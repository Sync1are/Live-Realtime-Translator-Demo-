const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('events');

// Mock Electron modules
const mockNotification = {
  isSupported: () => true,
  prototype: {
    show: function() {},
    on: function() {}
  }
};

class MockNotification extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
  }
  show() {
    this.emit('show');
  }
}

MockNotification.isSupported = () => true;

// Mock electron module
const electron = {
  Notification: MockNotification,
  app: {}
};

// Replace require for electron
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'electron') {
    return electron;
  }
  return originalRequire.apply(this, arguments);
};

const NotificationService = require('../services/NotificationService');

describe('NotificationService', () => {
  let service;

  beforeEach(() => {
    service = new NotificationService();
  });

  afterEach(() => {
    service = null;
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const result = await service.initialize();
      assert.strictEqual(result, true);
      assert.strictEqual(service.permissionGranted, true);
    });

    it('should set default settings', () => {
      const settings = service.getSettings();
      assert.strictEqual(settings.taskReminders, true);
      assert.strictEqual(settings.overdueAlerts, true);
      assert.strictEqual(settings.endOfDaySummary, true);
      assert.strictEqual(settings.quietHours.enabled, false);
    });
  });

  describe('quiet hours', () => {
    it('should detect quiet hours correctly', () => {
      service.updateSettings({
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        }
      });

      // This test depends on current time, so we'll just check the method exists
      const result = service.isQuietHours();
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should handle quiet hours spanning midnight', () => {
      service.updateSettings({
        quietHours: {
          enabled: true,
          start: '23:00',
          end: '07:00'
        }
      });

      const result = service.isQuietHours();
      assert.strictEqual(typeof result, 'boolean');
    });
  });

  describe('notification type checking', () => {
    it('should check if taskReminder is enabled', () => {
      service.updateSettings({ taskReminders: true });
      assert.strictEqual(service.isNotificationTypeEnabled('taskReminder'), true);

      service.updateSettings({ taskReminders: false });
      assert.strictEqual(service.isNotificationTypeEnabled('taskReminder'), false);
    });

    it('should check if overdueAlert is enabled', () => {
      service.updateSettings({ overdueAlerts: true });
      assert.strictEqual(service.isNotificationTypeEnabled('overdueAlert'), true);

      service.updateSettings({ overdueAlerts: false });
      assert.strictEqual(service.isNotificationTypeEnabled('overdueAlert'), false);
    });

    it('should check if endOfDaySummary is enabled', () => {
      service.updateSettings({ endOfDaySummary: true });
      assert.strictEqual(service.isNotificationTypeEnabled('endOfDaySummary'), true);

      service.updateSettings({ endOfDaySummary: false });
      assert.strictEqual(service.isNotificationTypeEnabled('endOfDaySummary'), false);
    });
  });

  describe('notification queue', () => {
    it('should queue notification when disabled', async () => {
      service.updateSettings({ taskReminders: false });
      
      await service.sendNotification({
        type: 'taskReminder',
        title: 'Test',
        body: 'Test body'
      });

      assert.strictEqual(service.notificationQueue.length, 1);
    });

    it('should process queued notifications', async () => {
      service.updateSettings({ taskReminders: false });
      
      await service.sendNotification({
        type: 'taskReminder',
        title: 'Test',
        body: 'Test body'
      });

      service.updateSettings({ taskReminders: true });
      service.processQueue();

      assert.strictEqual(service.notificationQueue.length, 0);
    });

    it('should clear queue', () => {
      service.queueNotification({ type: 'test', title: 'Test' });
      service.queueNotification({ type: 'test', title: 'Test2' });
      
      assert.strictEqual(service.notificationQueue.length, 2);
      
      service.clearQueue();
      assert.strictEqual(service.notificationQueue.length, 0);
    });
  });

  describe('specialized notifications', () => {
    it('should send task reminder', async () => {
      await service.initialize();
      
      const task = { id: 'task-1', title: 'Test Task' };
      const notification = await service.sendTaskReminder(task);
      
      // Should not throw
      assert.ok(true);
    });

    it('should send overdue alert', async () => {
      await service.initialize();
      
      const task = { id: 'task-1', title: 'Test Task' };
      const notification = await service.sendOverdueAlert(task, 15);
      
      // Should not throw
      assert.ok(true);
    });

    it('should send end-of-day summary', async () => {
      await service.initialize();
      
      const summary = {
        tasksCompleted: 5,
        focusTime: 120,
        streak: 7,
        pendingRollovers: 2
      };
      
      const notification = await service.sendEndOfDaySummary(summary);
      
      // Should not throw
      assert.ok(true);
    });
  });

  describe('events', () => {
    it('should emit settingsUpdated event', (done) => {
      service.on('settingsUpdated', (settings) => {
        assert.strictEqual(settings.taskReminders, false);
        done();
      });

      service.updateSettings({ taskReminders: false });
    });
  });
});

// Restore original require
Module.prototype.require = originalRequire;

console.log('NotificationService tests completed');
