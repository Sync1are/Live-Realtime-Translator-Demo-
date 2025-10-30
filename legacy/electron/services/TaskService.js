const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * TaskService - Manages tasks with full CRUD operations and time tracking
 */
class TaskService extends EventEmitter {
  constructor(timerService) {
    super();
    this.timerService = timerService;
    this.tasks = new Map();
    this.timeLogs = new Map(); // taskId -> array of time log entries
    this.activeTaskId = null;
    this.activeTaskStartTime = null;
    this.activeTaskPausedTime = null;
    this.dataPath = null;
    this.timeLogsPath = null;
  }

  /**
   * Initialize the task service
   */
  async initialize() {
    // Set up data storage paths
    const userDataPath = app.getPath('userData');
    this.dataPath = path.join(userDataPath, 'tasks.json');
    this.timeLogsPath = path.join(userDataPath, 'task-time-logs.json');

    // Load existing tasks and time logs
    await this.loadTasks();
    await this.loadTimeLogs();

    console.log('Task service initialized');
  }

  /**
   * Load tasks from disk
   */
  async loadTasks() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        const tasksArray = JSON.parse(data);
        this.tasks = new Map(tasksArray.map(task => [task.id, task]));
        console.log(`Loaded ${this.tasks.size} tasks`);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      this.tasks = new Map();
    }
  }

  /**
   * Save tasks to disk
   */
  async saveTasks() {
    try {
      const tasksArray = Array.from(this.tasks.values());
      const data = JSON.stringify(tasksArray, null, 2);
      fs.writeFileSync(this.dataPath, data, 'utf8');
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  /**
   * Load time logs from disk
   */
  async loadTimeLogs() {
    try {
      if (fs.existsSync(this.timeLogsPath)) {
        const data = fs.readFileSync(this.timeLogsPath, 'utf8');
        const timeLogsObj = JSON.parse(data);
        this.timeLogs = new Map(Object.entries(timeLogsObj));
        console.log(`Loaded time logs for ${this.timeLogs.size} tasks`);
      }
    } catch (error) {
      console.error('Failed to load time logs:', error);
      this.timeLogs = new Map();
    }
  }

  /**
   * Save time logs to disk
   */
  async saveTimeLogs() {
    try {
      const timeLogsObj = Object.fromEntries(this.timeLogs);
      const data = JSON.stringify(timeLogsObj, null, 2);
      fs.writeFileSync(this.timeLogsPath, data, 'utf8');
    } catch (error) {
      console.error('Failed to save time logs:', error);
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData) {
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title,
      description: taskData.description || '',
      estimatedMinutes: taskData.estimatedMinutes || 0,
      actualMinutes: 0,
      priority: taskData.priority || 'medium', // low, medium, high, urgent
      categories: taskData.categories || [],
      tags: taskData.tags || [],
      status: 'not_started', // not_started, in_progress, paused, completed
      createdDate: new Date().toISOString(),
      startedDate: null,
      completedDate: null,
      isPendingFromYesterday: taskData.isPendingFromYesterday || false,
      scheduledDate: taskData.scheduledDate || null,
      scheduledTimeBlock: taskData.scheduledTimeBlock || null, // { start: "09:00", end: "10:00" }
    };

    this.tasks.set(task.id, task);
    this.timeLogs.set(task.id, []);
    await this.saveTasks();
    await this.saveTimeLogs();

    this.emit('taskCreated', task);
    return task;
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId, updates) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Merge updates
    Object.assign(task, updates);
    await this.saveTasks();

    this.emit('taskUpdated', task);
    return task;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Can't delete active task
    if (this.activeTaskId === taskId) {
      throw new Error('Cannot delete active task. Please stop the timer first.');
    }

    this.tasks.delete(taskId);
    this.timeLogs.delete(taskId);
    await this.saveTasks();
    await this.saveTimeLogs();

    this.emit('taskDeleted', taskId);
    return { success: true };
  }

  /**
   * Get all tasks
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status) {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  /**
   * Get a single task
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * Get tasks by filter
   */
  getTasksFiltered(filters = {}) {
    let tasks = Array.from(this.tasks.values());

    if (filters.status) {
      tasks = tasks.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      tasks = tasks.filter(task => task.priority === filters.priority);
    }

    if (filters.category) {
      tasks = tasks.filter(task => task.categories.includes(filters.category));
    }

    if (filters.tag) {
      tasks = tasks.filter(task => task.tags.includes(filters.tag));
    }

    if (filters.isPendingFromYesterday !== undefined) {
      tasks = tasks.filter(task => task.isPendingFromYesterday === filters.isPendingFromYesterday);
    }

    if (filters.scheduledDate) {
      tasks = tasks.filter(task => task.scheduledDate === filters.scheduledDate);
    }

    return tasks;
  }

  /**
   * Start timer for a task
   */
  async startTimer(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Stop any currently active task
    if (this.activeTaskId && this.activeTaskId !== taskId) {
      await this.pauseTimer();
    }

    // Update task status
    if (task.status === 'not_started') {
      task.startedDate = new Date().toISOString();
    }
    task.status = 'in_progress';

    this.activeTaskId = taskId;
    this.activeTaskStartTime = Date.now();
    this.activeTaskPausedTime = null;

    await this.saveTasks();

    // Start timer service focus session
    this.timerService.startFocusSession(taskId, false);

    this.emit('timerStarted', { taskId, task });
    return task;
  }

  /**
   * Pause timer for active task
   */
  async pauseTimer() {
    if (!this.activeTaskId) {
      throw new Error('No active task timer');
    }

    const task = this.tasks.get(this.activeTaskId);
    if (!task) {
      throw new Error('Active task not found');
    }

    // Calculate elapsed time for this session
    const elapsedMinutes = Math.round((Date.now() - this.activeTaskStartTime) / 1000 / 60);

    // Add time log entry
    const timeLog = {
      id: `log-${Date.now()}`,
      startTime: new Date(this.activeTaskStartTime).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: elapsedMinutes,
    };

    const logs = this.timeLogs.get(this.activeTaskId) || [];
    logs.push(timeLog);
    this.timeLogs.set(this.activeTaskId, logs);

    // Update task actual time
    task.actualMinutes += elapsedMinutes;
    task.status = 'paused';

    const pausedTaskId = this.activeTaskId;
    this.activeTaskId = null;
    this.activeTaskStartTime = null;
    this.activeTaskPausedTime = Date.now();

    await this.saveTasks();
    await this.saveTimeLogs();

    // End timer service focus session
    this.timerService.endCurrentSession();

    this.emit('timerPaused', { taskId: pausedTaskId, task, timeLog });
    return task;
  }

  /**
   * Resume timer for a paused task
   */
  async resumeTimer(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'paused') {
      throw new Error('Task is not paused');
    }

    // Stop any currently active task
    if (this.activeTaskId && this.activeTaskId !== taskId) {
      await this.pauseTimer();
    }

    task.status = 'in_progress';
    this.activeTaskId = taskId;
    this.activeTaskStartTime = Date.now();
    this.activeTaskPausedTime = null;

    await this.saveTasks();

    // Start timer service focus session
    this.timerService.startFocusSession(taskId, false);

    this.emit('timerResumed', { taskId, task });
    return task;
  }

  /**
   * Complete a task
   */
  async completeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // If timer is running, pause it first
    if (this.activeTaskId === taskId) {
      await this.pauseTimer();
    }

    task.status = 'completed';
    task.completedDate = new Date().toISOString();

    await this.saveTasks();

    this.emit('taskCompleted', task);
    return task;
  }

  /**
   * Get active task
   */
  getActiveTask() {
    if (!this.activeTaskId) {
      return null;
    }

    const task = this.tasks.get(this.activeTaskId);
    if (!task) {
      return null;
    }

    // Calculate current elapsed time if timer is running
    let currentElapsedMinutes = 0;
    if (this.activeTaskStartTime) {
      currentElapsedMinutes = Math.round((Date.now() - this.activeTaskStartTime) / 1000 / 60);
    }

    return {
      ...task,
      currentSessionMinutes: currentElapsedMinutes,
      totalMinutesWithCurrent: task.actualMinutes + currentElapsedMinutes,
    };
  }

  /**
   * Get time logs for a task
   */
  getTimeLogs(taskId) {
    return this.timeLogs.get(taskId) || [];
  }

  /**
   * Get all categories used across tasks
   */
  getAllCategories() {
    const categories = new Set();
    this.tasks.forEach(task => {
      task.categories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }

  /**
   * Get all tags used across tasks
   */
  getAllTags() {
    const tags = new Set();
    this.tasks.forEach(task => {
      task.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Mark tasks as rollover (pending from yesterday)
   */
  async markRollovers() {
    const today = new Date().toISOString().split('T')[0];
    let updated = 0;

    this.tasks.forEach(task => {
      // If task is not completed and was created before today, mark as rollover
      if (task.status !== 'completed') {
        const taskDate = task.createdDate.split('T')[0];
        if (taskDate < today && !task.isPendingFromYesterday) {
          task.isPendingFromYesterday = true;
          updated++;
        }
      }
    });

    if (updated > 0) {
      await this.saveTasks();
      this.emit('rolloversMarked', { count: updated });
    }

    return updated;
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    // Pause any active timer
    if (this.activeTaskId) {
      await this.pauseTimer();
    }

    console.log('Task service shutdown');
  }
}

module.exports = TaskService;
