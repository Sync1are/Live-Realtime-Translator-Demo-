const EventEmitter = require('events');

/**
 * PomodoroService - Manages Pomodoro cycles with work and break sessions
 */
class PomodoroService extends EventEmitter {
  constructor(notificationService) {
    super();
    this.notificationService = notificationService;
    this.isEnabled = false;
    this.currentPhase = null; // 'work' or 'break'
    this.workDuration = 25; // minutes
    this.breakDuration = 5; // minutes
    this.longBreakDuration = 15; // minutes
    this.cyclesBeforeLongBreak = 4;
    this.currentCycle = 0;
    this.activeTaskId = null;
    this.timer = null;
    this.remainingSeconds = 0;
    this.isPaused = false;
    this.sessionStartTime = null;
  }

  /**
   * Initialize the Pomodoro service with settings
   */
  initialize(settings = {}) {
    const { 
      enabled = false, 
      workDuration = 25, 
      breakDuration = 5,
      longBreakDuration = 15,
      cyclesBeforeLongBreak = 4
    } = settings;
    
    this.isEnabled = enabled;
    this.workDuration = workDuration;
    this.breakDuration = breakDuration;
    this.longBreakDuration = longBreakDuration;
    this.cyclesBeforeLongBreak = cyclesBeforeLongBreak;
    
    console.log('Pomodoro service initialized:', settings);
  }

  /**
   * Enable Pomodoro mode
   */
  enable() {
    this.isEnabled = true;
    this.emit('pomodoroEnabled');
    console.log('Pomodoro mode enabled');
  }

  /**
   * Disable Pomodoro mode
   */
  disable() {
    this.isEnabled = false;
    this.stopTimer();
    this.emit('pomodoroDisabled');
    console.log('Pomodoro mode disabled');
  }

  /**
   * Update Pomodoro settings
   */
  updateSettings(settings) {
    if (settings.workDuration !== undefined) {
      this.workDuration = settings.workDuration;
    }
    if (settings.breakDuration !== undefined) {
      this.breakDuration = settings.breakDuration;
    }
    if (settings.longBreakDuration !== undefined) {
      this.longBreakDuration = settings.longBreakDuration;
    }
    if (settings.cyclesBeforeLongBreak !== undefined) {
      this.cyclesBeforeLongBreak = settings.cyclesBeforeLongBreak;
    }
    
    this.emit('pomodoroSettingsUpdated', this.getSettings());
    console.log('Pomodoro settings updated:', settings);
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      enabled: this.isEnabled,
      workDuration: this.workDuration,
      breakDuration: this.breakDuration,
      longBreakDuration: this.longBreakDuration,
      cyclesBeforeLongBreak: this.cyclesBeforeLongBreak
    };
  }

  /**
   * Start a work session
   */
  startWorkSession(taskId = null) {
    if (!this.isEnabled) {
      console.warn('Pomodoro mode is not enabled');
      return;
    }

    this.stopTimer();
    this.currentPhase = 'work';
    this.activeTaskId = taskId;
    this.remainingSeconds = this.workDuration * 60;
    this.sessionStartTime = Date.now();
    this.isPaused = false;
    
    this.startTimer();
    this.emit('workSessionStarted', {
      taskId,
      duration: this.workDuration,
      cycle: this.currentCycle + 1
    });
    
    console.log(`Work session started (${this.workDuration} min) for task:`, taskId);
  }

  /**
   * Start a break session
   */
  startBreakSession(isLongBreak = false) {
    if (!this.isEnabled) {
      console.warn('Pomodoro mode is not enabled');
      return;
    }

    this.stopTimer();
    this.currentPhase = 'break';
    const duration = isLongBreak ? this.longBreakDuration : this.breakDuration;
    this.remainingSeconds = duration * 60;
    this.sessionStartTime = Date.now();
    this.isPaused = false;
    
    this.startTimer();
    this.emit('breakSessionStarted', {
      duration,
      isLongBreak,
      cycle: this.currentCycle
    });
    
    console.log(`Break session started (${duration} min, long: ${isLongBreak})`);
  }

  /**
   * Start the countdown timer
   */
  startTimer() {
    this.timer = setInterval(() => {
      if (this.isPaused) {
        return;
      }

      this.remainingSeconds--;
      
      this.emit('timerTick', {
        phase: this.currentPhase,
        remainingSeconds: this.remainingSeconds,
        totalSeconds: this.currentPhase === 'work' 
          ? this.workDuration * 60 
          : (this.shouldTakeLongBreak() ? this.longBreakDuration : this.breakDuration) * 60
      });

      if (this.remainingSeconds <= 0) {
        this.handleSessionComplete();
      }
    }, 1000);
  }

  /**
   * Stop the timer
   */
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Pause the current session
   */
  pause() {
    if (!this.timer) {
      console.warn('No active timer to pause');
      return;
    }

    this.isPaused = true;
    this.emit('timerPaused', {
      phase: this.currentPhase,
      remainingSeconds: this.remainingSeconds
    });
    console.log('Timer paused');
  }

  /**
   * Resume the paused session
   */
  resume() {
    if (!this.timer || !this.isPaused) {
      console.warn('No paused timer to resume');
      return;
    }

    this.isPaused = false;
    this.emit('timerResumed', {
      phase: this.currentPhase,
      remainingSeconds: this.remainingSeconds
    });
    console.log('Timer resumed');
  }

  /**
   * Skip the current session
   */
  skip() {
    if (!this.timer) {
      console.warn('No active timer to skip');
      return;
    }

    const currentPhase = this.currentPhase;
    this.stopTimer();
    
    this.emit('sessionSkipped', { phase: currentPhase });
    
    if (currentPhase === 'work') {
      this.transitionToBreak();
    } else {
      this.transitionToWork();
    }
    
    console.log(`${currentPhase} session skipped`);
  }

  /**
   * Extend the current session by specified minutes
   */
  extend(minutes) {
    if (!this.timer) {
      console.warn('No active timer to extend');
      return;
    }

    this.remainingSeconds += minutes * 60;
    this.emit('sessionExtended', {
      phase: this.currentPhase,
      extensionMinutes: minutes,
      newRemainingSeconds: this.remainingSeconds
    });
    
    console.log(`Session extended by ${minutes} minutes`);
  }

  /**
   * Handle session completion
   */
  handleSessionComplete() {
    this.stopTimer();
    
    const sessionData = {
      phase: this.currentPhase,
      taskId: this.activeTaskId,
      startTime: this.sessionStartTime,
      endTime: Date.now(),
      durationMinutes: this.currentPhase === 'work' 
        ? this.workDuration 
        : (this.shouldTakeLongBreak() ? this.longBreakDuration : this.breakDuration)
    };

    this.emit('sessionCompleted', sessionData);

    if (this.currentPhase === 'work') {
      this.currentCycle++;
      this.sendWorkCompleteNotification();
      this.transitionToBreak();
    } else {
      this.sendBreakCompleteNotification();
      this.transitionToWork();
    }
  }

  /**
   * Transition from work to break
   */
  transitionToBreak() {
    const isLongBreak = this.shouldTakeLongBreak();
    
    this.emit('transitionToBreak', { 
      isLongBreak,
      cycle: this.currentCycle
    });
    
    // Auto-start break if enabled, otherwise just notify
    setTimeout(() => {
      this.startBreakSession(isLongBreak);
    }, 1000);
  }

  /**
   * Transition from break to work
   */
  transitionToWork() {
    this.emit('transitionToWork', {
      cycle: this.currentCycle + 1
    });
    
    // Don't auto-start work session, let user manually start
    console.log('Break complete. Ready for next work session.');
  }

  /**
   * Check if it's time for a long break
   */
  shouldTakeLongBreak() {
    return this.currentCycle % this.cyclesBeforeLongBreak === 0 && this.currentCycle > 0;
  }

  /**
   * Send work complete notification
   */
  async sendWorkCompleteNotification() {
    try {
      await this.notificationService.sendPomodoroNotification({
        type: 'workComplete',
        message: 'Work session complete! Time for a break.',
        isLongBreak: this.shouldTakeLongBreak()
      });
    } catch (error) {
      console.error('Failed to send work complete notification:', error);
    }
  }

  /**
   * Send break complete notification
   */
  async sendBreakCompleteNotification() {
    try {
      await this.notificationService.sendPomodoroNotification({
        type: 'breakComplete',
        message: 'Break is over! Ready to focus?',
        cycle: this.currentCycle + 1
      });
    } catch (error) {
      console.error('Failed to send break complete notification:', error);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      phase: this.currentPhase,
      isPaused: this.isPaused,
      remainingSeconds: this.remainingSeconds,
      currentCycle: this.currentCycle,
      activeTaskId: this.activeTaskId,
      nextBreakIsLong: this.shouldTakeLongBreak()
    };
  }

  /**
   * Get upcoming cycles preview
   */
  getUpcomingCycles(count = 5) {
    const cycles = [];
    for (let i = 0; i < count; i++) {
      const cycleNumber = this.currentCycle + i + 1;
      const isLongBreak = cycleNumber % this.cyclesBeforeLongBreak === 0;
      cycles.push({
        cycle: cycleNumber,
        workDuration: this.workDuration,
        breakDuration: isLongBreak ? this.longBreakDuration : this.breakDuration,
        isLongBreak
      });
    }
    return cycles;
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    this.stopTimer();
    console.log('Pomodoro service shutdown');
  }
}

module.exports = PomodoroService;
