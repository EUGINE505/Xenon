import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { PRACTICE_QUESTIONS } from "../lib/practiceQuestions";
import { getChallengeXpBreakdown, getLevelProgress } from "../lib/progression";
import { useAppStore } from "../store/useAppStore";
import ProfileAvatar from "./ProfileAvatar";

const STORAGE_PREFIX = "xenon-challenge-session";

const shuffle = (items = []) => [...items].sort(() => Math.random() - 0.5);

const readSession = (challengeId) => {
  if (typeof window === "undefined" || !challengeId) return null;
  try {
    return JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}:${challengeId}`) || "null");
  } catch {
    return null;
  }
};

const writeSession = (challengeId, value) => {
  if (typeof window === "undefined" || !challengeId) return;
  window.localStorage.setItem(`${STORAGE_PREFIX}:${challengeId}`, JSON.stringify(value));
};

const clearSession = (challengeId) => {
  if (typeof window === "undefined" || !challengeId) return;
  window.localStorage.removeItem(`${STORAGE_PREFIX}:${challengeId}`);
};

const getQuestionByTitle = (title) => PRACTICE_QUESTIONS.find((question) => question.title === title) || null;

const getResultLabel = (result) => {
  if (result === "win") return "Victory";
  if (result === "loss") return "Defeat";
  if (result === "draw") return "Draw";
  return "In Progress";
};

function ChallengeCard({ title, subtitle, action, children, badge = "" }) {
  return (
    <div className="xenon-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {badge ? <span className="xenon-badge">{badge}</span> : null}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function ChallengeArena() {
  const {
    profile,
    friends,
    friendChallenges,
    databaseWarnings,
    loadFriendChallenges,
    createFriendChallenge,
    respondToChallengeInvite,
    saveChallengeProgress,
  } = useAppStore();

  const [activeChallengeId, setActiveChallengeId] = useState("");
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [savingRound, setSavingRound] = useState(false);

  useEffect(() => {
    if (profile?.role === "student") {
      loadFriendChallenges().catch(() => {});
    }
  }, [profile?.role, loadFriendChallenges]);

  const levelProgress = getLevelProgress(profile?.experience_points || 0);
  const incomingChallenges = useMemo(
    () => friendChallenges.filter((challenge) => challenge.status === "pending" && !challenge.isChallenger),
    [friendChallenges],
  );
  const outgoingChallenges = useMemo(
    () => friendChallenges.filter((challenge) => challenge.status === "pending" && challenge.isChallenger),
    [friendChallenges],
  );
  const activeChallenges = useMemo(
    () =>
      friendChallenges.filter(
        (challenge) => challenge.status === "active" && challenge.selfAnswers < (challenge.question_titles?.length || 10),
      ),
    [friendChallenges],
  );
  const completedChallenges = useMemo(
    () => friendChallenges.filter((challenge) => challenge.status === "completed"),
    [friendChallenges],
  );
  const activeChallenge = friendChallenges.find((challenge) => challenge.id === activeChallengeId) || null;
  const questionTitles = activeChallenge?.question_titles || [];
  const currentQuestion = getQuestionByTitle(questionTitles[roundIndex]);
  const solved = currentQuestion ? blocks.join("\n") === currentQuestion.lines.join("\n") : false;

  useEffect(() => {
    if (!activeChallenge && activeChallenges.length) {
      setActiveChallengeId(activeChallenges[0].id);
    }
  }, [activeChallenge, activeChallenges]);

  useEffect(() => {
    if (!activeChallenge) {
      setRoundIndex(0);
      setRoundScore(0);
      setBlocks([]);
      return;
    }

    const saved = readSession(activeChallenge.id);
    const nextIndex = Math.min(saved?.roundIndex ?? activeChallenge.selfAnswers ?? 0, questionTitles.length);
    const nextScore = saved?.roundScore ?? activeChallenge.selfScore ?? 0;
    const fallbackQuestion = getQuestionByTitle(questionTitles[nextIndex]);
    const nextBlocks =
      saved?.blocks?.length && saved.roundIndex === nextIndex
        ? saved.blocks
        : fallbackQuestion
          ? shuffle(fallbackQuestion.lines)
          : [];

    setRoundIndex(nextIndex);
    setRoundScore(nextScore);
    setBlocks(nextBlocks);
  }, [activeChallenge, questionTitles]);

  useEffect(() => {
    if (!activeChallenge || !currentQuestion) return;
    writeSession(activeChallenge.id, { roundIndex, roundScore, blocks });
  }, [activeChallenge, roundIndex, roundScore, blocks, currentQuestion]);

  const moveBlock = (from, to) => {
    if (!currentQuestion || to < 0 || to >= blocks.length) return;
    setBlocks((current) =>
      current.map((item, index) => {
        if (index === from) return current[to];
        if (index === to) return current[from];
        return item;
      }),
    );
  };

  const startChallenge = (challengeId) => {
    setStatus("");
    setError("");
    setActiveChallengeId(challengeId);
  };

  const sendChallenge = async (friendId) => {
    setStatus("");
    setError("");
    try {
      await createFriendChallenge(friendId);
      setStatus("Challenge sent.");
    } catch (err) {
      setError(err?.message || "Could not send challenge.");
    }
  };

  const answerInvite = async (challengeId, action) => {
    setStatus("");
    setError("");
    try {
      await respondToChallengeInvite(challengeId, action);
      setStatus(action === "accept" ? "Challenge accepted." : "Challenge declined.");
      if (action === "accept") setActiveChallengeId(challengeId);
    } catch (err) {
      setError(err?.message || "Could not update challenge.");
    }
  };

  const submitRound = async () => {
    if (!activeChallenge || !currentQuestion) return;
    setSavingRound(true);
    setStatus("");
    setError("");

    const nextIndex = roundIndex + 1;
    const nextScore = roundScore + (solved ? 1 : 0);

    try {
      const updated = await saveChallengeProgress({
        challengeId: activeChallenge.id,
        score: nextScore,
        answers: nextIndex,
      });

      if (nextIndex >= questionTitles.length) {
        clearSession(activeChallenge.id);
        setStatus(
          solved
            ? "Round locked in. Match complete."
            : "Round submitted. Match complete.",
        );
      } else {
        const nextQuestion = getQuestionByTitle(questionTitles[nextIndex]);
        const nextBlocks = nextQuestion ? shuffle(nextQuestion.lines) : [];
        setRoundIndex(nextIndex);
        setRoundScore(nextScore);
        setBlocks(nextBlocks);
        setStatus(solved ? "Correct answer. Next round ready." : "Round submitted. Next question ready.");
        writeSession(activeChallenge.id, { roundIndex: nextIndex, roundScore: nextScore, blocks: nextBlocks });
      }

      if (updated?.status === "completed") {
        const finalBreakdown = getChallengeXpBreakdown({
          playerScore: updated.selfScore,
          opponentScore: updated.otherScore,
          playerAnswered: updated.selfAnswers,
          opponentAnswered: updated.otherAnswers,
        });
        setStatus(
          `${updated.result === "win" ? "You won" : updated.result === "draw" ? "It finished level" : "Match finished"} - +${finalBreakdown.totalXp} XP`,
        );
      }
    } catch (err) {
      setError(err?.message || "Could not save challenge round.");
    } finally {
      setSavingRound(false);
    }
  };

  const friendWithOpenChallenge = (friendId) =>
    friendChallenges.some(
      (challenge) =>
        challenge.opponentProfile?.id === friendId && (challenge.status === "pending" || challenge.status === "active"),
    );

  if (profile?.role !== "student") {
    return (
      <motion.section className="xenon-panel p-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-semibold">1v1 Showdown</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">This feature is for student profiles because it runs on the friends system.</p>
      </motion.section>
    );
  }

  return (
    <motion.section className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="xenon-hero-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <span className="xenon-pill">1v1 Python Showdown</span>
            <h2 className="xenon-section-title mt-4 text-4xl">Challenge friends to 10 quick Python rounds and climb your level.</h2>
            <p className="xenon-subtitle mt-4 max-w-xl text-sm sm:text-base">
              Every correct answer earns XP. Finish the match, win the showdown, and your level badge updates across your profile.
            </p>
          </div>
          <div className="challenge-progress-card">
            <p className="xenon-kicker">Your Progress</p>
            <p className="mt-3 text-3xl font-bold">Level {levelProgress.level}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{profile?.experience_points || 0} XP total</p>
            <div className="challenge-progress-track mt-4">
              <span style={{ width: `${levelProgress.percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              {levelProgress.xpIntoLevel}/{levelProgress.xpNeeded} XP to Level {levelProgress.level + 1}
            </p>
          </div>
        </div>
      </div>

      {databaseWarnings.challenges || databaseWarnings.progression ? (
        <div className="xenon-panel border-amber-400/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200">Supabase migration still needed for challenge progression.</p>
          <p className="mt-1 text-sm text-amber-100/90">
            Run the updated migration so friend challenges, XP, and levels can save correctly.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <ChallengeCard title="Start A Showdown" subtitle="Challenge accepted friends to a 10-question Python battle." badge={`${friends.length} friends`}>
            {!friends.length ? (
              <p className="text-sm text-[var(--muted)]">Add a friend in Settings first, then challenge them from here.</p>
            ) : (
              <div className="space-y-3">
                {friends.map((entry) => {
                  const locked = friendWithOpenChallenge(entry.friend.id);
                  return (
                    <div key={entry.id} className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar name={entry.friend.full_name || entry.friend.username} avatarUrl={entry.friend.avatar_url} size="md" />
                        <div>
                          <p className="font-semibold">{entry.friend.full_name || entry.friend.username}</p>
                          <p className="text-sm text-[var(--muted)]">@{entry.friend.username} · Level {entry.friend.level || 1}</p>
                        </div>
                      </div>
                      <button className="xenon-btn" disabled={locked} onClick={() => sendChallenge(entry.friend.id)}>
                        {locked ? "Open challenge exists" : "Challenge Friend"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </ChallengeCard>

          <ChallengeCard title="Invites" subtitle="Accept incoming matches or track requests you already sent." badge={`${incomingChallenges.length} incoming`}>
            {!incomingChallenges.length && !outgoingChallenges.length ? (
              <p className="text-sm text-[var(--muted)]">No challenge invites right now.</p>
            ) : (
              <div className="space-y-4">
                {incomingChallenges.map((challenge) => (
                  <div key={challenge.id} className="xenon-panel-muted p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{challenge.opponentProfile.full_name || challenge.opponentProfile.username}</p>
                        <p className="text-sm text-[var(--muted)]">Invited you to a 10-question showdown.</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="xenon-btn" onClick={() => answerInvite(challenge.id, "accept")}>Accept</button>
                        <button className="xenon-btn-ghost" onClick={() => answerInvite(challenge.id, "decline")}>Decline</button>
                      </div>
                    </div>
                  </div>
                ))}
                {outgoingChallenges.map((challenge) => (
                  <div key={challenge.id} className="xenon-panel-muted p-4">
                    <p className="font-semibold">{challenge.opponentProfile.full_name || challenge.opponentProfile.username}</p>
                    <p className="text-sm text-[var(--muted)]">Invite sent. Waiting for them to accept.</p>
                  </div>
                ))}
              </div>
            )}
          </ChallengeCard>

          <ChallengeCard title="Match History" subtitle="Recent results and the XP you earned from each finish." badge={`${completedChallenges.length} finished`}>
            {!completedChallenges.length ? (
              <p className="text-sm text-[var(--muted)]">No completed showdowns yet.</p>
            ) : (
              <div className="space-y-3">
                {completedChallenges.slice(0, 6).map((challenge) => {
                  const xp = getChallengeXpBreakdown({
                    playerScore: challenge.selfScore,
                    opponentScore: challenge.otherScore,
                    playerAnswered: challenge.selfAnswers,
                    opponentAnswered: challenge.otherAnswers,
                  });
                  return (
                    <div key={challenge.id} className="xenon-panel-muted flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-semibold">
                          {getResultLabel(challenge.result)} vs {challenge.opponentProfile.full_name || challenge.opponentProfile.username}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {challenge.selfScore} - {challenge.otherScore} · {new Date(challenge.completed_at || challenge.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="xenon-badge">+{xp.totalXp} XP</span>
                    </div>
                  );
                })}
              </div>
            )}
          </ChallengeCard>
        </div>

        <div className="space-y-5">
          <ChallengeCard
            title="Active Matches"
            subtitle="Resume an accepted challenge or jump into your latest showdown."
            badge={`${activeChallenges.length} live`}
          >
            {!activeChallenges.length ? (
              <p className="text-sm text-[var(--muted)]">No live matches yet. Accept an invite or challenge a friend to get started.</p>
            ) : (
              <div className="space-y-3">
                {activeChallenges.map((challenge) => (
                  <button
                    key={challenge.id}
                    className="xenon-panel-muted challenge-list-button w-full p-4 text-left"
                    data-active={activeChallengeId === challenge.id}
                    onClick={() => startChallenge(challenge.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar name={challenge.opponentProfile.full_name || challenge.opponentProfile.username} avatarUrl={challenge.opponentProfile.avatar_url} size="md" />
                        <div>
                          <p className="font-semibold">{challenge.opponentProfile.full_name || challenge.opponentProfile.username}</p>
                          <p className="text-sm text-[var(--muted)]">
                            Round {Math.min((challenge.selfAnswers || 0) + 1, 10)}/10 · Score {challenge.selfScore}-{challenge.otherScore}
                          </p>
                        </div>
                      </div>
                      <span className="xenon-badge">{challenge.selfAnswers}/10 answered</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ChallengeCard>

          <ChallengeCard title="Arena" subtitle="Arrange the code blocks in the right order, then submit the round." badge={activeChallenge ? `Round ${Math.min(roundIndex + 1, 10)}/10` : "Waiting"}>
            {!activeChallenge || !currentQuestion ? (
              <p className="text-sm text-[var(--muted)]">Pick an active match to start playing.</p>
            ) : (
              <div className="space-y-5">
                <div className="challenge-scoreboard">
                  <div>
                    <p className="xenon-kicker">You</p>
                    <p className="mt-2 text-2xl font-bold">{roundScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="xenon-kicker">Showdown</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--muted)]">{activeChallenge.opponentProfile.full_name || activeChallenge.opponentProfile.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="xenon-kicker">Friend</p>
                    <p className="mt-2 text-2xl font-bold">{activeChallenge.otherScore}</p>
                  </div>
                </div>

                <div className="xenon-panel-muted p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="xenon-kicker">{currentQuestion.topic} · {currentQuestion.difficulty}</p>
                      <h4 className="mt-2 text-xl font-semibold">{currentQuestion.title}</h4>
                      <p className="mt-2 text-sm text-[var(--muted)]">{currentQuestion.description}</p>
                    </div>
                    <span className="xenon-badge">Correct answer = +8 XP</span>
                  </div>
                  <div className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--code-bg)] p-4">
                    <p className="xenon-kicker">Expected Output</p>
                    <pre className="xenon-code mt-3 whitespace-pre-wrap text-sm">{currentQuestion.output}</pre>
                  </div>
                </div>

                <div className="space-y-3">
                  {blocks.map((line, index) => (
                    <div key={`${line}-${index}`} className="xenon-panel-muted flex items-center gap-3 p-3">
                      <span className="challenge-line-number">{index + 1}</span>
                      <code className="xenon-code flex-1 text-sm">{line}</code>
                      <div className="flex gap-2">
                        <button className="xenon-btn-subtle" disabled={index === 0} onClick={() => moveBlock(index, index - 1)}>Up</button>
                        <button className="xenon-btn-subtle" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, index + 1)}>Down</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={clsx("text-sm font-semibold", solved ? "text-[var(--success)]" : "text-[var(--muted)]")}>
                      {solved ? "Looks correct. Submit when you're ready." : "You can submit now, or keep rearranging to find the right order."}
                    </p>
                  </div>
                  <button className="xenon-btn" disabled={savingRound} onClick={submitRound}>
                    {savingRound ? "Submitting..." : roundIndex === 9 ? "Finish Match" : "Submit Round"}
                  </button>
                </div>
              </div>
            )}
          </ChallengeCard>

          {status ? <p className="text-sm text-green-600">{status}</p> : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>
      </div>
    </motion.section>
  );
}
