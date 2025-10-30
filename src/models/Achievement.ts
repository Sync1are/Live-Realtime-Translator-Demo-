export type AchievementType = 'task_count' | 'streak' | 'focus_time' | 'beat_estimate' | 'level';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  icon: string;
  xpReward: number;
  condition: {
    type: string;
    threshold: number;
  };
  unlockedAt: string | null;
}

export interface UnlockedAchievement extends Achievement {
  unlockedAt: string;
}
