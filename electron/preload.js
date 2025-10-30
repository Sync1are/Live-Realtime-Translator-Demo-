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
  }
});
