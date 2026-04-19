import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import AuthGate from "./components/AuthGate";
import InitOverlay from "./components/InitOverlay";
import ProfileSetupModal from "./components/ProfileSetupModal";
import XenonIDE from "./components/XenonIDE";
import SettingsPanel from "./components/SettingsPanel";
import ClassDashboard from "./components/ClassDashboard";
import ParsonsProblem from "./components/ParsonsProblem";
import ChallengeArena from "./components/ChallengeArena";
import TheoryComingSoon from "./components/TheoryComingSoon";
import SiteFooter from "./components/SiteFooter";
import ProfileAvatar from "./components/ProfileAvatar";
import AchievementsPanel from "./components/AchievementsPanel";
import { getLevelProgress, getRankBadge } from "./lib/progression";
import { useAppStore } from "./store/useAppStore";

const motionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: "easeOut" },
};

const formatPracticeTime = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
};

const LOAD_HINTS = [
  { after: 2500, text: "Checking your account details..." },
  { after: 5000, text: "If you just signed up, please check your email and click the verification link." },
  { after: 9000, text: "Still loading - this is taking longer than usual." },
  { after: 13000, text: "If you have not verified your email yet, look for a message from Xenon Code in your inbox." },
  { after: 18000, text: "Account not found or session expired. Try refreshing the page or signing in again." },
];

function LoadingScreen() {
  const [hint, setHint] = useState(null);

  useEffect(() => {
    const timers = LOAD_HINTS.map(({ after, text }) => setTimeout(() => setHint(text), after));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="xenon-shell flex min-h-screen flex-col items-center justify-center px-4">
      <div className="xenon-panel mx-auto w-full max-w-sm p-8 text-center">
        <img src="/xenon-logo.svg" alt="Xenon Code" className="mx-auto mb-5 h-12 w-12 rounded-xl" />
        <p className="text-base font-semibold">Loading Xenon Code...</p>
        <div className="mt-3 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite` }}
            />
          ))}
        </div>
        {hint ? <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">{hint}</p> : null}
      </div>
    </div>
  );
}

function HomeView({ profile, enrolledClass, projectsCount, challengeCount, onNavigate }) {
  const levelProgress = getLevelProgress(profile?.experience_points || 0);
  const rankBadge = getRankBadge(enrolledClass?.rank);
  return (
    <motion.section className="space-y-4" {...motionProps}>
      <div className="xenon-hero-panel p-6 sm:p-8">
        <span className="xenon-pill">School Workspace</span>
        <h1 className="xenon-section-title mt-5 font-bold">A brighter classroom for Python practice, projects, and class progress.</h1>
        <p className="xenon-subtitle mt-4 max-w-2xl text-sm sm:text-base">
          Write code, run it instantly, save your projects, tackle a larger practice bank, and now challenge friends in 10-question Python showdowns.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="xenon-btn" onClick={() => onNavigate("code")}>Open Code</button>
          <button className="xenon-btn-ghost" onClick={() => onNavigate("theory")}>Open Theory</button>
          <button className="xenon-btn-ghost" onClick={() => onNavigate("projects")}>View Saved Projects</button>
          {profile?.role === "student" ? <button className="xenon-btn-ghost" onClick={() => onNavigate("challenge")}>Open 1v1</button> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="xenon-panel p-5">
          <p className="xenon-kicker">Your Role</p>
          <p className="mt-3 text-xl font-semibold capitalize">{profile?.role || "none"}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {profile?.role === "teacher"
              ? "You can create classes and manage students."
              : profile?.role === "student"
                ? "You can work on projects and join a class."
                : "Choose a role in Settings when you are ready."}
          </p>
        </div>
        <div className="xenon-panel p-5">
          <p className="xenon-kicker">Saved Projects</p>
          <p className="mt-3 text-xl font-semibold">{projectsCount}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Your code files are saved here so you can come back later.</p>
        </div>
        <div className="xenon-panel p-5">
          <p className="xenon-kicker">Level Progress</p>
          <p className="mt-3 text-xl font-semibold">Level {levelProgress.level}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{profile?.experience_points || 0} XP total</p>
          <div className="challenge-progress-track mt-4">
            <span style={{ width: `${levelProgress.percent}%` }} />
          </div>
        </div>
        <div className="xenon-panel p-5">
          <p className="xenon-kicker">Class Status</p>
          <p className="mt-3 text-xl font-semibold">{enrolledClass ? enrolledClass.name : "Not connected"}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {enrolledClass ? `Class code: ${enrolledClass.class_code}` : "Connect to a class from the Settings button in the header."}
          </p>
          {rankBadge ? <span className="xenon-badge mt-3">{rankBadge.icon} {rankBadge.label}</span> : null}
          {profile?.role === "student" ? <p className="mt-2 text-xs text-[var(--muted)]">{challengeCount} challenge{challengeCount === 1 ? "" : "s"} in your feed</p> : null}
        </div>
      </div>
    </motion.section>
  );
}

function SavedProjects({ onOpenIde }) {
  const { projects, openProject, loadProjects, newProject } = useAppStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <motion.section className="xenon-panel p-6 sm:p-8" {...motionProps}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Saved Projects</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Open an old project or start a new one.</p>
        </div>
        <button
          className="xenon-btn"
          onClick={() => {
            newProject();
            onOpenIde();
          }}
        >
          New Project
        </button>
      </div>

      {!projects.length ? (
        <div className="xenon-panel-muted mt-6 p-5">
          <p className="text-sm text-[var(--muted)]">You have no saved projects yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <button
              key={project.id}
              className="xenon-panel-muted p-4 text-left"
              onClick={() => {
                openProject(project);
                onOpenIde();
              }}
            >
              <h3 className="font-semibold">{project.title}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">{new Date(project.updated_at).toLocaleString()}</p>
              <pre className="xenon-code mt-3 overflow-hidden text-xs text-[var(--muted)]">{project.snippet || "# Empty file"}</pre>
            </button>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function StudentClassView() {
  const { enrolledClass, announcements, assignments, streak, submitAssignment } = useAppStore();
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [submittingId, setSubmittingId] = useState(null);
  const [noteMap, setNoteMap] = useState({});

  const handleSubmit = async (assignmentId) => {
    setSubmittingId(assignmentId);
    try {
      await submitAssignment({ assignmentId, notes: noteMap[assignmentId] || "" });
      setSubmittedIds((prev) => new Set([...prev, assignmentId]));
    } catch {}
    setSubmittingId(null);
  };

  const MEDALS = {
    1: { icon: "🥇", label: "1st Place", bg: "rgba(255,215,0,0.12)", border: "rgba(255,190,0,0.45)", text: "#8a6000" },
    2: { icon: "🥈", label: "2nd Place", bg: "rgba(192,192,192,0.14)", border: "rgba(160,160,160,0.5)", text: "#5a5a5a" },
    3: { icon: "🥉", label: "3rd Place", bg: "rgba(205,127,50,0.14)", border: "rgba(180,100,30,0.45)", text: "#7a4a10" },
  };

  return (
    <motion.section className="space-y-4" {...motionProps}>
      <div className="xenon-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">My Class</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Your class activity, ranking, assignments, and updates.</p>
          </div>
          {(streak?.current || 0) > 0 ? (
            <div className="xenon-panel-muted flex items-center gap-3 p-4">
              <span className="text-3xl leading-none">{streak.current >= 7 ? "⚡" : "🔥"}</span>
              <div>
                <p className="text-lg font-bold">{streak.current}-day streak</p>
                <p className="text-xs text-[var(--muted)]">Longest: {streak.longest} days</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {!enrolledClass ? (
        <div className="xenon-panel p-6">
          <p className="text-sm text-[var(--muted)]">You are not connected to a class yet. Go to Settings and enter a class code.</p>
        </div>
      ) : (
        <>
          <div className="xenon-panel p-6">
            <h3 className="text-lg font-semibold">Class Overview</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Class</p>
                <p className="mt-2 text-lg font-semibold">{enrolledClass.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Code {enrolledClass.class_code}</p>
              </div>
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Your Rank</p>
                <p className="mt-2 text-lg font-semibold">{enrolledClass.rank ? `#${enrolledClass.rank}` : "Unranked"}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Skills correct, then projects, then time</p>
              </div>
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Teacher</p>
                <p className="mt-2 text-lg font-semibold">{enrolledClass.profiles?.first_name || "Unknown"}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">@{enrolledClass.profiles?.username || "teacher"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Practice Time</p>
                <p className="mt-2 text-xl font-semibold">{formatPracticeTime(enrolledClass.total_time_seconds || 0)}</p>
              </div>
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Projects</p>
                <p className="mt-2 text-xl font-semibold">{enrolledClass.total_projects || 0}</p>
              </div>
              <div className="xenon-panel-muted p-4">
                <p className="xenon-kicker">Skills Correct</p>
                <p className="mt-2 text-xl font-semibold">{enrolledClass.practice_questions_correct || 0}</p>
              </div>
            </div>
          </div>

          {announcements.length > 0 ? (
            <div className="xenon-panel p-6">
              <h3 className="text-lg font-semibold">Announcements</h3>
              <div className="mt-4 space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="xenon-panel-muted p-4" style={{ borderLeft: "3px solid var(--accent)" }}>
                    <p className="text-sm leading-relaxed">{announcement.message}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">{new Date(announcement.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {assignments.length > 0 ? (
            <div className="xenon-panel p-6">
              <h3 className="text-lg font-semibold">Assignments</h3>
              <div className="mt-4 space-y-4">
                {assignments.map((assignment) => {
                  const done = submittedIds.has(assignment.id);
                  const submitting = submittingId === assignment.id;
                  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
                  return (
                    <div key={assignment.id} className="xenon-panel-muted p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{assignment.title}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{assignment.description}</p>
                          {assignment.question_goal ? (
                            <p className="mt-2 text-xs font-semibold text-[var(--accent)]">
                              Practice target: complete {assignment.question_goal} questions in the Practice tab
                            </p>
                          ) : null}
                          {assignment.due_date ? (
                            <p className={clsx("mt-1 text-xs font-semibold", isOverdue ? "text-red-500" : "text-[var(--muted)]")}>
                              Due: {new Date(assignment.due_date).toLocaleDateString()} {isOverdue ? "(overdue)" : ""}
                            </p>
                          ) : null}
                        </div>
                        {done ? (
                          <span className="xenon-badge" style={{ borderColor: "var(--success)", color: "var(--success)", background: "rgba(26,110,62,0.1)" }}>
                            Submitted
                          </span>
                        ) : (
                          <button className="xenon-btn" disabled={submitting} onClick={() => handleSubmit(assignment.id)}>
                            {submitting ? "Submitting..." : "Mark as Submitted"}
                          </button>
                        )}
                      </div>
                      {!done ? (
                        <textarea
                          className="xenon-input mt-3 w-full resize-none text-sm"
                          rows={2}
                          placeholder="Optional: add a note to your teacher..."
                          value={noteMap[assignment.id] || ""}
                          onChange={(event) => setNoteMap((prev) => ({ ...prev, [assignment.id]: event.target.value }))}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="xenon-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Class Leaderboard</h3>
              <span className="xenon-badge">{(enrolledClass.leaderboard || []).length} students</span>
            </div>
            <div className="mt-4 space-y-3">
              {(enrolledClass.leaderboard || []).map((entry) => {
                const medal = MEDALS[entry.rank] || null;
                return (
                  <div
                    key={entry.student_id}
                    className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4"
                    style={medal ? { borderColor: medal.border, background: medal.bg } : undefined}
                  >
                    <div className="flex items-center gap-4">
                      {medal ? <span className="text-2xl leading-none">{medal.icon}</span> : <span className="xenon-pill">#{entry.rank}</span>}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{entry.profiles?.first_name || entry.profiles?.username || "Student"}</p>
                          {medal ? (
                            <span className="rounded px-1.5 py-0.5 text-xs font-bold" style={{ background: medal.bg, color: medal.text, border: `1px solid ${medal.border}` }}>
                              {medal.label}
                            </span>
                          ) : null}
                          <span className="xenon-badge">Lvl {entry.profiles?.level || 1}</span>
                        </div>
                        <p className="text-sm text-[var(--muted)]">@{entry.profiles?.username || "unknown"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="xenon-badge">{entry.practice_questions_correct || 0} correct</span>
                      <span className="xenon-badge">{entry.total_projects || 0} projects</span>
                      <span className="xenon-badge">{formatPracticeTime(entry.total_time_seconds || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}

function AchievementsView() {
  const { achievements, databaseWarnings, profile } = useAppStore();

  return (
    <motion.div {...motionProps}>
      <AchievementsPanel
        title="Achievements"
        subtitle={profile?.role === "student" ? "Your milestones, streak awards, and classroom badges." : "Sign in as a student to unlock classroom achievements."}
        achievements={achievements}
        warning={databaseWarnings.achievements}
      />
    </motion.div>
  );
}

export default function App() {
  const {
    user,
    profile,
    authHydrated,
    enrolledClass,
    projects,
    friendChallenges,
    showInitOverlay,
    showProfileSetup,
    bootstrap,
    recoverAuthState,
    loadTeacherClasses,
    loadStudentClass,
    initAuthListener,
    cleanupAuthListener,
    signOut,
    streak,
    databaseWarnings,
  } = useAppStore();
  const [tab, setTab] = useState("home");

  useEffect(() => {
    bootstrap();
    initAuthListener();
    return () => cleanupAuthListener();
  }, [bootstrap, initAuthListener, cleanupAuthListener]);

  useEffect(() => {
    const timer = setTimeout(() => {
      recoverAuthState();
    }, 4500);
    return () => clearTimeout(timer);
  }, [recoverAuthState]);

  useEffect(() => {
    if (profile?.role === "teacher") loadTeacherClasses();
    if (profile?.role === "student") loadStudentClass();
  }, [profile?.role, loadTeacherClasses, loadStudentClass]);

  const navigation = [
    { id: "home", label: "Home" },
    { id: "code", label: "Code" },
    { id: "theory", label: "Theory" },
    { id: "projects", label: "Projects" },
    { id: "parsons", label: "Practise Python Skills" },
    ...(profile?.role === "student" ? [{ id: "challenge", label: "1v1 Showdown" }] : []),
    ...(profile?.role === "student" ? [{ id: "achievements", label: "Achievements" }] : []),
    ...(profile?.role === "teacher" ? [{ id: "class", label: "Classes" }] : []),
    ...(profile?.role === "student" ? [{ id: "view-class", label: "My Class" }] : []),
  ];

  if (!authHydrated) return <LoadingScreen />;
  if (!user) return <AuthGate initialMode="landing" />;

  const studentRank = profile?.role === "student" ? enrolledClass?.rank : null;
  const rankBadge = getRankBadge(studentRank);
  const levelProgress = getLevelProgress(profile?.experience_points || 0);
  const displayName = profile?.first_name || profile?.username || "User";

  return (
    <div className="xenon-shell">
      {showInitOverlay ? <InitOverlay /> : null}
      {showProfileSetup ? <ProfileSetupModal /> : null}

      <motion.header className="xenon-header sticky top-0 z-30" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mx-auto max-w-screen-xl px-4 md:px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <img src="/xenon-logo.svg" alt="Xenon Code logo" className="h-9 w-9 rounded-lg" />
              <div>
                <span className="text-base font-bold tracking-tight">Xenon Code</span>
                <span className="ml-2 hidden text-xs font-medium text-[var(--muted)] sm:inline">GCSE Python Learning</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(streak?.current || 0) >= 2 ? (
                <span className="xenon-badge hidden items-center gap-1 sm:inline-flex" title={`${streak.current}-day login streak`}>
                  {streak.current >= 7 ? "⚡" : "🔥"} {streak.current}d
                </span>
              ) : null}
              <span className="xenon-badge hidden sm:inline-flex">Lvl {levelProgress.level}</span>
              {rankBadge ? <span className="text-xl leading-none" title={`Rank #${studentRank} in your class`}>{rankBadge.icon}</span> : null}
              <div className="flex items-center gap-2">
                <ProfileAvatar name={displayName} avatarUrl={profile?.avatar_url} size="md" />
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold leading-tight">{displayName}</p>
                  <p className="text-xs capitalize leading-tight text-[var(--muted)]">
                    {profile?.role || "no role"}
                    {studentRank ? ` · Rank #${studentRank}` : ""}
                  </p>
                </div>
              </div>
              <button className="xenon-btn-subtle text-sm" onClick={() => setTab("settings")}>Settings</button>
              <button className="xenon-btn-ghost text-sm" onClick={signOut}>Sign Out</button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0" style={{ borderTop: "1px solid var(--border)" }}>
            {navigation.map((item) => (
              <button key={item.id} className="xenon-nav-tab" data-active={tab === item.id} onClick={() => setTab(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      <div className="mx-auto max-w-screen-xl px-4 py-5 md:px-6">
        {Object.keys(databaseWarnings || {}).length > 0 ? (
          <div className="xenon-panel mb-4 border-amber-400/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-200">Database setup still needs one Supabase migration.</p>
            <p className="mt-1 text-sm text-amber-100/90">
              Run the SQL in <code>supabase_migrations.sql</code>, then refresh. Until then, announcements, assignment targets, friend challenges, and student progression may stay unavailable.
            </p>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {tab === "home" ? <HomeView key="home" profile={profile} enrolledClass={enrolledClass} projectsCount={projects.length} challengeCount={friendChallenges.length} onNavigate={setTab} /> : null}
          {tab === "code" ? <motion.div key="code" {...motionProps}><XenonIDE /></motion.div> : null}
          {tab === "theory" ? <motion.div key="theory" {...motionProps}><TheoryComingSoon /></motion.div> : null}
          {tab === "projects" ? <SavedProjects key="projects" onOpenIde={() => setTab("code")} /> : null}
          {tab === "parsons" ? <motion.div key="parsons" {...motionProps}><ParsonsProblem /></motion.div> : null}
          {tab === "challenge" && profile?.role === "student" ? <motion.div key="challenge" {...motionProps}><ChallengeArena /></motion.div> : null}
          {tab === "achievements" && profile?.role === "student" ? <AchievementsView key="achievements" /> : null}
          {tab === "settings" ? <motion.div key="settings" {...motionProps}><SettingsPanel /></motion.div> : null}
          {tab === "class" && profile?.role === "teacher" ? <motion.div key="class" {...motionProps}><ClassDashboard /></motion.div> : null}
          {tab === "view-class" && profile?.role === "student" ? <StudentClassView key="view-class" /> : null}
        </AnimatePresence>

        <SiteFooter />
      </div>
    </div>
  );
}
