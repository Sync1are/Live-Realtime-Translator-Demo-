/**
 * StorageService - Handles IndexedDB operations for gamification data
 * This service runs in the renderer process, not the main process
 */
class StorageService {
  constructor() {
    this.dbName = 'GamificationDB';
    this.version = 1;
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('gamification')) {
          const store = db.createObjectStore('gamification', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('achievements')) {
          db.createObjectStore('achievements', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('dailyStats')) {
          const dailyStore = db.createObjectStore('dailyStats', { keyPath: 'date' });
          dailyStore.createIndex('date', 'date', { unique: true });
        }

        if (!db.objectStoreNames.contains('weeklyStats')) {
          const weeklyStore = db.createObjectStore('weeklyStats', { keyPath: 'week' });
          weeklyStore.createIndex('week', 'week', { unique: true });
        }
      };
    });
  }

  /**
   * Get gamification state
   */
  async getGamificationState() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['gamification'], 'readonly');
      const store = transaction.objectStore('gamification');
      const request = store.get('main');

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          // Return default state
          resolve(this.getDefaultState());
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save gamification state
   */
  async saveGamificationState(state) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['gamification'], 'readwrite');
      const store = transaction.objectStore('gamification');
      const request = store.put({
        id: 'main',
        type: 'state',
        data: state,
        updatedAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get unlocked achievements
   */
  async getUnlockedAchievements() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['achievements'], 'readonly');
      const store = transaction.objectStore('achievements');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Unlock achievement
   */
  async unlockAchievement(achievement) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['achievements'], 'readwrite');
      const store = transaction.objectStore('achievements');
      const request = store.put({
        id: achievement.id,
        ...achievement,
        unlockedAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get today's stats
   */
  async getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    return this.getDailyStats(today);
  }

  /**
   * Get daily stats by date
   */
  async getDailyStats(date) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['dailyStats'], 'readonly');
      const store = transaction.objectStore('dailyStats');
      const request = store.get(date);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          resolve({ date, tasksCompleted: 0, focusTime: 0, breakTime: 0 });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update daily stats
   */
  async updateDailyStats(date, updates) {
    return new Promise(async (resolve, reject) => {
      const current = await this.getDailyStats(date);
      const updated = { ...current, ...updates };

      const transaction = this.db.transaction(['dailyStats'], 'readwrite');
      const store = transaction.objectStore('dailyStats');
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get current week stats
   */
  async getWeekStats() {
    const weekKey = this.getCurrentWeekKey();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['weeklyStats'], 'readonly');
      const store = transaction.objectStore('weeklyStats');
      const request = store.get(weekKey);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          resolve({ week: weekKey, tasksCompleted: 0, focusTime: 0, breakTime: 0 });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update weekly stats
   */
  async updateWeekStats(updates) {
    const weekKey = this.getCurrentWeekKey();
    return new Promise(async (resolve, reject) => {
      const current = await this.getWeekStats();
      const updated = { ...current, ...updates };

      const transaction = this.db.transaction(['weeklyStats'], 'readwrite');
      const store = transaction.objectStore('weeklyStats');
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get current week key (format: YYYY-WW)
   */
  getCurrentWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const days = Math.floor((now - firstDay) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  /**
   * Get default gamification state
   */
  getDefaultState() {
    return {
      totalXP: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      totalTasksCompleted: 0,
      beatEstimateCount: 0,
      lastCompletionDate: null
    };
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ['gamification', 'achievements', 'dailyStats', 'weeklyStats'],
        'readwrite'
      );

      const stores = ['gamification', 'achievements', 'dailyStats', 'weeklyStats'];
      let completed = 0;

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}

// This will be available in the renderer process
if (typeof window !== 'undefined') {
  window.StorageService = StorageService;
}
