const EventEmitter = require('events');

/**
 * EndOfDayService - Manages end-of-day summary notifications
 */
class EndOfDayService extends EventEmitter {
  constructor(notificationService) {
    super();
    this.notificationService = notificationService;
    this.scheduledSummary = null;
    this.summaryTime = '18:00'; // 6:00 PM default
    this.dailyStats = {
      tasksCompleted: 0,
      focusTime: 0,
      streak: 0,
      pendingRollovers: 0
    };
  }

  /**
   * Initialize the end-of-day service
   */
  initialize(config = {}) {
    const { summaryTime } = config;
    
    if (summaryTime) {
      this.summaryTime = summaryTime;
    }

    this.scheduleDailySummary();
    console.log(`End-of-day service initialized (summary at ${this.summaryTime})`);
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    if (this.scheduledSummary) {
      clearTimeout(this.scheduledSummary);
      this.scheduledSummary = null;
    }
    console.log('End-of-day service shutdown');
  }

  /**
   * Schedule the daily summary notification
   */
  scheduleDailySummary() {
    // Cancel existing schedule if any
    if (this.scheduledSummary) {
      clearTimeout(this.scheduledSummary);
    }

    const now = new Date();
    const [hours, minutes] = this.summaryTime.split(':').map(Number);
    
    // Create target time for today
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);

    // If target time has passed today, schedule for tomorrow
    if (now >= targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const delay = targetTime.getTime() - now.getTime();

    this.scheduledSummary = setTimeout(() => {
      this.sendDailySummary();
      // Reschedule for next day
      this.scheduleDailySummary();
    }, delay);

    const hoursUntil = Math.floor(delay / 1000 / 60 / 60);
    const minutesUntil = Math.floor((delay / 1000 / 60) % 60);
    console.log(`Daily summary scheduled in ${hoursUntil}h ${minutesUntil}m`);
  }

  /**
   * Update the summary time
   */
  updateSummaryTime(newTime) {
    this.summaryTime = newTime;
    this.scheduleDailySummary();
    this.emit('summaryTimeUpdated', newTime);
  }

  /**
   * Update daily statistics
   */
  updateDailyStats(stats) {
    this.dailyStats = { ...this.dailyStats, ...stats };
  }

  /**
   * Increment tasks completed counter
   */
  incrementTasksCompleted() {
    this.dailyStats.tasksCompleted++;
  }

  /**
   * Add focus time (in minutes)
   */
  addFocusTime(minutes) {
    this.dailyStats.focusTime += minutes;
  }

  /**
   * Update streak count
   */
  updateStreak(days) {
    this.dailyStats.streak = days;
  }

  /**
   * Set pending rollovers count
   */
  setPendingRollovers(count) {
    this.dailyStats.pendingRollovers = count;
  }

  /**
   * Get current daily statistics
   */
  getDailyStats() {
    return { ...this.dailyStats };
  }

  /**
   * Reset daily statistics (typically called at start of new day)
   */
  resetDailyStats() {
    this.dailyStats = {
      tasksCompleted: 0,
      focusTime: 0,
      streak: this.dailyStats.streak, // Preserve streak
      pendingRollovers: 0
    };
    this.emit('dailyStatsReset');
  }

  /**
   * Send the daily summary notification
   */
  async sendDailySummary() {
    try {
      const summary = this.getDailyStats();
      
      await this.notificationService.sendEndOfDaySummary(summary);
      
      this.emit('summarySent', summary);
      
      // Store summary in inbox
      this.storeSummaryInInbox(summary);
      
      console.log('Daily summary sent successfully');
    } catch (error) {
      console.error('Failed to send daily summary:', error);
      this.emit('summaryError', error.message);
    }
  }

  /**
   * Store summary in in-app inbox for later viewing
   */
  storeSummaryInInbox(summary) {
    const inboxEntry = {
      id: `summary-${Date.now()}`,
      type: 'dailySummary',
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      data: summary,
      read: false
    };

    this.emit('inboxEntryCreated', inboxEntry);
  }

  /**
   * Manually trigger a summary (for testing or user-requested summaries)
   */
  async triggerSummary() {
    console.log('Manually triggering daily summary');
    await this.sendDailySummary();
  }

  /**
   * Calculate productivity score based on daily stats
   */
  calculateProductivityScore() {
    const { tasksCompleted, focusTime, streak } = this.dailyStats;
    
    // Simple scoring algorithm
    let score = 0;
    
    // Tasks completed (up to 10 points per task, max 50)
    score += Math.min(tasksCompleted * 10, 50);
    
    // Focus time (1 point per 10 minutes, max 30)
    score += Math.min(Math.floor(focusTime / 10), 30);
    
    // Streak bonus (2 points per day, max 20)
    score += Math.min(streak * 2, 20);
    
    return Math.min(score, 100);
  }

  /**
   * Generate detailed summary report
   */
  generateDetailedReport() {
    const stats = this.getDailyStats();
    const score = this.calculateProductivityScore();
    
    return {
      ...stats,
      productivityScore: score,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };
  }
}

module.exports = EndOfDayService;
