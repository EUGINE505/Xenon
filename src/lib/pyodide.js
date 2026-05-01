let worker = null;
let sab = null;
let inputControl = null;
let inputData = null;
let workerReadyPromise = null;

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

export function sendInputToWorker(text) {
  if (!worker) return;
  if (sabAvailable && inputControl && inputData) {
    // SAB path: write into shared memory and wake Atomics.wait in the worker
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text + "\n");
    inputData.set(bytes);
    Atomics.store(inputControl, 1, bytes.length);
    Atomics.store(inputControl, 0, 1);
    Atomics.notify(inputControl, 0);
  } else {
    // Async path: resolve the pending Promise inside the worker
    worker.postMessage({ type: "stdin_response", value: text });
  }
}
