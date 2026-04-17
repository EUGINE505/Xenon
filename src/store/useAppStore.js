import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { generateClassCode } from "../lib/classCode";

const THEMES = ["xenon-dark", "oled-black", "classic-light", "solarized", "pink", "blue"];

const getStoredTheme = () => {
  if (typeof window === "undefined") return "xenon-dark";
  const storedTheme = window.localStorage.getItem("xenon-theme");
  return THEMES.includes(storedTheme) ? storedTheme : "xenon-dark";
};

const applyTheme = (theme) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem("xenon-theme", theme);
  }
};

const withTimeout = async (promise, timeoutMs = 5000) => {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Request timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const hasMissingColumnError = (error) =>
  String(error?.message || "").toLowerCase().includes("practice_questions_correct");

const LOCAL_PRACTICE_KEY = "xenon-local-practice-correct";

const readLocalPracticeCounts = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_PRACTICE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeLocalPracticeCounts = (counts) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_PRACTICE_KEY, JSON.stringify(counts));
};

const getLocalPracticeCorrect = (classId, studentId) => {
  if (!classId || !studentId) return 0;
  const counts = readLocalPracticeCounts();
  return counts[`${classId}:${studentId}`] || 0;
};

const setLocalPracticeCorrect = (classId, studentId, value) => {
  if (!classId || !studentId) return value || 0;
  const counts = readLocalPracticeCounts();
  const nextValue = Math.max(0, value || 0);
  counts[`${classId}:${studentId}`] = nextValue;
  writeLocalPracticeCounts(counts);
  return nextValue;
};

const mergePracticeCorrect = (classId, studentId, value) =>
  Math.max(value || 0, getLocalPracticeCorrect(classId, studentId));

const getLeaderboardScore = (entry = {}) =>
  (entry.practice_questions_correct || 0) * 100000 +
  (entry.total_projects || 0) * 100 +
  (entry.total_time_seconds || 0);

const buildLeaderboard = (members = []) =>
  members
    .map((entry) => ({
      ...entry,
      practice_questions_correct: entry.practice_questions_correct || 0,
      total_projects: entry.total_projects || 0,
      total_time_seconds: entry.total_time_seconds || 0,
      score: getLeaderboardScore(entry),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

const hydrateClassLeaderboard = (cls, studentId = null) => {
  if (!cls) return null;
  const normalizedMembers = (cls.class_members || []).map((entry) => ({
    ...entry,
    practice_questions_correct: mergePracticeCorrect(cls.id, entry.student_id, entry.practice_questions_correct),
  }));
  const leaderboard = buildLeaderboard(normalizedMembers);
  const selfEntry = studentId ? leaderboard.find((entry) => entry.student_id === studentId) : null;
  return {
    ...cls,
    class_members: leaderboard,
    leaderboard,
    rank: selfEntry?.rank || null,
  };
};

applyTheme(getStoredTheme());

export const useAppStore = create((set, get) => ({
  user: null,
  profile: null,
  projects: [],
  classes: [],
  enrolledClass: null,
  activeProjectId: null,
  activeProject: { title: "Untitled.py", code: "print('Hello Xenon Code')" },
  consoleLines: [],
  theme: getStoredTheme(),
  showInitOverlay: false,
  showProfileSetup: false,
  authHydrated: false,
  authSubscription: null,
  practiceSecondsPending: 0,
  completedPracticeSkills: {},
  resetSessionState: () =>
    set({
      user: null,
      profile: null,
      projects: [],
      classes: [],
      enrolledClass: null,
      activeProjectId: null,
      activeProject: { title: "Untitled.py", code: "print('Hello Xenon Code')" },
      consoleLines: [],
      showInitOverlay: false,
      showProfileSetup: false,
      practiceSecondsPending: 0,
      completedPracticeSkills: {},
    }),

  setTheme: (theme) => {
    if (!THEMES.includes(theme)) return;
    applyTheme(theme);
    set({ theme });
  },

  setConsoleLines: (lines) => set({ consoleLines: lines }),
  appendConsoleLine: (line) => set((state) => ({ consoleLines: [...state.consoleLines, line] })),
  setActiveProjectTitle: (title) =>
    set((state) => ({ activeProject: { ...state.activeProject, title } })),
  setActiveProjectCode: (code) =>
    set((state) => ({ activeProject: { ...state.activeProject, code } })),
  newProject: () => set({ activeProjectId: null, activeProject: { title: "Untitled.py", code: "" }, consoleLines: [] }),
  openProject: (project) =>
    set({
      activeProjectId: project.id,
      activeProject: { title: project.title, code: project.code },
      consoleLines: [],
    }),

  hydrateUserSession: async (sessionUser) => {
    if (!sessionUser) {
      get().resetSessionState();
      return null;
    }

    set({ user: sessionUser });
    await get().ensureProfileExists(sessionUser);
    const profile = await get().loadProfile(sessionUser);
    await get().loadProjects(sessionUser.id);

    if (profile?.role === "teacher") {
      await get().loadTeacherClasses(sessionUser.id);
      set({ enrolledClass: null });
    } else {
      set({ classes: [] });
    }

    if (profile?.role === "student") {
      await get().loadStudentClass({ sessionUser, profile });
    } else {
      set({ enrolledClass: null });
    }

    return profile;
  },

  startUserHydration: (sessionUser) => {
    if (!sessionUser) {
      get().resetSessionState();
      set({ authHydrated: true });
      return;
    }

    set({ user: sessionUser, authHydrated: true, completedPracticeSkills: {} });
    get().hydrateUserSession(sessionUser).catch(() => {
      const draftUser = get().user;
      if (!draftUser || draftUser.id !== sessionUser.id) return;
      set({
        profile: {
          id: sessionUser.id,
          full_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || "",
          first_name: sessionUser.user_metadata?.first_name || "",
          username: sessionUser.user_metadata?.username || "",
          role: "none",
          has_seen_init: false,
          joined_app: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        showInitOverlay: false,
        showProfileSetup: true,
      });
    });
  },

  bootstrap: async () => {
    const initialTheme = getStoredTheme();
    applyTheme(initialTheme);
    set({ theme: initialTheme });
    set({ authHydrated: false });
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 2500);
      if (data.session?.user) {
        get().startUserHydration(data.session.user);
        return;
      }
      get().resetSessionState();
    } catch {
      get().resetSessionState();
    } finally {
      set({ authHydrated: true });
    }
  },

  ensureProfileExists: async (sessionUser) => {
    const user = sessionUser || get().user;
    if (!user) return;
    const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (existing) return;

    const md = user.user_metadata || {};
    const fallbackName = (user.email || "user").split("@")[0];
    const fullName = md.full_name || md.name || md.first_name || fallbackName;
    const firstName = md.first_name || fullName.split(" ")[0] || "User";
    const usernameBase = (md.username || fallbackName).replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "xenonuser";
    const username = `${usernameBase}${Math.floor(Math.random() * 900 + 100)}`;
    const role = ["none", "student", "teacher"].includes(md.role) ? md.role : "none";

    await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
      first_name: firstName,
      username,
      role,
    });
  },

  shouldPromptProfileSetup: (profile, user) => {
    if (!profile || !user) return false;
    const provider = user?.app_metadata?.provider;
    const hasFallbackUsername = (profile.username || "").startsWith("xenonuser");
    const missingBasics = !profile.full_name || !profile.username;
    const missingRole = profile.role === "none";
    if (provider === "google") return hasFallbackUsername || missingBasics || missingRole;
    return missingBasics;
  },

  initAuthListener: () => {
    if (get().authSubscription) return;
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        get().startUserHydration(session.user);
      } else {
        get().resetSessionState();
        set({ authHydrated: true });
      }
    });
    set({ authSubscription: data.subscription });
  },

  cleanupAuthListener: () => {
    const sub = get().authSubscription;
    if (sub) sub.unsubscribe();
    set({ authSubscription: null });
  },

  recoverAuthState: async () => {
    if (get().authHydrated) return;
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 2000);
      if (data.session?.user) {
        get().startUserHydration(data.session.user);
      } else {
        get().resetSessionState();
        set({ authHydrated: true });
      }
    } catch {
      get().resetSessionState();
      set({ authHydrated: true });
    }
  },

  loadProfile: async (sessionUser) => {
    const user = sessionUser || get().user;
    if (!user) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) {
      const md = user.user_metadata || {};
      const draftProfile = {
        id: user.id,
        full_name: md.full_name || md.name || "",
        first_name: md.first_name || "",
        username: md.username || "",
        role: "none",
        has_seen_init: false,
        joined_app: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      set({ profile: draftProfile, showInitOverlay: false, showProfileSetup: true });
      return draftProfile;
    }
    if (!data) {
      const md = user.user_metadata || {};
      const draftProfile = {
        id: user.id,
        full_name: md.full_name || md.name || "",
        first_name: md.first_name || "",
        username: md.username || "",
        role: "none",
        has_seen_init: false,
        joined_app: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      set({ profile: draftProfile, showInitOverlay: false, showProfileSetup: true });
      return draftProfile;
    }
    set({
      profile: data,
      showInitOverlay: !data.has_seen_init,
      showProfileSetup: get().shouldPromptProfileSetup(data, user),
    });
    return data;
  },

  completeProfileSetup: async ({ fullName, username, role }) => {
    const { profile, user } = get();
    if (!user) return;
    if (!["student", "teacher"].includes(role)) {
      throw new Error("Please choose Student or Teacher.");
    }
    const firstName = fullName.trim().split(" ")[0] || "User";
    const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, "");
    if (!sanitizedUsername) throw new Error("Username must contain letters, numbers or underscore.");

    const payload = {
      id: user.id,
      joined_app: profile?.joined_app || new Date().toISOString(),
      created_at: profile?.created_at || new Date().toISOString(),
      has_seen_init: profile?.has_seen_init ?? false,
      full_name: fullName.trim(),
      first_name: firstName,
      username: sanitizedUsername,
      role,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select("id")
      .single();
    if (error) throw error;
    await get().loadProfile();
    set({ showProfileSetup: false });
  },

  finishInitOverlay: async () => {
    const { profile } = get();
    if (!profile) return;
    await supabase.from("profiles").update({ has_seen_init: true }).eq("id", profile.id);
    set((state) => ({ showInitOverlay: false, profile: { ...state.profile, has_seen_init: true } }));
  },

  signUp: async ({ email, password, firstName, fullName, username, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, full_name: fullName, username, role },
      },
    });
    if (error) throw error;
    if (data.session?.user) {
      get().startUserHydration(data.session.user);
    } else {
      set({ authHydrated: true });
    }
    return data;
  },

  signIn: async ({ email, password }) => {
    set({ authHydrated: false });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session?.user) {
      get().startUserHydration(data.session.user);
    } else {
      set({ authHydrated: true });
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  },

  signOut: async () => {
    set({ authHydrated: false });
    try {
      await get().flushPracticeTime();
      await withTimeout(supabase.auth.signOut({ scope: "global" }), 5000);
    } finally {
      get().resetSessionState();
      set({ authHydrated: true });
    }
  },

  changePassword: async (password) => {
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  updateRole: async (nextRole) => {
    const { profile } = get();
    if (!profile) return;
    const immutable = profile.role === "student" || profile.role === "teacher";
    if (immutable) throw new Error("Role is immutable once Student or Teacher is selected.");
    if (!["student", "teacher"].includes(nextRole)) throw new Error("Invalid role change.");
    const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", profile.id);
    if (error) throw error;
    await get().loadProfile();
    await get().loadStudentClass();
  },

  loadProjects: async (ownerId) => {
    const { user, profile, enrolledClass } = get();
    const resolvedOwnerId = ownerId || user?.id;
    if (!resolvedOwnerId) {
      set({ projects: [] });
      return [];
    }
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("owner_id", resolvedOwnerId)
      .order("updated_at", { ascending: false });
    const projects = data || [];
    set({ projects });
    if (profile?.role === "student" && enrolledClass?.id) {
      await get().syncStudentProjectCount(projects.length);
    }
    return projects;
  },

  saveProject: async () => {
    const { user, activeProject, activeProjectId, profile, enrolledClass } = get();
    if (!user) return;
    const isNewProject = !activeProjectId;
    const safeTitle = (activeProject.title || "").trim() || `Untitled-${new Date().toLocaleString()}`;
    const payload = {
      owner_id: user.id,
      title: safeTitle,
      code: activeProject.code,
      snippet: activeProject.code.slice(0, 120),
      updated_at: new Date().toISOString(),
    };
    let data;
    let error;
    if (activeProjectId) {
      ({ data, error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", activeProjectId)
        .eq("owner_id", user.id)
        .select("id")
        .single());
    } else {
      ({ data, error } = await supabase.from("projects").insert(payload).select("id").single());
    }
    if (error) throw error;
    if (data?.id) {
      set((state) => ({
        activeProjectId: data.id,
        activeProject: { ...state.activeProject, title: safeTitle },
      }));
    }
    await get().loadProjects();
    if (isNewProject && profile?.role === "student" && enrolledClass?.id) {
      await get().updateClassMemberStats({ projectsDelta: 1 });
    }
  },

  createClass: async ({ name, description }) => {
    const { user } = get();
    const code = generateClassCode();
    const { error } = await supabase.from("classes").insert({
      teacher_id: user.id,
      name,
      description,
      class_code: code,
    });
    if (error) throw error;
    await get().loadTeacherClasses();
  },

  loadTeacherClasses: async (teacherId) => {
    const { user } = get();
    const resolvedTeacherId = teacherId || user?.id;
    if (!resolvedTeacherId) {
      set({ classes: [] });
      return [];
    }
    const { data } = await supabase.from("classes").select("*, class_members(*, profiles(*))").eq("teacher_id", resolvedTeacherId);
    const classes = (data || []).map((cls) => hydrateClassLeaderboard(cls));
    set({ classes });
    return classes;
  },

  removeStudentFromClass: async ({ classId, studentId }) => {
    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId);
    if (error) throw error;
    await get().loadTeacherClasses();
  },

  joinClassByCode: async (classCode) => {
    const { user } = get();
    const trimmed = classCode.trim().toUpperCase();
    const { data: cls } = await supabase.from("classes").select("id").eq("class_code", trimmed).single();
    if (!cls) throw new Error("Class code not found.");
    await supabase.from("class_members").upsert({ class_id: cls.id, student_id: user.id });
    await get().loadStudentClass();
  },

  loadStudentClass: async ({ sessionUser, profile: sessionProfile } = {}) => {
    const { user, profile } = get();
    const resolvedUser = sessionUser || user;
    const resolvedProfile = sessionProfile || profile;
    if (!resolvedUser || resolvedProfile?.role !== "student") {
      set({ enrolledClass: null });
      return;
    }
    let member;
    let memberError;
    ({ data: member, error: memberError } = await supabase
      .from("class_members")
      .select("class_id, total_time_seconds, total_projects, practice_questions_correct")
      .eq("student_id", resolvedUser.id)
      .maybeSingle());
    if (memberError && hasMissingColumnError(memberError)) {
      const fallbackMember = await supabase
        .from("class_members")
        .select("class_id, total_time_seconds, total_projects")
        .eq("student_id", resolvedUser.id)
        .maybeSingle();
      member = fallbackMember.data
        ? {
            ...fallbackMember.data,
            practice_questions_correct: getLocalPracticeCorrect(fallbackMember.data.class_id, resolvedUser.id),
          }
        : fallbackMember.data;
      memberError = fallbackMember.error;
    }
    if (memberError) {
      set({ enrolledClass: null });
      return;
    }
    if (!member) {
      set({ enrolledClass: null });
      return;
    }
    let cls;
    let classError;
    ({ data: cls, error: classError } = await supabase
      .from("classes")
      .select("id, name, description, class_code, teacher_id, profiles!classes_teacher_id_fkey(first_name, username), class_members(student_id, total_time_seconds, total_projects, practice_questions_correct, profiles(username, first_name, full_name))")
      .eq("id", member.class_id)
      .single());
    if (classError && hasMissingColumnError(classError)) {
      const fallbackClass = await supabase
        .from("classes")
        .select("id, name, description, class_code, teacher_id, profiles!classes_teacher_id_fkey(first_name, username), class_members(student_id, total_time_seconds, total_projects, profiles(username, first_name, full_name))")
        .eq("id", member.class_id)
        .single();
      cls = fallbackClass.data
        ? {
            ...fallbackClass.data,
            class_members: (fallbackClass.data.class_members || []).map((entry) => ({
              ...entry,
              practice_questions_correct: 0,
            })),
          }
        : fallbackClass.data;
      classError = fallbackClass.error;
    }
    if (classError) {
      set({ enrolledClass: null });
      return;
    }
    if (!cls) {
      set({ enrolledClass: null });
      return;
    }
    const rankedClass = hydrateClassLeaderboard(cls, resolvedUser.id);
    set({
      enrolledClass: {
        ...rankedClass,
        total_time_seconds: member.total_time_seconds,
        total_projects: member.total_projects,
        practice_questions_correct: member.practice_questions_correct || 0,
      },
    });
    await get().syncStudentProjectCount(get().projects.length, member.total_projects);
    return {
      ...rankedClass,
      total_time_seconds: member.total_time_seconds,
      total_projects: member.total_projects,
      practice_questions_correct: member.practice_questions_correct || 0,
    };
  },

  syncStudentProjectCount: async (actualProjectCount, knownProjectCount) => {
    const { user, enrolledClass, profile } = get();
    if (!user || !enrolledClass?.id || profile?.role !== "student") return;

    const nextProjectCount = typeof actualProjectCount === "number" ? actualProjectCount : get().projects.length;
    const currentKnownCount =
      typeof knownProjectCount === "number" ? knownProjectCount : enrolledClass.total_projects || 0;

    if (nextProjectCount === currentKnownCount) return;

    const { error } = await supabase
      .from("class_members")
      .update({ total_projects: nextProjectCount })
      .eq("class_id", enrolledClass.id)
      .eq("student_id", user.id);
    if (error) throw error;
    await get().loadStudentClass({ sessionUser: user, profile });
  },

  updateClassMemberStats: async ({ secondsDelta = 0, projectsDelta = 0 } = {}) => {
    const { user, enrolledClass, profile } = get();
    if (!user || !enrolledClass?.id || profile?.role !== "student") return;

    const { data: member, error: memberError } = await supabase
      .from("class_members")
      .select("total_time_seconds, total_projects")
      .eq("class_id", enrolledClass.id)
      .eq("student_id", user.id)
      .single();
    if (memberError) throw memberError;

    const nextTime = Math.max(0, (member?.total_time_seconds || 0) + secondsDelta);
    const nextProjects = Math.max(0, (member?.total_projects || 0) + projectsDelta);

    const { error } = await supabase
      .from("class_members")
      .update({
        total_time_seconds: nextTime,
        total_projects: nextProjects,
      })
      .eq("class_id", enrolledClass.id)
      .eq("student_id", user.id);
    if (error) throw error;

    await get().loadStudentClass();
  },

  queuePracticeTime: (seconds) => {
    if (!seconds || seconds < 1) return;
    set((state) => ({ practiceSecondsPending: state.practiceSecondsPending + seconds }));
  },

  markPracticeSkillCorrect: async (skillKey) => {
    const { user, enrolledClass, profile, completedPracticeSkills } = get();
    if (!skillKey || !user || !enrolledClass?.id || profile?.role !== "student") return { status: "ignored" };
    if (completedPracticeSkills[skillKey]) return { status: "already_counted" };

    const { data: member, error: memberError } = await supabase
      .from("class_members")
      .select("practice_questions_correct")
      .eq("class_id", enrolledClass.id)
      .eq("student_id", user.id)
      .single();
    if (memberError && hasMissingColumnError(memberError)) {
      const nextCorrect = setLocalPracticeCorrect(
        enrolledClass.id,
        user.id,
        getLocalPracticeCorrect(enrolledClass.id, user.id) + 1,
      );
      set((state) => {
        const nextCompletedPracticeSkills = {
          ...state.completedPracticeSkills,
          [skillKey]: true,
        };
        const nextMembers = (state.enrolledClass?.class_members || []).map((entry) =>
          entry.student_id === user.id
            ? {
                ...entry,
                practice_questions_correct: nextCorrect,
              }
            : entry,
        );
        const rankedClass = hydrateClassLeaderboard(
          {
            ...state.enrolledClass,
            class_members: nextMembers,
          },
          user.id,
        );

        return {
          completedPracticeSkills: nextCompletedPracticeSkills,
          enrolledClass: {
            ...rankedClass,
            total_time_seconds: state.enrolledClass.total_time_seconds,
            total_projects: state.enrolledClass.total_projects,
            practice_questions_correct: nextCorrect,
          },
        };
      });
      return { status: "counted_local", totalCorrect: nextCorrect };
    }
    if (memberError) throw memberError;

    const nextCorrect = (member?.practice_questions_correct || 0) + 1;
    const { error } = await supabase
      .from("class_members")
      .update({ practice_questions_correct: nextCorrect })
      .eq("class_id", enrolledClass.id)
      .eq("student_id", user.id);
    if (error && hasMissingColumnError(error)) {
      const localCorrect = setLocalPracticeCorrect(enrolledClass.id, user.id, nextCorrect);
      set((state) => {
        const nextCompletedPracticeSkills = {
          ...state.completedPracticeSkills,
          [skillKey]: true,
        };
        const nextMembers = (state.enrolledClass?.class_members || []).map((entry) =>
          entry.student_id === user.id
            ? {
                ...entry,
                practice_questions_correct: localCorrect,
              }
            : entry,
        );
        const rankedClass = hydrateClassLeaderboard(
          {
            ...state.enrolledClass,
            class_members: nextMembers,
          },
          user.id,
        );

        return {
          completedPracticeSkills: nextCompletedPracticeSkills,
          enrolledClass: {
            ...rankedClass,
            total_time_seconds: state.enrolledClass.total_time_seconds,
            total_projects: state.enrolledClass.total_projects,
            practice_questions_correct: localCorrect,
          },
        };
      });
      return { status: "counted_local", totalCorrect: localCorrect };
    }
    if (error) throw error;

    set((state) => {
      const nextCompletedPracticeSkills = {
        ...state.completedPracticeSkills,
        [skillKey]: true,
      };

      if (!state.enrolledClass?.id) {
        return { completedPracticeSkills: nextCompletedPracticeSkills };
      }

      const nextMembers = (state.enrolledClass.class_members || []).map((entry) =>
        entry.student_id === user.id
          ? {
              ...entry,
              practice_questions_correct: nextCorrect,
            }
          : entry,
      );
      const rankedClass = hydrateClassLeaderboard(
        {
          ...state.enrolledClass,
          class_members: nextMembers,
        },
        user.id,
      );

      return {
        completedPracticeSkills: nextCompletedPracticeSkills,
        enrolledClass: {
          ...rankedClass,
          total_time_seconds: state.enrolledClass.total_time_seconds,
          total_projects: state.enrolledClass.total_projects,
          practice_questions_correct: nextCorrect,
        },
      };
    });
    await get().loadStudentClass({ sessionUser: user, profile });
    return { status: "counted", totalCorrect: nextCorrect };
  },

  flushPracticeTime: async () => {
    const { practiceSecondsPending, enrolledClass, profile } = get();
    if (!practiceSecondsPending) return;
    if (!enrolledClass?.id || profile?.role !== "student") {
      set({ practiceSecondsPending: 0 });
      return;
    }

    set({ practiceSecondsPending: 0 });
    try {
      await get().updateClassMemberStats({ secondsDelta: practiceSecondsPending });
    } catch {
      set((state) => ({ practiceSecondsPending: state.practiceSecondsPending + practiceSecondsPending }));
    }
  },

  leaveCurrentClass: async () => {
    const { user, enrolledClass } = get();
    if (!user || !enrolledClass) return;
    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("student_id", user.id)
      .eq("class_id", enrolledClass.id);
    if (error) throw error;
    set({ enrolledClass: null });
  },
}));
