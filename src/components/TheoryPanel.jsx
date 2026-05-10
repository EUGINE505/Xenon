import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { THEORY_UNITS } from "../lib/theoryContent";
import {
  BookOpen,
  Layers,
  Clock,
  ChevronDown,
  ChevronLeft,
  Search,
  Shuffle,
  Trophy,
  Award,
  BookMarked,
  FileText,
  HelpCircle,
  Check,
  X,
  RotateCcw,
  ArrowRight,
  Bookmark,
  PenLine,
  GraduationCap,
  Sparkles,
  Target
} from "lucide-react";

// ─── Flashcard component ───────────────────────────────────────────────────────

function Flashcard({ card, onKnow, onLearn, cardKey }) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setFlipped(false);
  }, [cardKey]);

  const flip = () => setFlipped((v) => !v);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-full max-w-lg cursor-pointer"
        style={{ perspective: "1000px", minHeight: "220px" }}
        onClick={flip}
      >
        <div
          className="w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="xenon-panel flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center"
            style={{ 
              backfaceVisibility: "hidden",
              minHeight: "220px"
            }}
          >
            <span className="xenon-kicker flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5" />
              Question — tap to reveal
            </span>
            <p className="text-xl font-semibold leading-snug">{card.q}</p>
          </div>
          {/* Back */}
          <div
            className="xenon-panel absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center"
            style={{ 
              backfaceVisibility: "hidden", 
              transform: "rotateY(180deg)", 
              background: "var(--panel-muted)",
              minHeight: "220px"
            }}
          >
            <span className="xenon-kicker text-green-400 flex items-center gap-2">
              <Check className="h-3.5 w-3.5" />
              Answer
            </span>
            <p className="text-lg leading-relaxed text-[var(--text)]">{card.a}</p>
          </div>
        </div>
      </div>

      <div className="h-12 flex items-center justify-center">
        {flipped ? (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              className="rounded-lg border border-red-400/40 bg-red-400/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 flex items-center gap-2"
              onClick={(e) => { e.stopPropagation(); onLearn(); }}
            >
              <RotateCcw className="h-4 w-4" />
              Still learning
            </button>
            <button
              className="rounded-lg border border-green-400/40 bg-green-400/10 px-5 py-2.5 text-sm font-semibold text-green-300 transition hover:bg-green-400/20 flex items-center gap-2"
              onClick={(e) => { e.stopPropagation(); onKnow(); }}
            >
              <Check className="h-4 w-4" />
              Know it
            </button>
          </motion.div>
        ) : (
          <p className="text-xs text-[var(--muted)]">Tap the card to see the answer</p>
        )}
      </div>
    </div>
  );
}

// ─── Flashcard session ─────────────────────────────────────────────────────────

function FlashcardSession({ cards, onExit, shuffle: shouldShuffle = false }) {
  const shuffleCards = useCallback((items) => [...items].sort(() => Math.random() - 0.5), []);
  
  const [queue, setQueue] = useState(() => {
    const initialCards = cards.map((c, i) => ({ ...c, _id: i }));
    return shouldShuffle ? shuffleCards(initialCards) : initialCards;
  });
  const [weak, setWeak] = useState([]);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const current = queue[0];

  const advance = (cardId, isKnown) => {
    setQueue((prev) => prev.filter((c) => c._id !== cardId));
    if (isKnown) {
      setKnown((n) => n + 1);
    } else {
      setWeak((prev) => [...prev, cards.find((c, i) => i === cardId) || current]);
    }
    if (queue.length === 1) setDone(true);
    setCardKey((k) => k + 1);
  };

  const retryWeak = () => {
    setQueue(weak.map((c, i) => ({ ...c, _id: i })));
    setWeak([]);
    setKnown(0);
    setDone(false);
    setCardKey((k) => k + 1);
  };

  const total = cards.length;
  const progress = Math.round(((total - queue.length) / total) * 100);

  if (done) {
    const percentage = Math.round((known / total) * 100);
    const ResultIcon = weak.length === 0 ? Trophy : percentage >= 70 ? Award : BookOpen;
    
    return (
      <motion.div className="flex flex-col items-center gap-6 py-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="h-16 w-16 rounded-2xl bg-[var(--accent)]/20 flex items-center justify-center">
          <ResultIcon className="h-8 w-8 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-2xl font-bold">{weak.length === 0 ? "Perfect score!" : percentage >= 70 ? "Great job!" : "Keep practising!"}</p>
          <p className="mt-2 text-[var(--muted)]">
            {known} / {total} cards known ({percentage}%)
            {weak.length > 0 ? ` — ${weak.length} still to practise` : ""}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {weak.length > 0 && (
            <button className="xenon-btn flex items-center gap-2" onClick={retryWeak}>
              <RotateCcw className="h-4 w-4" />
              Retry {weak.length} weak card{weak.length !== 1 ? "s" : ""}
            </button>
          )}
          <button className="xenon-btn-ghost flex items-center gap-2" onClick={onExit}>
            <ChevronLeft className="h-4 w-4" />
            Back to Notes
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
            <span>{total - queue.length} of {total}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button className="xenon-btn-ghost text-xs flex items-center gap-1" onClick={onExit}>
          <X className="h-3.5 w-3.5" />
          Exit
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={cardKey}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
        >
          <Flashcard
            card={current}
            cardKey={cardKey}
            onKnow={() => advance(current._id, true)}
            onLearn={() => advance(current._id, false)}
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-2">
        {queue.map((c, i) => (
          <div
            key={c._id}
            className="h-1 w-6 rounded-full"
            style={{ background: i === 0 ? "var(--accent)" : "rgba(255,255,255,0.15)" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Quiz Mode ─────────────────────────────────────────────────────────────────

function QuizMode({ cards, onExit }) {
  const [shuffledCards] = useState(() => [...cards].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [selfScore, setSelfScore] = useState(null);

  const current = shuffledCards[currentIndex];
  const total = shuffledCards.length;

  const handleSubmit = () => {
    if (!showAnswer) {
      setShowAnswer(true);
    } else {
      if (selfScore !== null) {
        setUserAnswers((prev) => [...prev, { 
          question: current.q, 
          userAnswer: currentInput, 
          correctAnswer: current.a,
          correct: selfScore >= 0.5
        }]);
        setCurrentInput("");
        setShowAnswer(false);
        setSelfScore(null);
        
        if (currentIndex + 1 >= total) {
          setShowResults(true);
        } else {
          setCurrentIndex((i) => i + 1);
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!showAnswer && currentInput.trim()) {
        handleSubmit();
      }
    }
  };

  if (showResults) {
    const correctCount = userAnswers.filter((a) => a.correct).length;
    const percentage = Math.round((correctCount / total) * 100);
    const ResultIcon = percentage >= 80 ? Trophy : percentage >= 60 ? Award : BookOpen;
    
    return (
      <motion.div className="space-y-6 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[var(--accent)]/20 flex items-center justify-center mb-4">
            <ResultIcon className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-2xl font-bold">Quiz Complete!</h3>
          <p className="mt-2 text-[var(--muted)]">
            You got {correctCount} / {total} correct ({percentage}%)
          </p>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {userAnswers.map((answer, i) => (
            <div 
              key={i} 
              className={`xenon-panel p-4 rounded-xl border-l-4 ${
                answer.correct ? "border-green-400" : "border-red-400"
              }`}
            >
              <p className="font-medium text-sm">{answer.question}</p>
              <p className="text-xs text-[var(--muted)] mt-1">Your answer: {answer.userAnswer || "(empty)"}</p>
              <p className="text-xs text-green-400 mt-1">Correct: {answer.correctAnswer}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <button className="xenon-btn flex items-center gap-2" onClick={() => {
            setCurrentIndex(0);
            setUserAnswers([]);
            setShowResults(false);
            setCurrentInput("");
          }}>
            <RotateCcw className="h-4 w-4" />
            Retry Quiz
          </button>
          <button className="xenon-btn-ghost flex items-center gap-2" onClick={onExit}>
            <ChevronLeft className="h-4 w-4" />
            Back to Notes
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
            <span>Question {currentIndex + 1} of {total}</span>
            <span>{Math.round((currentIndex / total) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${(currentIndex / total) * 100}%` }}
            />
          </div>
        </div>
        <button className="xenon-btn-ghost text-xs flex items-center gap-1" onClick={onExit}>
          <X className="h-3.5 w-3.5" />
          Exit
        </button>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="xenon-panel p-6 rounded-2xl space-y-4"
      >
        <p className="text-lg font-semibold">{current.q}</p>
        
        <textarea
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
          placeholder="Type your answer..."
          rows={3}
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={showAnswer}
        />

        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-xl bg-green-400/10 border border-green-400/30">
              <p className="text-xs text-green-400 mb-1 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Correct Answer:
              </p>
              <p className="text-sm text-[var(--text)]">{current.a}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-[var(--muted)] mb-2">How did you do?</p>
              <div className="flex justify-center gap-2">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    selfScore === 0 ? "bg-red-400/30 border-red-400" : "bg-white/5 hover:bg-white/10"
                  } border border-[var(--border)]`}
                  onClick={() => setSelfScore(0)}
                >
                  <X className="h-4 w-4" />
                  Wrong
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    selfScore === 0.5 ? "bg-yellow-400/30 border-yellow-400" : "bg-white/5 hover:bg-white/10"
                  } border border-[var(--border)]`}
                  onClick={() => setSelfScore(0.5)}
                >
                  <Target className="h-4 w-4" />
                  Partial
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    selfScore === 1 ? "bg-green-400/30 border-green-400" : "bg-white/5 hover:bg-white/10"
                  } border border-[var(--border)]`}
                  onClick={() => setSelfScore(1)}
                >
                  <Check className="h-4 w-4" />
                  Correct
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <button
          className="xenon-btn w-full flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={!showAnswer ? !currentInput.trim() : selfScore === null}
        >
          {showAnswer ? (
            <>
              <ArrowRight className="h-4 w-4" />
              Next Question
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Check Answer
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

// ─── Study Progress Tracker ────────────────────────────────────────────────────

function StudyProgress({ unit }) {
  const totalNotes = unit.notes.length;
  const totalCards = unit.flashcards.length;
  const estimatedTime = Math.ceil(totalNotes * 2 + totalCards * 0.5);

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-blue-400/20 flex items-center justify-center">
          <FileText className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <p className="font-medium">{totalNotes} sections</p>
          <p className="text-xs text-[var(--muted)]">Notes</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-purple-400/20 flex items-center justify-center">
          <Layers className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <p className="font-medium">{totalCards} cards</p>
          <p className="text-xs text-[var(--muted)]">Flashcards</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-green-400/20 flex items-center justify-center">
          <Clock className="h-4 w-4 text-green-400" />
        </div>
        <div>
          <p className="font-medium">~{estimatedTime} min</p>
          <p className="text-xs text-[var(--muted)]">Est. time</p>
        </div>
      </div>
    </div>
  );
}

// ─── Key Terms Component ───────────────────────────────────────────────────────

function KeyTerms({ unit }) {
  // Extract key terms from notes (terms that appear in flashcard questions)
  const terms = unit.flashcards.slice(0, 6).map((card) => ({
    term: card.q.replace(/^What (is|does|are) (the |a |an )?/i, "").replace(/\?$/, ""),
    definition: card.a.slice(0, 100) + (card.a.length > 100 ? "..." : "")
  }));

  return (
    <div className="xenon-panel p-6 rounded-2xl">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Bookmark className="h-4 w-4 text-[var(--accent)]" />
        Key Terms
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {terms.map((item, i) => (
          <div key={i} className="p-3 rounded-xl bg-[var(--panel-muted)] text-sm">
            <p className="font-medium text-[var(--accent)]">{item.term}</p>
            <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{item.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Topic detail view ─────────────────────────────────────────────────────────

function TopicDetail({ unit, onBack }) {
  const [tab, setTab] = useState("notes");
  const [inFlashcards, setInFlashcards] = useState(false);
  const [inQuiz, setInQuiz] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (heading) => {
    setExpandedSections((prev) => ({
      ...prev,
      [heading]: !prev[heading]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    unit.notes.forEach((section) => {
      allExpanded[section.heading] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="xenon-panel p-6">
        <button
          className="mb-4 flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to all topics
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="xenon-kicker" style={{ color: unit.accent }}>{unit.unit}</p>
            <h2 className="mt-1 text-2xl font-bold">{unit.title}</h2>
          </div>
          <StudyProgress unit={unit} />
        </div>

        <div className="mt-5 flex gap-1 border-b border-[var(--border)]">
          {["notes", "flashcards", "quiz"].map((t) => (
            <button
              key={t}
              className="xenon-tab capitalize flex items-center gap-2"
              data-active={tab === t}
              onClick={() => { setTab(t); setInFlashcards(false); setInQuiz(false); }}
            >
              {t === "notes" && <BookOpen className="h-4 w-4" />}
              {t === "flashcards" && <Layers className="h-4 w-4" />}
              {t === "quiz" && <PenLine className="h-4 w-4" />}
              {t === "notes" ? "Notes" : t === "flashcards" ? `Flashcards (${unit.flashcards.length})` : "Quiz"}
            </button>
          ))}
        </div>
      </div>

      {tab === "notes" && (
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button 
              className="xenon-btn-ghost text-xs"
              onClick={expandAll}
            >
              Expand All
            </button>
            <button 
              className="xenon-btn-ghost text-xs"
              onClick={collapseAll}
            >
              Collapse All
            </button>
          </div>

          {unit.notes.map((section, idx) => (
            <motion.div
              key={section.heading}
              className="xenon-panel rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <button
                className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                onClick={() => toggleSection(section.heading)}
              >
                <h3 className="text-lg font-semibold" style={{ color: unit.accent }}>
                  {section.heading}
                </h3>
                <ChevronDown className={`h-5 w-5 text-[var(--muted)] transition-transform ${expandedSections[section.heading] ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {expandedSections[section.heading] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <p className="xenon-code whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">
                        {section.body}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Key Terms */}
          <KeyTerms unit={unit} />

          {/* CTA */}
          <div className="xenon-panel p-6 text-center">
            <p className="font-semibold">Ready to test yourself?</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Work through {unit.flashcards.length} flashcards or take a quiz for {unit.title}.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <button className="xenon-btn flex items-center gap-2" onClick={() => { setTab("flashcards"); setInFlashcards(true); }}>
                <Layers className="h-4 w-4" />
                Start Flashcards
              </button>
              <button className="xenon-btn-ghost flex items-center gap-2" onClick={() => { setTab("quiz"); setInQuiz(true); }}>
                <PenLine className="h-4 w-4" />
                Take Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "flashcards" && (
        <div className="xenon-panel p-6 sm:p-8">
          {inFlashcards ? (
            <FlashcardSession
              cards={unit.flashcards}
              shuffle={shuffleEnabled}
              onExit={() => { setInFlashcards(false); setTab("notes"); }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[var(--accent)]/20 flex items-center justify-center">
                <Layers className="h-8 w-8 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xl font-bold">{unit.flashcards.length} flashcards</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Flip each card to reveal the answer, then mark whether you know it or still need practice. Weak cards resurface at the end.
                </p>
              </div>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleEnabled}
                  onChange={(e) => setShuffleEnabled(e.target.checked)}
                  className="rounded border-[var(--border)] bg-[var(--panel)] text-[var(--accent)]"
                />
                <Shuffle className="h-4 w-4 text-[var(--muted)]" />
                <span className="text-[var(--muted)]">Shuffle cards</span>
              </label>

              <button className="xenon-btn flex items-center gap-2" onClick={() => setInFlashcards(true)}>
                <Sparkles className="h-4 w-4" />
                Start Session
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "quiz" && (
        <div className="xenon-panel p-6 sm:p-8">
          {inQuiz ? (
            <QuizMode
              cards={unit.flashcards}
              onExit={() => { setInQuiz(false); setTab("notes"); }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[var(--accent)]/20 flex items-center justify-center">
                <PenLine className="h-8 w-8 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xl font-bold">Written Quiz</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Test your knowledge by typing answers to {unit.flashcards.length} questions. Self-mark your answers to track progress.
                </p>
              </div>
              <button className="xenon-btn flex items-center gap-2" onClick={() => setInQuiz(true)}>
                <Sparkles className="h-4 w-4" />
                Start Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Topic card grid ───────────────────────────────────────────────────────────

function TopicCard({ unit, onClick }) {
  return (
    <motion.button
      className="xenon-panel group w-full overflow-hidden rounded-2xl text-left transition hover:scale-[1.02]"
      onClick={onClick}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="h-2 w-full" style={{ background: unit.accent }} />
      <div className="p-5">
        <p className="xenon-kicker" style={{ color: unit.accent }}>{unit.unit}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug">{unit.title}</h3>
        <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
          {unit.notes[0]?.body.slice(0, 90)}...
        </p>
        <div className="mt-4 flex gap-2">
          <span className="xenon-badge flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {unit.notes.length} sections
          </span>
          <span className="xenon-badge flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {unit.flashcards.length} cards
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Search Component ──────────────────────────────────────────────────────────

function TopicSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = [];

    THEORY_UNITS.forEach((unit) => {
      // Search in unit title
      if (unit.title.toLowerCase().includes(lowerQuery)) {
        matches.push({ type: "unit", unit, text: unit.title });
      }

      // Search in notes
      unit.notes.forEach((note) => {
        if (note.heading.toLowerCase().includes(lowerQuery) || 
            note.body.toLowerCase().includes(lowerQuery)) {
          matches.push({ 
            type: "note", 
            unit, 
            text: note.heading,
            preview: note.body.slice(0, 60) + "..."
          });
        }
      });

      // Search in flashcards
      unit.flashcards.forEach((card) => {
        if (card.q.toLowerCase().includes(lowerQuery) || 
            card.a.toLowerCase().includes(lowerQuery)) {
          matches.push({ 
            type: "flashcard", 
            unit, 
            text: card.q,
            preview: card.a.slice(0, 60) + "..."
          });
        }
      });
    });

    setResults(matches.slice(0, 8));
  }, [query]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "unit": return <BookMarked className="h-3 w-3" />;
      case "note": return <FileText className="h-3 w-3" />;
      case "flashcard": return <Layers className="h-3 w-3" />;
      default: return <BookOpen className="h-3 w-3" />;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <input
          type="text"
          placeholder="Search topics, notes, flashcards..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] pl-11 pr-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10 rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-lg overflow-hidden">
          {results.map((result, i) => (
            <button
              key={i}
              className="w-full p-3 text-left hover:bg-white/[0.05] transition flex items-start gap-3 border-b border-[var(--border)] last:border-b-0"
              onClick={() => {
                onSelect(result.unit.id);
                setQuery("");
                setResults([]);
              }}
            >
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/10" style={{ color: result.unit.accent }}>
                {getTypeIcon(result.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{result.text}</p>
                {result.preview && (
                  <p className="text-xs text-[var(--muted)] truncate">{result.preview}</p>
                )}
                <p className="text-xs mt-1" style={{ color: result.unit.accent }}>{result.unit.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main TheoryPanel ──────────────────────────────────────────────────────────

export default function TheoryPanel() {
  const [selectedId, setSelectedId] = useState(null);

  const selected = THEORY_UNITS.find((u) => u.id === selectedId);

  if (selected) {
    return <TopicDetail unit={selected} onBack={() => setSelectedId(null)} />;
  }

  const totalCards = THEORY_UNITS.reduce((sum, u) => sum + u.flashcards.length, 0);
  const totalNotes = THEORY_UNITS.reduce((sum, u) => sum + u.notes.length, 0);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="xenon-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="xenon-pill flex items-center gap-2 w-fit">
              <GraduationCap className="h-4 w-4" />
              GCSE Computer Science Theory
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Theory & Revision</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
              All 9 GCSE Computer Science units — concise notes, self-marking flashcards, and written quizzes. Select a topic to start learning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="xenon-badge">AQA</span>
            <span className="xenon-badge">OCR</span>
            <span className="xenon-badge">Edexcel</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-400/20 flex items-center justify-center">
              <BookMarked className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-lg">{THEORY_UNITS.length}</p>
              <p className="text-xs text-[var(--muted)]">Units</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-400/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="font-bold text-lg">{totalNotes}</p>
              <p className="text-xs text-[var(--muted)]">Sections</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-400/20 flex items-center justify-center">
              <Layers className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="font-bold text-lg">{totalCards}</p>
              <p className="text-xs text-[var(--muted)]">Flashcards</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <TopicSearch onSelect={setSelectedId} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {THEORY_UNITS.map((unit) => (
          <TopicCard key={unit.id} unit={unit} onClick={() => setSelectedId(unit.id)} />
        ))}
      </div>
    </motion.div>
  );
}
