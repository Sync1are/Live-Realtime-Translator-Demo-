const EventEmitter = require('events');

/**
 * TaskScheduler - Manages scheduling of task reminders and overdue alerts
 */
class TaskScheduler extends EventEmitter {
  constructor(notificationService) {
    super();
    this.notificationService = notificationService;
    this.scheduledReminders = new Map();
    this.overdueChecks = new Map();
    this.tasks = new Map();
    this.checkInterval = null;
  }

  /**
   * Initialize the task scheduler
   */
  initialize() {
    // Check for overdue tasks every minute
    this.checkInterval = setInterval(() => {
      this.checkOverdueTasks();
    }, 60000); // 1 minute

    console.log('Task scheduler initialized');
  }

  /**
   * Shutdown the scheduler
   */
  shutdown() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Clear all scheduled reminders
    this.scheduledReminders.forEach(timer => clearTimeout(timer));
    this.scheduledReminders.clear();

    // Clear all overdue checks
    this.overdueChecks.forEach(timer => clearInterval(timer));
    this.overdueChecks.clear();

    console.log('Task scheduler shutdown');
  }

  /**
   * Add or update a task in the scheduler
   */
  addTask(task) {
    const { id, title, startTime, endTime, estimatedMinutes, status } = task;

    // Validate task data
    if (!id || !title) {
      console.warn('Invalid task data: missing id or title');
      return;
    }

    // Store task
    this.tasks.set(id, { ...task, addedAt: Date.now() });

    // Schedule reminder if task has a start time
    if (startTime && status !== 'completed') {
      this.scheduleReminder(task);
    }

    // Start monitoring for overdue if task is in progress
    if (status === 'in_progress' && (endTime || estimatedMinutes)) {
      this.scheduleOverdueCheck(task);
    }

    this.emit('taskAdded', task);
  }

  /**
   * Remove a task from the scheduler
   */
  removeTask(taskId) {
    // Cancel scheduled reminder
    if (this.scheduledReminders.has(taskId)) {
      clearTimeout(this.scheduledReminders.get(taskId));
      this.scheduledReminders.delete(taskId);
    }

    // Cancel overdue check
    if (this.overdueChecks.has(taskId)) {
      clearInterval(this.overdueChecks.get(taskId));
      this.overdueChecks.delete(taskId);
    }

    // Remove from tasks map
    this.tasks.delete(taskId);

    this.emit('taskRemoved', taskId);
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId, status) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`Task ${taskId} not found`);
      return;
    }

    task.status = status;
    const taskCopy = { ...task };

    // Emit event before potentially removing the task
    this.emit('taskStatusUpdated', { taskId, status, task: taskCopy });

    // If task is completed, remove all scheduled items
    if (status === 'completed') {
      this.removeTask(taskId);
    }
    // If task started, begin overdue monitoring
    else if (status === 'in_progress') {
      this.scheduleOverdueCheck(task);
    }
  }

  /**
   * Schedule a reminder for a task
   */
  scheduleReminder(task) {
    const { id, startTime } = task;

    // Cancel existing reminder if any
    if (this.scheduledReminders.has(id)) {
      clearTimeout(this.scheduledReminders.get(id));
    }

    // Parse start time
    const reminderTime = new Date(startTime);
    const now = new Date();

    // Calculate delay (remind 5 minutes before start time)
    const delay = reminderTime.getTime() - now.getTime() - (5 * 60 * 1000);

    if (delay <= 0) {
      // Start time has passed or is within 5 minutes
      console.log(`Task ${id} start time is imminent or passed`);
      return;
    }

    // Schedule the reminder
    const timer = setTimeout(() => {
      this.sendReminderNotification(task);
      this.scheduledReminders.delete(id);
    }, delay);

    this.scheduledReminders.set(id, timer);
    console.log(`Scheduled reminder for task ${id} in ${Math.round(delay / 1000 / 60)} minutes`);
  }

  /**
   * Schedule overdue check for a task
   */
  scheduleOverdueCheck(task) {
    const { id, endTime, estimatedMinutes } = task;

    // Cancel existing check if any
    if (this.overdueChecks.has(id)) {
      clearInterval(this.overdueChecks.get(id));
    }

    let deadline;
    if (endTime) {
      deadline = new Date(endTime);
    } else if (estimatedMinutes) {
      // Use current time + estimated minutes as deadline
      deadline = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    } else {
      console.warn(`Task ${id} has no end time or estimated duration`);
      return;
    }

    // Check every minute for overdue status
    const checkTimer = setInterval(() => {
      const now = new Date();
      if (now > deadline) {
        const minutesOverdue = Math.floor((now - deadline) / 1000 / 60);
        this.sendOverdueNotification(task, minutesOverdue);
      }
    }, 60000); // Check every minute

    this.overdueChecks.set(id, checkTimer);
    console.log(`Scheduled overdue check for task ${id}`);
  }

  /**
   * Check all tasks for overdue status
   */
  checkOverdueTasks() {
    const now = new Date();

    this.tasks.forEach(task => {
      if (task.status !== 'in_progress') {
        return;
      }

      let deadline;
      if (task.endTime) {
        deadline = new Date(task.endTime);
      } else if (task.estimatedMinutes) {
        // Calculate deadline based on when task was marked in progress
        // For simplicity, using addedAt timestamp
        deadline = new Date(task.addedAt + task.estimatedMinutes * 60 * 1000);
      } else {
        return;
      }

      if (now > deadline) {
        const minutesOverdue = Math.floor((now - deadline) / 1000 / 60);
        
        // Only alert every 15 minutes to avoid spam
        const lastAlert = task.lastOverdueAlert || 0;
        if (now.getTime() - lastAlert >= 15 * 60 * 1000) {
          this.sendOverdueNotification(task, minutesOverdue);
          task.lastOverdueAlert = now.getTime();
        }
      }
    });
  }

  /**
   * Send a reminder notification for a task
   */
  async sendReminderNotification(task) {
    try {
      await this.notificationService.sendTaskReminder(task);
      this.emit('reminderSent', task);
    } catch (error) {
      console.error('Failed to send reminder notification:', error);
      this.emit('reminderError', { task, error: error.message });
    }
  }

  /**
   * Send an overdue notification for a task
   */
  async sendOverdueNotification(task, minutesOverdue) {
    try {
      await this.notificationService.sendOverdueAlert(task, minutesOverdue);
      this.emit('overdueSent', { task, minutesOverdue });
    } catch (error) {
      console.error('Failed to send overdue notification:', error);
      this.emit('overdueError', { task, error: error.message });
    }
  }

  /**
   * Get all scheduled tasks
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Get a specific task
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }
}

module.exports = TaskScheduler;
