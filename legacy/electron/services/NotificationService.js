const { Notification, app } = require('electron');
const EventEmitter = require('events');

/**
 * NotificationService - Manages system notifications with permission handling and fallbacks
 */
class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.permissionGranted = false;
    this.notificationQueue = [];
    this.settings = {
      taskReminders: true,
      overdueAlerts: true,
      endOfDaySummary: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  /**
   * Initialize the notification service and request permissions
   */
  async initialize() {
    try {
      // Check if notifications are supported
      if (!Notification.isSupported()) {
        console.warn('Notifications are not supported on this system');
        this.permissionGranted = false;
        return false;
      }

      // Request notification permission if not already granted
      this.permissionGranted = true; // Electron handles this automatically
      console.log('Notification permissions granted');
      
      // Process any queued notifications
      this.processQueue();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      this.permissionGranted = false;
      return false;
    }
  }

  /**
   * Check if we're in quiet hours
   */
  isQuietHours() {
    if (!this.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const { start, end } = this.settings.quietHours;
    
    // Handle cases where quiet hours span midnight
    if (start > end) {
      return currentTime >= start || currentTime < end;
    } else {
      return currentTime >= start && currentTime < end;
    }
  }

  /**
   * Update notification settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.emit('settingsUpdated', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Send a notification with the specified options
   */
  async sendNotification(options) {
    const { type, title, body, actions, data, urgent } = options;

    // Check if this notification type is enabled
    if (!this.isNotificationTypeEnabled(type)) {
      console.log(`Notification type '${type}' is disabled, skipping`);
      return null;
    }

    // Check quiet hours (unless urgent)
    if (!urgent && this.isQuietHours()) {
      console.log('In quiet hours, queueing notification for later');
      this.queueNotification(options);
      return null;
    }

    // Check permissions
    if (!this.permissionGranted) {
      console.warn('Notification permissions not granted, queueing notification');
      this.queueNotification(options);
      return null;
    }

    try {
      const notification = new Notification({
        title,
        body,
        silent: false,
        urgency: urgent ? 'critical' : 'normal',
        timeoutType: urgent ? 'never' : 'default'
      });

      // Handle notification click
      notification.on('click', () => {
        this.emit('notificationClicked', { type, data });
      });

      // Handle notification close
      notification.on('close', () => {
        this.emit('notificationClosed', { type, data });
      });

      // Handle action buttons (if supported)
      if (actions && actions.length > 0) {
        notification.on('action', (event, index) => {
          this.emit('notificationAction', {
            type,
            action: actions[index],
            data
          });
        });
      }

      notification.show();
      
      this.emit('notificationSent', { type, title, body });
      
      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      this.emit('notificationError', { type, error: error.message });
      return null;
    }
  }

  /**
   * Check if a notification type is enabled in settings
   */
  isNotificationTypeEnabled(type) {
    switch (type) {
      case 'taskReminder':
        return this.settings.taskReminders;
      case 'overdueAlert':
        return this.settings.overdueAlerts;
      case 'endOfDaySummary':
        return this.settings.endOfDaySummary;
      default:
        return true;
    }
  }

  /**
   * Queue a notification for later delivery
   */
  queueNotification(options) {
    this.notificationQueue.push({
      ...options,
      queuedAt: Date.now()
    });
  }

  /**
   * Process queued notifications
   */
  processQueue() {
    if (this.notificationQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.notificationQueue.length} queued notifications`);
    
    const queue = [...this.notificationQueue];
    this.notificationQueue = [];

    queue.forEach(notification => {
      // Remove queuedAt property before sending
      const { queuedAt, ...options } = notification;
      this.sendNotification(options);
    });
  }

  /**
   * Clear all queued notifications
   */
  clearQueue() {
    const count = this.notificationQueue.length;
    this.notificationQueue = [];
    console.log(`Cleared ${count} queued notifications`);
  }

  /**
   * Send a task reminder notification
   */
  async sendTaskReminder(task) {
    return this.sendNotification({
      type: 'taskReminder',
      title: 'Task Reminder',
      body: `Time to start: ${task.title}`,
      actions: [
        { type: 'startNow', text: 'Start Now' },
        { type: 'snooze', text: 'Snooze 5 min' }
      ],
      data: { taskId: task.id, task },
      urgent: false
    });
  }

  /**
   * Send an overdue alert notification
   */
  async sendOverdueAlert(task, minutesOverdue) {
    return this.sendNotification({
      type: 'overdueAlert',
      title: 'Task Overdue',
      body: `"${task.title}" is ${minutesOverdue} minutes overdue`,
      actions: [
        { type: 'extend', text: 'Extend Time' },
        { type: 'complete', text: 'Mark Complete' }
      ],
      data: { taskId: task.id, task, minutesOverdue },
      urgent: true
    });
  }

  /**
   * Send an end-of-day summary notification
   */
  async sendEndOfDaySummary(summary) {
    const { tasksCompleted, focusTime, streak, pendingRollovers } = summary;
    
    let body = `✓ ${tasksCompleted} tasks completed\n`;
    body += `⏱ ${focusTime} minutes of focus time\n`;
    body += `🔥 ${streak} day streak\n`;
    
    if (pendingRollovers > 0) {
      body += `📌 ${pendingRollovers} tasks to roll over`;
    }

    return this.sendNotification({
      type: 'endOfDaySummary',
      title: 'Daily Summary',
      body,
      actions: [
        { type: 'viewDetails', text: 'View Details' },
        { type: 'dismiss', text: 'Dismiss' }
      ],
      data: { summary },
      urgent: false
    });
  }

  /**
   * Send a Pomodoro notification
   */
  async sendPomodoroNotification(pomodoroData) {
    const { type, message, isLongBreak, cycle } = pomodoroData;
    
    let title = '';
    let actions = [];
    
    if (type === 'workComplete') {
      title = '🍅 Work Session Complete!';
      actions = [
        { type: 'startBreak', text: isLongBreak ? 'Start Long Break' : 'Start Break' },
        { type: 'skipBreak', text: 'Skip Break' }
      ];
    } else if (type === 'breakComplete') {
      title = '✨ Break Complete!';
      actions = [
        { type: 'startWork', text: 'Start Work' },
        { type: 'extendBreak', text: 'Extend 5 min' }
      ];
    }

    return this.sendNotification({
      type: 'pomodoro',
      title,
      body: message,
      actions,
      data: { pomodoroData },
      urgent: false
    });
  }

  /**
   * Send a break reminder notification
   */
  async sendBreakReminder(focusMinutes) {
    return this.sendNotification({
      type: 'breakReminder',
      title: '💆 Time for a Break?',
      body: `You've been focused for ${focusMinutes} minutes. Consider taking a short break!`,
      actions: [
        { type: 'startBreak', text: 'Start Break' },
        { type: 'snooze', text: 'Remind Later' },
        { type: 'dismiss', text: 'Keep Working' }
      ],
      data: { focusMinutes },
      urgent: false
    });
  }
}

module.exports = NotificationService;
