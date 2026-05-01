importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");

let pyodide;
let inputControl;
let inputData;
let localBuffer = "";
let sabInstance;

async function init(sab) {
  try {
    sabInstance = sab;
    inputControl = new Int32Array(sab);
    inputData = new Uint8Array(sab, 8);

    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
    });

    // Diagnostically report environment
    self.postMessage({ 
      type: "stdout", 
      text: `[System] Pyodide initialized. SharedArrayBuffer: ${true}. Isolated: ${self.crossOriginIsolated}\n` 
    });

    // Initialize stdin once
    pyodide.setStdin({
      isatty: false, // Try false to see if it avoids illegal seek errors
      stdin: () => {
        if (localBuffer.length === 0) {
          self.postMessage({ type: "stdin_request" });
          
          // Wait for main thread
          const status = Atomics.wait(inputControl, 0, 0);
          
          const length = Atomics.load(inputControl, 1);
          const bytes = new Uint8Array(sabInstance, 8, length);
          localBuffer = new TextDecoder().decode(bytes);
          
          Atomics.store(inputControl, 0, 0);
          self.postMessage({ type: "stdin_complete", text: localBuffer });
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
  } catch (err) {
    self.postMessage({ type: "error", error: "Failed to load Pyodide: " + err.message });
  }
}

self.onmessage = async (e) => {
  const { type, code, sab } = e.data;

  if (type === "init") {
    if (!sab) {
      self.postMessage({ type: "error", error: "SharedArrayBuffer is not available in this environment." });
      return;
    }
    await init(sab);
  } else if (type === "run") {
    if (!pyodide) {
        self.postMessage({ type: "error", error: "Pyodide not initialized." });
        return;
    }

    pyodide.setStdout({
      batched: (text) => self.postMessage({ type: "stdout", text }),
    });
    pyodide.setStderr({
      batched: (text) => self.postMessage({ type: "stderr", text }),
    });

    try {
      pyodide.runPython("import random");
      pyodide.runPython(code);

      // Extract variables
      const globals = pyodide.globals.toJs();
      const newVars = [];
      for (const [key, value] of globals.entries()) {
        if (
          key.startsWith("__") ||
          typeof value === "function" ||
          (value && value._type === "module") ||
          key === "random"
        ) {
          continue;
        }

        let displayValue = "";
        let displayType = "";

        try {
          if (value === null) {
            displayValue = "None";
            displayType = "NoneType";
          } else if (typeof value === "object" && value.toJs) {
            const jsVal = value.toJs();
            displayValue = JSON.stringify(jsVal);
            displayType = value.type || "object";
          } else {
            displayValue = String(value);
            displayType = typeof value;
          }
        } catch {
          displayValue = "[Complex Object]";
          displayType = "object";
        }

        newVars.push({ name: key, value: displayValue, type: displayType });
      }

      self.postMessage({ type: "done", variables: newVars });
    } catch (error) {
      self.postMessage({ type: "error", error: String(error) });
    }
  }
};
