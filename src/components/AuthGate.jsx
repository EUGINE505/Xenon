import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useAppStore } from "../store/useAppStore";
import SiteFooter from "./SiteFooter";

const roleOptions = [
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
  { label: "None", value: "none" },
];

const featureHighlights = [
  {
    title: "Run Python Instantly",
    description: "Start coding in the browser straight away with no installs, downloads, or setup problems.",
  },
  {
    title: "Practise Core Skills",
    description: "Build confidence with structured Python practise tasks designed for classroom learning.",
  },
  {
    title: "Save Real Progress",
    description: "Keep projects, return to them later, and build a record of your coding work over time.",
  },
  {
    title: "Track Class Progress",
    description: "Teachers can manage classes while students climb the leaderboard through practise and projects.",
  },
];

const journeySteps = [
  "Create an account and choose whether you are a student or teacher.",
  "Write Python in the built-in IDE, run it instantly, and save your work.",
  "Join a class, complete practise tasks, and build progress over time.",
];

export default function AuthGate({ initialMode = "landing" }) {
  const { signIn, signUp, signInWithGoogle } = useAppStore();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    fullName: "",
    username: "",
    role: "none",
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signin") {
        await signIn({ email: form.email, password: form.password });
        setMessage("Signed in successfully.");
      }
      if (mode === "signup") {
        if (!form.username.trim()) throw new Error("Username is required.");
        await signUp(form);
        setMessage("Account created.");
      }
    } catch (err) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleClick = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err?.message || "Google sign-in failed.");
      setLoading(false);
    }
  };

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (mode === "landing") {
    return (
      <div className="xenon-shell px-4 py-6 md:px-6">
        <motion.div className="mx-auto max-w-6xl space-y-4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="xenon-panel overflow-hidden p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <img src="/xenon-logo.svg" alt="Xenon Code logo" className="h-14 w-14 rounded-3xl shadow-lg shadow-black/20" />
                <span className="xenon-pill">Browser-Based Python Learning</span>
              </div>
              <h1 className="xenon-section-title mt-6 max-w-3xl font-bold">Learn Python in a clean workspace built for students and teachers.</h1>
              <p className="xenon-subtitle mt-4 max-w-3xl text-sm sm:text-base">
                Xenon Code gives you a simple place to write Python, run it instantly, save your projects, join classes, practise coding skills, and track progress without dealing with installation problems.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="xenon-btn" onClick={() => setMode("signup")}>Create Free Account</button>
                <button className="xenon-btn-ghost" onClick={() => setMode("signin")}>Sign In</button>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="xenon-panel-muted p-4">
                  <p className="xenon-kicker">Built For</p>
                  <p className="mt-2 text-lg font-semibold">Students</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">Learn Python with practise tasks, saved work, and clearer feedback.</p>
                </div>
                <div className="xenon-panel-muted p-4">
                  <p className="xenon-kicker">Built For</p>
                  <p className="mt-2 text-lg font-semibold">Teachers</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">Create classes, share codes, and monitor progress in one place.</p>
                </div>
                <div className="xenon-panel-muted p-4">
                  <p className="xenon-kicker">No Setup</p>
                  <p className="mt-2 text-lg font-semibold">Just Open And Code</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">Everything runs in the browser, so lessons can start faster.</p>
                </div>
              </div>
            </div>

            <div className="xenon-panel p-6 sm:p-8">
              <p className="xenon-kicker">How It Works</p>
              <h2 className="mt-3 text-2xl font-semibold">A simple route from first login to class progress</h2>
              <div className="mt-6 space-y-4">
                {journeySteps.map((step, index) => (
                  <div key={step} className="xenon-panel-muted flex gap-4 p-4">
                    <span className="xenon-pill h-fit">0{index + 1}</span>
                    <p className="text-sm leading-6 text-[var(--muted)]">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(79,184,255,0.12),rgba(255,255,255,0.03))] p-5">
                <p className="xenon-kicker">Why Xenon Code</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Built after seeing Trinket shut down, Xenon Code is designed to keep Python learning accessible, focused, and classroom-friendly.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureHighlights.map((item) => (
              <div key={item.title} className="xenon-panel p-5">
                <p className="xenon-kicker">Feature</p>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="xenon-panel p-6 sm:p-8">
              <p className="xenon-kicker">For Students</p>
              <h2 className="mt-3 text-2xl font-semibold">A calmer place to learn Python</h2>
              <div className="mt-5 space-y-3 text-sm leading-6 text-[var(--muted)]">
                <p>Write code, run it straight away, and read clearer Python hints when something goes wrong.</p>
                <p>Practise Python skills with structured tasks that contribute to class progress.</p>
                <p>Keep saved projects so classwork and homework are easy to revisit.</p>
              </div>
            </div>

            <div className="xenon-panel p-6 sm:p-8">
              <p className="xenon-kicker">For Teachers</p>
              <h2 className="mt-3 text-2xl font-semibold">Simple class management without the clutter</h2>
              <div className="mt-5 space-y-3 text-sm leading-6 text-[var(--muted)]">
                <p>Create classes, share a code, and let students join in a few clicks.</p>
                <p>See leaderboard positions based on practise questions, projects, and time spent practising.</p>
                <p>Use the dashboard to keep the class organised and follow student activity more easily.</p>
              </div>
            </div>
          </section>
        </motion.div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="xenon-shell px-4 py-6 md:px-6">
      <motion.form className="xenon-panel mx-auto min-h-[calc(100vh-14rem)] w-full max-w-xl self-center p-6 sm:p-8" onSubmit={onSubmit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <img src="/xenon-logo.svg" alt="Xenon Code logo" className="h-11 w-11 rounded-2xl" />
              <div>
                <h2 className="text-2xl font-semibold">{mode === "signin" ? "Sign In" : "Create Account"}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {mode === "signin" ? "Welcome back." : "Start using Xenon Code."}
                </p>
              </div>
            </div>
          </div>
          <button className="xenon-btn-subtle" type="button" onClick={() => setMode("landing")}>
            Back
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <button className="xenon-tab flex-1" data-active={mode === "signin"} type="button" onClick={() => setMode("signin")}>
            Sign In
          </button>
          <button className="xenon-tab flex-1" data-active={mode === "signup"} type="button" onClick={() => setMode("signup")}>
            Sign Up
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {mode === "signup" && (
            <>
              <input className="xenon-input" placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input className="xenon-input" placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className="xenon-input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <div>
                <p className="mb-2 text-sm font-medium">Choose your role</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      className={clsx(
                        "rounded-xl border px-4 py-3 text-sm",
                        form.role === role.value ? "border-[var(--border-strong)] bg-[var(--accent-soft)]" : "border-[var(--border)]",
                      )}
                      onClick={() => setForm({ ...form, role: role.value })}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">Student and Teacher are locked after you choose them.</p>
              </div>
            </>
          )}

          <input className="xenon-input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="xenon-input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button className="xenon-btn w-full" disabled={loading} type="submit">
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
          <button className="xenon-btn-ghost w-full" disabled={loading} type="button" onClick={onGoogleClick}>
            Google
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </motion.form>
      <SiteFooter />
    </div>
  );
}
