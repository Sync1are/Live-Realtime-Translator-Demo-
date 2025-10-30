const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * TimerService - Tracks focus and break sessions with analytics
 */
class TimerService extends EventEmitter {
  constructor(notificationService) {
    super();
    this.notificationService = notificationService;
    this.sessions = [];
    this.currentSession = null;
    this.breakReminderEnabled = true;
    this.breakReminderInterval = 60; // minutes of continuous focus before reminder
    this.lastBreakTime = Date.now();
    this.focusStartTime = null;
    this.continuousFocusTimer = null;
    this.dataPath = null;
  }

  /**
   * Initialize the timer service
   */
  async initialize(settings = {}) {
    const {
      breakReminderEnabled = true,
      breakReminderInterval = 60
    } = settings;

    this.breakReminderEnabled = breakReminderEnabled;
    this.breakReminderInterval = breakReminderInterval;

    // Set up data storage path
    const userDataPath = app.getPath('userData');
    this.dataPath = path.join(userDataPath, 'timer-sessions.json');

    // Load existing sessions
    await this.loadSessions();

    console.log('Timer service initialized');
  }

  /**
   * Load sessions from disk
   */
  async loadSessions() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        this.sessions = JSON.parse(data);
        console.log(`Loaded ${this.sessions.length} timer sessions`);
      }
    } catch (error) {
      console.error('Failed to load timer sessions:', error);
      this.sessions = [];
    }
  }

  /**
   * Save sessions to disk
   */
  async saveSessions() {
    try {
      const data = JSON.stringify(this.sessions, null, 2);
      fs.writeFileSync(this.dataPath, data, 'utf8');
    } catch (error) {
      console.error('Failed to save timer sessions:', error);
    }
  }

  /**
   * Start a focus session
   */
  startFocusSession(taskId = null, isPomodoroMode = false) {
    if (this.currentSession && this.currentSession.type === 'focus') {
      console.warn('Focus session already active');
      return;
    }

    // End any existing session
    if (this.currentSession) {
      this.endCurrentSession();
    }

    this.currentSession = {
      id: `session-${Date.now()}`,
      type: 'focus',
      taskId,
      isPomodoroMode,
      startTime: Date.now(),
      endTime: null,
      durationMinutes: 0
    };

    this.focusStartTime = Date.now();
    this.startBreakReminderMonitoring();

    this.emit('focusSessionStarted', { ...this.currentSession });
    console.log('Focus session started:', this.currentSession.id);
  }

  /**
   * Start a break session
   */
  startBreakSession(isPomodoroMode = false, isLongBreak = false) {
    if (this.currentSession && this.currentSession.type === 'break') {
      console.warn('Break session already active');
      return;
    }

    // End any existing session
    if (this.currentSession) {
      this.endCurrentSession();
    }

    this.currentSession = {
      id: `session-${Date.now()}`,
      type: 'break',
      isPomodoroMode,
      isLongBreak,
      startTime: Date.now(),
      endTime: null,
      durationMinutes: 0
    };

    this.lastBreakTime = Date.now();
    this.stopBreakReminderMonitoring();

    this.emit('breakSessionStarted', { ...this.currentSession });
    console.log('Break session started:', this.currentSession.id);
  }

  /**
   * End the current session
   */
  endCurrentSession() {
    if (!this.currentSession) {
      console.warn('No active session to end');
      return;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.durationMinutes = Math.round(
      (this.currentSession.endTime - this.currentSession.startTime) / 1000 / 60
    );

    // Save to sessions history
    this.sessions.push({ ...this.currentSession });
    this.saveSessions();

    const sessionType = this.currentSession.type;
    const sessionData = { ...this.currentSession };

    this.emit('sessionEnded', sessionData);

    if (sessionType === 'focus') {
      this.emit('focusSessionEnded', sessionData);
      this.stopBreakReminderMonitoring();
    } else {
      this.emit('breakSessionEnded', sessionData);
    }

    console.log(`${sessionType} session ended:`, sessionData.id, `(${sessionData.durationMinutes} min)`);

    this.currentSession = null;
  }

  /**
   * Start monitoring for break reminders
   */
  startBreakReminderMonitoring() {
    if (!this.breakReminderEnabled) {
      return;
    }

    this.stopBreakReminderMonitoring();

    // Check every minute
    this.continuousFocusTimer = setInterval(() => {
      this.checkBreakReminder();
    }, 60000);
  }

  /**
   * Stop break reminder monitoring
   */
  stopBreakReminderMonitoring() {
    if (this.continuousFocusTimer) {
      clearInterval(this.continuousFocusTimer);
      this.continuousFocusTimer = null;
    }
  }

  /**
   * Check if it's time for a break reminder
   */
  checkBreakReminder() {
    if (!this.currentSession || this.currentSession.type !== 'focus') {
      return;
    }

    if (this.currentSession.isPomodoroMode) {
      // Skip reminders in Pomodoro mode
      return;
    }

    const continuousFocusMinutes = Math.floor((Date.now() - this.focusStartTime) / 1000 / 60);

    if (continuousFocusMinutes >= this.breakReminderInterval) {
      this.sendBreakReminder(continuousFocusMinutes);
      // Reset timer after reminder
      this.focusStartTime = Date.now();
    }
  }

  /**
   * Send break reminder notification
   */
  async sendBreakReminder(focusMinutes) {
    try {
      await this.notificationService.sendBreakReminder(focusMinutes);
      this.emit('breakReminderSent', { focusMinutes });
      console.log(`Break reminder sent after ${focusMinutes} minutes of focus`);
    } catch (error) {
      console.error('Failed to send break reminder:', error);
    }
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    if (settings.breakReminderEnabled !== undefined) {
      this.breakReminderEnabled = settings.breakReminderEnabled;
      
      if (this.breakReminderEnabled && this.currentSession?.type === 'focus') {
        this.startBreakReminderMonitoring();
      } else {
        this.stopBreakReminderMonitoring();
      }
    }

    if (settings.breakReminderInterval !== undefined) {
      this.breakReminderInterval = settings.breakReminderInterval;
    }

    this.emit('timerSettingsUpdated', this.getSettings());
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      breakReminderEnabled: this.breakReminderEnabled,
      breakReminderInterval: this.breakReminderInterval
    };
  }

  /**
   * Get current session
   */
  getCurrentSession() {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Get analytics for a date range
   */
  getAnalytics(startDate = null, endDate = null) {
    const now = Date.now();
    const start = startDate ? new Date(startDate).getTime() : now - (7 * 24 * 60 * 60 * 1000); // Default: last 7 days
    const end = endDate ? new Date(endDate).getTime() : now;

    const filteredSessions = this.sessions.filter(s => 
      s.startTime >= start && s.startTime <= end
    );

    const focusSessions = filteredSessions.filter(s => s.type === 'focus');
    const breakSessions = filteredSessions.filter(s => s.type === 'break');

    const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalBreakTime = breakSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    const pomodoroFocusSessions = focusSessions.filter(s => s.isPomodoroMode);
    const pomodoroBreakSessions = breakSessions.filter(s => s.isPomodoroMode);

    return {
      totalSessions: filteredSessions.length,
      focusSessions: {
        count: focusSessions.length,
        totalMinutes: totalFocusTime,
        averageMinutes: focusSessions.length > 0 ? Math.round(totalFocusTime / focusSessions.length) : 0,
        pomodoroCount: pomodoroFocusSessions.length
      },
      breakSessions: {
        count: breakSessions.length,
        totalMinutes: totalBreakTime,
        averageMinutes: breakSessions.length > 0 ? Math.round(totalBreakTime / breakSessions.length) : 0,
        pomodoroCount: pomodoroBreakSessions.length,
        longBreaks: breakSessions.filter(s => s.isLongBreak).length
      },
      focusBreakRatio: totalBreakTime > 0 ? (totalFocusTime / totalBreakTime).toFixed(2) : totalFocusTime > 0 ? 'N/A' : '0',
      dateRange: {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString()
      }
    };
  }

  /**
   * Get session history
   */
  getHistory(limit = 50, offset = 0) {
    return this.sessions
      .slice()
      .reverse()
      .slice(offset, offset + limit)
      .map(s => ({ ...s }));
  }

  /**
   * Clear session history
   */
  async clearHistory() {
    this.sessions = [];
    await this.saveSessions();
    this.emit('historyCleared');
    console.log('Session history cleared');
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    this.stopBreakReminderMonitoring();
    
    // End current session if any
    if (this.currentSession) {
      this.endCurrentSession();
    }
    
    console.log('Timer service shutdown');
  }
}

module.exports = TimerService;
