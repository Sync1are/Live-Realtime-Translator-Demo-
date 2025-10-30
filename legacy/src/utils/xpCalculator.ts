export interface TaskXPInput {
  focusTimeMinutes: number;
  currentStreak: number;
  estimatedMinutes?: number;
  actualMinutes?: number;
}

export function calculateTaskXP(input: TaskXPInput): number {
  const BASE_XP = 10;
  const FOCUS_TIME_MULTIPLIER = 1;
  const STREAK_BONUS_PER_DAY = 5;
  const BEAT_ESTIMATE_BONUS = 10;

  let xp = BASE_XP;

  xp += input.focusTimeMinutes * FOCUS_TIME_MULTIPLIER;

  xp += input.currentStreak * STREAK_BONUS_PER_DAY;

  if (
    input.estimatedMinutes &&
    input.actualMinutes &&
    input.actualMinutes <= input.estimatedMinutes
  ) {
    xp += BEAT_ESTIMATE_BONUS;
  }

  return Math.round(xp);
}

export function calculateLevel(totalXP: number): number {
  const XP_BASE = 100;
  const XP_MULTIPLIER = 1.5;
  
  let level = 1;
  let xpRequired = XP_BASE;
  let totalXPRequired = 0;

  while (totalXPRequired + xpRequired <= totalXP) {
    totalXPRequired += xpRequired;
    level++;
    xpRequired = Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
  }

  return level;
}

export function getXPForLevel(level: number): number {
  const XP_BASE = 100;
  const XP_MULTIPLIER = 1.5;
  
  let totalXP = 0;
  
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, i - 1));
  }
  
  return totalXP;
}

export function getXPRequiredForNextLevel(level: number): number {
  const XP_BASE = 100;
  const XP_MULTIPLIER = 1.5;
  
  return Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
}

export interface LevelProgress {
  currentLevel: number;
  totalXP: number;
  currentLevelXP: number;
  xpRequiredForNext: number;
  percentage: number;
}

export function getLevelProgress(totalXP: number): LevelProgress {
  const currentLevel = calculateLevel(totalXP);
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const currentLevelXP = totalXP - xpForCurrentLevel;
  const xpRequiredForNext = getXPRequiredForNextLevel(currentLevel);
  const percentage = Math.round((currentLevelXP / xpRequiredForNext) * 100);

  return {
    currentLevel,
    totalXP,
    currentLevelXP,
    xpRequiredForNext,
    percentage,
  };
}
