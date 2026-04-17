import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../store/useAppStore";

const PARSONS_SET = [
  {
    title: "Even Odd Counter",
    lines: [
      "for n in range(1, 6):",
      "    if n % 2 == 0:",
      "        print('even', n)",
      "    else:",
      "        print('odd', n)",
    ],
  },
  {
    title: "Factorial Builder",
    lines: [
      "number = 5",
      "result = 1",
      "for i in range(1, number + 1):",
      "    result *= i",
      "print(result)",
    ],
  },
  {
    title: "Find Largest",
    lines: [
      "values = [9, 4, 13, 7]",
      "largest = values[0]",
      "for value in values:",
      "    if value > largest:",
      "        largest = value",
      "print(largest)",
    ],
  },
  {
    title: "Count Vowels",
    lines: [
      "text = 'xenon code'",
      "count = 0",
      "for ch in text:",
      "    if ch in 'aeiou':",
      "        count += 1",
      "print(count)",
    ],
  },
  {
    title: "Grade Classifier",
    lines: [
      "score = 74",
      "if score >= 80:",
      "    print('A')",
      "elif score >= 60:",
      "    print('B')",
      "else:",
      "    print('C')",
    ],
  },
  {
    title: "Sum A List",
    lines: [
      "numbers = [3, 6, 9, 12]",
      "total = 0",
      "for number in numbers:",
      "    total += number",
      "print(total)",
    ],
  },
  {
    title: "Password Check",
    lines: [
      "password = 'abc12345'",
      "if len(password) >= 8:",
      "    print('strong enough')",
      "else:",
      "    print('too short')",
    ],
  },
  {
    title: "Count Above 50",
    lines: [
      "scores = [22, 65, 49, 80, 51]",
      "count = 0",
      "for score in scores:",
      "    if score > 50:",
      "        count += 1",
      "print(count)",
    ],
  },
];

const shuffle = (lines) => [...lines].sort(() => Math.random() - 0.5);

const formatPracticeTime = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
};

export default function ParsonsProblem() {
  const [problemIndex, setProblemIndex] = useState(0);
  const [blocks, setBlocks] = useState(() => shuffle(PARSONS_SET[0].lines));
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState(null);
  const {
    profile,
    enrolledClass,
    completedPracticeSkills,
    markPracticeSkillCorrect,
    queuePracticeTime,
    flushPracticeTime,
  } = useAppStore();

  const selected = PARSONS_SET[problemIndex];
  const target = useMemo(() => selected.lines.join("\n"), [selected]);
  const solved = blocks.join("\n") === target;
  const alreadyCounted = Boolean(completedPracticeSkills[selected.title]);
  const correctLineCount = useMemo(
    () => blocks.reduce((total, line, index) => total + (line === selected.lines[index] ? 1 : 0), 0),
    [blocks, selected.lines],
  );

  const loadProblem = (index) => {
    setProblemIndex(index);
    setBlocks(shuffle(PARSONS_SET[index].lines));
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

  const submitAnswer = async () => {
    if (!solved) {
      setDialog({
        tone: "error",
        title: "Not quite yet",
        body: "Keep rearranging the lines until the whole program is in the correct order, then submit it again.",
      });
      return;
    }

    if (profile?.role !== "student" || !enrolledClass?.id) {
      setDialog({
        tone: "success",
        title: "Correct sequence",
        body: "You solved this practise question. Join a class as a student if you want it to count toward the leaderboard.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await markPracticeSkillCorrect(selected.title);
      if (result?.status === "already_counted") {
        setDialog({
          tone: "success",
          title: "Already counted",
          body: "You got this one right before, so it is already contributing to the leaderboard.",
        });
        return;
      }
      if (result?.status === "counted") {
        setDialog({
          tone: "success",
          title: "You got it right",
          body: "Nice work. This practise question now contributes to the leaderboard for your class.",
        });
        return;
      }
      if (result?.status === "counted_local") {
        setDialog({
          tone: "success",
          title: "You got it right",
          body: "Nice work. This practise question now contributes to the leaderboard on this device as well.",
        });
        return;
      }
      setDialog({
        tone: "info",
        title: "Saved locally",
        body: "Your answer is correct, but the leaderboard could not be updated on this device right now.",
      });
    } catch (error) {
      setDialog({
        tone: "error",
        title: "Could not submit",
        body: error?.message || "The answer was correct, but we could not update the leaderboard just now.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (profile?.role !== "student" || !enrolledClass?.id) return undefined;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        queuePracticeTime(15);
        setSessionSeconds((current) => current + 15);
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
    <>
      <motion.section className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="xenon-panel p-6">
          <h2 className="text-2xl font-semibold">Practise Python Skills</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Rebuild Python programs by putting each line into the correct place. Submit when you think the full sequence is right.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Session Practice Time</p>
              <p className="mt-2 text-xl font-semibold">{formatPracticeTime(sessionSeconds)}</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Leaderboard Status</p>
              <p className="mt-2 text-sm font-semibold">
                {alreadyCounted ? "This question already counts" : "Submit a correct answer to count it"}
              </p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Tracked Time</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {profile?.role === "student" && enrolledClass?.id
                  ? "Time spent on this page now adds to your practising total."
                  : "Join a class as a student to track practising time and leaderboard progress."}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {PARSONS_SET.map((item, index) => (
              <button
                key={item.title}
                className="xenon-tab"
                data-active={problemIndex === index}
                onClick={() => loadProblem(index)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        <div className="xenon-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Correct lines: {correctLineCount} / {selected.lines.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="xenon-btn-ghost" onClick={() => setBlocks(shuffle(selected.lines))}>Shuffle</button>
              <button className="xenon-btn" disabled={submitting} onClick={submitAnswer}>
                {submitting ? "Submitting..." : "Submit Answer"}
              </button>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {blocks.map((line, index) => {
              const isCorrect = line === selected.lines[index];
              return (
                <div
                  key={`${line}-${index}`}
                  className="xenon-panel-muted flex items-center justify-between gap-3 p-4"
                  style={isCorrect ? { borderColor: "rgba(73, 198, 122, 0.45)", background: "rgba(73, 198, 122, 0.14)" } : undefined}
                >
                  <div>
                    <p className={`xenon-code text-sm ${isCorrect ? "text-green-300" : ""}`}>{line}</p>
                    {isCorrect && <p className="mt-2 text-xs font-medium text-green-300">Correct position</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="xenon-btn-subtle px-3 py-2" onClick={() => move(index, index - 1)}>Up</button>
                    <button className="xenon-btn-subtle px-3 py-2" onClick={() => move(index, index + 1)}>Down</button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm font-medium">
            {solved
              ? alreadyCounted
                ? "Correct sequence. This question is already contributing to the leaderboard."
                : "Correct sequence. Press submit to add it to the leaderboard."
              : "Keep trying, then press submit when the order looks right."}
          </p>
        </div>
      </motion.section>

      {dialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="xenon-panel w-full max-w-lg p-6">
            <p className="xenon-kicker">{dialog.tone === "error" ? "Submission Error" : dialog.tone === "info" ? "Submission Update" : "Submission Success"}</p>
            <h3 className="mt-3 text-2xl font-semibold">{dialog.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{dialog.body}</p>
            <div className="mt-6 flex justify-end">
              <button className="xenon-btn" onClick={() => setDialog(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
