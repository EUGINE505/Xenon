export const ACHIEVEMENT_DEFS = {
  first_project: { icon: "\u{1F4BB}", label: "First Project", desc: "Saved your first project" },
  joined_class: { icon: "\u{1F3EB}", label: "Class Member", desc: "Joined a class" },
  skills_5: { icon: "\u{2B50}", label: "Getting Started", desc: "5 practice questions correct" },
  skills_25: { icon: "\u{1F31F}", label: "Practice Pro", desc: "25 practice questions correct" },
  skills_100: { icon: "\u{1F3C6}", label: "Master Coder", desc: "100 practice questions correct" },
  streak_3: { icon: "\u{1F525}", label: "On a Roll", desc: "3-day login streak" },
  streak_7: { icon: "\u{26A1}", label: "Week Warrior", desc: "7-day login streak" },
  top_3: { icon: "\u{1F396}\u{FE0F}", label: "Top 3", desc: "Reached top 3 in your class" },
  top_1: { icon: "\u{1F451}", label: "Class Champion", desc: "Reached rank #1 in your class" },
  rank_1: { icon: "\u{1F947}", label: "Gold Badge", desc: "Finished 1st in your class" },
  rank_2: { icon: "\u{1F948}", label: "Silver Badge", desc: "Finished 2nd in your class" },
  rank_3: { icon: "\u{1F949}", label: "Bronze Badge", desc: "Finished 3rd in your class" },
};

export function AchievementGrid({ achievements = [], warning = "", compact = false }) {
  const earnedKeys = new Set((achievements || []).map((entry) => entry.achievement_key));
  const allAchievements = Object.entries(ACHIEVEMENT_DEFS);

  return (
    <div>
      <p className="xenon-kicker mb-3">Achievements ({earnedKeys.size}/{allAchievements.length})</p>
      {warning ? <p className="mb-3 text-sm text-amber-400">{warning}</p> : null}
      <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}`}>
        {allAchievements.map(([key, def]) => {
          const earned = earnedKeys.has(key);
          return (
            <div
              key={key}
              className="achievement-card xenon-panel-muted p-4 text-center"
              data-earned={earned}
              title={earned ? `Earned: ${def.desc}` : `Locked: ${def.desc}`}
            >
              <span className="achievement-icon" aria-hidden="true">
                {def.icon}
              </span>
              <p className="mt-3 text-xs font-semibold leading-tight">{def.label}</p>
              <p className="mt-1 text-xs leading-tight text-[var(--muted)]">{def.desc}</p>
              {earned ? <span className="mt-2 inline-flex text-xs font-bold text-[var(--accent)]">Earned</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AchievementsPanel({ achievements = [], warning = "", title = "Achievements", subtitle = "", compact = false }) {
  return (
    <section className="xenon-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5">
        <AchievementGrid achievements={achievements} warning={warning} compact={compact} />
      </div>
    </section>
  );
}
