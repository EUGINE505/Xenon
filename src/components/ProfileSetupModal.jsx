import { useState } from "react";
import clsx from "clsx";
import { useAppStore } from "../store/useAppStore";

const roles = [
  {
    value: "student",
    label: "Student",
    description: "Join a class, solve coding tasks, and receive learner-friendly Python hints.",
  },
  {
    value: "teacher",
    label: "Teacher",
    description: "Create classes, share codes, and manage rosters from the dashboard.",
  },
];

export default function ProfileSetupModal() {
  const { profile, user, completeProfileSetup } = useAppStore();
  const fallbackName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const fallbackUser = (user?.email || "").split("@")[0] || "";
  const [fullName, setFullName] = useState(profile?.full_name || fallbackName);
  const [username, setUsername] = useState(profile?.username?.startsWith("xenonuser") ? "" : profile?.username || fallbackUser);
  const [role, setRole] = useState(profile?.role === "none" ? "" : profile?.role || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!fullName.trim() || !username.trim() || !role) {
      setError("Full name, username, and role are required.");
      return;
    }
    setLoading(true);
    try {
      await completeProfileSetup({ fullName, username, role });
    } catch (err) {
      setError(err?.message || "Could not update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="xenon-panel w-full max-w-3xl p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel-muted)] p-6">
            <p className="xenon-kicker">Profile Bootstrap</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Complete your Xenon identity</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Before entering the workspace, we need a display name, a username, and the permanent role that shapes your tools.
            </p>
            <div className="mt-6 space-y-3">
              <div className="xenon-metric">
                <p className="xenon-kicker">Important</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Student and Teacher roles are locked after selection. Choose the one that matches your real use.
                </p>
              </div>
              <div className="xenon-metric">
                <p className="xenon-kicker">Username</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Use letters, numbers, and underscores so classmates and teachers can recognize you easily.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Full Name</span>
                <input className="xenon-input" placeholder="Grace Hopper" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Username</span>
                <input className="xenon-input" placeholder="grace_codes" value={username} onChange={(e) => setUsername(e.target.value)} />
              </label>

              <div>
                <p className="mb-3 text-sm font-medium">Choose role</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((item) => (
                    <button
                      key={item.value}
                      className={clsx(
                        "rounded-3xl border p-5 text-left transition",
                        role === item.value
                          ? "border-[var(--border-strong)] bg-[var(--accent-soft)]"
                          : "border-[var(--border)] bg-transparent hover:border-[var(--border-strong)] hover:bg-[var(--panel-muted)]",
                      )}
                      onClick={() => setRole(item.value)}
                    >
                      <span className="block text-base font-semibold">{item.label}</span>
                      <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button className="xenon-btn w-full disabled:opacity-60" disabled={loading} onClick={submit}>
                {loading ? "Saving..." : "Save And Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
