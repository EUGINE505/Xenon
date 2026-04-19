export const XP_PER_CORRECT_CHALLENGE_ANSWER = 8;
export const XP_MATCH_COMPLETION_BONUS = 20;
export const XP_MATCH_WIN_BONUS = 35;
export const XP_MATCH_DRAW_BONUS = 20;

export const PODIUM_MEDALS = {
  1: { key: "rank_1", label: "1st Place", icon: "\u{1F947}" },
  2: { key: "rank_2", label: "2nd Place", icon: "\u{1F948}" },
  3: { key: "rank_3", label: "3rd Place", icon: "\u{1F949}" },
};

export const getXpForNextLevel = (level = 1) => 120 + Math.max(0, level - 1) * 40;

export const getLevelFromXp = (xp = 0) => {
  let totalXp = Math.max(0, Number(xp) || 0);
  let level = 1;

  while (totalXp >= getXpForNextLevel(level)) {
    totalXp -= getXpForNextLevel(level);
    level += 1;
  }

  return level;
};

export const getLevelProgress = (xp = 0) => {
  let totalXp = Math.max(0, Number(xp) || 0);
  let level = 1;

  while (totalXp >= getXpForNextLevel(level)) {
    totalXp -= getXpForNextLevel(level);
    level += 1;
  }

  const needed = getXpForNextLevel(level);
  return {
    level,
    currentLevelXp: totalXp,
    xpIntoLevel: totalXp,
    xpNeeded: needed,
    percent: needed ? Math.min(100, Math.round((totalXp / needed) * 100)) : 100,
  };
};

export const getChallengeXpBreakdown = ({
  playerScore = 0,
  opponentScore = 0,
  playerAnswered = 0,
  opponentAnswered = 0,
} = {}) => {
  const correctXp = Math.max(0, Number(playerScore) || 0) * XP_PER_CORRECT_CHALLENGE_ANSWER;
  const completed = (Number(playerAnswered) || 0) >= 10 && (Number(opponentAnswered) || 0) >= 10;
  const completionXp = completed ? XP_MATCH_COMPLETION_BONUS : 0;
  const resultXp =
    !completed ? 0 : playerScore > opponentScore ? XP_MATCH_WIN_BONUS : playerScore === opponentScore ? XP_MATCH_DRAW_BONUS : 0;

  return {
    correctXp,
    completionXp,
    resultXp,
    totalXp: correctXp + completionXp + resultXp,
  };
};

export const getRankBadge = (rank) => PODIUM_MEDALS[rank] || null;
