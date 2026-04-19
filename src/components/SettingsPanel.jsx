import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLevelProgress, getRankBadge } from "../lib/progression";
import { useAppStore } from "../store/useAppStore";
import ProfileAvatar from "./ProfileAvatar";
import { AchievementGrid } from "./AchievementsPanel";

const themes = [
  { value: "xenon-dark", label: "Xenon Dark" },
  { value: "oled-black", label: "OLED Black" },
  { value: "classic-light", label: "Classic Light" },
  { value: "solarized", label: "Solarized" },
  { value: "pink", label: "Pink" },
  { value: "blue", label: "Blue" },
];

function StudentProfilePreview({ profile, achievements, onClose, onAddFriend, relationshipLabel, disableAdd, rank }) {
  if (!profile) return null;
  const levelProgress = getLevelProgress(profile.experience_points || 0);
  const rankBadge = getRankBadge(rank);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="xenon-panel w-full max-w-3xl p-6" initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}>
          <div className="flex flex-wrap items-start gap-4">
            <ProfileAvatar name={profile.full_name || profile.username} avatarUrl={profile.avatar_url} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="xenon-kicker">Student Profile</p>
              <h3 className="mt-2 text-2xl font-semibold">{profile.full_name || profile.username}</h3>
              <p className="text-sm text-[var(--muted)]">@{profile.username}</p>
              {profile.headline ? <p className="mt-3 text-sm font-medium">{profile.headline}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="xenon-badge">Level {levelProgress.level}</span>
                {rankBadge ? <span className="xenon-badge">{rankBadge.icon} {rankBadge.label}</span> : null}
                {profile.favorite_topic ? <span className="xenon-badge">{profile.favorite_topic}</span> : null}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="xenon-panel-muted p-4">
              <p className="xenon-kicker">About Me</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{profile.about_me || "This student has not written an about section yet."}</p>
              <div className="challenge-progress-track mt-4">
                <span style={{ width: `${levelProgress.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">{profile.experience_points || 0} XP total</p>
            </div>
            <div className="xenon-panel-muted p-4">
              <AchievementGrid achievements={achievements} compact />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="xenon-badge">{relationshipLabel || "Visible profile"}</span>
            <div className="flex gap-2">
              {onAddFriend ? (
                <button className="xenon-btn" disabled={disableAdd} onClick={onAddFriend}>
                  {disableAdd ? relationshipLabel || "Connected" : "Add Friend"}
                </button>
              ) : null}
              <button className="xenon-btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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
    saveProfileCustomizations,
    searchStudentProfiles,
    sendFriendRequest,
    loadFriendNetwork,
    respondToFriendRequest,
    removeFriendship,
    loadAchievementsForUser,
    friends,
    incomingFriendRequests,
    outgoingFriendRequests,
    achievements,
  } = useAppStore();

  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [favoriteTopic, setFavoriteTopic] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [previewAchievements, setPreviewAchievements] = useState([]);

  useEffect(() => {
    if (!profile) loadProfile();
  }, [profile, loadProfile]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setUsername(profile.username || "");
    setAvatarUrl(profile.avatar_url || "");
    setHeadline(profile.headline || "");
    setFavoriteTopic(profile.favorite_topic || "");
    setAboutMe(profile.about_me || "");
    setProfileVisibility(profile.profile_visibility ?? true);
  }, [profile]);

  useEffect(() => {
    if (profile?.role === "student") {
      loadFriendNetwork().catch(() => {});
    }
  }, [profile?.role, loadFriendNetwork]);

  const existingRelationships = useMemo(() => {
    const map = new Map();
    friends.forEach((entry) => map.set(entry.friend.id, "Friends"));
    incomingFriendRequests.forEach((entry) => map.set(entry.friend.id, "Incoming request"));
    outgoingFriendRequests.forEach((entry) => map.set(entry.friend.id, "Request sent"));
    return map;
  }, [friends, incomingFriendRequests, outgoingFriendRequests]);

  const displayName = profile?.full_name || profile?.username || "Student";
  const levelProgress = getLevelProgress(profile?.experience_points || 0);
  const rankBadge = getRankBadge(enrolledClass?.rank);

  const saveProfile = async () => {
    setStatus("");
    setError("");
    setSavingProfile(true);
    try {
      await saveProfileCustomizations({
        fullName,
        username,
        avatarUrl,
        headline,
        favoriteTopic,
        aboutMe,
        profileVisibility,
      });
      setStatus("Profile saved.");
    } catch (err) {
      setError(err?.message || "Could not save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const openProfilePreview = async (studentProfile, useOwnAchievements = false) => {
    setPreviewProfile(studentProfile);
    if (useOwnAchievements) {
      setPreviewAchievements(achievements || []);
      return;
    }
    const rows = await loadAchievementsForUser(studentProfile.id);
    setPreviewAchievements(rows);
  };

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

  const runSearch = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setError("");
    try {
      const results = await searchStudentProfiles(search);
      setSearchResults(results);
    } catch (err) {
      setError(err?.message || "Could not search students.");
    } finally {
      setSearching(false);
    }
  };

  const addFriend = async (targetId) => {
    setStatus("");
    setError("");
    try {
      await sendFriendRequest(targetId);
      setStatus("Friend request sent.");
    } catch (err) {
      setError(err?.message || "Could not send friend request.");
    }
  };

  const answerRequest = async (friendshipId, action) => {
    setStatus("");
    setError("");
    try {
      await respondToFriendRequest(friendshipId, action);
      setStatus(action === "accept" ? "Friend request accepted." : "Friend request declined.");
    } catch (err) {
      setError(err?.message || "Could not update request.");
    }
  };

  const removeFriend = async (friendshipId) => {
    setStatus("");
    setError("");
    try {
      await removeFriendship(friendshipId);
      setStatus("Friend removed.");
    } catch (err) {
      setError(err?.message || "Could not remove friend.");
    }
  };

  return (
    <>
      <motion.section className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="xenon-hero-panel p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <ProfileAvatar name={displayName} avatarUrl={profile?.avatar_url} size="xl" />
              <div>
                <span className="xenon-pill">Profile And Settings</span>
                <h2 className="mt-3 text-3xl font-semibold">{displayName}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  @{profile?.username || "username"} {profile?.role ? `· ${profile.role}` : ""}
                </p>
                {profile?.headline ? <p className="mt-3 max-w-xl text-sm">{profile.headline}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="xenon-badge">Level {levelProgress.level}</span>
                  <span className="xenon-badge">{profile?.experience_points || 0} XP</span>
                  {rankBadge ? <span className="xenon-badge">{rankBadge.icon} {rankBadge.label}</span> : null}
                  <button className="xenon-btn-subtle" onClick={() => openProfilePreview(profile, true)}>View Profile</button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="xenon-metric">
                <p className="xenon-kicker">Level Progress</p>
                <p className="mt-2 text-lg font-semibold">Level {levelProgress.level}</p>
                <div className="challenge-progress-track mt-3">
                  <span style={{ width: `${levelProgress.percent}%` }} />
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">{levelProgress.xpIntoLevel}/{levelProgress.xpNeeded} XP to next level</p>
              </div>
              <div className="xenon-metric">
                <p className="xenon-kicker">Profile Status</p>
                <p className="mt-2 text-lg font-semibold">{profileVisibility ? "Visible" : "Friends only"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {enrolledClass ? `${enrolledClass.name} · ${enrolledClass.class_code}` : "Join a class to earn rank badges"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="xenon-panel p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">Profile Customisation</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">Use an image address for your avatar, add an about section, and decide whether other students can find your profile.</p>
                </div>
                <button className="xenon-btn" disabled={savingProfile} onClick={saveProfile}>{savingProfile ? "Saving..." : "Save Profile"}</button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Full Name</span>
                  <input className="xenon-input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Username</span>
                  <input className="xenon-input" value={username} onChange={(event) => setUsername(event.target.value)} />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium">Profile Picture Address</span>
                  <input className="xenon-input" placeholder="https://example.com/my-photo.png" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Headline</span>
                  <input className="xenon-input" placeholder="Year 10 Python learner" value={headline} onChange={(event) => setHeadline(event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Favourite Topic</span>
                  <input className="xenon-input" placeholder="Loops, lists, strings..." value={favoriteTopic} onChange={(event) => setFavoriteTopic(event.target.value)} />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium">About Me</span>
                  <textarea className="xenon-input min-h-[140px] resize-none" placeholder="Tell classmates what you enjoy building or what you are learning." value={aboutMe} onChange={(event) => setAboutMe(event.target.value)} />
                </label>
              </div>

              <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
                <input type="checkbox" checked={profileVisibility} onChange={(event) => setProfileVisibility(event.target.checked)} />
                Let other students discover and preview my profile
              </label>
            </div>

            <div className="xenon-panel p-6">
              <h3 className="text-xl font-semibold">Theme</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map((item) => (
                  <button
                    key={item.value}
                    className="xenon-panel-muted p-4 text-left"
                    style={theme === item.value ? { borderColor: "var(--border-strong)", background: "var(--accent-soft)" } : undefined}
                    onClick={() => setTheme(item.value)}
                  >
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">Change the classroom mood of the site.</span>
                  </button>
                ))}
              </div>
            </div>

            {profile?.role === "none" ? (
              <div className="xenon-panel p-6">
                <h3 className="text-xl font-semibold">Choose Role</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">You can still become a student or teacher before you start using the school tools.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="xenon-btn" onClick={() => updateRole("student")}>Become Student</button>
                  <button className="xenon-btn-ghost" onClick={() => updateRole("teacher")}>Become Teacher</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            {profile?.role === "student" ? (
              <>
                <div className="xenon-panel p-6">
                  <h3 className="text-xl font-semibold">Class Connection</h3>
                  {enrolledClass ? (
                    <div className="mt-4 space-y-3">
                      <div className="xenon-panel-muted p-4">
                        <p className="font-semibold">{enrolledClass.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">Code {enrolledClass.class_code}</p>
                      </div>
                      <button className="xenon-btn-ghost" onClick={leaveClass}>Leave Class</button>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <input className="xenon-input max-w-sm" placeholder="Class Code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
                      <button className="xenon-btn" onClick={connectClass}>Connect</button>
                    </div>
                  )}
                </div>

                <div className="xenon-panel p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">Student Friends</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">Search for classmates, send friend requests, and browse public profiles from settings.</p>
                    </div>
                    <span className="xenon-badge">{friends.length} friends</span>
                  </div>

                  {!!friends.length ? (
                    <div className="mt-4">
                      <p className="xenon-kicker">Friend List</p>
                      <div className="mt-3 grid gap-3">
                        {friends.map((friendship) => (
                          <div key={friendship.id} className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4">
                            <div className="flex items-center gap-3">
                              <ProfileAvatar name={friendship.friend.full_name || friendship.friend.username} avatarUrl={friendship.friend.avatar_url} size="md" />
                              <div>
                                <p className="font-semibold">{friendship.friend.full_name || friendship.friend.username}</p>
                                <p className="text-sm text-[var(--muted)]">@{friendship.friend.username} · Level {friendship.friend.level || 1}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="xenon-btn-subtle" onClick={() => openProfilePreview(friendship.friend)}>View Profile</button>
                              <button className="xenon-btn-ghost" onClick={() => removeFriend(friendship.id)}>Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex gap-3">
                    <input className="xenon-input" placeholder="Search by name, username, or topic" value={search} onChange={(event) => setSearch(event.target.value)} />
                    <button className="xenon-btn" disabled={searching} onClick={runSearch}>{searching ? "Searching..." : "Search"}</button>
                  </div>

                  {!!searchResults.length ? (
                    <div className="mt-4 space-y-3">
                      {searchResults.map((result) => {
                        const relationship = existingRelationships.get(result.id);
                        const disableAdd = Boolean(relationship);
                        return (
                          <div key={result.id} className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4">
                            <div className="flex items-center gap-3">
                              <ProfileAvatar name={result.full_name || result.username} avatarUrl={result.avatar_url} size="lg" />
                              <div>
                                <p className="font-semibold">{result.full_name || result.username}</p>
                                <p className="text-sm text-[var(--muted)]">@{result.username} · Level {result.level || 1}</p>
                                {result.headline ? <p className="mt-1 text-xs text-[var(--muted)]">{result.headline}</p> : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button className="xenon-btn-subtle" onClick={() => openProfilePreview(result)}>View Profile</button>
                              <button className="xenon-btn" disabled={disableAdd} onClick={() => addFriend(result.id)}>
                                {disableAdd ? relationship : "Add Friend"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {!!incomingFriendRequests.length ? (
                    <div className="mt-5">
                      <p className="xenon-kicker">Incoming Requests</p>
                      <div className="mt-3 space-y-3">
                        {incomingFriendRequests.map((request) => (
                          <div key={request.id} className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4">
                            <div className="flex items-center gap-3">
                              <ProfileAvatar name={request.friend.full_name || request.friend.username} avatarUrl={request.friend.avatar_url} size="md" />
                              <div>
                                <p className="font-semibold">{request.friend.full_name || request.friend.username}</p>
                                <p className="text-sm text-[var(--muted)]">@{request.friend.username}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="xenon-btn" onClick={() => answerRequest(request.id, "accept")}>Accept</button>
                              <button className="xenon-btn-ghost" onClick={() => answerRequest(request.id, "decline")}>Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {!!outgoingFriendRequests.length ? (
                    <div className="mt-5">
                      <p className="xenon-kicker">Sent Requests</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {outgoingFriendRequests.map((request) => (
                          <span key={request.id} className="xenon-badge">@{request.friend.username}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="xenon-panel p-6">
              <h3 className="text-xl font-semibold">Password</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <input className="xenon-input max-w-sm" type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
                <button className="xenon-btn" onClick={submitPassword}>Update Password</button>
              </div>
            </div>
          </div>
        </div>

        {status ? <p className="text-sm text-green-600">{status}</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </motion.section>

      <StudentProfilePreview
        profile={previewProfile}
        achievements={previewAchievements}
        onClose={() => setPreviewProfile(null)}
        onAddFriend={previewProfile ? () => addFriend(previewProfile.id) : null}
        relationshipLabel={previewProfile ? existingRelationships.get(previewProfile.id) : ""}
        disableAdd={previewProfile ? Boolean(existingRelationships.get(previewProfile.id)) : false}
        rank={previewProfile?.id === profile?.id ? enrolledClass?.rank : undefined}
      />
    </>
  );
}
