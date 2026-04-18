import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../store/useAppStore";

const formatPracticeTime = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
};

export default function ClassDashboard() {
  const { classes, createClass, removeStudentFromClass, loadTeacherClasses } = useAppStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const submitClass = async () => {
    setStatus("");
    setError("");
    if (!name.trim() || !description.trim()) {
      setError("Class name and description are required.");
      return;
    }
    try {
      await createClass({ name: name.trim(), description: description.trim() });
      setStatus("Class created.");
      setName("");
      setDescription("");
    } catch (err) {
      setError(err?.message || "Could not create class.");
    }
  };

  const refreshClasses = async () => {
    setStatus("");
    setError("");
    setRefreshing(true);
    try {
      await loadTeacherClasses();
      setStatus("Class data refreshed.");
    } catch (err) {
      setError(err?.message || "Could not refresh class data.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <motion.section className="xenon-panel p-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-semibold">Class Dashboard</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Create a class and manage your students.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="xenon-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Class Name" />
          <input className="xenon-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="xenon-btn" onClick={submitClass}>Create Class</button>
          <button className="xenon-btn-ghost" disabled={refreshing} onClick={refreshClasses}>
            {refreshing ? "Refreshing..." : "Refresh Leaderboard"}
          </button>
        </div>
        {status && <p className="mt-3 text-sm text-green-400">{status}</p>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </motion.section>

      {!classes.length && (
        <section className="xenon-panel p-6">
          <p className="text-sm text-[var(--muted)]">No classes yet.</p>
        </section>
      )}

      {classes.map((cls) => (
        <motion.section key={cls.id} className="xenon-panel p-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">{cls.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{cls.description}</p>
            </div>
            <span className="xenon-pill xenon-code">{cls.class_code}</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Students</p>
              <p className="mt-2 text-xl font-semibold">{(cls.class_members || []).length}</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Total Practice Time</p>
              <p className="mt-2 text-xl font-semibold">
                {formatPracticeTime((cls.class_members || []).reduce((sum, member) => sum + (member.total_time_seconds || 0), 0))}
              </p>
            </div>
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">Total Projects</p>
              <p className="mt-2 text-xl font-semibold">
                {(cls.class_members || []).reduce((sum, member) => sum + (member.total_projects || 0), 0)}
              </p>
            </div>
          </div>

          <div className="xenon-panel-muted mt-4 p-4">
            <p className="xenon-kicker">Practise Questions Correct</p>
            <p className="mt-2 text-xl font-semibold">
              {(cls.class_members || []).reduce((sum, member) => sum + (member.practice_questions_correct || 0), 0)}
            </p>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold">Leaderboard</h4>
              <span className="text-sm text-[var(--muted)]">Top students by skills correct, then projects, then time spent</span>
            </div>
            <div className="mt-4 space-y-3">
              {(cls.leaderboard || cls.class_members || [])
                .map((member, index) => {
                  const rank = member.rank || index + 1;
                  const medal =
                    rank === 1 ? { icon: "🥇", label: "1st Place", bg: "rgba(255,215,0,0.12)", border: "rgba(255,190,0,0.45)", text: "#8a6000" } :
                    rank === 2 ? { icon: "🥈", label: "2nd Place", bg: "rgba(192,192,192,0.14)", border: "rgba(160,160,160,0.5)", text: "#5a5a5a" } :
                    rank === 3 ? { icon: "🥉", label: "3rd Place", bg: "rgba(205,127,50,0.14)", border: "rgba(180,100,30,0.45)", text: "#7a4a10" } :
                    null;
                  return (
                    <div
                      key={member.student_id}
                      className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4"
                      style={medal ? { borderColor: medal.border, background: medal.bg } : undefined}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {medal ? (
                            <span className="text-2xl leading-none" title={medal.label}>{medal.icon}</span>
                          ) : (
                            <span className="xenon-pill">#{rank}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{member.profiles?.first_name || member.profiles?.username || "Student"}</p>
                            {medal && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: medal.bg, color: medal.text, border: `1px solid ${medal.border}` }}>
                                {medal.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--muted)]">@{member.profiles?.username || "unknown"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="xenon-badge">{member.practice_questions_correct || 0} correct</span>
                        <span className="xenon-badge">{member.total_projects || 0} projects</span>
                        <span className="xenon-badge">{formatPracticeTime(member.total_time_seconds || 0)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="xenon-scroll mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                  <th className="py-3 pr-4">Username</th>
                  <th className="py-3 pr-4">First Name</th>
                  <th className="py-3 pr-4">Correct</th>
                  <th className="py-3 pr-4">Time</th>
                  <th className="py-3 pr-4">Projects</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {(cls.class_members || []).length ? (
                  cls.class_members.map((member) => (
                    <tr key={member.student_id} className="border-b border-[var(--border)] last:border-b-0">
                      <td className="py-3 pr-4">{member.profiles?.username || "Unknown"}</td>
                      <td className="py-3 pr-4">{member.profiles?.first_name || "Unknown"}</td>
                      <td className="py-3 pr-4">{member.practice_questions_correct || 0}</td>
                      <td className="py-3 pr-4">{formatPracticeTime(member.total_time_seconds || 0)}</td>
                      <td className="py-3 pr-4">{member.total_projects || 0}</td>
                      <td className="py-3">
                        <button className="xenon-btn-ghost" onClick={() => removeStudentFromClass({ classId: cls.id, studentId: member.student_id })}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-[var(--muted)]" colSpan={6}>No students enrolled yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      ))}
    </div>
  );
}
