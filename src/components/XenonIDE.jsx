import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { getPyodideWorker, sendInputToWorker } from "../lib/pyodide";
import { translatePythonError } from "../lib/errorTranslator";
import { useAppStore } from "../store/useAppStore";
import { GCSE_QUESTIONS } from "../lib/gcseQuestions";

const buildMonacoTheme = (monaco) => {
  monaco.editor.defineTheme("xenon-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#07101a",
      "editorCursor.foreground": "#4fb8ff",
      "editorLineNumber.foreground": "#61738b",
      "editorLineNumber.activeForeground": "#eef4ff",
      "editor.selectionBackground": "#173047",
    },
  });

  monaco.editor.defineTheme("xenon-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#f7f9fc",
      "editorCursor.foreground": "#1e3a6e",
      "editor.selectionBackground": "#dce7ff",
    },
  });
};

export default function XenonIDE() {
  const editorRef = useRef(null);
  const projectIdRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [variables, setVariables] = useState([]);
  const [showVariables, setShowVariables] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef(null);
  const {
    activeProject,
    enrolledClass,
    profile,
    theme,
    setActiveProjectCode,
    consoleLines,
    setConsoleLines,
    appendConsoleLine,
    newProject,
    saveProject,
    setActiveProjectTitle,
    queuePracticeTime,
    flushPracticeTime,
  } = useAppStore();

  const monacoTheme = useMemo(() => {
    const lightThemes = ["classic-light", "solarized", "pink", "blue"];
    return lightThemes.includes(theme) ? "xenon-light" : "xenon-dark";
  }, [theme]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    projectIdRef.current = activeProject.id;
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLines, isWaitingForInput]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (activeProject.id === projectIdRef.current) return;
    projectIdRef.current = activeProject.id;
    const current = editorRef.current.getValue();
    if (current !== activeProject.code) {
      editorRef.current.setValue(activeProject.code);
    }
  }, [activeProject.id, activeProject.code]);

  const handleTerminalSubmit = (e) => {
    if (e.key === "Enter" && isWaitingForInput) {
      const value = terminalInput;
      appendConsoleLine({ type: "in", text: value });
      sendInputToWorker(value);
      setTerminalInput("");
      setIsWaitingForInput(false);
    }
  };

  const runCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setConsoleLines([{ type: "sys", text: "Starting Python worker..." }]);

    try {
      const { worker, sab, workerReadyPromise } = getPyodideWorker();

      const handleMessage = (e) => {
        const { type, text, variables: newVars, error } = e.data;

        switch (type) {
          case "stdout":
            appendConsoleLine({ type: "out", text });
            break;
          case "stderr":
            appendConsoleLine({
              type: "err",
              text: profile?.role === "student" ? translatePythonError(text) : text,
            });
            break;
          case "stdin_request":
            setIsWaitingForInput(true);
            break;
          case "done":
            setVariables(newVars || []);
            setIsRunning(false);
            worker.removeEventListener("message", handleMessage);
            break;
          case "error":
            appendConsoleLine({
              type: "err",
              text: profile?.role === "student" ? translatePythonError(error) : error,
            });
            setIsRunning(false);
            worker.removeEventListener("message", handleMessage);
            break;
          default:
            break;
        }
      };

      worker.addEventListener("message", handleMessage);

      // Wait for Pyodide to finish initializing before sending run
      await workerReadyPromise;
      setConsoleLines([{ type: "sys", text: "Running..." }]);
      worker.postMessage({ type: "run", code: activeProject.code, sab });
    } catch (error) {
      setIsRunning(false);
      appendConsoleLine({ type: "err", text: "Worker Error: " + String(error) });
    }
  };

  const onSave = async () => {
    setSaveStatus("");
    try {
      await saveProject();
      setSaveStatus("Saved.");
    } catch (error) {
      setSaveStatus(error?.message || "Save failed.");
    }
  };

  const useChallenge = () => {
    const text = `# Challenge\n# ${GCSE_QUESTIONS[challengeIndex]}\n\n`;
    setActiveProjectCode(`${text}${activeProject.code}`);
    setShowChallenge(false);
  };

  useEffect(() => {
    if (profile?.role !== "student" || !enrolledClass?.id) return undefined;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        queuePracticeTime(15);
      }
    }, 15000);

    const flushIfHidden = () => {
      if (document.visibilityState === "hidden") {
        flushPracticeTime();
      }
    };

    document.addEventListener("visibilitychange", flushIfHidden);
    window.addEventListener("beforeunload", flushPracticeTime);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", flushIfHidden);
      window.removeEventListener("beforeunload", flushPracticeTime);
      flushPracticeTime();
    };
  }, [profile?.role, enrolledClass?.id, queuePracticeTime, flushPracticeTime]);

  return (
    <div className="space-y-4">
      <motion.section className="xenon-panel p-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Python IDE</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Write code on the left and see the result on the right.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="xenon-btn" onClick={runCode} disabled={isRunning}>
              {isRunning ? "Running..." : "Run Code"}
            </button>
            <button className="xenon-btn-ghost" onClick={() => setShowVariables((v) => !v)}>Variables</button>
            <button className="xenon-btn-ghost" onClick={onSave}>Save</button>
            <button className="xenon-btn-ghost" onClick={newProject}>New Project</button>
            <button className="xenon-btn-subtle" onClick={() => setShowChallenge((value) => !value)}>Challenges</button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="xenon-input max-w-lg"
            value={activeProject.title}
            onChange={(e) => setActiveProjectTitle(e.target.value)}
            placeholder="Untitled.py"
          />
          <span className="xenon-badge">Standard Python imports like `random` are available here</span>
          {profile?.role === "student" && enrolledClass?.id && (
            <span className="xenon-badge">Practice time is tracked while this page is active</span>
          )}
          {saveStatus && <span className="text-sm text-[var(--muted)]">{saveStatus}</span>}
        </div>
      </motion.section>

      {showChallenge && (
        <motion.section className="xenon-panel p-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Challenge Mode</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Pick a task and add it into your code area.</p>
            </div>
            <button className="xenon-btn" onClick={useChallenge}>Use This Challenge</button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {GCSE_QUESTIONS.slice(0, 12).map((question, index) => (
              <button
                key={`${index}-${question}`}
                className="xenon-panel-muted p-4 text-left"
                style={challengeIndex === index ? { borderColor: "var(--border-strong)", background: "var(--accent-soft)" } : undefined}
                onClick={() => setChallengeIndex(index)}
              >
                <p className="text-sm">{question}</p>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="xenon-panel h-[70vh] overflow-hidden p-3">
          <Editor
            beforeMount={buildMonacoTheme}
            onMount={handleEditorMount}
            height="100%"
            defaultLanguage="python"
            defaultValue={activeProject.code}
            onChange={(value) => setActiveProjectCode(value || "")}
            theme={monacoTheme}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              fontFamily: "JetBrains Mono",
              fontSize: 14,
              lineHeight: 24,
              scrollBeyondLastLine: false,
            }}
          />
        </section>

        <section className="xenon-panel flex h-[70vh] flex-col p-5">
          <h3 className="text-lg font-semibold">Output</h3>
          <div className="xenon-terminal xenon-scroll mt-4 flex-1 overflow-auto p-4">
            {consoleLines.length ? (
              consoleLines.map((line, index) => (
                <p
                  key={`${line.text}-${index}`}
                  className={`xenon-code mb-2 whitespace-pre-wrap text-sm ${
                    line.type === "err"
                      ? "text-red-300"
                      : line.type === "sys"
                        ? "text-sky-300"
                        : line.type === "in"
                          ? "text-amber-200 font-bold"
                          : "text-green-300"
                  }`}
                >
                  {line.type === "in" ? `> ${line.text}` : line.text}
                </p>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">Run your code to see output here.</p>
            )}

            {isWaitingForInput && (
              <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
                <span>&gt;</span>
                <input
                  autoFocus
                  className="w-full bg-transparent outline-none ring-0 placeholder:text-amber-200/50"
                  placeholder="Type here..."
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalSubmit}
                />
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </section>
      </div>

      {showVariables && (
        <motion.section
          className="xenon-panel p-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Variable Explorer</h3>
            <button className="text-sm text-[var(--muted)] hover:text-white" onClick={() => setShowVariables(false)}>Close</button>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">Inspect the current value and type of your variables after execution.</p>
          
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--panel-muted)] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {variables.length > 0 ? (
                  variables.map((v) => (
                    <tr key={v.name} className="hover:bg-white/5">
                      <td className="px-4 py-2 font-mono text-sky-300">{v.name}</td>
                      <td className="px-4 py-2"><span className="xenon-badge text-[10px] uppercase opacity-70">{v.type}</span></td>
                      <td className="px-4 py-2 font-mono text-[var(--muted)] truncate max-w-xs" title={v.value}>{v.value}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">Run code to populate variables.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}
    </div>
  );
}
