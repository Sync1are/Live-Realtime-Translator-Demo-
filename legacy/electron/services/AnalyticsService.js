const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * AnalyticsService - Provides analytics data for dashboards
 */
class AnalyticsService extends EventEmitter {
  constructor(timerService, taskScheduler, endOfDayService) {
    super();
    this.timerService = timerService;
    this.taskScheduler = taskScheduler;
    this.endOfDayService = endOfDayService;
    this.dataPath = null;
    this.taskHistory = [];
    this.dailyGoals = {
      focusTimeMinutes: 240, // 4 hours default
      tasksCount: 5
    };
  }

  /**
   * Initialize the analytics service
   */
  async initialize() {
    const userDataPath = app.getPath('userData');
    this.dataPath = path.join(userDataPath, 'task-history.json');
    
    await this.loadTaskHistory();
    console.log('Analytics service initialized');
  }

  /**
   * Load task history from disk
   */
  async loadTaskHistory() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        this.taskHistory = JSON.parse(data);
        console.log(`Loaded ${this.taskHistory.length} historical tasks`);
      }
    } catch (error) {
      console.error('Failed to load task history:', error);
      this.taskHistory = [];
    }
  }

  /**
   * Save task history to disk
   */
  async saveTaskHistory() {
    try {
      const data = JSON.stringify(this.taskHistory, null, 2);
      fs.writeFileSync(this.dataPath, data, 'utf8');
    } catch (error) {
      console.error('Failed to save task history:', error);
    }
  }

  /**
   * Record a completed task
   */
  async recordCompletedTask(task) {
    const historyEntry = {
      ...task,
      completedAt: Date.now(),
      completedDate: new Date().toISOString().split('T')[0]
    };
    
    this.taskHistory.push(historyEntry);
    await this.saveTaskHistory();
    this.emit('taskRecorded', historyEntry);
  }

  /**
   * Get daily dashboard data
   */
  getDailyDashboard(date = null) {
    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Get start and end of day
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).getTime();

    // Get current tasks grouped by status
    const allTasks = this.taskScheduler.getAllTasks();
    const todayTasks = {
      pending: [],
      in_progress: [],
      completed: []
    };

    allTasks.forEach(task => {
      if (task.status && todayTasks[task.status]) {
        todayTasks[task.status].push(task);
      }
    });

    // Add completed tasks from history for the day
    const completedFromHistory = this.taskHistory.filter(t => 
      t.completedDate === dateStr
    );
    todayTasks.completed = [...todayTasks.completed, ...completedFromHistory];

    // Get focus/break data
    const timerAnalytics = this.timerService.getAnalytics(startOfDay, endOfDay);
    
    // Calculate goal progress
    const focusTimeProgress = (timerAnalytics.focusSessions.totalMinutes / this.dailyGoals.focusTimeMinutes) * 100;
    const tasksProgress = (todayTasks.completed.length / this.dailyGoals.tasksCount) * 100;

    return {
      date: dateStr,
      tasks: todayTasks,
      totalTimeWorked: timerAnalytics.focusSessions.totalMinutes,
      totalBreakTime: timerAnalytics.breakSessions.totalMinutes,
      focusBreakRatio: timerAnalytics.focusBreakRatio,
      completedCount: todayTasks.completed.length,
      goals: {
        focusTime: {
          current: timerAnalytics.focusSessions.totalMinutes,
          target: this.dailyGoals.focusTimeMinutes,
          progress: Math.min(focusTimeProgress, 100)
        },
        tasks: {
          current: todayTasks.completed.length,
          target: this.dailyGoals.tasksCount,
          progress: Math.min(tasksProgress, 100)
        }
      }
    };
  }

  /**
   * Get weekly dashboard data
   */
  getWeeklyDashboard(weekStartDate = null) {
    const targetDate = weekStartDate ? new Date(weekStartDate) : new Date();
    
    // Get start of week (Monday)
    const dayOfWeek = targetDate.getDay();
    const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(targetDate.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const weekStart = monday.getTime();
    const weekEnd = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1).getTime();

    // Get timer analytics for the week
    const timerAnalytics = this.timerService.getAnalytics(weekStart, weekEnd);
    
    // Get completed tasks for the week
    const weekStartStr = new Date(weekStart).toISOString().split('T')[0];
    const weekEndStr = new Date(weekEnd).toISOString().split('T')[0];
    
    const completedTasks = this.taskHistory.filter(t => {
      return t.completedDate >= weekStartStr && t.completedDate <= weekEndStr;
    });

    // Calculate daily breakdown
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart + i * 24 * 60 * 60 * 1000);
      const dayStr = dayDate.toISOString().split('T')[0];
      const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
      
      const dayStart = dayDate.getTime();
      const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999)).getTime();
      
      const dayAnalytics = this.timerService.getAnalytics(dayStart, dayEnd);
      const dayCompletedTasks = completedTasks.filter(t => t.completedDate === dayStr);
      
      dailyData.push({
        date: dayStr,
        dayName,
        focusTime: dayAnalytics.focusSessions.totalMinutes,
        breakTime: dayAnalytics.breakSessions.totalMinutes,
        tasksCompleted: dayCompletedTasks.length,
        productiveHours: (dayAnalytics.focusSessions.totalMinutes / 60).toFixed(1)
      });
    }

    // Find most productive day
    const mostProductiveDay = dailyData.reduce((max, day) => 
      day.focusTime > max.focusTime ? day : max, dailyData[0]
    );

    // Calculate task categories (if tasks have category property)
    const categoryBreakdown = {};
    completedTasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          count: 0,
          focusTime: 0
        };
      }
      categoryBreakdown[category].count++;
    });

    // Get all sessions for the week to calculate time per category
    const allSessions = this.timerService.getHistory(1000, 0);
    const weekSessions = allSessions.filter(s => 
      s.startTime >= weekStart && s.startTime <= weekEnd && s.type === 'focus'
    );

    // Group focus time by task category
    weekSessions.forEach(session => {
      if (session.taskId) {
        const task = completedTasks.find(t => t.id === session.taskId);
        if (task) {
          const category = task.category || 'Uncategorized';
          if (categoryBreakdown[category]) {
            categoryBreakdown[category].focusTime += session.durationMinutes;
          }
        }
      }
    });

    // Calculate streak (consecutive days with completed tasks)
    let currentStreak = 0;
    for (let i = dailyData.length - 1; i >= 0; i--) {
      if (dailyData[i].tasksCompleted > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      weekStart: new Date(weekStart).toISOString().split('T')[0],
      weekEnd: new Date(weekEnd).toISOString().split('T')[0],
      tasksCompleted: completedTasks.length,
      totalProductiveHours: (timerAnalytics.focusSessions.totalMinutes / 60).toFixed(1),
      averageCompletionRate: (completedTasks.length / 7).toFixed(1),
      weeklyStreak: currentStreak,
      mostProductiveDay: mostProductiveDay,
      dailyData: dailyData,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]) => ({
        name,
        count: data.count,
        focusTime: data.focusTime,
        percentage: completedTasks.length > 0 
          ? ((data.count / completedTasks.length) * 100).toFixed(1) 
          : 0
      }))
    };
  }

  /**
   * Set daily goals
   */
  setDailyGoals(goals) {
    this.dailyGoals = { ...this.dailyGoals, ...goals };
    this.emit('goalsUpdated', this.dailyGoals);
  }

  /**
   * Get daily goals
   */
  getDailyGoals() {
    return { ...this.dailyGoals };
  }
}

module.exports = AnalyticsService;
