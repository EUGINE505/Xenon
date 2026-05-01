importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");

let pyodide = null;
let useSAB = false;

// SAB mode state
let inputControl = null;
let inputData = null;
let sabInstance = null;
let localBuffer = "";

// Async mode state
let stdinResolver = null;
let asyncInputBuffer = "";

// ─── Initialisation ──────────────────────────────────────────────────────────

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

        // Block until the main thread writes into shared memory
        Atomics.wait(inputControl, 0, 0);

        const length = Atomics.load(inputControl, 1);
        const bytes = new Uint8Array(sabInstance, 8, length);
        localBuffer = new TextDecoder().decode(bytes);

        Atomics.store(inputControl, 0, 0);
      }

      if (localBuffer.length > 0) {
        const char = localBuffer.charAt(0);
        localBuffer = localBuffer.substring(1);
        return char;
      }
      return null;
    },
  });

  self.postMessage({ type: "ready" });
}

async function initAsync() {
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
  });

  // Async stdin: return a Promise that resolves when a stdin_response arrives
  pyodide.setStdin({
    isatty: false,
    stdin: () => {
      if (asyncInputBuffer.length > 0) {
        const char = asyncInputBuffer.charAt(0);
        asyncInputBuffer = asyncInputBuffer.substring(1);
        return char;
      }

      // Signal the main thread we need input, then wait for it
      self.postMessage({ type: "stdin_request" });
      return new Promise((resolve) => {
        stdinResolver = (text) => {
          asyncInputBuffer = text;
          const char = asyncInputBuffer.charAt(0);
          asyncInputBuffer = asyncInputBuffer.substring(1);
          resolve(char);
        };
      });
    },
  });

  self.postMessage({ type: "ready" });
}

// ─── Variable extraction helper ───────────────────────────────────────────────

function extractVariables() {
  const globals = pyodide.globals.toJs();
  const vars = [];
  for (const [key, value] of globals.entries()) {
    if (
      key.startsWith("__") ||
      typeof value === "function" ||
      (value && value._type === "module") ||
      key === "random"
    ) continue;

    let displayValue = "";
    let displayType = "";
    try {
      if (value === null) {
        displayValue = "None";
        displayType = "NoneType";
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

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = async (e) => {
  const { type, code, sab, value } = e.data;

  if (type === "init") {
    try {
      // Main thread sends a non-null sab only when SharedArrayBuffer +
      // crossOriginIsolated are confirmed available there.
      if (sab !== null && sab !== undefined) {
        useSAB = true;
        await initWithSAB(sab);
      } else {
        useSAB = false;
        await initAsync();
      }
    } catch (err) {
      self.postMessage({ type: "error", error: "Failed to load Pyodide: " + err.message });
    }
    return;
  }

  if (type === "stdin_response") {
    // Only used in async mode
    if (stdinResolver) {
      const resolve = stdinResolver;
      stdinResolver = null;
      resolve(value);
    }
    return;
  }

  if (type === "run") {
    if (!pyodide) {
      self.postMessage({ type: "error", error: "Pyodide not initialised yet." });
      return;
    }

    // Reset stdin buffers for a fresh run
    localBuffer = "";
    asyncInputBuffer = "";
    stdinResolver = null;

    pyodide.setStdout({ batched: (text) => self.postMessage({ type: "stdout", text }) });
    pyodide.setStderr({ batched: (text) => self.postMessage({ type: "stderr", text }) });

    try {
      if (useSAB) {
        pyodide.runPython("import random");
        pyodide.runPython(code);
      } else {
        await pyodide.runPythonAsync("import random");
        await pyodide.runPythonAsync(code);
      }
      self.postMessage({ type: "done", variables: extractVariables() });
    } catch (error) {
      self.postMessage({ type: "error", error: String(error) });
    }
  }
};
