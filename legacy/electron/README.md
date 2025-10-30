# Notification Engine for Electron

A comprehensive notification service for task management applications built with Electron. This engine provides intelligent notification handling with permission management, quiet hours, and multiple notification types.

## Features

### 🔔 Core Notification Service
- **Permission Handling**: Automatic permission request and management
- **Fallback Support**: Graceful degradation when notifications aren't supported
- **Queue Management**: Queues notifications during quiet hours or when permissions aren't granted
- **Event-Driven**: Emits events for notification interactions

### ⏰ Task Reminders
- Schedule reminders based on task start times
- Configurable lead time (default: 5 minutes before start)
- Actions: "Start Now" and "Snooze"
- Automatic rescheduling on snooze

### ⚠️ Overdue Alerts
- Monitor tasks in progress for overdue status
- Alert based on estimated time or planned end time
- Configurable alert intervals (default: every 15 minutes)
- Actions: "Extend Time" and "Mark Complete"

### 📊 End-of-Day Summary
- Scheduled daily summary notification
- Metrics: tasks completed, focus time, streak, pending rollovers
- Configurable summary time (default: 6:00 PM)
- Stored in in-app inbox for later viewing

### ⚙️ Settings Management
- Enable/disable each notification category independently
- Configure quiet hours (start and end times)
- Set end-of-day summary time
- Persistent settings storage
- Export/import settings

### 📥 Notification Inbox
- In-app inbox for viewing past summaries
- Unread count tracking
- Mark as read functionality
- Filter and search capabilities
- Automatic cleanup (max 100 items)

### 🎮 Gamification System
- **XP & Leveling**: Earn experience points for completing tasks with 20 levels
- **Achievements**: 15+ unique achievements across multiple categories
- **Streak Tracking**: Maintain consecutive days of task completion for bonus XP
- **Daily & Weekly Goals**: Track progress toward task and focus time goals
- **Celebratory Feedback**: Confetti, animations, and sounds on task completion
- **Persistent Storage**: All progress saved to IndexedDB

See [GAMIFICATION_GUIDE.md](../GAMIFICATION_GUIDE.md) for detailed documentation.

## Architecture

### Services

#### NotificationService
Core notification service that wraps Electron's Notification API.

```javascript
const notificationService = new NotificationService();
await notificationService.initialize();

// Send a notification
await notificationService.sendNotification({
  type: 'taskReminder',
  title: 'Task Reminder',
  body: 'Time to start your task',
  urgent: false
});
```

#### TaskScheduler
Manages scheduling of task reminders and overdue checks.

```javascript
const taskScheduler = new TaskScheduler(notificationService);
taskScheduler.initialize();

// Add a task
taskScheduler.addTask({
  id: 'task-1',
  title: 'Review documents',
  startTime: '2024-01-15T14:00:00Z',
  endTime: '2024-01-15T15:00:00Z',
  estimatedMinutes: 60,
  status: 'pending'
});
```

#### EndOfDayService
Manages end-of-day summary notifications.

```javascript
const endOfDayService = new EndOfDayService(notificationService);
endOfDayService.initialize({ summaryTime: '18:00' });

// Update stats throughout the day
endOfDayService.incrementTasksCompleted();
endOfDayService.addFocusTime(30);
endOfDayService.updateStreak(5);
```

#### SettingsManager
Manages notification preferences and settings.

```javascript
const settingsManager = new SettingsManager();
await settingsManager.initialize();

// Update settings
await settingsManager.setTaskReminders(true);
await settingsManager.setQuietHours({
  enabled: true,
  start: '22:00',
  end: '08:00'
});
```

#### InboxManager
Manages in-app notification inbox.

```javascript
const inboxManager = new InboxManager();
await inboxManager.initialize();

// Get inbox items
const items = inboxManager.getAllItems();
const unreadCount = inboxManager.getUnreadCount();

// Mark as read
await inboxManager.markAsRead(itemId);
```

#### GamificationService
Manages XP, achievements, streaks, and goals.

```javascript
const gamificationService = new GamificationService();
await gamificationService.initialize();

// Calculate XP for a completed task
const xp = gamificationService.calculateTaskXP({
  focusTime: 25,
  currentStreak: 3,
  estimatedTime: 30,
  actualTime: 20
});

// Check for new achievements
const newAchievements = gamificationService.checkAchievements(
  stats,
  unlockedAchievements
);
```

#### StorageService (Renderer Process)
Manages IndexedDB storage for gamification data.

```javascript
// In renderer process
const storageService = new StorageService();
await storageService.initialize();

// Get/save gamification state
const state = await storageService.getGamificationState();
await storageService.saveGamificationState(updatedState);

// Track daily stats
await storageService.updateDailyStats(date, { tasksCompleted: 5, focusTime: 120 });
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the application:
```bash
npm start
```

3. For development with DevTools:
```bash
npm run dev
```

## Usage

### Basic Setup

In your Electron main process:

```javascript
const NotificationService = require('./services/NotificationService');
const TaskScheduler = require('./services/TaskScheduler');
const EndOfDayService = require('./services/EndOfDayService');
const SettingsManager = require('./services/SettingsManager');
const InboxManager = require('./services/InboxManager');

// Initialize services
async function initializeServices() {
  // Settings
  const settingsManager = new SettingsManager();
  await settingsManager.initialize();

  // Notifications
  const notificationService = new NotificationService();
  await notificationService.initialize();
  notificationService.updateSettings(settingsManager.getNotificationSettings());

  // Task scheduler
  const taskScheduler = new TaskScheduler(notificationService);
  taskScheduler.initialize();

  // End-of-day
  const endOfDayService = new EndOfDayService(notificationService);
  endOfDayService.initialize(settingsManager.getAll().endOfDay);

  // Inbox
  const inboxManager = new InboxManager();
  await inboxManager.initialize();

  return {
    notificationService,
    taskScheduler,
    endOfDayService,
    settingsManager,
    inboxManager
  };
}
```

### IPC Communication

The included `preload.js` exposes safe IPC methods to the renderer process:

```javascript
// In renderer process

// Add a task
await window.notificationAPI.addTask({
  id: 'task-1',
  title: 'Complete report',
  startTime: new Date(Date.now() + 3600000).toISOString(),
  estimatedMinutes: 60,
  status: 'pending'
});

// Update settings
await window.notificationAPI.setTaskReminders(true);
await window.notificationAPI.setQuietHours({
  enabled: true,
  start: '22:00',
  end: '08:00'
});

// Get daily stats
const stats = await window.notificationAPI.getDailyStats();

// Listen for notification clicks
window.notificationAPI.onNotificationClicked((data) => {
  console.log('Notification clicked:', data);
});
```

## Configuration

### Default Settings

```json
{
  "notifications": {
    "taskReminders": true,
    "overdueAlerts": true,
    "endOfDaySummary": true,
    "quietHours": {
      "enabled": false,
      "start": "22:00",
      "end": "08:00"
    }
  },
  "endOfDay": {
    "summaryTime": "18:00"
  },
  "reminders": {
    "minutesBeforeStart": 5,
    "snoozeMinutes": 5
  },
  "overdue": {
    "alertIntervalMinutes": 15
  }
}
```

Settings are stored in the Electron user data directory:
- macOS: `~/Library/Application Support/[app-name]/notification-settings.json`
- Windows: `%APPDATA%/[app-name]/notification-settings.json`
- Linux: `~/.config/[app-name]/notification-settings.json`

## Events

### NotificationService Events
- `notificationSent`: Notification was sent
- `notificationClicked`: User clicked a notification
- `notificationAction`: User clicked a notification action button
- `notificationError`: Error occurred sending notification
- `settingsUpdated`: Notification settings were updated

### TaskScheduler Events
- `taskAdded`: Task was added to scheduler
- `taskRemoved`: Task was removed
- `taskStatusUpdated`: Task status changed
- `reminderSent`: Reminder notification sent
- `overdueSent`: Overdue alert sent

### EndOfDayService Events
- `summarySent`: Daily summary was sent
- `inboxEntryCreated`: Summary added to inbox
- `dailyStatsReset`: Daily stats were reset

### SettingsManager Events
- `notificationSettingsUpdated`: Notification settings changed
- `taskRemindersChanged`: Task reminders toggled
- `overdueAlertsChanged`: Overdue alerts toggled
- `endOfDaySummaryChanged`: EOD summary toggled
- `quietHoursChanged`: Quiet hours configuration changed

## Testing

Test notifications from the UI:
1. Click "Test Task Reminder" to see a task reminder notification
2. Click "Test Overdue Alert" to see an overdue alert
3. Click "Test Daily Summary" to see an end-of-day summary
4. Click "Trigger Daily Summary Now" to manually trigger a summary

Run automated tests:
```bash
node electron/tests/NotificationService.test.js
```

## Best Practices

1. **Permission Handling**: Always initialize the notification service before attempting to send notifications
2. **Quiet Hours**: Respect user quiet hours for non-urgent notifications
3. **Queue Management**: The service automatically queues notifications during quiet hours
4. **Error Handling**: Listen for error events to handle notification failures
5. **Settings Persistence**: Settings are automatically saved to disk on changes
6. **Memory Management**: Inbox is limited to 100 items to prevent memory issues

## Troubleshooting

### Notifications not appearing
1. Check that permissions are granted: Look for "Notification permissions granted" in console
2. Verify notification type is enabled in settings
3. Check if currently in quiet hours
4. Ensure system notifications are enabled for the app

### Settings not persisting
1. Check Electron app user data directory exists
2. Verify write permissions to settings file
3. Look for errors in console during save operations

### Timers not firing
1. Verify system time is correct
2. Check that services were properly initialized
3. Look for timer cleanup on app quit

## License

MIT
