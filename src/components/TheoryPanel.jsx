import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { THEORY_UNITS } from "../lib/theoryContent";

// ─── Flashcard component ───────────────────────────────────────────────────────

function Flashcard({ card, onKnow, onLearn }) {
  const [flipped, setFlipped] = useState(false);

  const flip = () => setFlipped((v) => !v);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative w-full max-w-lg cursor-pointer"
        style={{ perspective: "1000px", height: "220px" }}
        onClick={flip}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="xenon-panel absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="xenon-kicker">Question — tap to reveal</span>
            <p className="text-xl font-semibold leading-snug">{card.q}</p>
          </div>
          {/* Back */}
          <div
            className="xenon-panel absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--panel-muted)" }}
          >
            <span className="xenon-kicker text-green-400">Answer</span>
            <p className="text-lg leading-relaxed text-[var(--text)]">{card.a}</p>
          </div>
        </div>
      </div>

      {flipped && (
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            className="rounded-lg border border-red-400/40 bg-red-400/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
            onClick={(e) => { e.stopPropagation(); onLearn(); }}
          >
            Still learning
          </button>
          <button
            className="rounded-lg border border-green-400/40 bg-green-400/10 px-5 py-2.5 text-sm font-semibold text-green-300 transition hover:bg-green-400/20"
            onClick={(e) => { e.stopPropagation(); onKnow(); }}
          >
            Know it
          </button>
        </motion.div>
      )}
      {!flipped && (
        <p className="text-xs text-[var(--muted)]">Tap the card to see the answer</p>
      )}
    </div>
  );
}

// ─── Flashcard session ─────────────────────────────────────────────────────────

function FlashcardSession({ cards, onExit }) {
  const [queue, setQueue] = useState(cards.map((c, i) => ({ ...c, _id: i })));
  const [weak, setWeak] = useState([]);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);

  const current = queue[0];

  const advance = (cardId, isKnown) => {
    setQueue((prev) => prev.filter((c) => c._id !== cardId));
    if (isKnown) {
      setKnown((n) => n + 1);
    } else {
      setWeak((prev) => [...prev, cards.find((c, i) => i === cardId) || current]);
    }
    if (queue.length === 1) setDone(true);
    setKey((k) => k + 1);
  };

  const retryWeak = () => {
    setQueue(weak.map((c, i) => ({ ...c, _id: i })));
    setWeak([]);
    setKnown(0);
    setDone(false);
    setKey((k) => k + 1);
  };

  const total = cards.length;
  const progress = Math.round(((total - queue.length) / total) * 100);

  if (done) {
    return (
      <motion.div className="flex flex-col items-center gap-6 py-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="text-5xl">{weak.length === 0 ? "🎉" : "📚"}</div>
        <div>
          <p className="text-2xl font-bold">{weak.length === 0 ? "Perfect score!" : "Round complete"}</p>
          <p className="mt-2 text-[var(--muted)]">
            {known} / {total} cards known
            {weak.length > 0 ? ` — ${weak.length} still to practise` : ""}
          </p>
        </div>
        <div className="flex gap-3">
          {weak.length > 0 && (
            <button className="xenon-btn" onClick={retryWeak}>
              Retry {weak.length} weak card{weak.length !== 1 ? "s" : ""}
            </button>
          )}
          <button className="xenon-btn-ghost" onClick={onExit}>Back to Notes</button>
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
        <button className="xenon-btn-ghost text-xs" onClick={onExit}>Exit</button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
        >
          <Flashcard
            card={current}
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

// ─── Topic detail view ─────────────────────────────────────────────────────────

function TopicDetail({ unit, onBack }) {
  const [tab, setTab] = useState("notes");
  const [inFlashcards, setInFlashcards] = useState(false);

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="xenon-panel p-6">
        <button
          className="mb-4 flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition"
          onClick={onBack}
        >
          ← Back to all topics
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="xenon-kicker" style={{ color: unit.accent }}>{unit.unit}</p>
            <h2 className="mt-1 text-2xl font-bold">{unit.title}</h2>
          </div>
          <div className="flex gap-2">
            <span className="xenon-badge">{unit.notes.length} sections</span>
            <span className="xenon-badge">{unit.flashcards.length} flashcards</span>
          </div>
        </div>

        <div className="mt-5 flex gap-1 border-b border-[var(--border)]">
          {["notes", "flashcards"].map((t) => (
            <button
              key={t}
              className="xenon-tab capitalize"
              data-active={tab === t}
              onClick={() => { setTab(t); setInFlashcards(false); }}
            >
              {t === "notes" ? "Notes" : `Flashcards (${unit.flashcards.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === "notes" && (
        <div className="space-y-4">
          {unit.notes.map((section) => (
            <motion.div
              key={section.heading}
              className="xenon-panel p-6"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold" style={{ color: unit.accent }}>
                {section.heading}
              </h3>
              <p className="xenon-code mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">
                {section.body}
              </p>
            </motion.div>
          ))}
          <div className="xenon-panel p-6 text-center">
            <p className="font-semibold">Ready to test yourself?</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Work through {unit.flashcards.length} flashcards for {unit.title}.
            </p>
            <button className="xenon-btn mt-4" onClick={() => { setTab("flashcards"); setInFlashcards(true); }}>
              Start Flashcards
            </button>
          </div>
        </div>
      )}

      {tab === "flashcards" && (
        <div className="xenon-panel p-6 sm:p-8">
          {inFlashcards ? (
            <FlashcardSession
              cards={unit.flashcards}
              onExit={() => { setInFlashcards(false); setTab("notes"); }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="text-4xl">🃏</span>
              <div>
                <p className="text-xl font-bold">{unit.flashcards.length} flashcards</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Flip each card to reveal the answer, then mark whether you know it or still need practice. Weak cards resurface at the end.
                </p>
              </div>
              <button className="xenon-btn" onClick={() => setInFlashcards(true)}>
                Start Session
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
          {unit.notes[0]?.body.slice(0, 90)}…
        </p>
        <div className="mt-4 flex gap-2">
          <span className="xenon-badge">{unit.notes.length} sections</span>
          <span className="xenon-badge">{unit.flashcards.length} cards</span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main TheoryPanel ──────────────────────────────────────────────────────────

export default function TheoryPanel() {
  const [selectedId, setSelectedId] = useState(null);

  const selected = THEORY_UNITS.find((u) => u.id === selectedId);

  if (selected) {
    return <TopicDetail unit={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="xenon-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="xenon-pill">GCSE Computer Science Theory</span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Theory & Revision</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
              All 9 GCSE Computer Science units — concise notes and self-marking flashcards. Select a topic to start reading or jump straight into a flashcard session.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="xenon-badge">AQA</span>
            <span className="xenon-badge">OCR</span>
            <span className="xenon-badge">Edexcel</span>
          </div>
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
