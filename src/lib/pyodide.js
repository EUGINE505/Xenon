let worker;
let sab;
let inputControl;
let inputData;
let workerReadyPromise = null;
let hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";

/**
 * Initializes the Pyodide worker and SharedArrayBuffer for sync input.
 * SharedArrayBuffer requires Cross-Origin Isolation (COOP/COEP headers).
 */
export function getPyodideWorker() {
  if (worker) return { worker, sab, workerReadyPromise };

  worker = new Worker(new URL("./pyodide.worker.js", import.meta.url));

  sab = hasSharedArrayBuffer ? new SharedArrayBuffer(1024 * 16) : new ArrayBuffer(1024 * 16);
  inputControl = new Int32Array(sab);
  inputData = new Uint8Array(sab, 8);

  workerReadyPromise = new Promise((resolve, reject) => {
    const onInit = (e) => {
      if (e.data.type === "ready") {
        worker.removeEventListener("message", onInit);
        resolve();
      } else if (e.data.type === "error") {
        worker.removeEventListener("message", onInit);
        reject(new Error(e.data.error));
      }
    };
    worker.addEventListener("message", onInit);
  });

  worker.postMessage({ type: "init", sab });

  return { worker, sab, workerReadyPromise };
}

/**
 * Sends input from the main thread to the waiting Python worker.
 */
export function sendInputToWorker(text) {
  if (!inputControl) return;

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text + "\n");

  inputData.set(bytes);

  Atomics.store(inputControl, 1, bytes.length);
  Atomics.store(inputControl, 0, 1);
  Atomics.notify(inputControl, 0);
}
