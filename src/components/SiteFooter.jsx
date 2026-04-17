import { useMemo, useState } from "react";

const FOOTER_PAGES = {
  story: {
    title: "Our Story",
    content: [
      "One day I saw that Trinket was shutting down its server, so I decided to make Xenon Code.",
      "The goal was simple: keep Python learning easy in the browser for students and useful for teachers in class.",
      "Xenon Code was built to give people a clean coding space, saved projects, class tracking, and practise tools without a complicated setup.",
    ],
  },
  help: {
    title: "Help And FAQ",
    content: [
      "To join a class, go to Settings, choose the Student role, and enter the class code from your teacher.",
      "Leaderboard ranking is based on practise questions correct first, then projects created, then time spent practising.",
      "If your code does not run, check the output panel for hints about colons, brackets, indentation, imports, and variable names.",
      "Use the Practise Python Skills page to solve line-order questions and submit them for leaderboard progress.",
    ],
  },
  terms: {
    title: "Terms Of Service",
    content: [
      "Use Xenon Code for learning, teaching, and school-related coding in a respectful and lawful way.",
      "Do not upload harmful, abusive, or disruptive content or attempt to interfere with the platform.",
      "Users are responsible for the projects and class activity connected to their accounts.",
      "Features may change over time as Xenon Code improves for students and teachers.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    content: [
      "Xenon Code stores account details, saved projects, class membership, and progress data so the app can work properly.",
      "Practice time, project totals, and practise-question scores may be used to power class leaderboards and teacher views.",
      "The information in Xenon Code is used to support learning and classroom organisation, not advertising.",
      "This policy may be updated if the app changes or school requirements need it.",
    ],
  },
};

export default function SiteFooter() {
  const [activePage, setActivePage] = useState(null);
  const page = useMemo(() => (activePage ? FOOTER_PAGES[activePage] : null), [activePage]);

  return (
    <>
      <footer className="xenon-panel mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">More About Xenon Code</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Open a page to read more.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="xenon-btn-ghost" onClick={() => setActivePage("story")}>Our Story</button>
            <button className="xenon-btn-ghost" onClick={() => setActivePage("help")}>Help And FAQ</button>
            <button className="xenon-btn-ghost" onClick={() => setActivePage("terms")}>Terms Of Service</button>
            <button className="xenon-btn-ghost" onClick={() => setActivePage("privacy")}>Privacy Policy</button>
          </div>
        </div>
        <div className="mt-6 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
          Made by Shahzain Jehangiri for Seven Kings School
        </div>
      </footer>

      {page && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="xenon-panel w-full max-w-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="xenon-kicker">Information</p>
                <h2 className="mt-2 text-3xl font-semibold">{page.title}</h2>
              </div>
              <button className="xenon-btn-subtle" onClick={() => setActivePage(null)}>Close</button>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--muted)]">
              {page.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
