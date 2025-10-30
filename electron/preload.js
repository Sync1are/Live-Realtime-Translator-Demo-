const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Exposes safe IPC methods to renderer process
 */
contextBridge.exposeInMainWorld('notificationAPI', {
  // Task management
  addTask: (task) => ipcRenderer.invoke('add-task', task),
  removeTask: (taskId) => ipcRenderer.invoke('remove-task', taskId),
  updateTaskStatus: (taskId, status) => ipcRenderer.invoke('update-task-status', taskId, status),
  getAllTasks: () => ipcRenderer.invoke('get-all-tasks'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateNotificationSettings: (settings) => ipcRenderer.invoke('update-notification-settings', settings),
  setTaskReminders: (enabled) => ipcRenderer.invoke('set-task-reminders', enabled),
  setOverdueAlerts: (enabled) => ipcRenderer.invoke('set-overdue-alerts', enabled),
  setEndOfDaySummary: (enabled) => ipcRenderer.invoke('set-end-of-day-summary', enabled),
  setQuietHours: (config) => ipcRenderer.invoke('set-quiet-hours', config),
  setEndOfDayTime: (time) => ipcRenderer.invoke('set-end-of-day-time', time),

  // End-of-day
  getDailyStats: () => ipcRenderer.invoke('get-daily-stats'),
  triggerSummary: () => ipcRenderer.invoke('trigger-summary'),
  updateDailyStats: (stats) => ipcRenderer.invoke('update-daily-stats', stats),

  // Inbox
  getInboxItems: () => ipcRenderer.invoke('get-inbox-items'),
  getUnreadCount: () => ipcRenderer.invoke('get-unread-count'),
  markAsRead: (itemId) => ipcRenderer.invoke('mark-as-read', itemId),
  markAllAsRead: () => ipcRenderer.invoke('mark-all-as-read'),
  deleteInboxItem: (itemId) => ipcRenderer.invoke('delete-inbox-item', itemId),

  // Testing
  testNotification: (type) => ipcRenderer.invoke('test-notification', type),

  // Pomodoro
  pomodoroEnable: () => ipcRenderer.invoke('pomodoro-enable'),
  pomodoroDisable: () => ipcRenderer.invoke('pomodoro-disable'),
  pomodoroUpdateSettings: (settings) => ipcRenderer.invoke('pomodoro-update-settings', settings),
  pomodoroGetSettings: () => ipcRenderer.invoke('pomodoro-get-settings'),
  pomodoroStartWork: (taskId) => ipcRenderer.invoke('pomodoro-start-work', taskId),
  pomodoroStartBreak: (isLongBreak) => ipcRenderer.invoke('pomodoro-start-break', isLongBreak),
  pomodoroPause: () => ipcRenderer.invoke('pomodoro-pause'),
  pomodoroResume: () => ipcRenderer.invoke('pomodoro-resume'),
  pomodoroSkip: () => ipcRenderer.invoke('pomodoro-skip'),
  pomodoroExtend: (minutes) => ipcRenderer.invoke('pomodoro-extend', minutes),
  pomodoroGetStatus: () => ipcRenderer.invoke('pomodoro-get-status'),
  pomodoroGetUpcomingCycles: (count) => ipcRenderer.invoke('pomodoro-get-upcoming-cycles', count),

  // Timer
  timerStartFocus: (taskId) => ipcRenderer.invoke('timer-start-focus', taskId),
  timerStartBreak: () => ipcRenderer.invoke('timer-start-break'),
  timerEndSession: () => ipcRenderer.invoke('timer-end-session'),
  timerGetCurrentSession: () => ipcRenderer.invoke('timer-get-current-session'),
  timerGetAnalytics: (startDate, endDate) => ipcRenderer.invoke('timer-get-analytics', startDate, endDate),
  timerGetHistory: (limit, offset) => ipcRenderer.invoke('timer-get-history', limit, offset),
  timerUpdateSettings: (settings) => ipcRenderer.invoke('timer-update-settings', settings),
  timerGetSettings: () => ipcRenderer.invoke('timer-get-settings'),

  // Analytics
  analyticsGetDailyDashboard: (date) => ipcRenderer.invoke('analytics-get-daily-dashboard', date),
  analyticsGetWeeklyDashboard: (weekStartDate) => ipcRenderer.invoke('analytics-get-weekly-dashboard', weekStartDate),
  analyticsSetDailyGoals: (goals) => ipcRenderer.invoke('analytics-set-daily-goals', goals),
  analyticsGetDailyGoals: () => ipcRenderer.invoke('analytics-get-daily-goals'),
  analyticsPopulateTestData: () => ipcRenderer.invoke('analytics-populate-test-data'),
  // Gamification
  gamificationCalculateXP: (taskData) => ipcRenderer.invoke('gamification-calculate-xp', taskData),
  gamificationCalculateLevel: (totalXP) => ipcRenderer.invoke('gamification-calculate-level', totalXP),
  gamificationGetLevelProgress: (totalXP, currentLevel) => ipcRenderer.invoke('gamification-get-level-progress', totalXP, currentLevel),
  gamificationCheckAchievements: (stats, unlockedAchievements) => ipcRenderer.invoke('gamification-check-achievements', stats, unlockedAchievements),
  gamificationUpdateStreak: (lastCompletionDate) => ipcRenderer.invoke('gamification-update-streak', lastCompletionDate),
  gamificationGetDailyGoalProgress: (todayStats) => ipcRenderer.invoke('gamification-get-daily-goal-progress', todayStats),
  gamificationGetWeeklyGoalProgress: (weekStats) => ipcRenderer.invoke('gamification-get-weekly-goal-progress', weekStats),
  gamificationGetAllAchievements: () => ipcRenderer.invoke('gamification-get-all-achievements'),
  gamificationGetSettings: () => ipcRenderer.invoke('gamification-get-settings'),
  gamificationUpdateSettings: (settings) => ipcRenderer.invoke('gamification-update-settings', settings),
  gamificationSetEnabled: (enabled) => ipcRenderer.invoke('gamification-set-enabled', enabled),
  gamificationSetConfettiEnabled: (enabled) => ipcRenderer.invoke('gamification-set-confetti-enabled', enabled),
  gamificationSetAnimationEnabled: (enabled) => ipcRenderer.invoke('gamification-set-animation-enabled', enabled),
  gamificationSetSoundEnabled: (enabled) => ipcRenderer.invoke('gamification-set-sound-enabled', enabled),

  // Event listeners
  onNotificationClicked: (callback) => {
    ipcRenderer.on('notification-clicked', (event, data) => callback(data));
  },
  onTaskAction: (callback) => {
    ipcRenderer.on('task-action', (event, data) => callback(data));
  },
  onShowDetails: (callback) => {
    ipcRenderer.on('show-details', (event, data) => callback(data));
  },
  onPomodoroWorkStarted: (callback) => {
    ipcRenderer.on('pomodoro-work-started', (event, data) => callback(data));
  },
  onPomodoroBreakStarted: (callback) => {
    ipcRenderer.on('pomodoro-break-started', (event, data) => callback(data));
  },
  onPomodoroSessionCompleted: (callback) => {
    ipcRenderer.on('pomodoro-session-completed', (event, data) => callback(data));
  },
  onPomodoroTimerTick: (callback) => {
    ipcRenderer.on('pomodoro-timer-tick', (event, data) => callback(data));
  },

  // Focus monitoring
  focusMonitoringGetSettings: () => ipcRenderer.invoke('focus-monitoring-get-settings'),
  focusMonitoringUpdateSettings: (settings) => ipcRenderer.invoke('focus-monitoring-update-settings', settings),
  focusMonitoringSetEnabled: (enabled) => ipcRenderer.invoke('focus-monitoring-set-enabled', enabled),
  focusMonitoringGetDistractionLog: (limit, offset) => ipcRenderer.invoke('focus-monitoring-get-distraction-log', limit, offset),
  focusMonitoringAnnotateDistraction: (distractionId, annotation) => ipcRenderer.invoke('focus-monitoring-annotate-distraction', distractionId, annotation),
  focusMonitoringDeleteDistraction: (distractionId) => ipcRenderer.invoke('focus-monitoring-delete-distraction', distractionId),
  focusMonitoringAddToWhitelist: (entry) => ipcRenderer.invoke('focus-monitoring-add-to-whitelist', entry),
  focusMonitoringRemoveFromWhitelist: (index) => ipcRenderer.invoke('focus-monitoring-remove-from-whitelist', index),
  focusMonitoringAddToBlacklist: (entry) => ipcRenderer.invoke('focus-monitoring-add-to-blacklist', entry),
  focusMonitoringRemoveFromBlacklist: (index) => ipcRenderer.invoke('focus-monitoring-remove-from-blacklist', index),
  focusMonitoringClearLog: () => ipcRenderer.invoke('focus-monitoring-clear-log'),
  
  // Focus monitoring events
  onFocusGraceStarted: (callback) => {
    ipcRenderer.on('focus-grace-started', (event, data) => callback(data));
  },
  onFocusGraceCancelled: (callback) => {
    ipcRenderer.on('focus-grace-cancelled', (event) => callback());
  },
  onFocusAutoPauseTriggered: (callback) => {
    ipcRenderer.on('focus-auto-pause-triggered', (event, data) => callback(data));
  },

  // Task management
  taskCreate: (taskData) => ipcRenderer.invoke('task-create', taskData),
  taskUpdate: (taskId, updates) => ipcRenderer.invoke('task-update', taskId, updates),
  taskDelete: (taskId) => ipcRenderer.invoke('task-delete', taskId),
  taskGetAll: () => ipcRenderer.invoke('task-get-all'),
  taskGetById: (taskId) => ipcRenderer.invoke('task-get-by-id', taskId),
  taskGetByStatus: (status) => ipcRenderer.invoke('task-get-by-status', status),
  taskGetFiltered: (filters) => ipcRenderer.invoke('task-get-filtered', filters),
  taskStartTimer: (taskId) => ipcRenderer.invoke('task-start-timer', taskId),
  taskPauseTimer: () => ipcRenderer.invoke('task-pause-timer'),
  taskResumeTimer: (taskId) => ipcRenderer.invoke('task-resume-timer', taskId),
  taskComplete: (taskId) => ipcRenderer.invoke('task-complete', taskId),
  taskGetActive: () => ipcRenderer.invoke('task-get-active'),
  taskGetTimeLogs: (taskId) => ipcRenderer.invoke('task-get-time-logs', taskId),
  taskGetAllCategories: () => ipcRenderer.invoke('task-get-all-categories'),
  taskGetAllTags: () => ipcRenderer.invoke('task-get-all-tags'),
  taskMarkRollovers: () => ipcRenderer.invoke('task-mark-rollovers'),

  // Task events
  onTaskCompleted: (callback) => {
    ipcRenderer.on('task-completed', (event, task) => callback(task));
  },
  onTaskTimerStarted: (callback) => {
    ipcRenderer.on('task-timer-started', (event, data) => callback(data));
  },
  onTaskTimerPaused: (callback) => {
    ipcRenderer.on('task-timer-paused', (event, data) => callback(data));
  },
  onTaskTimerResumed: (callback) => {
    ipcRenderer.on('task-timer-resumed', (event, data) => callback(data));
  }
});
