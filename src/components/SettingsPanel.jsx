import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../store/useAppStore";

const themes = [
  { value: "xenon-dark", label: "Xenon Dark" },
  { value: "oled-black", label: "OLED Black" },
  { value: "classic-light", label: "Classic Light" },
  { value: "solarized", label: "Solarized" },
];

export default function SettingsPanel() {
  const {
    profile,
    enrolledClass,
    theme,
    setTheme,
    updateRole,
    joinClassByCode,
    leaveCurrentClass,
    loadProfile,
    changePassword,
  } = useAppStore();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!profile) loadProfile();
  }, [profile, loadProfile]);

  const connectClass = async () => {
    setStatus("");
    setError("");
    try {
      await joinClassByCode(code);
      setStatus("Connected to class.");
      setCode("");
    } catch (err) {
      setError(err?.message || "Could not join class.");
    }
  };

  const leaveClass = async () => {
    setStatus("");
    setError("");
    try {
      await leaveCurrentClass();
      setStatus("Left class.");
    } catch (err) {
      setError(err?.message || "Could not leave class.");
    }
  };

  const submitPassword = async () => {
    setStatus("");
    setError("");
    try {
      await changePassword(password);
      setStatus("Password updated.");
      setPassword("");
    } catch (err) {
      setError(err?.message || "Could not update password.");
    }
  };

  return (
    <motion.section className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="xenon-panel p-6">
        <h2 className="text-2xl font-semibold">Settings</h2>
        {!profile ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Loading...</p>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="text-[var(--muted)]">Full Name:</span> {profile.full_name || "Not set"}</p>
            <p><span className="text-[var(--muted)]">Username:</span> {profile.username || "Not set"}</p>
            <p><span className="text-[var(--muted)]">Role:</span> {profile.role || "none"}</p>
            <p><span className="text-[var(--muted)]">Joined:</span> {profile.joined_app ? new Date(profile.joined_app).toLocaleDateString() : "Unknown"}</p>
          </div>
        )}
      </div>

      <div className="xenon-panel p-6">
        <h3 className="text-lg font-semibold">Theme</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {themes.map((item) => (
            <button
              key={item.value}
              className="xenon-panel-muted p-4 text-left"
              style={theme === item.value ? { borderColor: "var(--border-strong)", background: "var(--accent-soft)" } : undefined}
              onClick={() => setTheme(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {profile?.role === "none" && (
        <div className="xenon-panel p-6">
          <h3 className="text-lg font-semibold">Choose Role</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">You can still become a Student or Teacher.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="xenon-btn" onClick={() => updateRole("student")}>Become Student</button>
            <button className="xenon-btn-ghost" onClick={() => updateRole("teacher")}>Become Teacher</button>
          </div>
        </div>
      )}

      {profile?.role === "student" && (
        <div className="xenon-panel p-6">
          <h3 className="text-lg font-semibold">Class Connection</h3>
          {enrolledClass ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">{enrolledClass.name} ({enrolledClass.class_code})</p>
              <button className="xenon-btn-ghost" onClick={leaveClass}>Leave Class</button>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <input className="xenon-input max-w-sm" placeholder="Class Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <button className="xenon-btn" onClick={connectClass}>Connect</button>
            </div>
          )}
        </div>
      )}

      <div className="xenon-panel p-6">
        <h3 className="text-lg font-semibold">Password</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <input className="xenon-input max-w-sm" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="xenon-btn" onClick={submitPassword}>Update Password</button>
        </div>
      </div>

      {status && <p className="text-sm text-green-400">{status}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </motion.section>
  );
}
