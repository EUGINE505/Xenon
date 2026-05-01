let worker = null;
let sab = null;
let inputControl = null;
let inputData = null;
let workerReadyPromise = null;

export const sabAvailable =
  typeof SharedArrayBuffer !== "undefined" &&
  typeof Atomics !== "undefined" &&
  crossOriginIsolated;

/**
 * Initialises the Pyodide worker.
 * If SharedArrayBuffer + crossOriginIsolated is available we use the fast
 * Atomics-based synchronous stdin path.  Otherwise we fall back to an async
 * message-passing stdin path.
 */
export function getPyodideWorker() {
  if (worker) return { worker, sab, workerReadyPromise };

  worker = new Worker(new URL("./pyodide.worker.js", import.meta.url));

  if (sabAvailable) {
    sab = new SharedArrayBuffer(1024 * 16);
    inputControl = new Int32Array(sab);
    inputData = new Uint8Array(sab, 8);
  }

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

  worker.postMessage({ type: "init", sab: sab ?? null });

  return { worker, sab, workerReadyPromise };
}

/**
 * Sends input to the worker.
 * SAB mode: writes into shared memory and wakes Atomics.wait.
 * Async mode: posts a stdin_response message.
 */
export function sendInputToWorker(text) {
  if (!worker) return;

  if (sabAvailable && inputControl && inputData) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text + "\n");
    inputData.set(bytes);
    Atomics.store(inputControl, 1, bytes.length);
    Atomics.store(inputControl, 0, 1);
    Atomics.notify(inputControl, 0);
  } else {
    worker.postMessage({ type: "stdin_response", value: text + "\n" });
  }
}
