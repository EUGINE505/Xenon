let pyodideInstance;
const CDN_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";

async function loadRuntimeScript() {
  if (window.loadPyodide) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CDN_URL;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  await loadRuntimeScript();
  pyodideInstance = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
  });
  return pyodideInstance;
}
