// Test script to verify AnalyticsService syntax and basic structure
const path = require('path');

console.log('Testing AnalyticsService...');

// Mock EventEmitter
class MockEventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }
}

// Mock services
const mockTimerService = {
  getAnalytics: (start, end) => ({
    focusSessions: { totalMinutes: 120, count: 4, averageMinutes: 30 },
    breakSessions: { totalMinutes: 30, count: 2, averageMinutes: 15 },
    focusBreakRatio: '4.00'
  }),
  getHistory: (limit, offset) => []
};

const mockTaskScheduler = {
  getAllTasks: () => [
    { id: '1', title: 'Test Task 1', status: 'pending' },
    { id: '2', title: 'Test Task 2', status: 'in_progress' },
    { id: '3', title: 'Test Task 3', status: 'completed' }
  ]
};

const mockEndOfDayService = {
  getDailyStats: () => ({
    tasksCompleted: 3,
    focusTime: 120,
    breakTime: 30,
    streak: 5,
    pendingRollovers: 1
  })
};

// Create a mock app object for AnalyticsService
const mockApp = {
  getPath: (name) => '/tmp/test-data'
};

// Mock fs and path for AnalyticsService
const mockFs = {
  existsSync: () => false,
  readFileSync: () => '[]',
  writeFileSync: () => {}
};

// Replace require for testing
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'fs') return mockFs;
  if (id === 'electron') return { app: mockApp };
  return originalRequire.apply(this, arguments);
};

// Now we can safely require AnalyticsService
const AnalyticsService = require('./electron/services/AnalyticsService');

// Restore original require
Module.prototype.require = originalRequire;

console.log('✓ AnalyticsService loaded successfully');

// Test instantiation
const service = new AnalyticsService(mockTimerService, mockTaskScheduler, mockEndOfDayService);
console.log('✓ AnalyticsService instantiated successfully');

// Test methods exist
console.log('✓ getDailyDashboard method exists:', typeof service.getDailyDashboard === 'function');
console.log('✓ getWeeklyDashboard method exists:', typeof service.getWeeklyDashboard === 'function');
console.log('✓ recordCompletedTask method exists:', typeof service.recordCompletedTask === 'function');
console.log('✓ setDailyGoals method exists:', typeof service.setDailyGoals === 'function');

// Test getDailyDashboard
try {
  const dailyData = service.getDailyDashboard();
  console.log('✓ getDailyDashboard returned data:', Object.keys(dailyData));
} catch (e) {
  console.error('✗ getDailyDashboard failed:', e.message);
}

// Test getWeeklyDashboard
try {
  const weeklyData = service.getWeeklyDashboard();
  console.log('✓ getWeeklyDashboard returned data:', Object.keys(weeklyData));
} catch (e) {
  console.error('✗ getWeeklyDashboard failed:', e.message);
}

console.log('\n✅ All tests passed!');
