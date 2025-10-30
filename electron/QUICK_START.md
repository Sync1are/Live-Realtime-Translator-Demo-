# Quick Start Guide

Get up and running with the Notification Engine in 5 minutes.

## Installation

```bash
npm install
```

## Run the Test App

```bash
npm start
```

This opens a test UI where you can:
- View daily statistics
- Toggle notification settings
- Configure quiet hours
- Test all notification types
- View notification inbox

## Run the Full Example

```bash
npm run example
```

This demonstrates all features with:
- Automatic service initialization
- Sample task scheduling
- Test notifications
- Console logging of all events

## Basic Integration (3 Steps)

### Step 1: Initialize Services

```javascript
const NotificationService = require('./services/NotificationService');
const TaskScheduler = require('./services/TaskScheduler');
const EndOfDayService = require('./services/EndOfDayService');
const SettingsManager = require('./services/SettingsManager');

async function init() {
  // 1. Settings
  const settingsManager = new SettingsManager();
  await settingsManager.initialize();

  // 2. Notifications
  const notificationService = new NotificationService();
  await notificationService.initialize();
  notificationService.updateSettings(
    settingsManager.getNotificationSettings()
  );

  // 3. Task Scheduler
  const taskScheduler = new TaskScheduler(notificationService);
  taskScheduler.initialize();

  // 4. End-of-Day
  const endOfDayService = new EndOfDayService(notificationService);
  endOfDayService.initialize(
    settingsManager.getAll().endOfDay
  );
}
```

### Step 2: Add Tasks

```javascript
// Schedule a task reminder
taskScheduler.addTask({
  id: 'task-1',
  title: 'Team meeting',
  startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  estimatedMinutes: 60,
  status: 'pending'
});
```

### Step 3: Handle Notifications

```javascript
// Listen for notification clicks
notificationService.on('notificationClicked', ({ type, data }) => {
  // Bring window to focus and navigate to task
  console.log('User clicked notification:', type, data);
});

// Listen for notification actions
notificationService.on('notificationAction', ({ action, data }) => {
  if (action.type === 'startNow') {
    taskScheduler.updateTaskStatus(data.taskId, 'in_progress');
  }
});
```

## Common Use Cases

### Configure Quiet Hours

```javascript
await settingsManager.setQuietHours({
  enabled: true,
  start: '22:00',
  end: '08:00'
});
```

### Track Daily Stats

```javascript
// Task completed
endOfDayService.incrementTasksCompleted();

// Add focus time
endOfDayService.addFocusTime(30); // 30 minutes

// Update streak
endOfDayService.updateStreak(5); // 5 days
```

### Update Task Status

```javascript
// Mark task as started
taskScheduler.updateTaskStatus('task-1', 'in_progress');

// Mark task as completed
taskScheduler.updateTaskStatus('task-1', 'completed');
```

### Test Notifications

```javascript
// Test reminder
await notificationService.sendTaskReminder({
  id: 'test',
  title: 'Sample Task'
});

// Test overdue alert
await notificationService.sendOverdueAlert({
  id: 'test',
  title: 'Overdue Task'
}, 15); // 15 minutes overdue

// Test daily summary
await endOfDayService.triggerSummary();
```

## IPC from Renderer Process

If using the preload script:

```javascript
// Add task
await window.notificationAPI.addTask({
  id: 'task-1',
  title: 'Complete report',
  startTime: new Date().toISOString(),
  status: 'pending'
});

// Toggle settings
await window.notificationAPI.setTaskReminders(true);
await window.notificationAPI.setOverdueAlerts(true);

// Get daily stats
const stats = await window.notificationAPI.getDailyStats();
console.log(stats); // { tasksCompleted: 5, focusTime: 120, ... }

// Listen for clicks
window.notificationAPI.onNotificationClicked((data) => {
  console.log('Notification clicked:', data);
});
```

## Configuration

Settings are automatically saved to:
- **macOS**: `~/Library/Application Support/[app-name]/notification-settings.json`
- **Windows**: `%APPDATA%/[app-name]/notification-settings.json`
- **Linux**: `~/.config/[app-name]/notification-settings.json`

Default settings:
```javascript
{
  notifications: {
    taskReminders: true,
    overdueAlerts: true,
    endOfDaySummary: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    }
  },
  endOfDay: {
    summaryTime: "18:00"
  }
}
```

## Notification Types

| Type | When | Actions | Urgent | Respects Quiet Hours |
|------|------|---------|--------|---------------------|
| Task Reminder | 5 min before start | Start, Snooze | No | Yes |
| Overdue Alert | Task exceeds time | Extend, Complete | Yes | No |
| Daily Summary | Scheduled time | View, Dismiss | No | Yes |

## Events

### NotificationService
- `notificationSent` - Notification sent
- `notificationClicked` - User clicked notification
- `notificationAction` - User clicked action button

### TaskScheduler
- `taskAdded` - Task added
- `reminderSent` - Reminder sent
- `overdueSent` - Overdue alert sent

### EndOfDayService
- `summarySent` - Daily summary sent
- `inboxEntryCreated` - Summary added to inbox

### SettingsManager
- `notificationSettingsUpdated` - Settings changed

## Troubleshooting

### Notifications not showing?
1. Check system notification permissions
2. Verify notification type is enabled in settings
3. Check if in quiet hours (unless urgent)
4. Look for errors in console

### Reminders not firing?
1. Ensure task has valid `startTime` (ISO 8601 format)
2. Verify task status is not 'completed'
3. Check that task was added to scheduler
4. Look for scheduling messages in console

### Settings not saving?
1. Check app has write access to userData directory
2. Look for save errors in console
3. Verify settingsManager was initialized

## Next Steps

- 📚 Read the full documentation: `electron/README.md`
- 🔌 Integration guide: `electron/INTEGRATION_GUIDE.md`
- 📖 API reference: `electron/API.md`
- 📝 See examples: `electron/examples/full-example.js`

## Commands

```bash
# Start test UI
npm start

# Start with DevTools
npm run dev

# Run full example
npm run example

# Run tests
npm test
```

## Support

Check the documentation in the `electron/` directory for detailed guides and API reference.
