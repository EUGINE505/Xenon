import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { getPyodide } from "../lib/pyodide";
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
      "editorCursor.foreground": "#386bff",
      "editor.selectionBackground": "#dce7ff",
    },
  });
};

export default function XenonIDE() {
  const [saveStatus, setSaveStatus] = useState("");
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
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

  const runCode = async () => {
    setConsoleLines([{ type: "sys", text: "Running your code..." }]);
    try {
      const pyodide = await getPyodide();
      const output = [];
      await pyodide.runPythonAsync("import random");
      pyodide.setStdout({ batched: (text) => output.push({ type: "out", text }) });
      pyodide.setStderr({
        batched: (text) =>
          output.push({
            type: "err",
            text: profile?.role === "student" ? translatePythonError(text) : text,
          }),
      });
      await pyodide.runPythonAsync(activeProject.code);
      setConsoleLines(output.length ? output : [{ type: "sys", text: "(no output)" }]);
    } catch (error) {
      const rawError = String(error);
      appendConsoleLine({
        type: "err",
        text: profile?.role === "student" ? translatePythonError(rawError) : rawError,
      });
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
            <button className="xenon-btn" onClick={runCode}>Run Code</button>
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
            key={activeProject.id || "default"}
            beforeMount={buildMonacoTheme}
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
                    line.type === "err" ? "text-red-300" : line.type === "sys" ? "text-sky-300" : "text-green-300"
                  }`}
                >
                  {line.text}
                </p>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">Run your code to see output here.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
