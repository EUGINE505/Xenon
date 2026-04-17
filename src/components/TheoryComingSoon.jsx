import { motion } from "framer-motion";

export default function TheoryComingSoon() {
  return (
    <motion.section className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="xenon-panel p-6 sm:p-8">
        <span className="xenon-pill">Theory</span>
        <h2 className="xenon-section-title mt-5 font-bold">Theory lessons are coming soon.</h2>
        <p className="xenon-subtitle mt-4 max-w-2xl text-sm sm:text-base">
          This area will be used for topic explanations, GCSE revision notes, worked examples, and short concept checks to support the coding side of Xenon Code.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="xenon-panel-muted p-5">
          <p className="xenon-kicker">Planned</p>
          <p className="mt-2 text-lg font-semibold">Python Basics</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Variables, selection, loops, lists, and functions explained in simple language.</p>
        </div>
        <div className="xenon-panel-muted p-5">
          <p className="xenon-kicker">Planned</p>
          <p className="mt-2 text-lg font-semibold">GCSE Revision</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Short notes and examples designed to help students revise quickly before tasks and tests.</p>
        </div>
        <div className="xenon-panel-muted p-5">
          <p className="xenon-kicker">Planned</p>
          <p className="mt-2 text-lg font-semibold">Quick Checks</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Mini quizzes and recall activities to support classroom teaching.</p>
        </div>
      </div>
    </motion.section>
  );
}
