export interface DailyGoal {
  tasksCompleted: number;
  focusTimeMinutes: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  totalDaysActive: number;
}

export interface GoalProgress {
  dailyTaskGoal: number;
  dailyFocusGoal: number;
  weeklyTaskGoal: number;
  weeklyFocusGoal: number;
}

export interface DailyStats {
  date: string;
  tasksCompleted: number;
  focusTimeMinutes: number;
  breakTimeMinutes: number;
  totalXPEarned: number;
  achievementsUnlocked: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyStats {
  week: string;
  tasksCompleted: number;
  focusTimeMinutes: number;
  breakTimeMinutes: number;
  totalXPEarned: number;
  achievementsUnlocked: string[];
  createdAt: string;
  updatedAt: string;
}
