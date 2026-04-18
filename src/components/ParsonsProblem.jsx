import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../store/useAppStore";

const PARSONS_SET = [
  {
    title: "Hello World",
    difficulty: "Easy",
    topic: "Output",
    description: "Print a greeting message to the screen.",
    output: "Hello, World!",
    lines: [
      "message = 'Hello, World!'",
      "print(message)",
    ],
  },
  {
    title: "Even or Odd",
    difficulty: "Easy",
    topic: "Selection",
    description: "Check whether a number is even or odd using the modulo operator.",
    output: "odd 3\neven 4\nodd 5",
    lines: [
      "for n in range(3, 6):",
      "    if n % 2 == 0:",
      "        print('even', n)",
      "    else:",
      "        print('odd', n)",
    ],
  },
  {
    title: "Factorial Builder",
    difficulty: "Easy",
    topic: "Iteration",
    description: "Calculate 5! (five factorial) by multiplying numbers 1 through 5.",
    output: "120",
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
    difficulty: "Easy",
    topic: "Lists",
    description: "Loop through a list and track the largest value found.",
    output: "13",
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
    difficulty: "Easy",
    topic: "Strings",
    description: "Count how many vowels appear in a piece of text.",
    output: "4",
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
    difficulty: "Easy",
    topic: "Selection",
    description: "Assign a letter grade based on a numeric score using elif chains.",
    output: "B",
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
    difficulty: "Easy",
    topic: "Lists",
    description: "Add up every number in a list using a loop and a running total.",
    output: "30",
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
    difficulty: "Easy",
    topic: "Strings",
    description: "Validate a password by checking whether it meets a minimum length.",
    output: "strong enough",
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
    difficulty: "Easy",
    topic: "Lists",
    description: "Count how many scores in a list are greater than 50.",
    output: "3",
    lines: [
      "scores = [22, 65, 49, 80, 51]",
      "count = 0",
      "for score in scores:",
      "    if score > 50:",
      "        count += 1",
      "print(count)",
    ],
  },
  {
    title: "Reverse a String",
    difficulty: "Easy",
    topic: "Strings",
    description: "Use Python slice notation to reverse a string.",
    output: "edoc nonex",
    lines: [
      "text = 'xenon code'",
      "reversed_text = text[::-1]",
      "print(reversed_text)",
    ],
  },
  {
    title: "Times Table",
    difficulty: "Easy",
    topic: "Iteration",
    description: "Print the 3 times table from 1 to 5 using a for loop.",
    output: "3\n6\n9\n12\n15",
    lines: [
      "for i in range(1, 6):",
      "    print(3 * i)",
    ],
  },
  {
    title: "Square Numbers",
    difficulty: "Easy",
    topic: "Iteration",
    description: "Print the square of each number from 1 to 4.",
    output: "1\n4\n9\n16",
    lines: [
      "for n in range(1, 5):",
      "    square = n ** 2",
      "    print(square)",
    ],
  },
  {
    title: "Average Calculator",
    difficulty: "Medium",
    topic: "Lists",
    description: "Calculate the average of a list of numbers.",
    output: "7.5",
    lines: [
      "numbers = [5, 8, 10, 7]",
      "total = sum(numbers)",
      "average = total / len(numbers)",
      "print(average)",
    ],
  },
  {
    title: "FizzBuzz",
    difficulty: "Medium",
    topic: "Selection",
    description: "Print Fizz for multiples of 3, Buzz for multiples of 5, otherwise the number.",
    output: "1\n2\nFizz\n4\nBuzz\nFizz\n7",
    lines: [
      "for n in range(1, 8):",
      "    if n % 3 == 0 and n % 5 == 0:",
      "        print('FizzBuzz')",
      "    elif n % 3 == 0:",
      "        print('Fizz')",
      "    elif n % 5 == 0:",
      "        print('Buzz')",
      "    else:",
      "        print(n)",
    ],
  },
  {
    title: "Build a Function",
    difficulty: "Medium",
    topic: "Functions",
    description: "Define a function that doubles a number and call it.",
    output: "10",
    lines: [
      "def double(n):",
      "    return n * 2",
      "result = double(5)",
      "print(result)",
    ],
  },
  {
    title: "List Filter",
    difficulty: "Medium",
    topic: "Lists",
    description: "Build a new list containing only the even numbers from an existing list.",
    output: "[2, 4, 6]",
    lines: [
      "numbers = [1, 2, 3, 4, 5, 6]",
      "evens = []",
      "for n in numbers:",
      "    if n % 2 == 0:",
      "        evens.append(n)",
      "print(evens)",
    ],
  },
  {
    title: "While Counter",
    difficulty: "Medium",
    topic: "Iteration",
    description: "Use a while loop to count down from 5 to 1.",
    output: "5\n4\n3\n2\n1",
    lines: [
      "count = 5",
      "while count > 0:",
      "    print(count)",
      "    count -= 1",
    ],
  },
  {
    title: "Dictionary Lookup",
    difficulty: "Medium",
    topic: "Dictionaries",
    description: "Store student scores in a dictionary and retrieve one by name.",
    output: "85",
    lines: [
      "scores = {'Alice': 92, 'Bob': 85, 'Carol': 78}",
      "student = 'Bob'",
      "print(scores[student])",
    ],
  },
  {
    title: "Count Characters",
    difficulty: "Medium",
    topic: "Strings",
    description: "Count how many times the letter 'o' appears in a word.",
    output: "3",
    lines: [
      "word = 'whosoever'",
      "count = 0",
      "for char in word:",
      "    if char == 'o':",
      "        count += 1",
      "print(count)",
    ],
  },
  {
    title: "String Builder",
    difficulty: "Medium",
    topic: "Strings",
    description: "Build a string by joining items from a list with a separator.",
    output: "apple, banana, cherry",
    lines: [
      "fruits = ['apple', 'banana', 'cherry']",
      "result = ', '.join(fruits)",
      "print(result)",
    ],
  },
  {
    title: "Min and Max",
    difficulty: "Medium",
    topic: "Lists",
    description: "Find and print both the smallest and largest values in a list.",
    output: "Min: 3  Max: 97",
    lines: [
      "data = [45, 3, 78, 97, 22]",
      "smallest = min(data)",
      "largest = max(data)",
      "print('Min:', smallest, ' Max:', largest)",
    ],
  },
  {
    title: "Nested Loop Grid",
    difficulty: "Hard",
    topic: "Iteration",
    description: "Use nested loops to print a 3x3 grid of coordinates.",
    output: "0,0  0,1  0,2\n1,0  1,1  1,2\n2,0  2,1  2,2",
    lines: [
      "for row in range(3):",
      "    for col in range(3):",
      "        print(row, col, end='  ')",
      "    print()",
    ],
  },
  {
    title: "Recursive Factorial",
    difficulty: "Hard",
    topic: "Recursion",
    description: "Calculate factorial using a function that calls itself.",
    output: "120",
    lines: [
      "def factorial(n):",
      "    if n == 0:",
      "        return 1",
      "    return n * factorial(n - 1)",
      "print(factorial(5))",
    ],
  },
  {
    title: "Dictionary Counter",
    difficulty: "Hard",
    topic: "Dictionaries",
    description: "Count how many times each word appears in a sentence.",
    output: "{'the': 2, 'cat': 1, 'sat': 1, 'on': 1, 'mat': 1}",
    lines: [
      "words = 'the cat sat on the mat'.split()",
      "counts = {}",
      "for word in words:",
      "    if word in counts:",
      "        counts[word] += 1",
      "    else:",
      "        counts[word] = 1",
      "print(counts)",
    ],
  },
  {
    title: "Error Handling",
    difficulty: "Hard",
    topic: "Exceptions",
    description: "Safely divide two numbers, catching a divide-by-zero error.",
    output: "Cannot divide by zero",
    lines: [
      "def safe_divide(a, b):",
      "    try:",
      "        return a / b",
      "    except ZeroDivisionError:",
      "        return 'Cannot divide by zero'",
      "print(safe_divide(10, 0))",
    ],
  },
];

const DIFFICULTY_COLOURS = {
  Easy:   { border: "rgba(73,198,122,0.5)",  bg: "rgba(73,198,122,0.12)",  text: "#2e7d54" },
  Medium: { border: "rgba(250,176,5,0.5)",   bg: "rgba(250,176,5,0.12)",   text: "#8a6000" },
  Hard:   { border: "rgba(255,123,134,0.5)", bg: "rgba(255,123,134,0.12)", text: "#8a1c2a" },
};

const TOPICS = ["All", ...Array.from(new Set(PARSONS_SET.map((p) => p.topic)))];

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
  const [showOutput, setShowOutput] = useState(false);
  const [filterTopic, setFilterTopic] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");

  const {
    profile,
    enrolledClass,
    completedPracticeSkills,
    markPracticeSkillCorrect,
    queuePracticeTime,
    flushPracticeTime,
  } = useAppStore();

  const filteredSet = useMemo(() => {
    return PARSONS_SET.filter((p) => {
      const topicMatch = filterTopic === "All" || p.topic === filterTopic;
      const diffMatch = filterDifficulty === "All" || p.difficulty === filterDifficulty;
      return topicMatch && diffMatch;
    });
  }, [filterTopic, filterDifficulty]);

  const selected = PARSONS_SET[problemIndex];
  const target = useMemo(() => selected.lines.join("\n"), [selected]);
  const solved = blocks.join("\n") === target;
  const alreadyCounted = Boolean(completedPracticeSkills?.[selected.title]);
  const correctLineCount = useMemo(
    () => blocks.reduce((total, line, index) => total + (line === selected.lines[index] ? 1 : 0), 0),
    [blocks, selected.lines],
  );
  const completedCount = PARSONS_SET.filter((p) => Boolean(completedPracticeSkills?.[p.title])).length;
  const diffColour = DIFFICULTY_COLOURS[selected.difficulty] || DIFFICULTY_COLOURS.Easy;

  const loadProblem = (globalIndex) => {
    setProblemIndex(globalIndex);
    setBlocks(shuffle(PARSONS_SET[globalIndex].lines));
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

  const submitAnswer = async () => {
    if (!solved) {
      setDialog({
        tone: "error",
        title: "Not quite right yet",
        body: "Keep rearranging the lines until the whole program is in the correct order, then submit again.",
      });
      return;
    }

    if (profile?.role !== "student" || !enrolledClass?.id) {
      setDialog({
        tone: "success",
        title: "Correct sequence",
        body: "You solved this question correctly. Join a class as a student to count it toward the leaderboard.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await markPracticeSkillCorrect(selected.title);
      if (result?.status === "already_counted") {
        setDialog({ tone: "success", title: "Already counted", body: "You got this one right before — it is already on the leaderboard." });
      } else if (result?.status === "counted" || result?.status === "counted_local") {
        setDialog({ tone: "success", title: "Correct!", body: "Great work. This question now counts toward your class leaderboard." });
      } else {
        setDialog({ tone: "info", title: "Saved locally", body: "Your answer is correct, but the leaderboard could not be updated right now." });
      }
    } catch (error) {
      setDialog({ tone: "error", title: "Could not submit", body: error?.message || "The answer was correct but we could not update the leaderboard." });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (profile?.role !== "student" || !enrolledClass?.id) return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        queuePracticeTime(15);
        setSessionSeconds((s) => s + 15);
      }
    }, 15000);
    const flushIfHidden = () => { if (document.visibilityState === "hidden") flushPracticeTime(); };
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

        {/* Header & Stats */}
        <div className="xenon-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Practise Python Skills</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Put each line of code into the correct order. Use the Up / Down buttons to rearrange lines, then submit when you are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="xenon-panel-muted px-4 py-3 text-center">
                <p className="xenon-kicker">Completed</p>
                <p className="mt-1 text-lg font-bold">{completedCount} / {PARSONS_SET.length}</p>
              </div>
              <div className="xenon-panel-muted px-4 py-3 text-center">
                <p className="xenon-kicker">Session Time</p>
                <p className="mt-1 text-lg font-bold">{formatPracticeTime(sessionSeconds)}</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--panel-soft)] border border-[var(--border)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / PARSONS_SET.length) * 100}%`, background: "var(--accent)" }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">{Math.round((completedCount / PARSONS_SET.length) * 100)}% of all questions completed</p>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-1">
              <span className="xenon-kicker self-center mr-1">Topic:</span>
              {TOPICS.map((t) => (
                <button key={t} className="xenon-tab" data-active={filterTopic === t} onClick={() => setFilterTopic(t)}>{t}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 ml-2">
              <span className="xenon-kicker self-center mr-1">Difficulty:</span>
              {["All", "Easy", "Medium", "Hard"].map((d) => (
                <button key={d} className="xenon-tab" data-active={filterDifficulty === d} onClick={() => setFilterDifficulty(d)}>{d}</button>
              ))}
            </div>
          </div>

          {/* Question list */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSet.map((item) => {
              const globalIndex = PARSONS_SET.indexOf(item);
              const done = Boolean(completedPracticeSkills?.[item.title]);
              const active = problemIndex === globalIndex;
              const dc = DIFFICULTY_COLOURS[item.difficulty];
              return (
                <button
                  key={item.title}
                  className="xenon-panel-muted p-3 text-left transition-all"
                  style={active ? { borderColor: "var(--border-strong)", background: "var(--accent-soft)" } : undefined}
                  onClick={() => loadProblem(globalIndex)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">{item.title}</span>
                    {done && <span className="text-green-600 text-xs font-bold shrink-0">✓</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}>
                      {item.difficulty}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{item.topic}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredSet.length === 0 && (
            <p className="mt-4 text-sm text-[var(--muted)]">No questions match these filters. Try changing the topic or difficulty.</p>
          )}
        </div>

        {/* Active Problem */}
        <div className="xenon-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold">{selected.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: diffColour.bg, color: diffColour.text, border: `1px solid ${diffColour.border}` }}>
                  {selected.difficulty}
                </span>
                <span className="xenon-badge">{selected.topic}</span>
                {alreadyCounted && <span className="xenon-badge" style={{ color: "#2e7d54", borderColor: "rgba(73,198,122,0.4)", background: "rgba(73,198,122,0.1)" }}>Already on leaderboard</span>}
              </div>
              <p className="mt-2 text-sm text-[var(--muted)] max-w-xl">{selected.description}</p>
              <p className="mt-2 text-sm font-medium">
                Lines in correct position: <span style={{ color: correctLineCount === selected.lines.length ? "#2e7d54" : "var(--text)" }}>{correctLineCount}</span> / {selected.lines.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="xenon-btn-subtle" onClick={() => setShowOutput((v) => !v)}>
                {showOutput ? "Hide Output" : "Show Expected Output"}
              </button>
              <button className="xenon-btn-ghost" onClick={() => { setBlocks(shuffle(selected.lines)); setShowOutput(false); }}>Shuffle</button>
              <button className="xenon-btn" disabled={submitting} onClick={submitAnswer}>
                {submitting ? "Submitting…" : solved ? "Submit Answer ✓" : "Submit Answer"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showOutput && (
              <motion.div
                className="xenon-terminal mt-4 p-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="xenon-kicker mb-2">Expected Output</p>
                <pre className="xenon-code text-sm whitespace-pre-wrap" style={{ color: "var(--success)" }}>{selected.output}</pre>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 space-y-2">
            {blocks.map((line, index) => {
              const isCorrect = line === selected.lines[index];
              const indent = line.match(/^(\s*)/)[1].length;
              return (
                <motion.div
                  key={`${line}-${index}`}
                  layout
                  className="xenon-panel-muted flex items-center gap-3 p-0 overflow-hidden"
                  style={isCorrect ? { borderColor: "rgba(73,198,122,0.45)", background: "rgba(73,198,122,0.08)" } : undefined}
                >
                  <div
                    className="self-stretch flex items-center justify-center text-xs font-bold w-8 shrink-0"
                    style={{ background: "var(--border)", color: "var(--muted)", minWidth: "2rem" }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 py-3 pr-2 min-w-0">
                    <code className="xenon-code text-sm block" style={{ paddingLeft: `${indent * 0.5}rem`, color: isCorrect ? "#2e7d54" : "var(--text)" }}>
                      {line.trimStart()}
                    </code>
                    {isCorrect && <p className="text-xs font-semibold mt-1" style={{ color: "#2e7d54" }}>Correct position</p>}
                  </div>
                  <div className="flex flex-col gap-1 px-3 py-2 shrink-0">
                    <button
                      className="xenon-btn-subtle px-2 py-1 text-xs"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      style={{ opacity: index === 0 ? 0.3 : 1 }}
                    >
                      ▲
                    </button>
                    <button
                      className="xenon-btn-subtle px-2 py-1 text-xs"
                      onClick={() => move(index, index + 1)}
                      disabled={index === blocks.length - 1}
                      style={{ opacity: index === blocks.length - 1 ? 0.3 : 1 }}
                    >
                      ▼
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 rounded border p-3 text-sm font-medium" style={{
            borderColor: solved ? "rgba(73,198,122,0.4)" : "var(--border)",
            background: solved ? "rgba(73,198,122,0.08)" : "var(--panel-soft)",
            color: solved ? "#2e7d54" : "var(--muted)",
          }}>
            {solved
              ? alreadyCounted
                ? "✓ Correct! This question is already on the leaderboard."
                : "✓ Correct sequence! Press Submit Answer to count it."
              : "Rearrange the lines until the program is in the right order, then submit."}
          </div>
        </div>
      </motion.section>

      {/* Dialog */}
      <AnimatePresence>
        {dialog && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="xenon-panel w-full max-w-md p-6"
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
            >
              <p className="xenon-kicker">
                {dialog.tone === "error" ? "Not correct" : dialog.tone === "info" ? "Update" : "Success"}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{dialog.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{dialog.body}</p>
              <div className="mt-5 flex justify-end">
                <button className="xenon-btn" onClick={() => setDialog(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
