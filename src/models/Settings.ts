export interface NotificationSettings {
  enabled: boolean;
  taskReminders: boolean;
  breakReminders: boolean;
  achievementNotifications: boolean;
  soundEnabled: boolean;
}

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export interface GamificationSettings {
  enabled: boolean;
  showXP: boolean;
  showLevel: boolean;
  showStreaks: boolean;
  showAchievements: boolean;
}

export interface AppSettings {
  id: string;
  notifications: NotificationSettings;
  pomodoro: PomodoroSettings;
  gamification: GamificationSettings;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  updatedAt: string;
}

export const defaultSettings: Omit<AppSettings, 'id' | 'updatedAt'> = {
  notifications: {
    enabled: true,
    taskReminders: true,
    breakReminders: true,
    achievementNotifications: true,
    soundEnabled: true,
  },
  pomodoro: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
  },
  gamification: {
    enabled: true,
    showXP: true,
    showLevel: true,
    showStreaks: true,
    showAchievements: true,
  },
  theme: 'auto',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};
