import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { generateClassCode } from "../lib/classCode";
import { PRACTICE_QUESTIONS } from "../lib/practiceQuestions";
import { getChallengeXpBreakdown, getLevelFromXp } from "../lib/progression";
import { isMissingSupabaseTableError, translateSupabaseError } from "../lib/errorTranslator";

const THEMES = ["xenon-dark", "oled-black", "classic-light", "solarized", "pink", "blue"];
const PROFILE_SELECT_FIELDS = "id, full_name, first_name, username, role, has_seen_init, joined_app, created_at, avatar_url, headline, about_me, favorite_topic, profile_visibility, experience_points, level";
const FRIEND_PROFILE_FIELDS = "id, full_name, first_name, username, role, avatar_url, headline, about_me, favorite_topic, profile_visibility, joined_app, experience_points, level";
const FRIENDSHIP_SELECT = `id, status, created_at, responded_at, requester_id, addressee_id, requester:profiles!friendships_requester_id_fkey(${FRIEND_PROFILE_FIELDS}), addressee:profiles!friendships_addressee_id_fkey(${FRIEND_PROFILE_FIELDS})`;
const FRIENDSHIP_SELECT_FALLBACK = "id, status, created_at, responded_at, requester_id, addressee_id, requester:profiles!friendships_requester_id_fkey(id, full_name, first_name, username, role, joined_app), addressee:profiles!friendships_addressee_id_fkey(id, full_name, first_name, username, role, joined_app)";
const CHALLENGE_SELECT = `id, status, question_titles, challenger_id, opponent_id, challenger_score, opponent_score, challenger_answers, opponent_answers, challenger_completed_at, opponent_completed_at, challenger_xp_awarded, opponent_xp_awarded, winner_id, completed_at, created_at, updated_at, challenger:profiles!friend_challenges_challenger_id_fkey(${FRIEND_PROFILE_FIELDS}), opponent:profiles!friend_challenges_opponent_id_fkey(${FRIEND_PROFILE_FIELDS})`;
const CHALLENGE_QUESTION_COUNT = 10;

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

const normalizeProfileRecord = (profile = {}, fallback = {}) => ({
  id: profile.id || fallback.id || "",
  full_name: profile.full_name || fallback.full_name || fallback.name || "",
  first_name:
    profile.first_name ||
    fallback.first_name ||
    (profile.full_name || fallback.full_name || fallback.name || "").split(" ")[0] ||
    "User",
  username: profile.username || fallback.username || "",
  role: profile.role || fallback.role || "none",
  has_seen_init: profile.has_seen_init ?? fallback.has_seen_init ?? false,
  joined_app: profile.joined_app || fallback.joined_app || new Date().toISOString(),
  created_at: profile.created_at || fallback.created_at || new Date().toISOString(),
  avatar_url: profile.avatar_url || "",
  headline: profile.headline || "",
  about_me: profile.about_me || "",
  favorite_topic: profile.favorite_topic || "",
  profile_visibility: profile.profile_visibility ?? true,
  experience_points: Math.max(0, Number(profile.experience_points ?? fallback.experience_points ?? 0) || 0),
  level: Math.max(1, Number(profile.level ?? fallback.level ?? 1) || 1),
});

const sanitizeUsername = (value = "") => value.trim().replace(/[^a-zA-Z0-9_]/g, "");

const normalizeFriendshipRecord = (row, userId) => {
  const isRequester = row.requester_id === userId;
  return {
    ...row,
    friend: normalizeProfileRecord(isRequester ? row.addressee : row.requester),
    direction: isRequester ? "outgoing" : "incoming",
  };
};

const shuffle = (items = []) => [...items].sort(() => Math.random() - 0.5);

const pickChallengeQuestionTitles = () =>
  shuffle(PRACTICE_QUESTIONS.map((question) => question.title)).slice(0, CHALLENGE_QUESTION_COUNT);

const normalizeChallengeRecord = (row, userId) => {
  const isChallenger = row.challenger_id === userId;
  const selfScore = isChallenger ? row.challenger_score : row.opponent_score;
  const otherScore = isChallenger ? row.opponent_score : row.challenger_score;
  const selfAnswers = isChallenger ? row.challenger_answers : row.opponent_answers;
  const otherAnswers = isChallenger ? row.opponent_answers : row.challenger_answers;
  const xpAwarded = isChallenger ? row.challenger_xp_awarded : row.opponent_xp_awarded;
  const opponentProfile = normalizeProfileRecord(isChallenger ? row.opponent : row.challenger);
  return {
    ...row,
    question_titles: Array.isArray(row.question_titles) ? row.question_titles : [],
    opponentProfile,
    selfScore,
    otherScore,
    selfAnswers,
    otherAnswers,
    xpAwarded,
    isChallenger,
    result:
      row.status !== "completed"
        ? "pending"
        : row.winner_id === userId
          ? "win"
          : row.winner_id
            ? "loss"
            : "draw",
  };
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

const hasMissingProfileProgressError = (error) =>
  String(error?.message || "").toLowerCase().includes("experience_points");

const LOCAL_PRACTICE_KEY = "xenon-local-practice-correct";
const LOCAL_ACHIEVEMENTS_KEY = "xenon-local-achievements";

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

const readLocalAchievements = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_ACHIEVEMENTS_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeLocalAchievements = (value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_ACHIEVEMENTS_KEY, JSON.stringify(value));
};

const getLocalAchievements = (userId) => {
  if (!userId) return [];
  const achievements = readLocalAchievements();
  return achievements[userId] || [];
};

const saveLocalAchievements = (userId, nextAchievements) => {
  if (!userId) return [];
  const achievements = readLocalAchievements();
  const uniqueAchievements = (nextAchievements || []).filter(
    (entry, index, arr) =>
      arr.findIndex((candidate) => candidate.achievement_key === entry.achievement_key) === index,
  );
  achievements[userId] = uniqueAchievements;
  writeLocalAchievements(achievements);
  return uniqueAchievements;
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
  announcements: [],
  assignments: [],
  achievements: [],
  friends: [],
  incomingFriendRequests: [],
  outgoingFriendRequests: [],
  friendChallenges: [],
  databaseWarnings: {},
  streak: { current: 0, longest: 0 },
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
      announcements: [],
      assignments: [],
      achievements: [],
      friends: [],
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      friendChallenges: [],
      databaseWarnings: {},
      streak: { current: 0, longest: 0 },
    }),

  setDatabaseWarning: (featureKey, message) =>
    set((state) => ({
      databaseWarnings: message
        ? { ...state.databaseWarnings, [featureKey]: message }
        : Object.fromEntries(Object.entries(state.databaseWarnings).filter(([key]) => key !== featureKey)),
    })),

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
    get().initStreak();

    if (profile?.role === "teacher") {
      await get().loadTeacherClasses(sessionUser.id);
      set({ enrolledClass: null });
    } else {
      set({ classes: [] });
    }

    if (profile?.role === "student") {
      await get().loadStudentClass({ sessionUser, profile });
      get().loadAchievements().catch(() => {});
      get().loadFriendNetwork().catch(() => {});
      get().loadFriendChallenges().catch(() => {});
    } else {
      set({ enrolledClass: null });
      set({ friends: [], incomingFriendRequests: [], outgoingFriendRequests: [], friendChallenges: [] });
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
          experience_points: 0,
          level: 1,
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
      avatar_url: "",
      headline: "",
      about_me: "",
      favorite_topic: "",
      profile_visibility: true,
      experience_points: 0,
      level: 1,
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
    let data;
    let error;
    ({ data, error } = await supabase.from("profiles").select(PROFILE_SELECT_FIELDS).eq("id", user.id).maybeSingle());
    if (error && String(error.message || "").toLowerCase().includes("column")) {
      ({ data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle());
    }
    if (error) {
      const md = user.user_metadata || {};
      const draftProfile = normalizeProfileRecord({ id: user.id }, md);
      set({ profile: draftProfile, showInitOverlay: false, showProfileSetup: true });
      return draftProfile;
    }
    if (!data) {
      const md = user.user_metadata || {};
      const draftProfile = normalizeProfileRecord({ id: user.id }, md);
      set({ profile: draftProfile, showInitOverlay: false, showProfileSetup: true });
      return draftProfile;
    }
    const normalized = normalizeProfileRecord(data);
    set({
      profile: normalized,
      showInitOverlay: !normalized.has_seen_init,
      showProfileSetup: get().shouldPromptProfileSetup(normalized, user),
    });
    return normalized;
  },

  completeProfileSetup: async ({ fullName, username, role, headline = "", aboutMe = "", avatarUrl = "", favoriteTopic = "" }) => {
    const { profile, user } = get();
    if (!user) return;
    if (!["student", "teacher"].includes(role)) {
      throw new Error("Please choose Student or Teacher.");
    }
    const firstName = fullName.trim().split(" ")[0] || "User";
    const sanitizedUsername = sanitizeUsername(username);
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
      headline: headline.trim(),
      about_me: aboutMe.trim(),
      avatar_url: avatarUrl.trim(),
      favorite_topic: favoriteTopic.trim(),
      profile_visibility: profile?.profile_visibility ?? true,
      experience_points: profile?.experience_points ?? 0,
      level: profile?.level ?? 1,
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
    if (nextRole === "student") {
      await get().loadFriendNetwork();
      await get().loadFriendChallenges();
    }
  },

  saveProfileCustomizations: async ({
    fullName,
    username,
    headline = "",
    aboutMe = "",
    avatarUrl = "",
    favoriteTopic = "",
    profileVisibility = true,
  }) => {
    const { profile, user } = get();
    if (!user || !profile) return;
    const nextFullName = (fullName || profile.full_name || "").trim();
    const nextUsername = sanitizeUsername(username || profile.username || "");
    if (!nextFullName) throw new Error("Full name is required.");
    if (!nextUsername) throw new Error("Username must contain letters, numbers or underscore.");

    const payload = {
      full_name: nextFullName,
      first_name: nextFullName.split(" ")[0] || "User",
      username: nextUsername,
      headline: headline.trim(),
      about_me: aboutMe.trim(),
      avatar_url: avatarUrl.trim(),
      favorite_topic: favoriteTopic.trim(),
      profile_visibility: Boolean(profileVisibility),
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    if (error) throw new Error(translateSupabaseError(error, "Could not save profile details."));
    await get().loadProfile();
  },

  searchStudentProfiles: async (query) => {
    const { user, profile } = get();
    const trimmed = (query || "").trim();
    if (!user || profile?.role !== "student" || trimmed.length < 2) return [];

    let data;
    let error;
    ({ data, error } = await supabase
      .from("profiles")
      .select(FRIEND_PROFILE_FIELDS)
      .eq("role", "student")
      .neq("id", user.id)
      .eq("profile_visibility", true)
      .or(`username.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,favorite_topic.ilike.%${trimmed}%`)
      .limit(12));
    if (error && String(error.message || "").toLowerCase().includes("column")) {
      ({ data, error } = await supabase
        .from("profiles")
        .select("id, full_name, first_name, username, role, joined_app")
        .eq("role", "student")
        .neq("id", user.id)
        .or(`username.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`)
        .limit(12));
    }
    if (error) throw new Error(translateSupabaseError(error, "Could not search student profiles."));
    return (data || []).map((entry) => normalizeProfileRecord(entry));
  },

  loadFriendNetwork: async () => {
    const { user, profile } = get();
    if (!user || profile?.role !== "student") {
      set({ friends: [], incomingFriendRequests: [], outgoingFriendRequests: [] });
      return { friends: [], incomingFriendRequests: [], outgoingFriendRequests: [] };
    }

    let data;
    let error;
    ({ data, error } = await supabase
      .from("friendships")
      .select(FRIENDSHIP_SELECT)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("created_at", { ascending: false }));
    if (error && String(error.message || "").toLowerCase().includes("column")) {
      ({ data, error } = await supabase
        .from("friendships")
        .select(FRIENDSHIP_SELECT_FALLBACK)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order("created_at", { ascending: false }));
    }

    if (error) {
      if (isMissingSupabaseTableError(error, "friendships")) {
        get().setDatabaseWarning("social", "Friends need the latest Supabase migration before students can connect.");
        set({ friends: [], incomingFriendRequests: [], outgoingFriendRequests: [] });
        return { friends: [], incomingFriendRequests: [], outgoingFriendRequests: [] };
      }
      throw new Error(translateSupabaseError(error, "Could not load friends."));
    }

    const network = (data || []).map((row) => normalizeFriendshipRecord(row, user.id));
    const friends = network.filter((entry) => entry.status === "accepted");
    const incomingFriendRequests = network.filter((entry) => entry.status === "pending" && entry.direction === "incoming");
    const outgoingFriendRequests = network.filter((entry) => entry.status === "pending" && entry.direction === "outgoing");

    get().setDatabaseWarning("social", "");
    set({ friends, incomingFriendRequests, outgoingFriendRequests });
    return { friends, incomingFriendRequests, outgoingFriendRequests };
  },

  sendFriendRequest: async (targetProfileId) => {
    const { user, profile } = get();
    if (!user || profile?.role !== "student") throw new Error("Only students can add friends.");
    if (!targetProfileId || targetProfileId === user.id) throw new Error("Choose a different student.");

    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: targetProfileId,
      status: "pending",
    });
    if (error) throw new Error(translateSupabaseError(error, "Could not send friend request."));
    await get().loadFriendNetwork();
  },

  respondToFriendRequest: async (friendshipId, action = "accept") => {
    const { user, profile } = get();
    if (!user || profile?.role !== "student") throw new Error("Only students can manage friend requests.");
    if (!friendshipId) return;

    if (action === "decline") {
      const { error } = await supabase.from("friendships").delete().eq("id", friendshipId).eq("addressee_id", user.id);
      if (error) throw new Error(translateSupabaseError(error, "Could not decline friend request."));
    } else {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", friendshipId)
        .eq("addressee_id", user.id);
      if (error) throw new Error(translateSupabaseError(error, "Could not accept friend request."));
    }
    await get().loadFriendNetwork();
  },

  removeFriendship: async (friendshipId) => {
    const { user, profile } = get();
    if (!user || profile?.role !== "student") throw new Error("Only students can manage friendships.");
    if (!friendshipId) return;
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (error) throw new Error(translateSupabaseError(error, "Could not remove friendship."));
    await get().loadFriendNetwork();
  },

  loadPublicProfile: async (profileId) => {
    if (!profileId) return null;
    let data;
    let error;
    ({ data, error } = await supabase.from("profiles").select(FRIEND_PROFILE_FIELDS).eq("id", profileId).maybeSingle());
    if (error && String(error.message || "").toLowerCase().includes("column")) {
      ({ data, error } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle());
    }
    if (error) throw new Error(translateSupabaseError(error, "Could not load profile."));
    return data ? normalizeProfileRecord(data) : null;
  },

  awardExperience: async (amount) => {
    const { user, profile } = get();
    const xpGain = Math.max(0, Number(amount) || 0);
    if (!user || !profile || !xpGain) return { xp: profile?.experience_points || 0, level: profile?.level || 1 };

    const nextXp = Math.max(0, (profile.experience_points || 0) + xpGain);
    const nextLevel = getLevelFromXp(nextXp);
    const { error } = await supabase
      .from("profiles")
      .update({ experience_points: nextXp, level: nextLevel })
      .eq("id", user.id);
    if (error) {
      if (hasMissingProfileProgressError(error)) {
        get().setDatabaseWarning("progression", "Levels and XP need the latest Supabase migration before they can be saved.");
        return { xp: profile.experience_points || 0, level: profile.level || 1 };
      }
      throw new Error(translateSupabaseError(error, "Could not update XP."));
    }

    get().setDatabaseWarning("progression", "");
    set((state) => ({
      profile: state.profile
        ? {
            ...state.profile,
            experience_points: nextXp,
            level: nextLevel,
          }
        : state.profile,
    }));
    return { xp: nextXp, level: nextLevel };
  },

  loadFriendChallenges: async () => {
    const { user, profile } = get();
    if (!user || profile?.role !== "student") {
      set({ friendChallenges: [] });
      return [];
    }

    const { data, error } = await supabase
      .from("friend_challenges")
      .select(CHALLENGE_SELECT)
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      if (isMissingSupabaseTableError(error, "friend_challenges")) {
        get().setDatabaseWarning("challenges", "1v1 friend showdowns need the latest Supabase migration before students can challenge each other.");
        set({ friendChallenges: [] });
        return [];
      }
      throw new Error(translateSupabaseError(error, "Could not load challenges."));
    }

    const friendChallenges = (data || []).map((row) => normalizeChallengeRecord(row, user.id));
    get().setDatabaseWarning("challenges", "");
    set({ friendChallenges });
    await get().grantPendingChallengeXp(friendChallenges);
    return friendChallenges;
  },

  createFriendChallenge: async (opponentId) => {
    const { user, profile, friends } = get();
    if (!user || profile?.role !== "student") throw new Error("Only students can start challenges.");
    if (!friends.some((entry) => entry.friend.id === opponentId)) throw new Error("You can only challenge accepted friends.");

    const { error } = await supabase.from("friend_challenges").insert({
      challenger_id: user.id,
      opponent_id: opponentId,
      status: "pending",
      question_titles: pickChallengeQuestionTitles(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(translateSupabaseError(error, "Could not create challenge."));
    await get().loadFriendChallenges();
  },

  respondToChallengeInvite: async (challengeId, action = "accept") => {
    const { user, profile } = get();
    if (!user || profile?.role !== "student") throw new Error("Only students can respond to challenges.");
    if (!challengeId) return;

    const updatePayload =
      action === "accept"
        ? { status: "active", updated_at: new Date().toISOString() }
        : { status: "declined", updated_at: new Date().toISOString(), completed_at: new Date().toISOString() };

    const { error } = await supabase
      .from("friend_challenges")
      .update(updatePayload)
      .eq("id", challengeId)
      .eq("opponent_id", user.id);
    if (error) throw new Error(translateSupabaseError(error, "Could not update challenge."));
    await get().loadFriendChallenges();
  },

  saveChallengeProgress: async ({ challengeId, score, answers }) => {
    const { user, profile } = get();
    if (!user || profile?.role !== "student" || !challengeId) return null;

    const challenge = (get().friendChallenges || []).find((entry) => entry.id === challengeId);
    if (!challenge) throw new Error("Challenge not found.");

    const isChallenger = challenge.challenger_id === user.id;
    const progressPayload = isChallenger
      ? {
          challenger_score: score,
          challenger_answers: answers,
          challenger_completed_at: answers >= CHALLENGE_QUESTION_COUNT ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }
      : {
          opponent_score: score,
          opponent_answers: answers,
          opponent_completed_at: answers >= CHALLENGE_QUESTION_COUNT ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };

    let updatedChallenge;
    const { data: challengeData, error } = await supabase
      .from("friend_challenges")
      .update(progressPayload)
      .eq("id", challengeId)
      .select(CHALLENGE_SELECT)
      .single();
    if (error) throw new Error(translateSupabaseError(error, "Could not save challenge progress."));
    updatedChallenge = challengeData;

    const bothFinished =
      (updatedChallenge.challenger_answers || 0) >= CHALLENGE_QUESTION_COUNT &&
      (updatedChallenge.opponent_answers || 0) >= CHALLENGE_QUESTION_COUNT;

    if (bothFinished && updatedChallenge.status !== "completed") {
      const winnerId =
        updatedChallenge.challenger_score === updatedChallenge.opponent_score
          ? null
          : updatedChallenge.challenger_score > updatedChallenge.opponent_score
            ? updatedChallenge.challenger_id
            : updatedChallenge.opponent_id;

      const { data: completedRow, error: completeError } = await supabase
        .from("friend_challenges")
        .update({
          status: "completed",
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", challengeId)
        .select(CHALLENGE_SELECT)
        .single();
      if (completeError) throw new Error(translateSupabaseError(completeError, "Could not finish challenge."));
      updatedChallenge = completedRow;
    }

    const freshChallenges = await get().loadFriendChallenges();
    return freshChallenges.find((entry) => entry.id === challengeId) || normalizeChallengeRecord(updatedChallenge, user.id);
  },

  grantPendingChallengeXp: async (challengeRows) => {
    const { user, profile } = get();
    if (!user || profile?.role !== "student") return [];

    const rows = challengeRows || get().friendChallenges || [];
    const pendingAwards = rows.filter((challenge) => {
      if (challenge.status !== "completed" || challenge.xpAwarded) return false;
      return challenge.isChallenger
        ? (challenge.challenger_answers || 0) >= CHALLENGE_QUESTION_COUNT
        : (challenge.opponent_answers || 0) >= CHALLENGE_QUESTION_COUNT;
    });

    for (const challenge of pendingAwards) {
      const breakdown = getChallengeXpBreakdown({
        playerScore: challenge.selfScore,
        opponentScore: challenge.otherScore,
        playerAnswered: challenge.selfAnswers,
        opponentAnswered: challenge.otherAnswers,
      });

      if (breakdown.totalXp > 0) {
        await get().awardExperience(breakdown.totalXp);
      }

      const awardField = challenge.isChallenger ? "challenger_xp_awarded" : "opponent_xp_awarded";
      const { error } = await supabase
        .from("friend_challenges")
        .update({ [awardField]: true, updated_at: new Date().toISOString() })
        .eq("id", challenge.id);
      if (error) throw new Error(translateSupabaseError(error, "Could not finalise challenge rewards."));
    }

    if (pendingAwards.length) {
      const { data } = await supabase
        .from("friend_challenges")
        .select(CHALLENGE_SELECT)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });
      const friendChallenges = (data || []).map((row) => normalizeChallengeRecord(row, user.id));
      set({ friendChallenges });
      return friendChallenges;
    }

    return rows;
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
    if (profile?.role === "student") get().checkAndGrantAchievements().catch(() => {});
  },

  createClass: async ({ name, description }) => {
    const { user } = get();
    const code = generateClassCode();
    const { data, error } = await supabase.from("classes").insert({
      teacher_id: user.id,
      name,
      description,
      class_code: code,
    }).select("id").single();
    if (error) throw error;
    // Also register in class_teachers junction (silently ignore if migration not yet run)
    if (data?.id) {
      supabase.from("class_teachers").insert({ class_id: data.id, teacher_id: user.id }).then(() => {}).catch(() => {});
    }
    await get().loadTeacherClasses();
  },

  loadTeacherClasses: async (teacherId) => {
    const { user } = get();
    const resolvedTeacherId = teacherId || user?.id;
    if (!resolvedTeacherId) {
      set({ classes: [] });
      return [];
    }

    // Try class_teachers junction table first (supports co-teaching)
    let classIds = null;
    const { data: ctData, error: ctError } = await supabase
      .from("class_teachers")
      .select("class_id")
      .eq("teacher_id", resolvedTeacherId);

    if (!ctError) {
      classIds = (ctData || []).map((r) => r.class_id);
      get().setDatabaseWarning("class_teachers", "");
    } else if (isMissingSupabaseTableError(ctError, "class_teachers")) {
      get().setDatabaseWarning("class_teachers", "Co-teacher support needs the class_teachers_migration.sql to be run in Supabase first.");
    }

    let data;
    if (classIds !== null && classIds.length > 0) {
      ({ data } = await supabase.from("classes").select("*, class_members(*, profiles(*))").in("id", classIds));
    } else if (classIds !== null && classIds.length === 0) {
      data = [];
    } else {
      // Fallback: original single teacher_id query
      ({ data } = await supabase.from("classes").select("*, class_members(*, profiles(*))").eq("teacher_id", resolvedTeacherId));
    }

    const classes = (data || []).map((cls) => hydrateClassLeaderboard(cls));
    set({ classes });
    return classes;
  },

  joinClassAsTeacher: async (classCode) => {
    const { user } = get();
    const trimmed = (classCode || "").trim().toUpperCase();
    if (!trimmed) throw new Error("Please enter a class code.");
    const { data: cls, error: clsError } = await supabase.from("classes").select("id").eq("class_code", trimmed).single();
    if (clsError || !cls) throw new Error("Class code not found. Check the code and try again.");
    const { error } = await supabase.from("class_teachers").insert({ class_id: cls.id, teacher_id: user.id });
    if (error) {
      if (isMissingSupabaseTableError(error, "class_teachers")) {
        throw new Error("Co-teacher support requires class_teachers_migration.sql to be run in Supabase first.");
      }
      if (String(error.code) === "23505") throw new Error("You are already a teacher in this class.");
      throw new Error(translateSupabaseError(error, "Could not join class."));
    }
    await get().loadTeacherClasses();
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
      .select("id, name, description, class_code, teacher_id, profiles!classes_teacher_id_fkey(first_name, username), class_members(student_id, total_time_seconds, total_projects, practice_questions_correct, profiles(username, first_name, full_name, level))")
      .eq("id", member.class_id)
      .single());
    if (classError && hasMissingColumnError(classError)) {
      const fallbackClass = await supabase
        .from("classes")
        .select("id, name, description, class_code, teacher_id, profiles!classes_teacher_id_fkey(first_name, username), class_members(student_id, total_time_seconds, total_projects, profiles(username, first_name, full_name, level))")
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
    get().loadAnnouncements(member.class_id).catch(() => {});
    get().loadAssignments(member.class_id).catch(() => {});
    get().checkAndGrantAchievements().catch(() => {});
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
    get().checkAndGrantAchievements().catch(() => {});
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

  initStreak: () => {
    try {
      const STREAK_KEY = 'xenon-streak';
      const today = new Date().toISOString().slice(0, 10);
      let stored = {};
      try { stored = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}'); } catch {}
      let current = stored.current || 0;
      let longest = stored.longest || 0;
      const lastDate = stored.lastDate || null;
      if (!lastDate || lastDate === today) {
        current = Math.max(current, 1);
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        current = lastDate === yesterday ? current + 1 : 1;
      }
      longest = Math.max(longest, current);
      localStorage.setItem(STREAK_KEY, JSON.stringify({ current, longest, lastDate: today }));
      set({ streak: { current, longest } });
    } catch {}
  },

  loadAchievements: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const { data, error } = await supabase.from('user_achievements').select('achievement_key, earned_at').eq('user_id', user.id);
      if (error) {
        if (isMissingSupabaseTableError(error, "user_achievements")) {
          set({
            achievements: getLocalAchievements(user.id),
            databaseWarnings: {
              ...get().databaseWarnings,
              achievements: "Achievements are using local browser storage until the Supabase migration is run.",
            },
          });
          return;
        }
        throw error;
      }
      get().setDatabaseWarning("achievements", "");
      set({ achievements: data || [] });
    } catch { set({ achievements: getLocalAchievements(user.id) }); }
  },

  loadAchievementsForUser: async (userId) => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase.from('user_achievements').select('achievement_key, earned_at').eq('user_id', userId);
      if (error) {
        if (isMissingSupabaseTableError(error, "user_achievements")) {
          return getLocalAchievements(userId);
        }
        throw error;
      }
      return data || [];
    } catch {
      return getLocalAchievements(userId);
    }
  },

  checkAndGrantAchievements: async () => {
    const { user, enrolledClass, projects, streak, achievements, profile } = get();
    if (!user || profile?.role !== 'student') return;
    try {
      const earned = new Set((achievements || []).map((a) => a.achievement_key));
      const toGrant = [];
      if (projects.length >= 1 && !earned.has('first_project')) toGrant.push('first_project');
      if (enrolledClass) {
        if (!earned.has('joined_class')) toGrant.push('joined_class');
        const correct = enrolledClass.practice_questions_correct || 0;
        if (correct >= 5 && !earned.has('skills_5')) toGrant.push('skills_5');
        if (correct >= 25 && !earned.has('skills_25')) toGrant.push('skills_25');
        if (correct >= 100 && !earned.has('skills_100')) toGrant.push('skills_100');
        const rank = enrolledClass.rank;
        if (rank && rank <= 3 && !earned.has('top_3')) toGrant.push('top_3');
        if (rank === 1 && !earned.has('top_1')) toGrant.push('top_1');
        if (rank === 1 && !earned.has('rank_1')) toGrant.push('rank_1');
        if (rank === 2 && !earned.has('rank_2')) toGrant.push('rank_2');
        if (rank === 3 && !earned.has('rank_3')) toGrant.push('rank_3');
      }
      const streakVal = streak?.current || 0;
      if (streakVal >= 3 && !earned.has('streak_3')) toGrant.push('streak_3');
      if (streakVal >= 7 && !earned.has('streak_7')) toGrant.push('streak_7');
      if (!toGrant.length) return;
      const now = new Date().toISOString();
      const nextEntries = [
        ...(achievements || []),
        ...toGrant.map((key) => ({ achievement_key: key, earned_at: now })),
      ];
      const { error } = await supabase.from('user_achievements').insert(
        toGrant.map((key) => ({ user_id: user.id, achievement_key: key, earned_at: now }))
      );
      if (error) {
        if (isMissingSupabaseTableError(error, "user_achievements")) {
          const localAchievements = saveLocalAchievements(user.id, nextEntries);
          set({
            achievements: localAchievements,
            databaseWarnings: {
              ...get().databaseWarnings,
              achievements: "Achievements are using local browser storage until the Supabase migration is run.",
            },
          });
          return;
        }
        throw error;
      }
      get().setDatabaseWarning("achievements", "");
      await get().loadAchievements();
    } catch {}
  },

  loadAnnouncements: async (classId) => {
    const cls = classId || get().enrolledClass?.id;
    if (!cls) { set({ announcements: [] }); return; }
    try {
      const { data, error } = await supabase.from('class_announcements').select('*').eq('class_id', cls).order('created_at', { ascending: false });
      if (error) {
        if (isMissingSupabaseTableError(error, "class_announcements")) {
          get().setDatabaseWarning("announcements", "Announcements need the Supabase migration before teachers can post and students can read them.");
          set({ announcements: [] });
          return;
        }
        throw error;
      }
      get().setDatabaseWarning("announcements", "");
      set({ announcements: data || [] });
    } catch { set({ announcements: [] }); }
  },

  postAnnouncement: async ({ classId, message }) => {
    const { user } = get();
    const { error } = await supabase.from('class_announcements').insert({ class_id: classId, teacher_id: user.id, message: message.trim() });
    if (error) throw new Error(translateSupabaseError(error, "Could not post announcement."));
    get().setDatabaseWarning("announcements", "");
  },

  deleteAnnouncement: async (id) => {
    const { error } = await supabase.from('class_announcements').delete().eq('id', id);
    if (error) throw new Error(translateSupabaseError(error, "Could not delete announcement."));
  },

  loadAssignments: async (classId) => {
    const cls = classId || get().enrolledClass?.id;
    if (!cls) { set({ assignments: [] }); return; }
    try {
      const { data, error } = await supabase.from('class_assignments').select('*').eq('class_id', cls).order('created_at', { ascending: false });
      if (error) {
        if (isMissingSupabaseTableError(error, "class_assignments")) {
          get().setDatabaseWarning("assignments", "Assignments need the Supabase migration before teachers can create them and students can receive them.");
          set({ assignments: [] });
          return;
        }
        throw error;
      }
      get().setDatabaseWarning("assignments", "");
      set({ assignments: data || [] });
    } catch { set({ assignments: [] }); }
  },

  postAssignment: async ({ classId, title, description, dueDate, questionGoal }) => {
    const { user } = get();
    const parsedGoal = Number(questionGoal);
    const { error } = await supabase.from('class_assignments').insert({
      class_id: classId,
      teacher_id: user.id,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate || null,
      question_goal: Number.isFinite(parsedGoal) && parsedGoal > 0 ? Math.floor(parsedGoal) : null,
    });
    if (error) throw new Error(translateSupabaseError(error, "Could not post assignment."));
    get().setDatabaseWarning("assignments", "");
  },

  deleteAssignment: async (id) => {
    const { error } = await supabase.from('class_assignments').delete().eq('id', id);
    if (error) throw new Error(translateSupabaseError(error, "Could not delete assignment."));
  },

  submitAssignment: async ({ assignmentId, notes }) => {
    const { user, enrolledClass } = get();
    const { error } = await supabase.from('assignment_submissions').upsert({ assignment_id: assignmentId, class_id: enrolledClass?.id, student_id: user.id, notes: notes || '', submitted_at: new Date().toISOString() }, { onConflict: 'assignment_id,student_id' });
    if (error) throw new Error(translateSupabaseError(error, "Could not submit assignment."));
  },

  loadSubmissions: async (assignmentId) => {
    const { data, error } = await supabase.from('assignment_submissions').select('*, profiles(username, first_name)').eq('assignment_id', assignmentId);
    if (error) throw new Error(translateSupabaseError(error, "Could not load submissions."));
    return data || [];
  },

}));
