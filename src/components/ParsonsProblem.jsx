import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../store/useAppStore";
import { PRACTICE_QUESTIONS } from "../lib/practiceQuestions";

const DIFFICULTY_COLOURS = {
  Easy: { border: "rgba(73,198,122,0.5)", bg: "rgba(73,198,122,0.12)", text: "#2e7d54" },
  Medium: { border: "rgba(250,176,5,0.5)", bg: "rgba(250,176,5,0.12)", text: "#8a6000" },
  Hard: { border: "rgba(255,123,134,0.5)", bg: "rgba(255,123,134,0.12)", text: "#8a1c2a" },
};

const TOPICS = ["All", ...Array.from(new Set(PRACTICE_QUESTIONS.map((question) => question.topic)))];

const shuffle = (lines) => [...lines].sort(() => Math.random() - 0.5);

const formatPracticeTime = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
};

const previewText = (value = "", maxLines = 3) => {
  const lines = String(value).split("\n");
  const preview = lines.slice(0, maxLines).join("\n");
  return lines.length > maxLines ? `${preview}\n...` : preview;
};

export default function ParsonsProblem() {
  const [problemIndex, setProblemIndex] = useState(0);
  const [blocks, setBlocks] = useState(() => shuffle(PRACTICE_QUESTIONS[0].lines));
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [filterTopic, setFilterTopic] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [search, setSearch] = useState("");
  const [questionBankExpanded, setQuestionBankExpanded] = useState(true);
  const [expandedQuestionTitle, setExpandedQuestionTitle] = useState(PRACTICE_QUESTIONS[0].title);

  const {
    profile,
    enrolledClass,
    assignments,
    completedPracticeSkills,
    markPracticeSkillCorrect,
    queuePracticeTime,
    flushPracticeTime,
  } = useAppStore();

  const selected = PRACTICE_QUESTIONS[problemIndex];
  const filteredSet = useMemo(
    () =>
      PRACTICE_QUESTIONS.filter((question) => {
        const topicMatch = filterTopic === "All" || question.topic === filterTopic;
        const difficultyMatch = filterDifficulty === "All" || question.difficulty === filterDifficulty;
        const searchMatch =
          !search.trim() ||
          question.title.toLowerCase().includes(search.trim().toLowerCase()) ||
          question.description.toLowerCase().includes(search.trim().toLowerCase()) ||
          question.topic.toLowerCase().includes(search.trim().toLowerCase());
        return topicMatch && difficultyMatch && searchMatch;
      }),
    [filterDifficulty, filterTopic, search],
  );

  const filteredStats = useMemo(
    () =>
      filteredSet.reduce(
        (stats, question) => {
          stats.total += 1;
          stats[question.difficulty] += 1;
          if (completedPracticeSkills?.[question.title]) stats.completed += 1;
          return stats;
        },
        { total: 0, completed: 0, Easy: 0, Medium: 0, Hard: 0 },
      ),
    [completedPracticeSkills, filteredSet],
  );

  const target = useMemo(() => selected.lines.join("\n"), [selected]);
  const solved = blocks.join("\n") === target;
  const alreadyCounted = Boolean(completedPracticeSkills?.[selected.title]);
  const correctLineCount = useMemo(
    () => blocks.reduce((total, line, index) => total + (line === selected.lines[index] ? 1 : 0), 0),
    [blocks, selected.lines],
  );
  const completedCount = PRACTICE_QUESTIONS.filter((question) => Boolean(completedPracticeSkills?.[question.title])).length;
  const diffColour = DIFFICULTY_COLOURS[selected.difficulty] || DIFFICULTY_COLOURS.Easy;
  const questionGoalAssignments = (assignments || []).filter((assignment) => Number(assignment.question_goal) > 0);
  const selectedFilteredIndex = filteredSet.findIndex((question) => question.title === selected.title);

  const loadProblem = (globalIndex) => {
    setProblemIndex(globalIndex);
    setBlocks(shuffle(PRACTICE_QUESTIONS[globalIndex].lines));
    setShowOutput(false);
    setExpandedQuestionTitle(PRACTICE_QUESTIONS[globalIndex].title);
  };

  const restartCurrentQuestion = () => {
    setBlocks(shuffle(selected.lines));
    setShowOutput(false);
  };

  const move = (from, to) => {
    if (to < 0 || to >= blocks.length) return;
    setBlocks((current) =>
      current.map((item, index) => {
        if (index === from) return current[to];
        if (index === to) return current[from];
        return item;
      }),
    );
  };

  const jumpToNextQuestion = () => {
    if (!filteredSet.length) return;
    const currentFilteredIndex = filteredSet.findIndex((question) => question.title === selected.title);
    const nextQuestion = filteredSet[(currentFilteredIndex + 1 + filteredSet.length) % filteredSet.length];
    loadProblem(PRACTICE_QUESTIONS.findIndex((question) => question.title === nextQuestion.title));
  };

  const submitAnswer = async () => {
    if (!solved) {
      setDialog({
        tone: "error",
        title: "Keep going",
        body: "The program order still needs a little work. Move the lines until the whole solution matches.",
      });
      return;
    }

    if (profile?.role !== "student" || !enrolledClass?.id) {
      setDialog({
        tone: "success",
        title: "Correct sequence",
        body: "You solved this challenge correctly. Join a class as a student if you want it to count on the leaderboard.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await markPracticeSkillCorrect(selected.title);
      if (result?.status === "already_counted") {
        setDialog({ tone: "success", title: "Already counted", body: "This challenge is already part of your practice total." });
      } else if (result?.status === "counted" || result?.status === "counted_local") {
        setDialog({ tone: "success", title: "Great work", body: "That answer now counts toward your class practice total." });
      } else {
        setDialog({ tone: "info", title: "Saved locally", body: "Your answer is correct, but the class total could not update right now." });
      }
    } catch (error) {
      setDialog({ tone: "error", title: "Could not submit", body: error?.message || "The answer was correct but the score update failed." });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!filteredSet.length) return;
    if (!filteredSet.some((question) => question.title === expandedQuestionTitle)) {
      setExpandedQuestionTitle(filteredSet[0].title);
    }
  }, [expandedQuestionTitle, filteredSet]);

  useEffect(() => {
    if (profile?.role !== "student" || !enrolledClass?.id) return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        queuePracticeTime(15);
        setSessionSeconds((seconds) => seconds + 15);
      }
    }, 15000);
    const flushIfHidden = () => {
      if (document.visibilityState === "hidden") flushPracticeTime();
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
    <>
      <motion.section className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="xenon-hero-panel p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <span className="xenon-pill">Practice Studio</span>
              <h2 className="xenon-section-title mt-4">A bigger school-style question bank with cleaner browsing and faster starts.</h2>
              <p className="xenon-subtitle mt-3 text-sm sm:text-base">
                Expand a question to preview it, pick the right topic faster, then rearrange the code into the correct Python order.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="xenon-metric">
                <p className="xenon-kicker">Completed</p>
                <p className="mt-2 text-2xl font-bold">{completedCount}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Challenges recorded</p>
              </div>
              <div className="xenon-metric">
                <p className="xenon-kicker">Session Time</p>
                <p className="mt-2 text-2xl font-bold">{formatPracticeTime(sessionSeconds)}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Tracked while this tab is active</p>
              </div>
            </div>
          </div>

          {questionGoalAssignments.length > 0 && (
            <div className="mt-5 xenon-school-banner p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="xenon-kicker">Teacher Targets</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Assignments can now include question goals. Keep practicing and then submit from My Class.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {questionGoalAssignments.slice(0, 3).map((assignment) => (
                    <span key={assignment.id} className="xenon-badge">
                      {assignment.title}: {assignment.question_goal} questions
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="h-3 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--panel-soft)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / PRACTICE_QUESTIONS.length) * 100}%`, background: "linear-gradient(90deg, var(--accent), #60a5fa)" }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              {Math.round((completedCount / PRACTICE_QUESTIONS.length) * 100)}% of the question bank completed
            </p>
          </div>
        </div>

        <div className="xenon-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Question Bank</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Search, filter, preview, and expand a question before opening it.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="xenon-badge">{filteredStats.total} matches</span>
              <span className="xenon-badge">{filteredStats.completed} solved</span>
              <button className="xenon-btn-subtle" onClick={() => setQuestionBankExpanded((value) => !value)}>
                {questionBankExpanded ? "Collapse List" : "Expand List"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_auto_auto]">
            <input
              className="xenon-input"
              placeholder="Search by title, topic, or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="xenon-input" value={filterTopic} onChange={(event) => setFilterTopic(event.target.value)}>
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            <select className="xenon-input" value={filterDifficulty} onChange={(event) => setFilterDifficulty(event.target.value)}>
              {["All", "Easy", "Medium", "Hard"].map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Visible Now</p>
              <p className="mt-2 text-xl font-semibold">{filteredStats.total}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Questions matching your current filters</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Easy</p>
              <p className="mt-2 text-xl font-semibold">{filteredStats.Easy}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Quick confidence-builders</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Medium</p>
              <p className="mt-2 text-xl font-semibold">{filteredStats.Medium}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">More steps and patterns</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Hard</p>
              <p className="mt-2 text-xl font-semibold">{filteredStats.Hard}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Nested logic and tougher structure</p>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {questionBankExpanded ? (
              <motion.div
                key="question-bank"
                className="mt-5 space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {filteredSet.map((question) => {
                  const globalIndex = PRACTICE_QUESTIONS.findIndex((entry) => entry.title === question.title);
                  const done = Boolean(completedPracticeSkills?.[question.title]);
                  const active = question.title === selected.title;
                  const expanded = expandedQuestionTitle === question.title || active;
                  const difficultyColours = DIFFICULTY_COLOURS[question.difficulty];

                  return (
                    <div
                      key={question.title}
                      className="practice-question-shell xenon-panel-muted p-4"
                      data-active={active}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold">{question.title}</p>
                            {active ? <span className="xenon-pill">Current</span> : null}
                            {done ? <span className="xenon-badge practice-done-badge">Solved</span> : null}
                          </div>
                          <p className="mt-2 text-sm text-[var(--muted)]">{question.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className="rounded-full px-2 py-1 text-xs font-semibold"
                              style={{ background: difficultyColours.bg, color: difficultyColours.text, border: `1px solid ${difficultyColours.border}` }}
                            >
                              {question.difficulty}
                            </span>
                            <span className="xenon-badge">{question.topic}</span>
                            <span className="xenon-badge">{question.lines.length} lines</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="xenon-btn-subtle"
                            onClick={() => setExpandedQuestionTitle((current) => (current === question.title ? "" : question.title))}
                          >
                            {expanded ? "Hide Details" : "Preview"}
                          </button>
                          <button className={active ? "xenon-btn-subtle" : "xenon-btn"} onClick={() => loadProblem(globalIndex)}>
                            {active ? "Open Now" : "Open Challenge"}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {expanded ? (
                          <motion.div
                            className="mt-4 grid gap-3 lg:grid-cols-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="practice-question-preview">
                              <p className="xenon-kicker">Expected Output</p>
                              <pre className="xenon-code mt-3 whitespace-pre-wrap text-sm text-[var(--muted)]">
                                {previewText(question.output)}
                              </pre>
                            </div>
                            <div className="practice-question-preview">
                              <p className="xenon-kicker">Code Shape</p>
                              <pre className="xenon-code mt-3 whitespace-pre-wrap text-sm text-[var(--muted)]">
                                {previewText(question.lines.map((line) => line.trimStart()).join("\n"), 4)}
                              </pre>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {!filteredSet.length ? <p className="text-sm text-[var(--muted)]">No questions match that filter yet. Try a broader search.</p> : null}
              </motion.div>
            ) : (
              <motion.p
                key="question-bank-collapsed"
                className="mt-4 text-sm text-[var(--muted)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                The question list is collapsed right now. Expand it whenever you want to preview another challenge.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="xenon-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold">{selected.title}</h3>
                {selectedFilteredIndex >= 0 ? <span className="xenon-pill">Question {selectedFilteredIndex + 1} of {filteredSet.length}</span> : null}
                <span className="xenon-badge">{selected.topic}</span>
                <span
                  className="rounded-full px-2 py-1 text-xs font-semibold"
                  style={{ background: diffColour.bg, color: diffColour.text, border: `1px solid ${diffColour.border}` }}
                >
                  {selected.difficulty}
                </span>
                {alreadyCounted ? <span className="xenon-badge practice-done-badge">Already counted</span> : null}
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">{selected.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Correct Lines</p>
                <p className="mt-2 text-xl font-semibold">{correctLineCount}/{selected.lines.length}</p>
              </div>
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Status</p>
                <p className="mt-2 text-xl font-semibold">{solved ? "Ready" : "In Progress"}</p>
              </div>
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Moves</p>
                <p className="mt-2 text-xl font-semibold">{blocks.length}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Use Up and Down to reorder each line</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="xenon-btn-subtle" onClick={() => setShowOutput((value) => !value)}>
              {showOutput ? "Hide Output" : "Show Output"}
            </button>
            <button className="xenon-btn-ghost" onClick={restartCurrentQuestion}>
              Restart Question
            </button>
            <button className="xenon-btn-ghost" onClick={jumpToNextQuestion}>
              Next Challenge
            </button>
            <button className="xenon-btn" disabled={submitting} onClick={submitAnswer}>
              {submitting ? "Submitting..." : solved ? "Submit Answer" : "Check And Submit"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showOutput ? (
              <motion.div
                className="xenon-terminal mt-5 p-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="xenon-kicker mb-2">Expected Output</p>
                <pre className="xenon-code whitespace-pre-wrap text-sm" style={{ color: "var(--success)" }}>
                  {selected.output}
                </pre>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="practice-help-grid mt-5">
            <div className="practice-question-preview">
              <p className="xenon-kicker">How To Solve Faster</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                <li>Find the first setup line like a variable, list, or loop header.</li>
                <li>Match indentation carefully because nested logic must stay grouped.</li>
                <li>Use the output preview to check the final shape of the program.</li>
              </ul>
            </div>
            <div className="practice-question-preview">
              <p className="xenon-kicker">Quick Reminder</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Green-highlighted lines are already in the right place. Keep nudging the remaining lines until the full program order matches.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {blocks.map((line, index) => {
              const isCorrect = line === selected.lines[index];
              const indent = line.match(/^(\s*)/)[1].length;
              return (
                <motion.div
                  key={`${line}-${index}`}
                  layout
                  className="xenon-panel-muted flex items-center gap-3 overflow-hidden"
                  style={isCorrect ? { borderColor: "rgba(73,198,122,0.45)", background: "rgba(73,198,122,0.08)" } : undefined}
                >
                  <div className="flex h-full min-w-[2.75rem] items-center justify-center self-stretch bg-[var(--panel)] text-xs font-bold text-[var(--muted)]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 py-3 pr-2">
                    <code className="xenon-code block text-sm" style={{ paddingLeft: `${indent * 0.5}rem`, color: isCorrect ? "#2e7d54" : "var(--text)" }}>
                      {line.trimStart()}
                    </code>
                    {isCorrect ? <p className="mt-1 text-xs font-semibold text-green-700">Right spot</p> : null}
                  </div>
                  <div className="flex flex-col gap-1 px-3 py-2">
                    <button className="xenon-btn-subtle px-2 py-1 text-xs" disabled={index === 0} onClick={() => move(index, index - 1)}>
                      Up
                    </button>
                    <button className="xenon-btn-subtle px-2 py-1 text-xs" disabled={index === blocks.length - 1} onClick={() => move(index, index + 1)}>
                      Down
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div
            className="mt-4 rounded-2xl border p-4 text-sm font-medium"
            style={{
              borderColor: solved ? "rgba(73,198,122,0.4)" : "var(--border)",
              background: solved ? "rgba(73,198,122,0.08)" : "var(--panel-soft)",
              color: solved ? "#2e7d54" : "var(--muted)",
            }}
          >
            {solved
              ? alreadyCounted
                ? "Correct. This challenge is already included in your practice score."
                : "Correct sequence. Submit it to count toward class progress."
              : "Reorder the code until every line is in the correct place."}
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {dialog ? (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="xenon-panel w-full max-w-md p-6"
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
            >
              <p className="xenon-kicker">{dialog.tone === "error" ? "Try again" : dialog.tone === "info" ? "Update" : "Success"}</p>
              <h3 className="mt-2 text-xl font-semibold">{dialog.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{dialog.body}</p>
              <div className="mt-5 flex justify-end">
                <button className="xenon-btn" onClick={() => setDialog(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
