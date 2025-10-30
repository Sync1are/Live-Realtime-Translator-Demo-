# Notification Engine API Documentation

## Table of Contents

1. [NotificationService](#notificationservice)
2. [TaskScheduler](#taskscheduler)
3. [EndOfDayService](#endofdayservice)
4. [SettingsManager](#settingsmanager)
5. [InboxManager](#inboxmanager)
6. [IPC API](#ipc-api)

---

## NotificationService

Core service for managing system notifications.

### Constructor

```javascript
const notificationService = new NotificationService();
```

### Methods

#### `initialize()`
Initialize the notification service and request permissions.

**Returns:** `Promise<boolean>` - True if successful

```javascript
const success = await notificationService.initialize();
```

#### `updateSettings(newSettings)`
Update notification settings.

**Parameters:**
- `newSettings` (Object): Settings to update

```javascript
notificationService.updateSettings({
  taskReminders: true,
  overdueAlerts: false,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
});
```

#### `getSettings()`
Get current notification settings.

**Returns:** `Object` - Current settings

```javascript
const settings = notificationService.getSettings();
```

#### `sendNotification(options)`
Send a notification.

**Parameters:**
- `options.type` (string): Notification type ('taskReminder', 'overdueAlert', 'endOfDaySummary')
- `options.title` (string): Notification title
- `options.body` (string): Notification body text
- `options.actions` (Array): Action buttons (optional)
- `options.data` (Object): Custom data (optional)
- `options.urgent` (boolean): Mark as urgent (optional)

**Returns:** `Promise<Notification|null>`

```javascript
await notificationService.sendNotification({
  type: 'taskReminder',
  title: 'Task Reminder',
  body: 'Time to start your task',
  actions: [
    { type: 'startNow', text: 'Start Now' }
  ],
  data: { taskId: 'task-1' },
  urgent: false
});
```

#### `sendTaskReminder(task)`
Send a task reminder notification.

**Parameters:**
- `task` (Object): Task object with `id` and `title`

**Returns:** `Promise<Notification|null>`

```javascript
await notificationService.sendTaskReminder({
  id: 'task-1',
  title: 'Review documents'
});
```

#### `sendOverdueAlert(task, minutesOverdue)`
Send an overdue alert notification.

**Parameters:**
- `task` (Object): Task object
- `minutesOverdue` (number): Minutes overdue

**Returns:** `Promise<Notification|null>`

```javascript
await notificationService.sendOverdueAlert(task, 15);
```

#### `sendEndOfDaySummary(summary)`
Send end-of-day summary notification.

**Parameters:**
- `summary` (Object): Summary data

```javascript
await notificationService.sendEndOfDaySummary({
  tasksCompleted: 5,
  focusTime: 120,
  streak: 7,
  pendingRollovers: 2
});
```

#### `isQuietHours()`
Check if currently in quiet hours.

**Returns:** `boolean`

```javascript
const isQuiet = notificationService.isQuietHours();
```

#### `clearQueue()`
Clear all queued notifications.

```javascript
notificationService.clearQueue();
```

### Events

- `notificationSent` - Fired when notification is sent
- `notificationClicked` - Fired when notification is clicked
- `notificationAction` - Fired when action button is clicked
- `notificationError` - Fired on error
- `settingsUpdated` - Fired when settings change

```javascript
notificationService.on('notificationClicked', ({ type, data }) => {
  console.log('Clicked:', type, data);
});
```

---

## TaskScheduler

Manages scheduling of task reminders and overdue checks.

### Constructor

```javascript
const taskScheduler = new TaskScheduler(notificationService);
```

**Parameters:**
- `notificationService` (NotificationService): Notification service instance

### Methods

#### `initialize()`
Initialize the task scheduler.

```javascript
taskScheduler.initialize();
```

#### `shutdown()`
Shutdown the scheduler and clear all timers.

```javascript
taskScheduler.shutdown();
```

#### `addTask(task)`
Add or update a task in the scheduler.

**Parameters:**
- `task` (Object): Task object

**Task Object Structure:**
```javascript
{
  id: 'task-1',                    // Required: Unique task ID
  title: 'Review documents',       // Required: Task title
  startTime: '2024-01-15T14:00:00Z', // ISO 8601 timestamp
  endTime: '2024-01-15T15:00:00Z',   // ISO 8601 timestamp
  estimatedMinutes: 60,            // Estimated duration
  status: 'pending'                // 'pending', 'in_progress', 'completed'
}
```

```javascript
taskScheduler.addTask({
  id: 'task-1',
  title: 'Complete report',
  startTime: new Date(Date.now() + 3600000).toISOString(),
  estimatedMinutes: 60,
  status: 'pending'
});
```

#### `removeTask(taskId)`
Remove a task from the scheduler.

**Parameters:**
- `taskId` (string): Task ID

```javascript
taskScheduler.removeTask('task-1');
```

#### `updateTaskStatus(taskId, status)`
Update task status.

**Parameters:**
- `taskId` (string): Task ID
- `status` (string): New status ('pending', 'in_progress', 'completed')

```javascript
taskScheduler.updateTaskStatus('task-1', 'in_progress');
```

#### `getAllTasks()`
Get all scheduled tasks.

**Returns:** `Array<Object>` - Array of task objects

```javascript
const tasks = taskScheduler.getAllTasks();
```

#### `getTask(taskId)`
Get a specific task.

**Parameters:**
- `taskId` (string): Task ID

**Returns:** `Object|undefined` - Task object or undefined

```javascript
const task = taskScheduler.getTask('task-1');
```

### Events

- `taskAdded` - Task added to scheduler
- `taskRemoved` - Task removed
- `taskStatusUpdated` - Task status changed
- `reminderSent` - Reminder sent for task
- `overdueSent` - Overdue alert sent
- `reminderError` - Error sending reminder
- `overdueError` - Error sending overdue alert

```javascript
taskScheduler.on('reminderSent', (task) => {
  console.log('Reminder sent for:', task.title);
});
```

---

## EndOfDayService

Manages end-of-day summary notifications.

### Constructor

```javascript
const endOfDayService = new EndOfDayService(notificationService);
```

**Parameters:**
- `notificationService` (NotificationService): Notification service instance

### Methods

#### `initialize(config)`
Initialize the end-of-day service.

**Parameters:**
- `config` (Object): Configuration options
  - `summaryTime` (string): Time in HH:mm format (default: '18:00')

```javascript
endOfDayService.initialize({
  summaryTime: '18:00'
});
```

#### `shutdown()`
Shutdown the service.

```javascript
endOfDayService.shutdown();
```

#### `updateSummaryTime(newTime)`
Update the summary time.

**Parameters:**
- `newTime` (string): Time in HH:mm format

```javascript
endOfDayService.updateSummaryTime('17:30');
```

#### `updateDailyStats(stats)`
Update daily statistics.

**Parameters:**
- `stats` (Object): Statistics to update

```javascript
endOfDayService.updateDailyStats({
  tasksCompleted: 5,
  focusTime: 120
});
```

#### `incrementTasksCompleted()`
Increment the tasks completed counter.

```javascript
endOfDayService.incrementTasksCompleted();
```

#### `addFocusTime(minutes)`
Add focus time.

**Parameters:**
- `minutes` (number): Minutes to add

```javascript
endOfDayService.addFocusTime(30);
```

#### `updateStreak(days)`
Update streak count.

**Parameters:**
- `days` (number): Streak in days

```javascript
endOfDayService.updateStreak(5);
```

#### `setPendingRollovers(count)`
Set pending rollovers count.

**Parameters:**
- `count` (number): Number of pending rollovers

```javascript
endOfDayService.setPendingRollovers(2);
```

#### `getDailyStats()`
Get current daily statistics.

**Returns:** `Object` - Daily statistics

```javascript
const stats = endOfDayService.getDailyStats();
// { tasksCompleted: 5, focusTime: 120, streak: 7, pendingRollovers: 2 }
```

#### `resetDailyStats()`
Reset daily statistics (preserves streak).

```javascript
endOfDayService.resetDailyStats();
```

#### `triggerSummary()`
Manually trigger a summary.

```javascript
await endOfDayService.triggerSummary();
```

#### `calculateProductivityScore()`
Calculate productivity score (0-100).

**Returns:** `number` - Productivity score

```javascript
const score = endOfDayService.calculateProductivityScore();
```

#### `generateDetailedReport()`
Generate detailed report with all metrics.

**Returns:** `Object` - Detailed report

```javascript
const report = endOfDayService.generateDetailedReport();
```

### Events

- `summarySent` - Summary sent
- `inboxEntryCreated` - Entry added to inbox
- `summaryError` - Error sending summary
- `dailyStatsReset` - Daily stats reset
- `summaryTimeUpdated` - Summary time changed

---

## SettingsManager

Manages notification preferences and settings.

### Constructor

```javascript
const settingsManager = new SettingsManager();
```

### Methods

#### `initialize()`
Initialize settings manager and load settings.

**Returns:** `Promise<void>`

```javascript
await settingsManager.initialize();
```

#### `getAll()`
Get all settings.

**Returns:** `Object` - All settings

```javascript
const settings = settingsManager.getAll();
```

#### `getNotificationSettings()`
Get notification settings only.

**Returns:** `Object` - Notification settings

```javascript
const notifSettings = settingsManager.getNotificationSettings();
```

#### `updateNotificationSettings(updates)`
Update notification settings.

**Parameters:**
- `updates` (Object): Settings to update

**Returns:** `Promise<void>`

```javascript
await settingsManager.updateNotificationSettings({
  taskReminders: true,
  overdueAlerts: false
});
```

#### `setTaskReminders(enabled)`
Enable/disable task reminders.

**Parameters:**
- `enabled` (boolean)

**Returns:** `Promise<void>`

```javascript
await settingsManager.setTaskReminders(true);
```

#### `setOverdueAlerts(enabled)`
Enable/disable overdue alerts.

**Parameters:**
- `enabled` (boolean)

**Returns:** `Promise<void>`

```javascript
await settingsManager.setOverdueAlerts(true);
```

#### `setEndOfDaySummary(enabled)`
Enable/disable end-of-day summary.

**Parameters:**
- `enabled` (boolean)

**Returns:** `Promise<void>`

```javascript
await settingsManager.setEndOfDaySummary(true);
```

#### `setQuietHours(config)`
Configure quiet hours.

**Parameters:**
- `config` (Object):
  - `enabled` (boolean)
  - `start` (string): Time in HH:mm format
  - `end` (string): Time in HH:mm format

**Returns:** `Promise<void>`

```javascript
await settingsManager.setQuietHours({
  enabled: true,
  start: '22:00',
  end: '08:00'
});
```

#### `setEndOfDayTime(time)`
Set end-of-day summary time.

**Parameters:**
- `time` (string): Time in HH:mm format

**Returns:** `Promise<void>`

```javascript
await settingsManager.setEndOfDayTime('18:00');
```

#### `reset()`
Reset to default settings.

**Returns:** `Promise<void>`

```javascript
await settingsManager.reset();
```

#### `exportSettings()`
Export settings as JSON string.

**Returns:** `string` - JSON string

```javascript
const json = settingsManager.exportSettings();
```

#### `importSettings(jsonString)`
Import settings from JSON string.

**Parameters:**
- `jsonString` (string): JSON settings

**Returns:** `Promise<void>`

```javascript
await settingsManager.importSettings(jsonString);
```

### Events

- `notificationSettingsUpdated` - Notification settings changed
- `taskRemindersChanged` - Task reminders toggled
- `overdueAlertsChanged` - Overdue alerts toggled
- `endOfDaySummaryChanged` - EOD summary toggled
- `quietHoursChanged` - Quiet hours changed
- `settingsReset` - Settings reset to defaults
- `settingsImported` - Settings imported

---

## InboxManager

Manages in-app notification inbox.

### Constructor

```javascript
const inboxManager = new InboxManager();
```

### Methods

#### `initialize()`
Initialize inbox manager.

**Returns:** `Promise<void>`

```javascript
await inboxManager.initialize();
```

#### `addItem(item)`
Add item to inbox.

**Parameters:**
- `item` (Object): Inbox item

**Returns:** `Promise<Object>` - Created inbox item

```javascript
await inboxManager.addItem({
  type: 'dailySummary',
  data: { tasksCompleted: 5 }
});
```

#### `getAllItems()`
Get all inbox items.

**Returns:** `Array<Object>` - Inbox items

```javascript
const items = inboxManager.getAllItems();
```

#### `getUnreadCount()`
Get unread items count.

**Returns:** `number` - Unread count

```javascript
const count = inboxManager.getUnreadCount();
```

#### `getItem(itemId)`
Get specific item.

**Parameters:**
- `itemId` (string): Item ID

**Returns:** `Object|undefined` - Inbox item

```javascript
const item = inboxManager.getItem('item-id');
```

#### `markAsRead(itemId)`
Mark item as read.

**Parameters:**
- `itemId` (string): Item ID

**Returns:** `Promise<void>`

```javascript
await inboxManager.markAsRead('item-id');
```

#### `markAllAsRead()`
Mark all items as read.

**Returns:** `Promise<void>`

```javascript
await inboxManager.markAllAsRead();
```

#### `deleteItem(itemId)`
Delete an item.

**Parameters:**
- `itemId` (string): Item ID

**Returns:** `Promise<void>`

```javascript
await inboxManager.deleteItem('item-id');
```

#### `clearAll()`
Clear all inbox items.

**Returns:** `Promise<void>`

```javascript
await inboxManager.clearAll();
```

#### `filterByType(type)`
Filter items by type.

**Parameters:**
- `type` (string): Item type

**Returns:** `Array<Object>` - Filtered items

```javascript
const summaries = inboxManager.filterByType('dailySummary');
```

#### `getRecentItems(days)`
Get items from last N days.

**Parameters:**
- `days` (number): Number of days (default: 7)

**Returns:** `Array<Object>` - Recent items

```javascript
const recent = inboxManager.getRecentItems(7);
```

#### `search(query)`
Search inbox items.

**Parameters:**
- `query` (string): Search query

**Returns:** `Array<Object>` - Matching items

```javascript
const results = inboxManager.search('completed');
```

### Events

- `itemAdded` - Item added to inbox
- `itemMarkedRead` - Item marked as read
- `allMarkedRead` - All items marked as read
- `itemDeleted` - Item deleted
- `inboxCleared` - Inbox cleared

---

## IPC API

API exposed to renderer process via `preload.js`.

### Task Management

```javascript
// Add task
await window.notificationAPI.addTask({
  id: 'task-1',
  title: 'Complete report',
  startTime: new Date().toISOString(),
  status: 'pending'
});

// Remove task
await window.notificationAPI.removeTask('task-1');

// Update task status
await window.notificationAPI.updateTaskStatus('task-1', 'in_progress');

// Get all tasks
const tasks = await window.notificationAPI.getAllTasks();
```

### Settings

```javascript
// Get all settings
const settings = await window.notificationAPI.getSettings();

// Update notification settings
await window.notificationAPI.updateNotificationSettings({
  taskReminders: true
});

// Toggle specific settings
await window.notificationAPI.setTaskReminders(true);
await window.notificationAPI.setOverdueAlerts(true);
await window.notificationAPI.setEndOfDaySummary(true);

// Configure quiet hours
await window.notificationAPI.setQuietHours({
  enabled: true,
  start: '22:00',
  end: '08:00'
});

// Set EOD summary time
await window.notificationAPI.setEndOfDayTime('18:00');
```

### Daily Stats

```javascript
// Get daily stats
const stats = await window.notificationAPI.getDailyStats();

// Update daily stats
await window.notificationAPI.updateDailyStats({
  tasksCompleted: 5,
  focusTime: 120
});

// Trigger summary manually
await window.notificationAPI.triggerSummary();
```

### Inbox

```javascript
// Get inbox items
const items = await window.notificationAPI.getInboxItems();

// Get unread count
const count = await window.notificationAPI.getUnreadCount();

// Mark as read
await window.notificationAPI.markAsRead('item-id');
await window.notificationAPI.markAllAsRead();

// Delete item
await window.notificationAPI.deleteInboxItem('item-id');
```

### Testing

```javascript
// Test notifications
await window.notificationAPI.testNotification('reminder');
await window.notificationAPI.testNotification('overdue');
await window.notificationAPI.testNotification('summary');
```

### Event Listeners

```javascript
// Listen for notification clicks
window.notificationAPI.onNotificationClicked((data) => {
  console.log('Notification clicked:', data);
});

// Listen for task actions
window.notificationAPI.onTaskAction((data) => {
  console.log('Task action:', data);
});

// Listen for show details events
window.notificationAPI.onShowDetails((data) => {
  console.log('Show details:', data);
});
```
