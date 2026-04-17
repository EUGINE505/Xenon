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
import TheoryComingSoon from "./components/TheoryComingSoon";
import SiteFooter from "./components/SiteFooter";
import { useAppStore } from "./store/useAppStore";

const motionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: "easeOut" },
};

const roleStyles = {
  teacher: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  student: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  none: "border-white/15 bg-white/5 text-[var(--muted)]",
};

const formatPracticeTime = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
};

function HomeView({ profile, enrolledClass, projectsCount, onNavigate }) {
  return (
    <motion.section className="space-y-4" {...motionProps}>
      <div className="xenon-panel p-6 sm:p-8">
        <span className="xenon-pill">Welcome to Xenon Code</span>
        <h1 className="xenon-section-title mt-5 font-bold">A simple place to learn Python in your browser.</h1>
        <p className="xenon-subtitle mt-4 max-w-2xl text-sm sm:text-base">
          Write code, run it instantly, save your projects, and use guided activities made for GCSE learning.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="xenon-btn" onClick={() => onNavigate("code")}>
            Open Code
          </button>
          <button className="xenon-btn-ghost" onClick={() => onNavigate("theory")}>
            Open Theory
          </button>
          <button className="xenon-btn-ghost" onClick={() => onNavigate("projects")}>
            View Saved Projects
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
          <p className="xenon-kicker">Class Status</p>
          <p className="mt-3 text-xl font-semibold">
            {enrolledClass ? enrolledClass.name : "Not connected"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {enrolledClass ? `Class code: ${enrolledClass.class_code}` : "Connect to a class from Settings."}
          </p>
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
              <p className="mt-1 text-xs text-[var(--muted)]">
                {new Date(project.updated_at).toLocaleString()}
              </p>
              <pre className="xenon-code mt-3 overflow-hidden text-xs text-[var(--muted)]">
                {project.snippet || "# Empty file"}
              </pre>
            </button>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function StudentClassView() {
  const { enrolledClass } = useAppStore();

  return (
    <motion.section className="xenon-panel p-6 sm:p-8" {...motionProps}>
      <h2 className="text-2xl font-semibold">Your Class</h2>
      {!enrolledClass ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          You are not connected to a class yet. Go to Settings and enter a class code.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Class</p>
              <p className="mt-2 text-lg font-semibold">{enrolledClass.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Code {enrolledClass.class_code}</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Your Rank</p>
              <p className="mt-2 text-lg font-semibold">{enrolledClass.rank ? `#${enrolledClass.rank}` : "Unranked"}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Based on skills correct first, then projects and practice time</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Teacher</p>
              <p className="mt-2 text-lg font-semibold">{enrolledClass.profiles?.first_name || "Unknown"}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">@{enrolledClass.profiles?.username || "teacher"}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Time Spent Practicing</p>
              <p className="mt-2 text-xl font-semibold">{formatPracticeTime(enrolledClass.total_time_seconds || 0)}</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Projects Created</p>
              <p className="mt-2 text-xl font-semibold">{enrolledClass.total_projects || 0}</p>
            </div>
          </div>

          <div className="xenon-panel-muted p-4">
            <p className="xenon-kicker">Practise Questions Correct</p>
            <p className="mt-2 text-xl font-semibold">{enrolledClass.practice_questions_correct || 0}</p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Class Leaderboard</h3>
              <span className="xenon-badge">{(enrolledClass.leaderboard || []).length} students</span>
            </div>
            <div className="mt-4 space-y-3">
              {(enrolledClass.leaderboard || []).map((entry) => (
                <div key={entry.student_id} className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-4">
                    <span className="xenon-pill">#{entry.rank}</span>
                    <div>
                      <p className="font-semibold">{entry.profiles?.first_name || entry.profiles?.username || "Student"}</p>
                      <p className="text-sm text-[var(--muted)]">@{entry.profiles?.username || "unknown"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="xenon-badge">{entry.practice_questions_correct || 0} correct</span>
                    <span className="xenon-badge">{entry.total_projects || 0} projects</span>
                    <span className="xenon-badge">{formatPracticeTime(entry.total_time_seconds || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}

export default function App() {
  const {
    user,
    profile,
    authHydrated,
    enrolledClass,
    projects,
    showInitOverlay,
    showProfileSetup,
    bootstrap,
    recoverAuthState,
    loadTeacherClasses,
    loadStudentClass,
    initAuthListener,
    cleanupAuthListener,
    signOut,
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
    { id: "settings", label: "Settings" },
    ...(profile?.role === "teacher" ? [{ id: "class", label: "Classes" }] : []),
    ...(profile?.role === "student" ? [{ id: "view-class", label: "My Class" }] : []),
  ];

  if (!authHydrated) {
    return (
      <div className="xenon-shell flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-6xl">
          <div className="xenon-panel mx-auto w-full max-w-sm p-6 text-center">
            <p className="text-sm text-[var(--muted)]">Loading Xenon Code...</p>
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  if (!user) return <AuthGate initialMode="landing" />;

  return (
    <div className="xenon-shell px-4 py-4 md:px-6">
      {showInitOverlay && <InitOverlay />}
      {showProfileSetup && <ProfileSetupModal />}

      <motion.nav
        className="xenon-panel mb-5 p-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <img src="/xenon-logo.svg" alt="Xenon Code logo" className="h-12 w-12 rounded-2xl" />
              <div>
                <h1 className="text-lg font-semibold">Xenon Code</h1>
                <p className="text-sm text-[var(--muted)]">Simple Python learning</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  className="xenon-tab"
                  data-active={tab === item.id}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx("xenon-badge", roleStyles[profile?.role || "none"])}>
              {profile?.role || "none"}
            </span>
            <button className="xenon-btn-ghost" onClick={signOut}>
              Log Out
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence mode="wait">
        {tab === "home" && (
          <HomeView
            key="home"
            profile={profile}
            enrolledClass={enrolledClass}
            projectsCount={projects.length}
            onNavigate={setTab}
          />
        )}
        {tab === "code" && <motion.div key="code" {...motionProps}><XenonIDE /></motion.div>}
        {tab === "theory" && <motion.div key="theory" {...motionProps}><TheoryComingSoon /></motion.div>}
        {tab === "projects" && <SavedProjects key="projects" onOpenIde={() => setTab("code")} />}
        {tab === "parsons" && <motion.div key="parsons" {...motionProps}><ParsonsProblem /></motion.div>}
        {tab === "settings" && <motion.div key="settings" {...motionProps}><SettingsPanel /></motion.div>}
        {tab === "class" && profile?.role === "teacher" && <motion.div key="class" {...motionProps}><ClassDashboard /></motion.div>}
        {tab === "view-class" && profile?.role === "student" && <StudentClassView key="view-class" />}
      </AnimatePresence>

      <SiteFooter />
    </div>
  );
}
