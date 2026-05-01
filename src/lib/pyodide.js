let worker = null;
let sab = null;
let inputControl = null;
let inputData = null;
let workerReadyPromise = null;

/**
 * True when SharedArrayBuffer + Atomics + crossOriginIsolated are all
 * available.  In that case we use the fast Atomics.wait synchronous stdin
 * path inside the worker.  Otherwise we fall back to pre-buffered stdin.
 */
export const sabAvailable =
  typeof SharedArrayBuffer !== "undefined" &&
  typeof Atomics !== "undefined" &&
  (typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : false);

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
 * SAB mode only: write text into shared memory and wake Atomics.wait in the
 * worker.  In pre-buffer mode the stdin is sent with the run message instead.
 */
export function sendInputToWorker(text) {
  if (!sabAvailable || !inputControl || !inputData) return;

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text + "\n");
  inputData.set(bytes);
  Atomics.store(inputControl, 1, bytes.length);
  Atomics.store(inputControl, 0, 1);
  Atomics.notify(inputControl, 0);
}
