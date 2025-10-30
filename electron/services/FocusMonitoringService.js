const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { app, Notification } = require('electron');
const activeWin = require('active-win');

/**
 * FocusMonitoringService - Monitors focus changes and manages distractions
 */
class FocusMonitoringService extends EventEmitter {
  constructor(notificationService) {
    super();
    this.notificationService = notificationService;
    this.isAppFocused = true;
    this.monitoringEnabled = false;
    this.whitelist = [];
    this.blacklist = [];
    this.graceCountdownActive = false;
    this.graceCountdownTimer = null;
    this.graceCountdownDuration = 10000; // 10 seconds
    this.monitorInterval = null;
    this.monitorIntervalDuration = 1000; // Check every second
    this.distractionLog = [];
    this.currentDistraction = null;
    this.dataPath = null;
    this.mainWindow = null;
  }

  /**
   * Initialize the focus monitoring service
   */
  async initialize(settings = {}, mainWindow = null) {
    const {
      enabled = false,
      whitelist = [],
      blacklist = [],
      graceCountdownDuration = 10
    } = settings;

    this.monitoringEnabled = enabled;
    this.whitelist = whitelist;
    this.blacklist = blacklist;
    this.graceCountdownDuration = graceCountdownDuration * 1000;
    this.mainWindow = mainWindow;

    // Set up data storage path
    const userDataPath = app.getPath('userData');
    this.dataPath = path.join(userDataPath, 'focus-distraction-log.json');

    // Load existing distraction log
    await this.loadDistractionLog();

    console.log('Focus monitoring service initialized');
  }

  /**
   * Set the main window reference
   */
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Load distraction log from disk
   */
  async loadDistractionLog() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        this.distractionLog = JSON.parse(data);
        console.log(`Loaded ${this.distractionLog.length} distraction log entries`);
      }
    } catch (error) {
      console.error('Failed to load distraction log:', error);
      this.distractionLog = [];
    }
  }

  /**
   * Save distraction log to disk
   */
  async saveDistractionLog() {
    try {
      const data = JSON.stringify(this.distractionLog, null, 2);
      fs.writeFileSync(this.dataPath, data, 'utf8');
    } catch (error) {
      console.error('Failed to save distraction log:', error);
    }
  }

  /**
   * Start monitoring focus
   */
  startMonitoring() {
    if (!this.monitoringEnabled) {
      return;
    }

    this.stopMonitoring();

    // Monitor active window every second
    this.monitorInterval = setInterval(async () => {
      await this.checkActiveWindow();
    }, this.monitorIntervalDuration);

    console.log('Focus monitoring started');
  }

  /**
   * Stop monitoring focus
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.cancelGraceCountdown();
    console.log('Focus monitoring stopped');
  }

  /**
   * Check the currently active window
   */
  async checkActiveWindow() {
    try {
      const window = await activeWin();
      
      if (!window) {
        return;
      }

      const isOurApp = window.owner?.name === 'electron' || window.owner?.name === 'Electron';
      
      if (isOurApp) {
        // User returned to our app
        this.handleFocusRegained();
      } else {
        // User is on a different app
        this.handleFocusLost(window);
      }
    } catch (error) {
      // active-win may fail on some platforms/configurations
      console.error('Failed to get active window:', error);
    }
  }

  /**
   * Handle app focus event
   */
  onAppFocus() {
    this.isAppFocused = true;
    this.handleFocusRegained();
  }

  /**
   * Handle app blur event
   */
  onAppBlur() {
    this.isAppFocused = false;
    
    if (this.monitoringEnabled) {
      // Start grace countdown when app loses focus
      this.startGraceCountdown({ type: 'app', name: 'Unknown' });
    }
  }

  /**
   * Handle focus regained
   */
  handleFocusRegained() {
    if (this.graceCountdownActive) {
      // User returned within grace period
      this.cancelGraceCountdown();
      console.log('Grace countdown cancelled - user returned');
      
      // Notify renderer
      if (this.mainWindow) {
        this.mainWindow.webContents.send('focus-grace-cancelled');
      }
    }
  }

  /**
   * Handle focus lost to another window
   */
  handleFocusLost(window) {
    const appName = window.owner?.name || 'Unknown';
    const windowTitle = window.title || '';
    const url = this.extractUrl(windowTitle);

    // Check if it's whitelisted (allowed apps)
    if (this.isWhitelisted(appName, url)) {
      this.cancelGraceCountdown();
      return;
    }

    // Check if it's blacklisted (blocked apps)
    const isBlacklisted = this.isBlacklisted(appName, url);

    // Start grace countdown if not already active
    if (!this.graceCountdownActive) {
      this.startGraceCountdown({
        type: isBlacklisted ? 'blacklisted' : 'unfocused',
        name: appName,
        title: windowTitle,
        url: url
      });
    }
  }

  /**
   * Check if app/URL is whitelisted
   */
  isWhitelisted(appName, url) {
    return this.whitelist.some(entry => {
      if (entry.type === 'app') {
        return this.matchesPattern(appName.toLowerCase(), entry.pattern.toLowerCase());
      } else if (entry.type === 'url' && url) {
        return this.matchesPattern(url.toLowerCase(), entry.pattern.toLowerCase());
      }
      return false;
    });
  }

  /**
   * Check if app/URL is blacklisted
   */
  isBlacklisted(appName, url) {
    return this.blacklist.some(entry => {
      if (entry.type === 'app') {
        return this.matchesPattern(appName.toLowerCase(), entry.pattern.toLowerCase());
      } else if (entry.type === 'url' && url) {
        return this.matchesPattern(url.toLowerCase(), entry.pattern.toLowerCase());
      }
      return false;
    });
  }

  /**
   * Match pattern (supports wildcards)
   */
  matchesPattern(text, pattern) {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(text);
  }

  /**
   * Extract URL from window title (for browsers)
   */
  extractUrl(title) {
    // Try to extract URL from common browser title formats
    const urlMatch = title.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  /**
   * Start grace countdown
   */
  startGraceCountdown(targetInfo) {
    if (this.graceCountdownActive) {
      return;
    }

    this.graceCountdownActive = true;
    this.currentDistraction = {
      ...targetInfo,
      startTime: Date.now()
    };

    console.log(`Grace countdown started: ${targetInfo.name}`);

    // Send notification to renderer for in-app banner
    if (this.mainWindow) {
      this.mainWindow.webContents.send('focus-grace-started', {
        target: targetInfo,
        duration: this.graceCountdownDuration / 1000
      });
    }

    // Show system notification
    this.showGraceNotification(targetInfo);

    // Set timer to trigger auto-pause after grace period
    this.graceCountdownTimer = setTimeout(() => {
      this.triggerAutoPause();
    }, this.graceCountdownDuration);

    this.emit('graceCountdownStarted', targetInfo);
  }

  /**
   * Cancel grace countdown
   */
  cancelGraceCountdown() {
    if (!this.graceCountdownActive) {
      return;
    }

    if (this.graceCountdownTimer) {
      clearTimeout(this.graceCountdownTimer);
      this.graceCountdownTimer = null;
    }

    this.graceCountdownActive = false;
    this.currentDistraction = null;

    console.log('Grace countdown cancelled');
    this.emit('graceCountdownCancelled');
  }

  /**
   * Show grace period notification
   */
  showGraceNotification(targetInfo) {
    const title = targetInfo.type === 'blacklisted'
      ? '⚠️ Blacklisted App Detected'
      : '⏰ Focus Warning';
    
    const body = targetInfo.type === 'blacklisted'
      ? `You switched to ${targetInfo.name}. Return within 10 seconds or your timer will pause.`
      : `You left the app. Return within 10 seconds or your timer will pause.`;

    const notification = new Notification({
      title,
      body,
      silent: false,
      urgency: 'normal'
    });

    notification.show();
  }

  /**
   * Trigger auto-pause after grace period expires
   */
  async triggerAutoPause() {
    console.log('Grace period expired - triggering auto-pause');

    this.graceCountdownActive = false;

    // Log the distraction
    const distractionEntry = {
      id: `distraction-${Date.now()}`,
      timestamp: this.currentDistraction.startTime,
      endTime: Date.now(),
      duration: Date.now() - this.currentDistraction.startTime,
      type: this.currentDistraction.type,
      appName: this.currentDistraction.name,
      windowTitle: this.currentDistraction.title,
      url: this.currentDistraction.url,
      annotation: null
    };

    this.distractionLog.push(distractionEntry);
    await this.saveDistractionLog();

    // Notify renderer to pause timer
    if (this.mainWindow) {
      this.mainWindow.webContents.send('focus-auto-pause-triggered', {
        distraction: distractionEntry
      });
    }

    // Emit event for TimerService integration
    this.emit('autoPauseTriggered', distractionEntry);

    // Show notification
    const notification = new Notification({
      title: '⏸️ Timer Auto-Paused',
      body: `Your timer was paused due to ${distractionEntry.appName}. Focus break recorded.`,
      silent: false
    });

    notification.show();

    this.currentDistraction = null;
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    if (settings.enabled !== undefined) {
      this.monitoringEnabled = settings.enabled;
      
      if (this.monitoringEnabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }

    if (settings.whitelist !== undefined) {
      this.whitelist = settings.whitelist;
    }

    if (settings.blacklist !== undefined) {
      this.blacklist = settings.blacklist;
    }

    if (settings.graceCountdownDuration !== undefined) {
      this.graceCountdownDuration = settings.graceCountdownDuration * 1000;
    }

    this.emit('focusMonitoringSettingsUpdated', this.getSettings());
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      enabled: this.monitoringEnabled,
      whitelist: this.whitelist,
      blacklist: this.blacklist,
      graceCountdownDuration: this.graceCountdownDuration / 1000
    };
  }

  /**
   * Get distraction log
   */
  getDistractionLog(limit = 100, offset = 0) {
    return this.distractionLog
      .slice()
      .reverse()
      .slice(offset, offset + limit)
      .map(entry => ({ ...entry }));
  }

  /**
   * Add annotation to distraction entry
   */
  async annotateDistraction(distractionId, annotation) {
    const entry = this.distractionLog.find(d => d.id === distractionId);
    
    if (entry) {
      entry.annotation = annotation;
      await this.saveDistractionLog();
      this.emit('distractionAnnotated', { id: distractionId, annotation });
      return true;
    }
    
    return false;
  }

  /**
   * Delete distraction entry
   */
  async deleteDistraction(distractionId) {
    const index = this.distractionLog.findIndex(d => d.id === distractionId);
    
    if (index !== -1) {
      this.distractionLog.splice(index, 1);
      await this.saveDistractionLog();
      this.emit('distractionDeleted', distractionId);
      return true;
    }
    
    return false;
  }

  /**
   * Add to whitelist
   */
  async addToWhitelist(entry) {
    this.whitelist.push(entry);
    this.emit('whitelistUpdated', this.whitelist);
  }

  /**
   * Remove from whitelist
   */
  async removeFromWhitelist(index) {
    if (index >= 0 && index < this.whitelist.length) {
      this.whitelist.splice(index, 1);
      this.emit('whitelistUpdated', this.whitelist);
    }
  }

  /**
   * Add to blacklist
   */
  async addToBlacklist(entry) {
    this.blacklist.push(entry);
    this.emit('blacklistUpdated', this.blacklist);
  }

  /**
   * Remove from blacklist
   */
  async removeFromBlacklist(index) {
    if (index >= 0 && index < this.blacklist.length) {
      this.blacklist.splice(index, 1);
      this.emit('blacklistUpdated', this.blacklist);
    }
  }

  /**
   * Clear distraction log
   */
  async clearDistractionLog() {
    this.distractionLog = [];
    await this.saveDistractionLog();
    this.emit('distractionLogCleared');
    console.log('Distraction log cleared');
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    this.stopMonitoring();
    console.log('Focus monitoring service shutdown');
  }
}

module.exports = FocusMonitoringService;
