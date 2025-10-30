const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const EventEmitter = require('events');

/**
 * SettingsManager - Manages notification settings and preferences
 */
class SettingsManager extends EventEmitter {
  constructor() {
    super();
    this.settings = this.getDefaultSettings();
    this.settingsPath = null;
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      notifications: {
        taskReminders: true,
        overdueAlerts: true,
        endOfDaySummary: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      },
      endOfDay: {
        summaryTime: '18:00'
      },
      reminders: {
        minutesBeforeStart: 5,
        snoozeMinutes: 5
      },
      overdue: {
        alertIntervalMinutes: 15
      }
    };
  }

  /**
   * Initialize settings manager
   */
  async initialize() {
    try {
      // Determine settings file path
      const userDataPath = app.getPath('userData');
      this.settingsPath = path.join(userDataPath, 'notification-settings.json');

      // Load existing settings or create default
      await this.load();

      console.log('Settings manager initialized');
      console.log('Settings path:', this.settingsPath);
    } catch (error) {
      console.error('Failed to initialize settings manager:', error);
      throw error;
    }
  }

  /**
   * Load settings from disk
   */
  async load() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const loadedSettings = JSON.parse(data);
        
        // Merge with defaults to ensure all keys exist
        this.settings = this.mergeWithDefaults(loadedSettings);
        
        console.log('Settings loaded from disk');
      } else {
        // Create default settings file
        await this.save();
        console.log('Default settings created');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Save settings to disk
   */
  async save() {
    try {
      const data = JSON.stringify(this.settings, null, 2);
      fs.writeFileSync(this.settingsPath, data, 'utf8');
      console.log('Settings saved to disk');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Merge loaded settings with defaults
   */
  mergeWithDefaults(loadedSettings) {
    const defaults = this.getDefaultSettings();
    
    return {
      notifications: {
        ...defaults.notifications,
        ...(loadedSettings.notifications || {}),
        quietHours: {
          ...defaults.notifications.quietHours,
          ...(loadedSettings.notifications?.quietHours || {})
        }
      },
      endOfDay: {
        ...defaults.endOfDay,
        ...(loadedSettings.endOfDay || {})
      },
      reminders: {
        ...defaults.reminders,
        ...(loadedSettings.reminders || {})
      },
      overdue: {
        ...defaults.overdue,
        ...(loadedSettings.overdue || {})
      }
    };
  }

  /**
   * Get all settings
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  /**
   * Get notification settings
   */
  getNotificationSettings() {
    return { ...this.settings.notifications };
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(updates) {
    this.settings.notifications = {
      ...this.settings.notifications,
      ...updates
    };
    
    await this.save();
    this.emit('notificationSettingsUpdated', this.settings.notifications);
  }

  /**
   * Enable/disable task reminders
   */
  async setTaskReminders(enabled) {
    this.settings.notifications.taskReminders = enabled;
    await this.save();
    this.emit('taskRemindersChanged', enabled);
  }

  /**
   * Enable/disable overdue alerts
   */
  async setOverdueAlerts(enabled) {
    this.settings.notifications.overdueAlerts = enabled;
    await this.save();
    this.emit('overdueAlertsChanged', enabled);
  }

  /**
   * Enable/disable end-of-day summary
   */
  async setEndOfDaySummary(enabled) {
    this.settings.notifications.endOfDaySummary = enabled;
    await this.save();
    this.emit('endOfDaySummaryChanged', enabled);
  }

  /**
   * Configure quiet hours
   */
  async setQuietHours(config) {
    this.settings.notifications.quietHours = {
      ...this.settings.notifications.quietHours,
      ...config
    };
    
    await this.save();
    this.emit('quietHoursChanged', this.settings.notifications.quietHours);
  }

  /**
   * Enable/disable quiet hours
   */
  async setQuietHoursEnabled(enabled) {
    this.settings.notifications.quietHours.enabled = enabled;
    await this.save();
    this.emit('quietHoursEnabledChanged', enabled);
  }

  /**
   * Set quiet hours time range
   */
  async setQuietHoursTime(start, end) {
    this.settings.notifications.quietHours.start = start;
    this.settings.notifications.quietHours.end = end;
    await this.save();
    this.emit('quietHoursTimeChanged', { start, end });
  }

  /**
   * Set end-of-day summary time
   */
  async setEndOfDayTime(time) {
    this.settings.endOfDay.summaryTime = time;
    await this.save();
    this.emit('endOfDayTimeChanged', time);
  }

  /**
   * Set reminder lead time
   */
  async setReminderLeadTime(minutes) {
    this.settings.reminders.minutesBeforeStart = minutes;
    await this.save();
    this.emit('reminderLeadTimeChanged', minutes);
  }

  /**
   * Set snooze duration
   */
  async setSnoozeDuration(minutes) {
    this.settings.reminders.snoozeMinutes = minutes;
    await this.save();
    this.emit('snoozeDurationChanged', minutes);
  }

  /**
   * Set overdue alert interval
   */
  async setOverdueAlertInterval(minutes) {
    this.settings.overdue.alertIntervalMinutes = minutes;
    await this.save();
    this.emit('overdueAlertIntervalChanged', minutes);
  }

  /**
   * Reset to default settings
   */
  async reset() {
    this.settings = this.getDefaultSettings();
    await this.save();
    this.emit('settingsReset');
  }

  /**
   * Export settings
   */
  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings
   */
  async importSettings(jsonString) {
    try {
      const importedSettings = JSON.parse(jsonString);
      this.settings = this.mergeWithDefaults(importedSettings);
      await this.save();
      this.emit('settingsImported');
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }
}

module.exports = SettingsManager;
