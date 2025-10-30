# Integration Guide

This guide shows how to integrate the Notification Engine into an existing Electron application.

## Quick Start

### 1. Copy the Services

Copy the entire `electron/services` directory into your Electron app:

```
your-app/
├── main/
│   └── services/
│       ├── NotificationService.js
│       ├── TaskScheduler.js
│       ├── EndOfDayService.js
│       ├── SettingsManager.js
│       └── InboxManager.js
```

### 2. Initialize in Main Process

In your main process file (e.g., `main.js`):

```javascript
const { app } = require('electron');
const NotificationService = require('./services/NotificationService');
const TaskScheduler = require('./services/TaskScheduler');
const EndOfDayService = require('./services/EndOfDayService');
const SettingsManager = require('./services/SettingsManager');
const InboxManager = require('./services/InboxManager');

let services = {};

async function initializeNotificationEngine() {
  // 1. Settings Manager (initialize first)
  services.settingsManager = new SettingsManager();
  await services.settingsManager.initialize();

  // 2. Notification Service
  services.notificationService = new NotificationService();
  await services.notificationService.initialize();
  
  // Apply settings
  const notifSettings = services.settingsManager.getNotificationSettings();
  services.notificationService.updateSettings(notifSettings);

  // 3. Task Scheduler
  services.taskScheduler = new TaskScheduler(services.notificationService);
  services.taskScheduler.initialize();

  // 4. End-of-Day Service
  services.endOfDayService = new EndOfDayService(services.notificationService);
  const eodSettings = services.settingsManager.getAll().endOfDay;
  services.endOfDayService.initialize(eodSettings);

  // 5. Inbox Manager
  services.inboxManager = new InboxManager();
  await services.inboxManager.initialize();

  // Set up event listeners
  setupEventListeners();

  console.log('Notification engine initialized');
}

function setupEventListeners() {
  // Forward EOD summaries to inbox
  services.endOfDayService.on('inboxEntryCreated', async (entry) => {
    await services.inboxManager.addItem(entry);
  });

  // Update notification service when settings change
  services.settingsManager.on('notificationSettingsUpdated', (settings) => {
    services.notificationService.updateSettings(settings);
  });

  // Update EOD service when time changes
  services.settingsManager.on('endOfDayTimeChanged', (time) => {
    services.endOfDayService.updateSummaryTime(time);
  });

  // Handle notification clicks
  services.notificationService.on('notificationClicked', ({ type, data }) => {
    // Bring window to focus
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Send to renderer
      mainWindow.webContents.send('notification-clicked', { type, data });
    }
  });

  // Handle notification actions
  services.notificationService.on('notificationAction', ({ action, data }) => {
    handleNotificationAction(action, data);
  });
}

function handleNotificationAction(action, data) {
  switch (action.type) {
    case 'startNow':
      // Update task status
      services.taskScheduler.updateTaskStatus(data.taskId, 'in_progress');
      // Notify renderer
      sendToRenderer('task-started', data.taskId);
      break;
    
    case 'complete':
      services.taskScheduler.updateTaskStatus(data.taskId, 'completed');
      services.endOfDayService.incrementTasksCompleted();
      sendToRenderer('task-completed', data.taskId);
      break;
    
    // Add more action handlers as needed
  }
}

function sendToRenderer(channel, data) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(win => {
    win.webContents.send(channel, data);
  });
}

// Initialize when app is ready
app.whenReady().then(async () => {
  await initializeNotificationEngine();
  // ... rest of your app initialization
});

// Cleanup on quit
app.on('before-quit', () => {
  if (services.taskScheduler) services.taskScheduler.shutdown();
  if (services.endOfDayService) services.endOfDayService.shutdown();
});

// Export for use in IPC handlers
module.exports = { services };
```

### 3. Set Up IPC Handlers

Create an IPC handlers file (e.g., `ipcHandlers.js`):

```javascript
const { ipcMain } = require('electron');
const { services } = require('./main');

function setupIpcHandlers() {
  // Task management
  ipcMain.handle('notification:addTask', async (event, task) => {
    services.taskScheduler.addTask(task);
    return { success: true };
  });

  ipcMain.handle('notification:removeTask', async (event, taskId) => {
    services.taskScheduler.removeTask(taskId);
    return { success: true };
  });

  ipcMain.handle('notification:updateTaskStatus', async (event, taskId, status) => {
    services.taskScheduler.updateTaskStatus(taskId, status);
    return { success: true };
  });

  // Settings
  ipcMain.handle('notification:getSettings', async () => {
    return services.settingsManager.getAll();
  });

  ipcMain.handle('notification:setTaskReminders', async (event, enabled) => {
    await services.settingsManager.setTaskReminders(enabled);
    return { success: true };
  });

  ipcMain.handle('notification:setQuietHours', async (event, config) => {
    await services.settingsManager.setQuietHours(config);
    return { success: true };
  });

  // Daily stats
  ipcMain.handle('notification:getDailyStats', async () => {
    return services.endOfDayService.getDailyStats();
  });

  ipcMain.handle('notification:incrementTasksCompleted', async () => {
    services.endOfDayService.incrementTasksCompleted();
    return { success: true };
  });

  ipcMain.handle('notification:addFocusTime', async (event, minutes) => {
    services.endOfDayService.addFocusTime(minutes);
    return { success: true };
  });

  // Inbox
  ipcMain.handle('notification:getInboxItems', async () => {
    return services.inboxManager.getAllItems();
  });

  ipcMain.handle('notification:getUnreadCount', async () => {
    return services.inboxManager.getUnreadCount();
  });

  ipcMain.handle('notification:markAsRead', async (event, itemId) => {
    await services.inboxManager.markAsRead(itemId);
    return { success: true };
  });
}

module.exports = { setupIpcHandlers };
```

Call this in your main process:
```javascript
const { setupIpcHandlers } = require('./ipcHandlers');
app.whenReady().then(() => {
  setupIpcHandlers();
});
```

### 4. Create Preload Script

Create or update your preload script:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notifications', {
  // Tasks
  addTask: (task) => ipcRenderer.invoke('notification:addTask', task),
  removeTask: (taskId) => ipcRenderer.invoke('notification:removeTask', taskId),
  updateTaskStatus: (taskId, status) => 
    ipcRenderer.invoke('notification:updateTaskStatus', taskId, status),

  // Settings
  getSettings: () => ipcRenderer.invoke('notification:getSettings'),
  setTaskReminders: (enabled) => 
    ipcRenderer.invoke('notification:setTaskReminders', enabled),
  setQuietHours: (config) => 
    ipcRenderer.invoke('notification:setQuietHours', config),

  // Stats
  getDailyStats: () => ipcRenderer.invoke('notification:getDailyStats'),
  incrementTasksCompleted: () => 
    ipcRenderer.invoke('notification:incrementTasksCompleted'),
  addFocusTime: (minutes) => 
    ipcRenderer.invoke('notification:addFocusTime', minutes),

  // Inbox
  getInboxItems: () => ipcRenderer.invoke('notification:getInboxItems'),
  getUnreadCount: () => ipcRenderer.invoke('notification:getUnreadCount'),
  markAsRead: (itemId) => ipcRenderer.invoke('notification:markAsRead', itemId),

  // Events
  onNotificationClicked: (callback) => {
    ipcRenderer.on('notification-clicked', (event, data) => callback(data));
  },
  onTaskStarted: (callback) => {
    ipcRenderer.on('task-started', (event, taskId) => callback(taskId));
  },
  onTaskCompleted: (callback) => {
    ipcRenderer.on('task-completed', (event, taskId) => callback(taskId));
  }
});
```

### 5. Use in Renderer Process

In your React/Vue/vanilla JS app:

```javascript
// Add a task
async function createTask(task) {
  await window.notifications.addTask({
    id: task.id,
    title: task.title,
    startTime: task.startTime,
    estimatedMinutes: task.estimatedMinutes,
    status: 'pending'
  });
}

// Mark task as started
async function startTask(taskId) {
  await window.notifications.updateTaskStatus(taskId, 'in_progress');
  
  // Start tracking focus time
  startFocusTimer();
}

// Mark task as completed
async function completeTask(taskId) {
  await window.notifications.updateTaskStatus(taskId, 'completed');
  await window.notifications.incrementTasksCompleted();
  
  // Stop focus timer and add time
  const focusMinutes = stopFocusTimer();
  await window.notifications.addFocusTime(focusMinutes);
}

// Listen for notification clicks
window.notifications.onNotificationClicked(({ type, data }) => {
  if (type === 'taskReminder') {
    // Navigate to task
    navigateToTask(data.taskId);
  }
});

// Listen for task actions from notifications
window.notifications.onTaskStarted((taskId) => {
  // Update UI to show task as started
  updateTaskUI(taskId, 'in_progress');
});
```

## Integration with Existing Task System

### Option 1: Sync on Task Events

If you have existing task management, sync with the notification engine:

```javascript
// When creating a task in your system
async function createTaskInYourSystem(task) {
  // 1. Save to your database/store
  await yourTaskStore.create(task);
  
  // 2. Add to notification engine
  await window.notifications.addTask({
    id: task.id,
    title: task.title,
    startTime: task.scheduledStart,
    endTime: task.scheduledEnd,
    estimatedMinutes: task.duration,
    status: task.status
  });
}

// When updating task status
async function updateTaskStatus(taskId, newStatus) {
  // 1. Update in your system
  await yourTaskStore.update(taskId, { status: newStatus });
  
  // 2. Update in notification engine
  await window.notifications.updateTaskStatus(taskId, newStatus);
  
  // 3. Update stats if completed
  if (newStatus === 'completed') {
    await window.notifications.incrementTasksCompleted();
  }
}

// When deleting a task
async function deleteTask(taskId) {
  // 1. Delete from your system
  await yourTaskStore.delete(taskId);
  
  // 2. Remove from notification engine
  await window.notifications.removeTask(taskId);
}
```

### Option 2: Batch Sync on Load

Sync all tasks when app loads:

```javascript
async function syncTasksOnLoad() {
  // Get all active tasks from your system
  const tasks = await yourTaskStore.getActiveTasks();
  
  // Add each to notification engine
  for (const task of tasks) {
    if (task.scheduledStart && task.status !== 'completed') {
      await window.notifications.addTask({
        id: task.id,
        title: task.title,
        startTime: task.scheduledStart,
        endTime: task.scheduledEnd,
        estimatedMinutes: task.duration,
        status: task.status
      });
    }
  }
}

// Call on app initialization
syncTasksOnLoad();
```

## Settings UI Integration

Create a settings panel in your app:

```javascript
// React example
function NotificationSettings() {
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  async function loadSettings() {
    const s = await window.notifications.getSettings();
    setSettings(s);
  }
  
  async function toggleTaskReminders(enabled) {
    await window.notifications.setTaskReminders(enabled);
    loadSettings();
  }
  
  async function updateQuietHours(start, end) {
    await window.notifications.setQuietHours({
      enabled: true,
      start,
      end
    });
    loadSettings();
  }
  
  return (
    <div>
      <h2>Notification Settings</h2>
      
      <label>
        <input
          type="checkbox"
          checked={settings?.notifications?.taskReminders}
          onChange={(e) => toggleTaskReminders(e.target.checked)}
        />
        Task Reminders
      </label>
      
      <div>
        <h3>Quiet Hours</h3>
        <input
          type="time"
          value={settings?.notifications?.quietHours?.start}
          onChange={(e) => updateQuietHours(e.target.value, settings.notifications.quietHours.end)}
        />
        to
        <input
          type="time"
          value={settings?.notifications?.quietHours?.end}
          onChange={(e) => updateQuietHours(settings.notifications.quietHours.start, e.target.value)}
        />
      </div>
    </div>
  );
}
```

## Daily Stats Integration

Display daily stats in your dashboard:

```javascript
function DailyStatsWidget() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  
  async function loadStats() {
    const s = await window.notifications.getDailyStats();
    setStats(s);
  }
  
  return (
    <div className="stats-widget">
      <div className="stat">
        <div className="value">{stats?.tasksCompleted || 0}</div>
        <div className="label">Tasks Completed</div>
      </div>
      <div className="stat">
        <div className="value">{stats?.focusTime || 0}</div>
        <div className="label">Focus Minutes</div>
      </div>
      <div className="stat">
        <div className="value">{stats?.streak || 0}</div>
        <div className="label">Day Streak 🔥</div>
      </div>
    </div>
  );
}
```

## Inbox Integration

Add a notification inbox to your app:

```javascript
function NotificationInbox() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    loadInbox();
  }, []);
  
  async function loadInbox() {
    const items = await window.notifications.getInboxItems();
    const count = await window.notifications.getUnreadCount();
    setItems(items);
    setUnreadCount(count);
  }
  
  async function markAsRead(itemId) {
    await window.notifications.markAsRead(itemId);
    loadInbox();
  }
  
  return (
    <div className="inbox">
      <h2>Notifications ({unreadCount} unread)</h2>
      
      {items.map(item => (
        <div 
          key={item.id} 
          className={item.read ? 'read' : 'unread'}
          onClick={() => markAsRead(item.id)}
        >
          <div className="date">
            {new Date(item.timestamp).toLocaleString()}
          </div>
          <div className="content">
            {formatInboxItem(item)}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatInboxItem(item) {
  if (item.type === 'dailySummary') {
    const { tasksCompleted, focusTime, streak } = item.data;
    return `Daily Summary: ${tasksCompleted} tasks, ${focusTime} min, ${streak} day streak`;
  }
  return JSON.stringify(item.data);
}
```

## Testing Integration

Test the integration:

```javascript
// Test that notifications work
async function testIntegration() {
  console.log('Testing notification engine integration...');
  
  // 1. Test adding a task
  await window.notifications.addTask({
    id: 'test-task',
    title: 'Test Task',
    startTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
    estimatedMinutes: 30,
    status: 'pending'
  });
  console.log('✓ Added task');
  
  // 2. Test updating stats
  await window.notifications.incrementTasksCompleted();
  await window.notifications.addFocusTime(15);
  console.log('✓ Updated stats');
  
  // 3. Test getting settings
  const settings = await window.notifications.getSettings();
  console.log('✓ Got settings:', settings);
  
  // 4. Test inbox
  const items = await window.notifications.getInboxItems();
  console.log('✓ Got inbox items:', items.length);
  
  console.log('Integration test complete!');
}
```

## Troubleshooting

### Notifications not appearing
1. Check notification permissions in system settings
2. Verify the notification service initialized successfully
3. Check if in quiet hours
4. Verify notification type is enabled in settings

### Tasks not triggering reminders
1. Ensure task has a valid `startTime` in ISO 8601 format
2. Check that `status` is not 'completed'
3. Verify task was added to scheduler
4. Check console for any errors

### Settings not persisting
1. Verify Electron app has write access to userData directory
2. Check for errors in console during save operations
3. Ensure `settingsManager.initialize()` completed successfully

### Daily summary not firing
1. Verify EOD service was initialized
2. Check summary time is set correctly
3. Ensure app is running at the scheduled time
4. Check console for scheduling messages

## Next Steps

- Customize notification styling to match your app
- Add custom notification types for your specific use case
- Integrate with your analytics/telemetry system
- Add sound customization options
- Implement notification history export
- Add notification statistics and insights
