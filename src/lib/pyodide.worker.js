importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");

let pyodide = null;
let useSAB = false;

// SAB mode
let inputControl = null;
let inputData = null;
let sabInstance = null;
let localBuffer = "";

// No-SAB async mode
let stdinResolver = null;

// ─── Init: SAB mode ───────────────────────────────────────────────────────────

async function initWithSAB(sab) {
  sabInstance = sab;
  inputControl = new Int32Array(sab);
  inputData = new Uint8Array(sab, 8);

  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
  });

  pyodide.setStdin({
    isatty: false,
    stdin: () => {
      if (localBuffer.length === 0) {
        self.postMessage({ type: "stdin_request" });
        Atomics.wait(inputControl, 0, 0);
        const length = Atomics.load(inputControl, 1);
        const bytes = new Uint8Array(sabInstance, 8, length);
        localBuffer = new TextDecoder().decode(bytes);
        Atomics.store(inputControl, 0, 0);
      }
      if (localBuffer.length > 0) {
        const ch = localBuffer.charAt(0);
        localBuffer = localBuffer.substring(1);
        return ch;
      }
      return null;
    },
  });

  self.postMessage({ type: "ready" });
}

// ─── Init: no-SAB async mode ─────────────────────────────────────────────────

async function initNoSAB() {
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
  });

  // JS function accessible from Python via the `js` module.
  // Sends the prompt to the output panel and returns a Promise that
  // resolves once the user submits their input.
  globalThis.__xenon_stdin__ = (prompt) => {
    if (prompt) {
      self.postMessage({ type: "stdout", text: String(prompt) });
    }
    self.postMessage({ type: "stdin_request" });
    return new Promise((resolve) => {
      stdinResolver = resolve;
    });
  };

  // Replace Python's built-in input() with an async version.
  // This coroutine is await-able from Python when running under runPythonAsync.
  await pyodide.runPythonAsync(`
import builtins
import js

async def _xenon_input(prompt=''):
    return await js.__xenon_stdin__(str(prompt) if prompt else '')

builtins.input = _xenon_input
`);

  self.postMessage({ type: "ready" });
}

// ─── Variable extraction ──────────────────────────────────────────────────────

function extractVariables() {
  const globals = pyodide.globals.toJs();
  const vars = [];
  for (const [key, value] of globals.entries()) {
    if (
      key.startsWith("__") ||
      typeof value === "function" ||
      (value && value._type === "module") ||
      key === "random" ||
      key.startsWith("_xenon")
    ) continue;

    let displayValue = "";
    let displayType = "";
    try {
      if (value === null) {
        displayValue = "None"; displayType = "NoneType";
      } else if (typeof value === "object" && value.toJs) {
        displayValue = JSON.stringify(value.toJs());
        displayType = value.type || "object";
      } else {
        displayValue = String(value);
        displayType = typeof value;
      }
    } catch {
      displayValue = "[Complex Object]";
      displayType = "object";
    }
    vars.push({ name: key, value: displayValue, type: displayType });
  }
  return vars;
}

// ─── Python code transformer ──────────────────────────────────────────────────
// Rewrites every  input(...)  call to  await input(...)  so user code can
// suspend at input() calls when running under runPythonAsync.
const TRANSFORM_SCRIPT = `
import ast as _ast

class _XenonInputTransformer(_ast.NodeTransformer):
    def visit_Call(self, node):
        self.generic_visit(node)
        func = node.func
        if isinstance(func, _ast.Name) and func.id == 'input':
            return _ast.copy_location(_ast.Await(value=node), node)
        return node

import js as _js
_raw = _js.__xenon_user_code__
_tree = _ast.parse(_raw)
_tree = _XenonInputTransformer().visit(_tree)
_ast.fix_missing_locations(_tree)
_xenon_transformed = _ast.unparse(_tree)
del _XenonInputTransformer, _raw, _tree
`;

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = async (e) => {
  const { type, code, sab } = e.data;

  if (type === "init") {
    try {
      if (sab !== null && sab !== undefined) {
        useSAB = true;
        await initWithSAB(sab);
      } else {
        useSAB = false;
        await initNoSAB();
      }
    } catch (err) {
      self.postMessage({ type: "error", error: "Failed to load Pyodide: " + err.message });
    }
    return;
  }

  if (type === "stdin_response") {
    if (stdinResolver) {
      const resolve = stdinResolver;
      stdinResolver = null;
      resolve(e.data.value ?? "");
    }
    return;
  }

  if (type === "run") {
    if (!pyodide) {
      self.postMessage({ type: "error", error: "Pyodide not initialised yet." });
      return;
    }

    localBuffer = "";
    stdinResolver = null;

    pyodide.setStdout({ batched: (text) => self.postMessage({ type: "stdout", text }) });
    pyodide.setStderr({ batched: (text) => self.postMessage({ type: "stderr", text }) });

    try {
      if (useSAB) {
        // Synchronous blocking path — Atomics.wait handles input()
        pyodide.runPython("import random");
        pyodide.runPython(code);
      } else {
        // Async path:
        // 1. Transform user code so every input() becomes await input()
        // 2. Run transformed code with runPythonAsync, which supports top-level await
        await pyodide.runPythonAsync("import random");

        globalThis.__xenon_user_code__ = code;
        await pyodide.runPythonAsync(TRANSFORM_SCRIPT);
        const transformed = pyodide.globals.get("_xenon_transformed");

        await pyodide.runPythonAsync(transformed);
      }
      self.postMessage({ type: "done", variables: extractVariables() });
    } catch (error) {
      self.postMessage({ type: "error", error: String(error) });
    }
  }
};
