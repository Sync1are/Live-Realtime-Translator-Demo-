/**
 * Full Example - Complete demonstration of the Notification Engine
 * 
 * This example shows how to use all features of the notification engine
 * in a real-world scenario.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Import all services
const NotificationService = require('../services/NotificationService');
const TaskScheduler = require('../services/TaskScheduler');
const EndOfDayService = require('../services/EndOfDayService');
const SettingsManager = require('../services/SettingsManager');
const InboxManager = require('../services/InboxManager');

// Service instances
let services = {};
let mainWindow;

/**
 * STEP 1: Initialize all services
 */
async function initializeServices() {
  console.log('Initializing notification engine...');

  // 1. Settings Manager (always initialize first)
  services.settingsManager = new SettingsManager();
  await services.settingsManager.initialize();
  console.log('✓ Settings manager ready');

  // 2. Notification Service
  services.notificationService = new NotificationService();
  await services.notificationService.initialize();
  
  // Apply notification settings from settings manager
  const notifSettings = services.settingsManager.getNotificationSettings();
  services.notificationService.updateSettings(notifSettings);
  console.log('✓ Notification service ready');

  // 3. Task Scheduler
  services.taskScheduler = new TaskScheduler(services.notificationService);
  services.taskScheduler.initialize();
  console.log('✓ Task scheduler ready');

  // 4. End-of-Day Service
  services.endOfDayService = new EndOfDayService(services.notificationService);
  const eodSettings = services.settingsManager.getAll().endOfDay;
  services.endOfDayService.initialize(eodSettings);
  console.log('✓ End-of-day service ready');

  // 5. Inbox Manager
  services.inboxManager = new InboxManager();
  await services.inboxManager.initialize();
  console.log('✓ Inbox manager ready');

  console.log('All services initialized successfully!\n');
}

/**
 * STEP 2: Set up event listeners
 */
function setupEventListeners() {
  console.log('Setting up event listeners...\n');

  // Notification Service Events
  services.notificationService.on('notificationSent', ({ type, title }) => {
    console.log(`📤 Notification sent: ${type} - "${title}"`);
  });

  services.notificationService.on('notificationClicked', ({ type, data }) => {
    console.log(`👆 Notification clicked: ${type}`, data);
    handleNotificationClick(type, data);
  });

  services.notificationService.on('notificationAction', ({ action, data }) => {
    console.log(`⚡ Notification action: ${action.type}`, data);
    handleNotificationAction(action, data);
  });

  // Task Scheduler Events
  services.taskScheduler.on('taskAdded', (task) => {
    console.log(`➕ Task added: "${task.title}"`);
  });

  services.taskScheduler.on('reminderSent', (task) => {
    console.log(`⏰ Reminder sent for: "${task.title}"`);
  });

  services.taskScheduler.on('overdueSent', ({ task, minutesOverdue }) => {
    console.log(`⚠️  Overdue alert: "${task.title}" (${minutesOverdue} min overdue)`);
  });

  // End-of-Day Service Events
  services.endOfDayService.on('summarySent', (summary) => {
    console.log('📊 Daily summary sent:', summary);
  });

  services.endOfDayService.on('inboxEntryCreated', async (entry) => {
    console.log('📥 Adding summary to inbox');
    await services.inboxManager.addItem(entry);
  });

  // Settings Manager Events
  services.settingsManager.on('notificationSettingsUpdated', (settings) => {
    console.log('⚙️  Notification settings updated');
    services.notificationService.updateSettings(settings);
  });

  services.settingsManager.on('endOfDayTimeChanged', (time) => {
    console.log(`⚙️  End-of-day time changed to: ${time}`);
    services.endOfDayService.updateSummaryTime(time);
  });
}

/**
 * STEP 3: Handle notification interactions
 */
function handleNotificationClick(type, data) {
  // Bring window to focus
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }

  // Handle different notification types
  switch (type) {
    case 'taskReminder':
      console.log(`  → Opening task: ${data.taskId}`);
      break;
    
    case 'overdueAlert':
      console.log(`  → Opening overdue task: ${data.taskId}`);
      break;
    
    case 'endOfDaySummary':
      console.log(`  → Opening daily summary`);
      break;
  }
}

function handleNotificationAction(action, data) {
  switch (action.type) {
    case 'startNow':
      console.log(`  → Starting task now: ${data.taskId}`);
      services.taskScheduler.updateTaskStatus(data.taskId, 'in_progress');
      break;
    
    case 'snooze':
      console.log(`  → Snoozing task: ${data.taskId}`);
      const task = services.taskScheduler.getTask(data.taskId);
      if (task) {
        const snoozeMinutes = services.settingsManager.getAll().reminders.snoozeMinutes;
        const newStart = new Date(Date.now() + snoozeMinutes * 60 * 1000);
        task.startTime = newStart.toISOString();
        services.taskScheduler.addTask(task);
      }
      break;
    
    case 'extend':
      console.log(`  → Extending task time: ${data.taskId}`);
      const taskToExtend = services.taskScheduler.getTask(data.taskId);
      if (taskToExtend) {
        taskToExtend.estimatedMinutes = (taskToExtend.estimatedMinutes || 30) + 15;
        services.taskScheduler.addTask(taskToExtend);
      }
      break;
    
    case 'complete':
      console.log(`  → Completing task: ${data.taskId}`);
      services.taskScheduler.updateTaskStatus(data.taskId, 'completed');
      services.endOfDayService.incrementTasksCompleted();
      break;
  }
}

/**
 * STEP 4: Example task workflows
 */
async function demonstrateFeatures() {
  console.log('='.repeat(60));
  console.log('DEMONSTRATION: Notification Engine Features');
  console.log('='.repeat(60));
  console.log();

  // 1. Configure Settings
  console.log('1. CONFIGURING SETTINGS');
  console.log('-'.repeat(60));
  
  await services.settingsManager.setTaskReminders(true);
  console.log('✓ Enabled task reminders');
  
  await services.settingsManager.setOverdueAlerts(true);
  console.log('✓ Enabled overdue alerts');
  
  await services.settingsManager.setEndOfDaySummary(true);
  console.log('✓ Enabled end-of-day summary');
  
  await services.settingsManager.setQuietHours({
    enabled: true,
    start: '22:00',
    end: '08:00'
  });
  console.log('✓ Set quiet hours: 22:00 - 08:00');
  
  await services.settingsManager.setEndOfDayTime('18:00');
  console.log('✓ Set end-of-day summary time: 18:00');
  
  console.log();

  // 2. Add Tasks
  console.log('2. ADDING TASKS');
  console.log('-'.repeat(60));
  
  // Task 1: Near-future reminder (2 minutes from now)
  const task1 = {
    id: 'task-1',
    title: 'Review project proposal',
    startTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    estimatedMinutes: 30,
    status: 'pending'
  };
  services.taskScheduler.addTask(task1);
  console.log(`✓ Added: "${task1.title}" (reminder in ~2 minutes)`);
  
  // Task 2: In progress task (will be overdue in 1 minute)
  const task2 = {
    id: 'task-2',
    title: 'Write documentation',
    startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    estimatedMinutes: 1, // Very short to trigger overdue quickly
    status: 'in_progress'
  };
  services.taskScheduler.addTask(task2);
  console.log(`✓ Added: "${task2.title}" (will be overdue in ~1 minute)`);
  
  // Task 3: Future task
  const task3 = {
    id: 'task-3',
    title: 'Team meeting',
    startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 60,
    status: 'pending'
  };
  services.taskScheduler.addTask(task3);
  console.log(`✓ Added: "${task3.title}" (reminder in ~1 hour)`);
  
  console.log();

  // 3. Update Daily Stats
  console.log('3. UPDATING DAILY STATS');
  console.log('-'.repeat(60));
  
  services.endOfDayService.incrementTasksCompleted();
  services.endOfDayService.incrementTasksCompleted();
  services.endOfDayService.incrementTasksCompleted();
  console.log('✓ Completed 3 tasks');
  
  services.endOfDayService.addFocusTime(90);
  console.log('✓ Added 90 minutes of focus time');
  
  services.endOfDayService.updateStreak(7);
  console.log('✓ Set streak to 7 days');
  
  services.endOfDayService.setPendingRollovers(2);
  console.log('✓ Set 2 pending rollovers');
  
  const stats = services.endOfDayService.getDailyStats();
  console.log('\nCurrent stats:', stats);
  
  const score = services.endOfDayService.calculateProductivityScore();
  console.log(`Productivity score: ${score}/100`);
  
  console.log();

  // 4. Test Notifications
  console.log('4. TESTING NOTIFICATIONS');
  console.log('-'.repeat(60));
  
  // Test reminder
  await services.notificationService.sendTaskReminder({
    id: 'test-task',
    title: 'Sample task for testing'
  });
  console.log('✓ Sent test task reminder');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test overdue
  await services.notificationService.sendOverdueAlert({
    id: 'test-task-2',
    title: 'Overdue sample task'
  }, 15);
  console.log('✓ Sent test overdue alert');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test summary
  await services.endOfDayService.triggerSummary();
  console.log('✓ Triggered daily summary');
  
  console.log();

  // 5. Check Inbox
  console.log('5. INBOX STATUS');
  console.log('-'.repeat(60));
  
  // Wait for inbox to update
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const inboxItems = services.inboxManager.getAllItems();
  const unreadCount = services.inboxManager.getUnreadCount();
  
  console.log(`Total inbox items: ${inboxItems.length}`);
  console.log(`Unread items: ${unreadCount}`);
  
  if (inboxItems.length > 0) {
    console.log('\nRecent items:');
    inboxItems.slice(0, 3).forEach(item => {
      console.log(`  - ${item.type} (${new Date(item.timestamp).toLocaleString()})`);
    });
  }
  
  console.log();

  // 6. Settings Summary
  console.log('6. CURRENT SETTINGS');
  console.log('-'.repeat(60));
  
  const settings = services.settingsManager.getAll();
  console.log('Notification settings:');
  console.log(`  Task reminders: ${settings.notifications.taskReminders}`);
  console.log(`  Overdue alerts: ${settings.notifications.overdueAlerts}`);
  console.log(`  End-of-day summary: ${settings.notifications.endOfDaySummary}`);
  console.log(`  Quiet hours: ${settings.notifications.quietHours.enabled ? 
    `${settings.notifications.quietHours.start} - ${settings.notifications.quietHours.end}` : 
    'Disabled'}`);
  console.log(`  EOD summary time: ${settings.endOfDay.summaryTime}`);
  
  console.log();
  console.log('='.repeat(60));
  console.log('Demonstration complete! The app will continue running.');
  console.log('You should receive notifications as tasks trigger.');
  console.log('Press Ctrl+C to quit.');
  console.log('='.repeat(60));
  console.log();
}

/**
 * STEP 5: Cleanup
 */
function cleanup() {
  console.log('\nCleaning up...');
  
  if (services.taskScheduler) {
    services.taskScheduler.shutdown();
    console.log('✓ Task scheduler shutdown');
  }
  
  if (services.endOfDayService) {
    services.endOfDayService.shutdown();
    console.log('✓ End-of-day service shutdown');
  }
  
  console.log('Cleanup complete.');
}

/**
 * Main application
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // For this example, just show a simple message
  mainWindow.loadURL(`data:text/html,
    <html>
      <body style="font-family: sans-serif; padding: 40px; background: #f5f5f5;">
        <h1>🔔 Notification Engine Example</h1>
        <p>The notification engine is running!</p>
        <p>Check the console for activity logs.</p>
        <p>You should start receiving test notifications shortly.</p>
        <hr>
        <h2>What's happening:</h2>
        <ul>
          <li>✅ All services initialized</li>
          <li>✅ Test tasks scheduled</li>
          <li>✅ Notifications configured</li>
          <li>⏰ Waiting for scheduled events...</li>
        </ul>
        <p><small>Keep this window open and check your system notifications!</small></p>
      </body>
    </html>
  `);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Application lifecycle
app.whenReady().then(async () => {
  await initializeServices();
  setupEventListeners();
  createWindow();
  
  // Run demonstration after a short delay
  setTimeout(demonstrateFeatures, 1000);

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

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection:', reason);
});
