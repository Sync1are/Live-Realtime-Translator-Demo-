const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Import services
const NotificationService = require('./services/NotificationService');
const TaskScheduler = require('./services/TaskScheduler');
const EndOfDayService = require('./services/EndOfDayService');
const SettingsManager = require('./services/SettingsManager');
const InboxManager = require('./services/InboxManager');
const PomodoroService = require('./services/PomodoroService');
const TimerService = require('./services/TimerService');
const AnalyticsService = require('./services/AnalyticsService');

// Service instances
let mainWindow;
let notificationService;
let taskScheduler;
let endOfDayService;
let settingsManager;
let inboxManager;
let pomodoroService;
let timerService;
let analyticsService;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load a simple HTML page (to be created)
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.argv.includes('--debug')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize all services
 */
async function initializeServices() {
  try {
    // Initialize settings manager first
    settingsManager = new SettingsManager();
    await settingsManager.initialize();

    // Initialize notification service
    notificationService = new NotificationService();
    await notificationService.initialize();

    // Apply settings to notification service
    const notificationSettings = settingsManager.getNotificationSettings();
    notificationService.updateSettings(notificationSettings);

    // Initialize task scheduler
    taskScheduler = new TaskScheduler(notificationService);
    taskScheduler.initialize();

    // Initialize end-of-day service
    endOfDayService = new EndOfDayService(notificationService);
    const eodSettings = settingsManager.getAll().endOfDay;
    endOfDayService.initialize(eodSettings);

    // Initialize inbox manager
    inboxManager = new InboxManager();
    await inboxManager.initialize();

    // Initialize Pomodoro service
    pomodoroService = new PomodoroService(notificationService);
    const pomodoroSettings = settingsManager.getPomodoroSettings();
    pomodoroService.initialize(pomodoroSettings);

    // Initialize Timer service
    timerService = new TimerService(notificationService);
    const timerSettings = settingsManager.getTimerSettings();
    await timerService.initialize(timerSettings);

    // Initialize Analytics service
    analyticsService = new AnalyticsService(timerService, taskScheduler, endOfDayService);
    await analyticsService.initialize();

    // Set up event listeners
    setupEventListeners();

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Set up event listeners between services
 */
function setupEventListeners() {
  // Notification service events
  notificationService.on('notificationClicked', handleNotificationClick);
  notificationService.on('notificationAction', handleNotificationAction);
  notificationService.on('notificationError', (error) => {
    console.error('Notification error:', error);
  });

  // Settings manager events
  settingsManager.on('notificationSettingsUpdated', (settings) => {
    notificationService.updateSettings(settings);
  });

  settingsManager.on('endOfDayTimeChanged', (time) => {
    endOfDayService.updateSummaryTime(time);
  });

  // End-of-day service events
  endOfDayService.on('inboxEntryCreated', async (entry) => {
    await inboxManager.addItem(entry);
  });

  endOfDayService.on('summarySent', (summary) => {
    console.log('Daily summary sent:', summary);
  });

  // Task scheduler events
  taskScheduler.on('reminderSent', (task) => {
    console.log('Reminder sent for task:', task.title);
  });

  taskScheduler.on('overdueSent', ({ task, minutesOverdue }) => {
    console.log(`Overdue alert sent for task: ${task.title} (${minutesOverdue} min overdue)`);
  });

  taskScheduler.on('taskStatusUpdated', ({ taskId, status, task }) => {
    if (status === 'completed' && task) {
      analyticsService.recordCompletedTask(task);
    }
  });

  // Pomodoro service events
  pomodoroService.on('workSessionStarted', (data) => {
    timerService.startFocusSession(data.taskId, true);
    if (mainWindow) {
      mainWindow.webContents.send('pomodoro-work-started', data);
    }
  });

  pomodoroService.on('breakSessionStarted', (data) => {
    timerService.startBreakSession(true, data.isLongBreak);
    if (mainWindow) {
      mainWindow.webContents.send('pomodoro-break-started', data);
    }
  });

  pomodoroService.on('sessionCompleted', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('pomodoro-session-completed', data);
    }
  });

  pomodoroService.on('timerTick', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('pomodoro-timer-tick', data);
    }
  });

  // Timer service events
  timerService.on('focusSessionEnded', (session) => {
    endOfDayService.addFocusTime(session.durationMinutes);
  });

  timerService.on('breakSessionEnded', (session) => {
    endOfDayService.addBreakTime(session.durationMinutes);
  });

  // Settings manager events for Pomodoro and Timer
  settingsManager.on('pomodoroSettingsUpdated', (settings) => {
    pomodoroService.updateSettings(settings);
  });

  settingsManager.on('timerSettingsUpdated', (settings) => {
    timerService.updateSettings(settings);
  });

  settingsManager.on('pomodoroEnabledChanged', (enabled) => {
    if (enabled) {
      pomodoroService.enable();
    } else {
      pomodoroService.disable();
    }
  });
}

/**
 * Handle notification click events
 */
function handleNotificationClick(event) {
  const { type, data } = event;
  
  // Bring app to focus
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }

  // Send to renderer process
  if (mainWindow) {
    mainWindow.webContents.send('notification-clicked', { type, data });
  }

  console.log('Notification clicked:', type);
}

/**
 * Handle notification action events
 */
function handleNotificationAction(event) {
  const { type, action, data } = event;

  switch (action.type) {
    case 'startNow':
      handleStartTaskNow(data.taskId);
      break;
    
    case 'snooze':
      handleSnoozeTask(data.taskId);
      break;
    
    case 'extend':
      handleExtendTask(data.taskId);
      break;
    
    case 'complete':
      handleCompleteTask(data.taskId);
      break;
    
    case 'viewDetails':
      handleViewDetails(data);
      break;
    
    default:
      console.log('Unhandled action:', action.type);
  }
}

/**
 * Handle "Start Now" action
 */
function handleStartTaskNow(taskId) {
  console.log('Starting task now:', taskId);
  
  // Update task status to in_progress
  taskScheduler.updateTaskStatus(taskId, 'in_progress');
  
  // Notify renderer
  if (mainWindow) {
    mainWindow.webContents.send('task-action', {
      action: 'start',
      taskId
    });
  }
}

/**
 * Handle snooze task action
 */
function handleSnoozeTask(taskId) {
  console.log('Snoozing task:', taskId);
  
  const task = taskScheduler.getTask(taskId);
  if (task) {
    // Reschedule reminder for 5 minutes from now
    const snoozeMinutes = settingsManager.getAll().reminders.snoozeMinutes;
    const newStartTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);
    
    task.startTime = newStartTime.toISOString();
    taskScheduler.addTask(task);
  }
}

/**
 * Handle extend task action
 */
function handleExtendTask(taskId) {
  console.log('Extending task:', taskId);
  
  const task = taskScheduler.getTask(taskId);
  if (task) {
    // Add 15 minutes to estimated time
    task.estimatedMinutes = (task.estimatedMinutes || 30) + 15;
    taskScheduler.addTask(task);
  }
  
  if (mainWindow) {
    mainWindow.webContents.send('task-action', {
      action: 'extend',
      taskId
    });
  }
}

/**
 * Handle complete task action
 */
function handleCompleteTask(taskId) {
  console.log('Completing task:', taskId);
  
  taskScheduler.updateTaskStatus(taskId, 'completed');
  endOfDayService.incrementTasksCompleted();
  
  if (mainWindow) {
    mainWindow.webContents.send('task-action', {
      action: 'complete',
      taskId
    });
  }
}

/**
 * Handle view details action
 */
function handleViewDetails(data) {
  console.log('Viewing details:', data);
  
  if (mainWindow) {
    mainWindow.webContents.send('show-details', data);
  }
}

/**
 * Set up IPC handlers for renderer process communication
 */
function setupIpcHandlers() {
  // Task management
  ipcMain.handle('add-task', async (event, task) => {
    taskScheduler.addTask(task);
    return { success: true };
  });

  ipcMain.handle('remove-task', async (event, taskId) => {
    taskScheduler.removeTask(taskId);
    return { success: true };
  });

  ipcMain.handle('update-task-status', async (event, taskId, status) => {
    taskScheduler.updateTaskStatus(taskId, status);
    return { success: true };
  });

  ipcMain.handle('get-all-tasks', async () => {
    return taskScheduler.getAllTasks();
  });

  // Settings management
  ipcMain.handle('get-settings', async () => {
    return settingsManager.getAll();
  });

  ipcMain.handle('update-notification-settings', async (event, settings) => {
    await settingsManager.updateNotificationSettings(settings);
    return { success: true };
  });

  ipcMain.handle('set-task-reminders', async (event, enabled) => {
    await settingsManager.setTaskReminders(enabled);
    return { success: true };
  });

  ipcMain.handle('set-overdue-alerts', async (event, enabled) => {
    await settingsManager.setOverdueAlerts(enabled);
    return { success: true };
  });

  ipcMain.handle('set-end-of-day-summary', async (event, enabled) => {
    await settingsManager.setEndOfDaySummary(enabled);
    return { success: true };
  });

  ipcMain.handle('set-quiet-hours', async (event, config) => {
    await settingsManager.setQuietHours(config);
    return { success: true };
  });

  ipcMain.handle('set-end-of-day-time', async (event, time) => {
    await settingsManager.setEndOfDayTime(time);
    return { success: true };
  });

  // End-of-day service
  ipcMain.handle('get-daily-stats', async () => {
    return endOfDayService.getDailyStats();
  });

  ipcMain.handle('trigger-summary', async () => {
    await endOfDayService.triggerSummary();
    return { success: true };
  });

  ipcMain.handle('update-daily-stats', async (event, stats) => {
    endOfDayService.updateDailyStats(stats);
    return { success: true };
  });

  // Inbox management
  ipcMain.handle('get-inbox-items', async () => {
    return inboxManager.getAllItems();
  });

  ipcMain.handle('get-unread-count', async () => {
    return inboxManager.getUnreadCount();
  });

  ipcMain.handle('mark-as-read', async (event, itemId) => {
    await inboxManager.markAsRead(itemId);
    return { success: true };
  });

  ipcMain.handle('mark-all-as-read', async () => {
    await inboxManager.markAllAsRead();
    return { success: true };
  });

  ipcMain.handle('delete-inbox-item', async (event, itemId) => {
    await inboxManager.deleteItem(itemId);
    return { success: true };
  });

  // Notification testing
  ipcMain.handle('test-notification', async (event, type) => {
    switch (type) {
      case 'reminder':
        await notificationService.sendTaskReminder({
          id: 'test-task',
          title: 'Test Task - Review documents'
        });
        break;
      
      case 'overdue':
        await notificationService.sendOverdueAlert({
          id: 'test-task',
          title: 'Test Task - Complete report'
        }, 15);
        break;
      
      case 'summary':
        await notificationService.sendEndOfDaySummary({
          tasksCompleted: 5,
          focusTime: 120,
          breakTime: 30,
          streak: 7,
          pendingRollovers: 2
        });
        break;
    }
    return { success: true };
  });

  // Pomodoro management
  ipcMain.handle('pomodoro-enable', async () => {
    await settingsManager.setPomodoroEnabled(true);
    return { success: true };
  });

  ipcMain.handle('pomodoro-disable', async () => {
    await settingsManager.setPomodoroEnabled(false);
    return { success: true };
  });

  ipcMain.handle('pomodoro-update-settings', async (event, settings) => {
    await settingsManager.updatePomodoroSettings(settings);
    return { success: true };
  });

  ipcMain.handle('pomodoro-get-settings', async () => {
    return pomodoroService.getSettings();
  });

  ipcMain.handle('pomodoro-start-work', async (event, taskId) => {
    pomodoroService.startWorkSession(taskId);
    return { success: true };
  });

  ipcMain.handle('pomodoro-start-break', async (event, isLongBreak) => {
    pomodoroService.startBreakSession(isLongBreak);
    return { success: true };
  });

  ipcMain.handle('pomodoro-pause', async () => {
    pomodoroService.pause();
    return { success: true };
  });

  ipcMain.handle('pomodoro-resume', async () => {
    pomodoroService.resume();
    return { success: true };
  });

  ipcMain.handle('pomodoro-skip', async () => {
    pomodoroService.skip();
    return { success: true };
  });

  ipcMain.handle('pomodoro-extend', async (event, minutes) => {
    pomodoroService.extend(minutes);
    return { success: true };
  });

  ipcMain.handle('pomodoro-get-status', async () => {
    return pomodoroService.getStatus();
  });

  ipcMain.handle('pomodoro-get-upcoming-cycles', async (event, count) => {
    return pomodoroService.getUpcomingCycles(count || 5);
  });

  // Timer management
  ipcMain.handle('timer-start-focus', async (event, taskId) => {
    timerService.startFocusSession(taskId, false);
    return { success: true };
  });

  ipcMain.handle('timer-start-break', async () => {
    timerService.startBreakSession(false, false);
    return { success: true };
  });

  ipcMain.handle('timer-end-session', async () => {
    timerService.endCurrentSession();
    return { success: true };
  });

  ipcMain.handle('timer-get-current-session', async () => {
    return timerService.getCurrentSession();
  });

  ipcMain.handle('timer-get-analytics', async (event, startDate, endDate) => {
    return timerService.getAnalytics(startDate, endDate);
  });

  ipcMain.handle('timer-get-history', async (event, limit, offset) => {
    return timerService.getHistory(limit, offset);
  });

  ipcMain.handle('timer-update-settings', async (event, settings) => {
    await settingsManager.updateTimerSettings(settings);
    return { success: true };
  });

  ipcMain.handle('timer-get-settings', async () => {
    return timerService.getSettings();
  });

  // Analytics management
  ipcMain.handle('analytics-get-daily-dashboard', async (event, date) => {
    return analyticsService.getDailyDashboard(date);
  });

  ipcMain.handle('analytics-get-weekly-dashboard', async (event, weekStartDate) => {
    return analyticsService.getWeeklyDashboard(weekStartDate);
  });

  ipcMain.handle('analytics-set-daily-goals', async (event, goals) => {
    analyticsService.setDailyGoals(goals);
    return { success: true };
  });

  ipcMain.handle('analytics-get-daily-goals', async () => {
    return analyticsService.getDailyGoals();
  });

  ipcMain.handle('analytics-populate-test-data', async () => {
    try {
      const { generateTestData } = require('./examples/populate-test-data');
      const { sessions, taskHistory } = generateTestData();
      
      // Load test data into services
      for (const session of sessions) {
        timerService.sessions.push(session);
      }
      await timerService.saveSessions();
      
      for (const task of taskHistory) {
        await analyticsService.recordCompletedTask(task);
      }
      
      return { success: true, message: 'Test data populated successfully' };
    } catch (error) {
      console.error('Failed to populate test data:', error);
      return { success: false, error: error.message };
    }
  });
}

/**
 * Cleanup on app quit
 */
function cleanup() {
  if (taskScheduler) {
    taskScheduler.shutdown();
  }
  
  if (endOfDayService) {
    endOfDayService.shutdown();
  }

  if (pomodoroService) {
    pomodoroService.shutdown();
  }

  if (timerService) {
    timerService.shutdown();
  }
  
  console.log('Services cleaned up');
}

// App lifecycle events
app.whenReady().then(async () => {
  await initializeServices();
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanup();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
