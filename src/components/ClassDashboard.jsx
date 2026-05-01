import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../store/useAppStore";
import { supabase } from "../lib/supabase";
import { translateSupabaseError } from "../lib/errorTranslator";

const formatPracticeTime = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
};

const MEDALS = {
  1: { icon: "🥇", label: "1st Place", bg: "rgba(255,215,0,0.12)", border: "rgba(255,190,0,0.45)", text: "#8a6000" },
  2: { icon: "🥈", label: "2nd Place", bg: "rgba(192,192,192,0.14)", border: "rgba(160,160,160,0.5)", text: "#5a5a5a" },
  3: { icon: "🥉", label: "3rd Place", bg: "rgba(205,127,50,0.14)", border: "rgba(180,100,30,0.45)", text: "#7a4a10" },
};

const CARD_ACCENTS = [
  "#4fb8ff", "#a78bfa", "#34d399", "#fb923c",
  "#f87171", "#fbbf24", "#38bdf8", "#e879f9", "#2dd4bf",
];

function getAccent(str = "") {
  const hash = str.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CARD_ACCENTS[hash % CARD_ACCENTS.length];
}

// ─── Announcements ─────────────────────────────────────────────────────────────

function ClassAnnouncementsPanel({ cls }) {
  const { postAnnouncement, deleteAnnouncement, databaseWarnings } = useAppStore();
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("class_announcements")
        .select("*")
        .eq("class_id", cls.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
      setLoaded(true);
      setErr("");
    } catch (error) {
      setErr(translateSupabaseError(error, "Could not load announcements."));
      setLoaded(true);
    }
    setLoading(false);
  };

  const submit = async () => {
    if (!message.trim()) return;
    setErr("");
    try {
      await postAnnouncement({ classId: cls.id, message });
      setMessage("");
      await load();
    } catch (e) { setErr(e?.message || "Could not post."); }
  };

  const remove = async (id) => {
    try { await deleteAnnouncement(id); await load(); } catch {}
  };

  if (!loaded) return (
    <div className="mt-4">
      <button className="xenon-btn-subtle" onClick={load} disabled={loading}>
        {loading ? "Loading..." : "Load Announcements"}
      </button>
    </div>
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        <textarea
          className="xenon-input flex-1 resize-none"
          rows={2}
          placeholder="Type an announcement for your students..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="xenon-btn self-start" onClick={submit}>Post</button>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
      {databaseWarnings.announcements && (
        <p className="text-sm text-amber-400">{databaseWarnings.announcements}</p>
      )}
      {!announcements.length ? (
        <p className="text-sm text-[var(--muted)]">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="xenon-panel-muted flex items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm leading-relaxed">{a.message}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <button className="xenon-btn-ghost text-xs" onClick={() => remove(a.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Assignments ───────────────────────────────────────────────────────────────

function ClassAssignmentsPanel({ cls }) {
  const { postAssignment, deleteAssignment, loadSubmissions, databaseWarnings } = useAppStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [questionGoal, setQuestionGoal] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("class_assignments")
        .select("*")
        .eq("class_id", cls.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAssignments(data || []);
      setLoaded(true);
      setErr("");
    } catch (error) {
      setErr(translateSupabaseError(error, "Could not load assignments."));
      setLoaded(true);
    }
    setLoading(false);
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) { setErr("Title and description are required."); return; }
    setErr("");
    try {
      await postAssignment({ classId: cls.id, title, description, dueDate, questionGoal });
      setTitle(""); setDescription(""); setDueDate(""); setQuestionGoal("");
      await load();
    } catch (e) { setErr(e?.message || "Could not post assignment."); }
  };

  const remove = async (id) => {
    try { await deleteAssignment(id); await load(); } catch {}
  };

  const viewSubs = async (assignmentId) => {
    if (expandedId === assignmentId) { setExpandedId(null); return; }
    setExpandedId(assignmentId);
    setSubsLoading(true);
    const data = await loadSubmissions(assignmentId);
    setSubmissions(data);
    setSubsLoading(false);
  };

  if (!loaded) return (
    <div className="mt-4">
      <button className="xenon-btn-subtle" onClick={load} disabled={loading}>
        {loading ? "Loading..." : "Load Assignments"}
      </button>
    </div>
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="xenon-input" placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="xenon-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <input className="xenon-input" type="number" min="1" placeholder="Questions to complete (e.g. 20)" value={questionGoal} onChange={(e) => setQuestionGoal(e.target.value)} />
        </div>
        <textarea
          className="xenon-input w-full resize-none"
          rows={3}
          placeholder="Describe the task. If you set a question target, students must reach that number of practice questions before they can submit."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="xenon-btn" onClick={submit}>Set Assignment</button>
        {err && <p className="text-sm text-red-500">{err}</p>}
        {databaseWarnings.assignments && <p className="text-sm text-amber-400">{databaseWarnings.assignments}</p>}
      </div>

      {!assignments.length ? (
        <p className="text-sm text-[var(--muted)]">No assignments set yet.</p>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="xenon-panel-muted p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{a.description}</p>
                  {a.question_goal ? (
                    <p className="mt-2 text-xs font-semibold text-[var(--accent)]">
                      Requires {a.question_goal} questions completed before submit unlocks
                    </p>
                  ) : null}
                  {a.due_date && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Due: {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="xenon-btn-subtle text-xs" onClick={() => viewSubs(a.id)}>
                    {expandedId === a.id ? "Hide Submissions" : "View Submissions"}
                  </button>
                  <button className="xenon-btn-ghost text-xs" onClick={() => remove(a.id)}>Delete</button>
                </div>
              </div>
              {expandedId === a.id && (
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  {subsLoading ? (
                    <p className="text-sm text-[var(--muted)]">Loading submissions...</p>
                  ) : !submissions.length ? (
                    <p className="text-sm text-[var(--muted)]">No submissions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {submissions.map((s) => (
                        <div key={s.id} className="rounded border border-[var(--border)] p-3">
                          <p className="text-sm font-semibold">
                            {s.profiles?.first_name || s.profiles?.username || "Student"}
                          </p>
                          {s.notes && <p className="mt-1 text-xs text-[var(--muted)]">{s.notes}</p>}
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Submitted: {new Date(s.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Class detail view (shown after selecting a card) ─────────────────────────

function ClassDetailView({ cls, onBack, removeStudentFromClass }) {
  const [tab, setTab] = useState("overview");
  const accent = getAccent(cls.name);

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
      {/* Header */}
      <div className="xenon-panel overflow-hidden p-0">
        <div className="h-2 w-full" style={{ background: accent }} />
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <button
              className="mb-3 flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] transition"
              onClick={onBack}
            >
              ← All classes
            </button>
            <h2 className="text-2xl font-bold">{cls.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{cls.description}</p>
          </div>
          <span className="xenon-pill xenon-code text-lg tracking-widest">{cls.class_code}</span>
        </div>
        <div className="flex gap-1 border-t border-[var(--border)] px-6">
          {["overview", "announcements", "assignments"].map((t) => (
            <button key={t} className="xenon-tab capitalize" data-active={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="xenon-panel p-5">
              <p className="xenon-kicker">Students</p>
              <p className="mt-2 text-2xl font-bold">{(cls.class_members || []).length}</p>
            </div>
            <div className="xenon-panel p-5">
              <p className="xenon-kicker">Total Practice Time</p>
              <p className="mt-2 text-2xl font-bold">
                {formatPracticeTime((cls.class_members || []).reduce((s, m) => s + (m.total_time_seconds || 0), 0))}
              </p>
            </div>
            <div className="xenon-panel p-5">
              <p className="xenon-kicker">Questions Completed</p>
              <p className="mt-2 text-2xl font-bold">
                {(cls.class_members || []).reduce((s, m) => s + (m.practice_questions_correct || 0), 0)}
              </p>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="xenon-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Leaderboard</h3>
              <span className="text-sm text-[var(--muted)]">Ranked by questions, projects, time</span>
            </div>
            <div className="mt-4 space-y-3">
              {(cls.leaderboard || cls.class_members || []).map((member, index) => {
                const rank = member.rank || index + 1;
                const medal = MEDALS[rank] || null;
                return (
                  <div
                    key={member.student_id}
                    className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4"
                    style={medal ? { borderColor: medal.border, background: medal.bg } : undefined}
                  >
                    <div className="flex items-center gap-4">
                      {medal ? (
                        <span className="text-2xl leading-none">{medal.icon}</span>
                      ) : (
                        <span className="xenon-pill">#{rank}</span>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {member.profiles?.first_name || member.profiles?.username || "Student"}
                          </p>
                          {medal && (
                            <span
                              className="rounded px-1.5 py-0.5 text-xs font-bold"
                              style={{ background: medal.bg, color: medal.text, border: `1px solid ${medal.border}` }}
                            >
                              {medal.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--muted)]">@{member.profiles?.username || "unknown"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="xenon-badge">{member.practice_questions_correct || 0} questions</span>
                      <span className="xenon-badge">{member.total_projects || 0} projects</span>
                      <span className="xenon-badge">{formatPracticeTime(member.total_time_seconds || 0)}</span>
                    </div>
                  </div>
                );
              })}
              {!(cls.class_members || []).length && (
                <p className="text-sm text-[var(--muted)]">No students enrolled yet. Share the class code above.</p>
              )}
            </div>
          </div>

          {/* Student table */}
          <div className="xenon-panel p-6">
            <h3 className="mb-4 text-lg font-semibold">All Students</h3>
            <div className="xenon-scroll overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                    <th className="py-3 pr-4">Username</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Questions</th>
                    <th className="py-3 pr-4">Time</th>
                    <th className="py-3 pr-4">Projects</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(cls.class_members || []).length ? (
                    cls.class_members.map((member) => (
                      <tr key={member.student_id} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="py-3 pr-4 font-mono text-sm">@{member.profiles?.username || "—"}</td>
                        <td className="py-3 pr-4">{member.profiles?.first_name || "—"}</td>
                        <td className="py-3 pr-4">{member.practice_questions_correct || 0}</td>
                        <td className="py-3 pr-4">{formatPracticeTime(member.total_time_seconds || 0)}</td>
                        <td className="py-3 pr-4">{member.total_projects || 0}</td>
                        <td className="py-3">
                          <button
                            className="xenon-btn-ghost text-xs"
                            onClick={() => removeStudentFromClass({ classId: cls.id, studentId: member.student_id })}
                          >
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
          </div>
        </div>
      )}

      {tab === "announcements" && (
        <div className="xenon-panel p-6">
          <ClassAnnouncementsPanel cls={cls} />
        </div>
      )}

      {tab === "assignments" && (
        <div className="xenon-panel p-6">
          <ClassAssignmentsPanel cls={cls} />
        </div>
      )}
    </motion.div>
  );
}

// ─── Class card (grid tile) ────────────────────────────────────────────────────

function ClassTile({ cls, onClick }) {
  const accent = getAccent(cls.name);
  const studentCount = (cls.class_members || []).length;

  return (
    <motion.button
      className="xenon-panel group w-full overflow-hidden rounded-2xl text-left transition"
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Accent banner */}
      <div className="relative flex h-28 items-end p-4" style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}18)`, borderBottom: `2px solid ${accent}55` }}>
        <div
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black"
          style={{ background: accent + "33", color: accent }}
        >
          {cls.name.charAt(0).toUpperCase()}
        </div>
        <div className="font-mono text-xs tracking-widest opacity-60">{cls.class_code}</div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold leading-snug">{cls.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{cls.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="xenon-badge">{studentCount} student{studentCount !== 1 ? "s" : ""}</span>
          </div>
          <span className="text-xs text-[var(--muted)] opacity-0 transition group-hover:opacity-100">
            Open →
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main ClassDashboard ───────────────────────────────────────────────────────

export default function ClassDashboard() {
  const { classes, createClass, joinClassAsTeacher, removeStudentFromClass, loadTeacherClasses, databaseWarnings } = useAppStore();

  const [selectedId, setSelectedId] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinStatus, setJoinStatus] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const selectedClass = classes.find((c) => c.id === selectedId) || null;

  const submitCreate = async () => {
    setCreateError("");
    if (!name.trim() || !description.trim()) { setCreateError("Class name and description are required."); return; }
    setCreating(true);
    try {
      await createClass({ name: name.trim(), description: description.trim() });
      setName(""); setDescription("");
      setShowCreateForm(false);
    } catch (err) { setCreateError(err?.message || "Could not create class."); }
    setCreating(false);
  };

  const submitJoin = async () => {
    setJoinError(""); setJoinStatus("");
    setJoining(true);
    try {
      await joinClassAsTeacher(joinCode);
      setJoinCode("");
      setJoinStatus("Joined! The class has been added to your list.");
      setShowJoinForm(false);
    } catch (err) { setJoinError(err?.message || "Could not join class."); }
    setJoining(false);
  };

  const refreshClasses = async () => {
    setRefreshing(true);
    try { await loadTeacherClasses(); } catch {}
    setRefreshing(false);
  };

  // ── Detail view ──
  if (selectedClass) {
    return (
      <ClassDetailView
        cls={selectedClass}
        onBack={() => setSelectedId(null)}
        removeStudentFromClass={removeStudentFromClass}
      />
    );
  }

  // ── Card grid ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="xenon-panel p-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">My Classes</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {classes.length
                ? `${classes.length} class${classes.length !== 1 ? "es" : ""} — click a card to manage it`
                : "No classes yet. Create one or join as a co-teacher."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="xenon-btn"
              onClick={() => { setShowCreateForm((v) => !v); setShowJoinForm(false); setCreateError(""); }}
            >
              {showCreateForm ? "Cancel" : "+ Create a Class"}
            </button>
            <button
              className="xenon-btn-subtle"
              onClick={() => { setShowJoinForm((v) => !v); setShowCreateForm(false); setJoinError(""); setJoinStatus(""); }}
            >
              {showJoinForm ? "Cancel" : "Join Another Class"}
            </button>
            <button className="xenon-btn-ghost" disabled={refreshing} onClick={refreshClasses}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {joinStatus && !showJoinForm && (
          <p className="mt-3 text-sm text-green-400">{joinStatus}</p>
        )}
        {databaseWarnings.class_teachers && (
          <p className="mt-3 text-sm text-amber-400">{databaseWarnings.class_teachers}</p>
        )}

        {/* Create form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              className="mt-5 space-y-3 border-t border-[var(--border)] pt-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-semibold">Create a New Class</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="xenon-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Year 10 — Period 2"
                  onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                />
                <input
                  className="xenon-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                />
              </div>
              <button className="xenon-btn" disabled={creating} onClick={submitCreate}>
                {creating ? "Creating..." : "Create Class"}
              </button>
              {createError && <p className="text-sm text-red-500">{createError}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join form */}
        <AnimatePresence>
          {showJoinForm && (
            <motion.div
              className="mt-5 space-y-3 border-t border-[var(--border)] pt-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-semibold">Join Another Class as Co-Teacher</h3>
              <p className="text-sm text-[var(--muted)]">
                Ask the lead teacher for the class code. You will get full access alongside them.
              </p>
              <div className="flex gap-2">
                <input
                  className="xenon-input w-44 font-mono uppercase tracking-widest"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CLASS CODE"
                  maxLength={8}
                  onKeyDown={(e) => e.key === "Enter" && submitJoin()}
                />
                <button className="xenon-btn" disabled={joining} onClick={submitJoin}>
                  {joining ? "Joining..." : "Join Class"}
                </button>
              </div>
              {joinError && <p className="text-sm text-red-500">{joinError}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Class card grid */}
      {classes.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <ClassTile key={cls.id} cls={cls} onClick={() => setSelectedId(cls.id)} />
          ))}
        </div>
      ) : (
        !showCreateForm && !showJoinForm && (
          <div className="xenon-panel p-8 text-center">
            <p className="text-4xl">🏫</p>
            <p className="mt-3 font-semibold">No classes yet</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Create your first class above, or join an existing class as a co-teacher using a class code.
            </p>
          </div>
        )
      )}
    </div>
  );
}
