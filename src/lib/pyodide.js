let worker;
let sab;
let inputControl;
let inputData;

/**
 * Initializes the Pyodide worker and SharedArrayBuffer for sync input.
 * SharedArrayBuffer requires Cross-Origin Isolation (COOP/COEP headers).
 */
export function getPyodideWorker() {
  if (worker) return { worker, sab };

  worker = new Worker(new URL("./pyodide.worker.js", import.meta.url));
  
  // Initialize SAB immediately
  sab = new SharedArrayBuffer(1024 * 16);
  inputControl = new Int32Array(sab);
  inputData = new Uint8Array(sab, 8);

  worker.postMessage({ type: "init", sab });

  return { worker, sab };
}

/**
 * Sends input from the main thread to the waiting Python worker.
 */
export function sendInputToWorker(text) {
  if (!inputControl) return;

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text + "\n");
  
  // Copy data to SAB
  inputData.set(bytes);
  
  // Set length and notify
  Atomics.store(inputControl, 1, bytes.length);
  Atomics.store(inputControl, 0, 1);
  Atomics.notify(inputControl, 0);
}
