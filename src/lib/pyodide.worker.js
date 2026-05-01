importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");

let pyodide = null;
let useSAB = false;

// SAB mode
let inputControl = null;
let inputData = null;
let sabInstance = null;
let localBuffer = "";

// ─── Init ─────────────────────────────────────────────────────────────────────

async function initWithSAB(sab) {
  sabInstance = sab;
  inputControl = new Int32Array(sab);
  inputData = new Uint8Array(sab, 8);

  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
  });

  // Stdin reads one char at a time, blocking via Atomics.wait until the
  // main thread writes a line into shared memory.
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
        const char = localBuffer.charAt(0);
        localBuffer = localBuffer.substring(1);
        return char;
      }
      return null;
    },
  });

  self.postMessage({ type: "ready" });
}

async function initNoSAB() {
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
  });
  // stdin is set per-run from the pre-buffer sent with the run message
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
  const { type, code, sab, stdinPreBuffer } = e.data;

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

  if (type === "run") {
    if (!pyodide) {
      self.postMessage({ type: "error", error: "Pyodide not initialised yet." });
      return;
    }

    localBuffer = "";

    pyodide.setStdout({ batched: (text) => self.postMessage({ type: "stdout", text }) });
    pyodide.setStderr({ batched: (text) => self.postMessage({ type: "stderr", text }) });

    if (!useSAB) {
      // Pre-buffer mode: stdin reads synchronously from the provided lines.
      // Pyodide's char-by-char stdin reader is fed from a line queue.
      const lines = (stdinPreBuffer || "").split("\n");
      let lineIdx = 0;
      let charBuf = "";

      pyodide.setStdin({
        isatty: false,
        stdin: () => {
          while (charBuf.length === 0) {
            if (lineIdx >= lines.length) return null; // EOF
            charBuf = lines[lineIdx] + "\n";
            lineIdx++;
          }
          const ch = charBuf.charAt(0);
          charBuf = charBuf.substring(1);
          return ch;
        },
      });
    }

    try {
      pyodide.runPython("import random");
      pyodide.runPython(code);
      self.postMessage({ type: "done", variables: extractVariables() });
    } catch (error) {
      self.postMessage({ type: "error", error: String(error) });
    }
  }
};
