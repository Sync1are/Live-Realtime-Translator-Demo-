const EventEmitter = require('events');

/**
 * GamificationService - Manages XP, streaks, achievements, and rewards
 */
class GamificationService extends EventEmitter {
  constructor() {
    super();
    
    // XP and Level configuration
    this.XP_RULES = {
      BASE_TASK_XP: 10,
      FOCUS_TIME_MULTIPLIER: 1, // 1 XP per minute
      BEAT_ESTIMATE_BONUS: 0.2, // 20% bonus
      STREAK_BONUS_PER_DAY: 5 // Extra XP per day of streak
    };

    this.LEVEL_THRESHOLDS = [
      0, 100, 250, 500, 1000, 1500, 2500, 4000, 6000, 8500, 
      11500, 15000, 20000, 25000, 30000, 40000, 50000, 65000, 80000, 100000
    ];

    // Achievements catalog
    this.ACHIEVEMENTS = {
      FIRST_TASK: {
        id: 'first_task',
        name: 'Getting Started',
        description: 'Complete your first task',
        threshold: 1,
        type: 'tasks_completed',
        icon: '🎯'
      },
      TASKS_10: {
        id: 'tasks_10',
        name: 'Productive',
        description: 'Complete 10 tasks',
        threshold: 10,
        type: 'tasks_completed',
        icon: '⭐'
      },
      TASKS_50: {
        id: 'tasks_50',
        name: 'Task Master',
        description: 'Complete 50 tasks',
        threshold: 50,
        type: 'tasks_completed',
        icon: '🏆'
      },
      TASKS_100: {
        id: 'tasks_100',
        name: 'Centurion',
        description: 'Complete 100 tasks',
        threshold: 100,
        type: 'tasks_completed',
        icon: '👑'
      },
      STREAK_3: {
        id: 'streak_3',
        name: 'On a Roll',
        description: 'Maintain a 3-day streak',
        threshold: 3,
        type: 'streak',
        icon: '🔥'
      },
      STREAK_5: {
        id: 'streak_5',
        name: 'Consistency',
        description: 'Maintain a 5-day streak',
        threshold: 5,
        type: 'streak',
        icon: '💪'
      },
      STREAK_7: {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        threshold: 7,
        type: 'streak',
        icon: '🌟'
      },
      STREAK_30: {
        id: 'streak_30',
        name: 'Unstoppable',
        description: 'Maintain a 30-day streak',
        threshold: 30,
        type: 'streak',
        icon: '💎'
      },
      BEAT_ESTIMATE_20: {
        id: 'beat_estimate_20',
        name: 'Speed Demon',
        description: 'Beat estimate by 20% or more',
        threshold: 1,
        type: 'beat_estimate_20',
        icon: '⚡'
      },
      BEAT_ESTIMATE_5: {
        id: 'beat_estimate_5',
        name: 'Efficiency Expert',
        description: 'Beat estimate 5 times',
        threshold: 5,
        type: 'beat_estimate_count',
        icon: '🎖️'
      },
      FOCUS_60: {
        id: 'focus_60',
        name: 'Focused Mind',
        description: 'Complete 60 minutes of focus time in a day',
        threshold: 60,
        type: 'daily_focus',
        icon: '🧠'
      },
      FOCUS_240: {
        id: 'focus_240',
        name: 'Deep Work',
        description: 'Complete 240 minutes of focus time in a day',
        threshold: 240,
        type: 'daily_focus',
        icon: '🎓'
      },
      LEVEL_5: {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        threshold: 5,
        type: 'level',
        icon: '⬆️'
      },
      LEVEL_10: {
        id: 'level_10',
        name: 'Expert',
        description: 'Reach level 10',
        threshold: 10,
        type: 'level',
        icon: '🚀'
      },
      LEVEL_20: {
        id: 'level_20',
        name: 'Legend',
        description: 'Reach level 20',
        threshold: 20,
        type: 'level',
        icon: '🏅'
      }
    };

    // Daily and weekly goals
    this.GOALS = {
      DAILY_TASKS: 5,
      DAILY_FOCUS_TIME: 120, // minutes
      WEEKLY_TASKS: 25,
      WEEKLY_FOCUS_TIME: 600 // minutes
    };

    this.state = null;
  }

  /**
   * Initialize the gamification service
   */
  async initialize() {
    console.log('Gamification service initialized');
  }

  /**
   * Set the current state from IndexedDB
   */
  setState(state) {
    this.state = state;
  }

  /**
   * Calculate XP for a completed task
   */
  calculateTaskXP(taskData) {
    let xp = this.XP_RULES.BASE_TASK_XP;

    // Add focus time bonus
    if (taskData.focusTime) {
      xp += taskData.focusTime * this.XP_RULES.FOCUS_TIME_MULTIPLIER;
    }

    // Add streak bonus
    if (taskData.currentStreak && taskData.currentStreak > 0) {
      xp += taskData.currentStreak * this.XP_RULES.STREAK_BONUS_PER_DAY;
    }

    // Add beat estimate bonus
    if (taskData.estimatedTime && taskData.actualTime) {
      const percentDiff = (taskData.estimatedTime - taskData.actualTime) / taskData.estimatedTime;
      if (percentDiff >= 0.2) {
        xp += Math.floor(xp * this.XP_RULES.BEAT_ESTIMATE_BONUS);
      }
    }

    return Math.floor(xp);
  }

  /**
   * Calculate level from total XP
   */
  calculateLevel(totalXP) {
    let level = 1;
    for (let i = 0; i < this.LEVEL_THRESHOLDS.length; i++) {
      if (totalXP >= this.LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return level;
  }

  /**
   * Get XP required for next level
   */
  getXPForNextLevel(currentLevel) {
    if (currentLevel >= this.LEVEL_THRESHOLDS.length) {
      return null; // Max level reached
    }
    return this.LEVEL_THRESHOLDS[currentLevel];
  }

  /**
   * Get XP progress to next level
   */
  getLevelProgress(totalXP, currentLevel) {
    if (currentLevel >= this.LEVEL_THRESHOLDS.length) {
      return { current: totalXP, needed: 0, percentage: 100 };
    }

    const currentLevelXP = this.LEVEL_THRESHOLDS[currentLevel - 1] || 0;
    const nextLevelXP = this.LEVEL_THRESHOLDS[currentLevel];
    const progressXP = totalXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const percentage = Math.floor((progressXP / neededXP) * 100);

    return {
      current: progressXP,
      needed: neededXP,
      percentage: Math.min(percentage, 100)
    };
  }

  /**
   * Check if any achievements were unlocked
   */
  checkAchievements(stats, unlockedAchievements) {
    const newAchievements = [];

    Object.values(this.ACHIEVEMENTS).forEach(achievement => {
      // Skip if already unlocked
      if (unlockedAchievements.includes(achievement.id)) {
        return;
      }

      let unlocked = false;

      switch (achievement.type) {
        case 'tasks_completed':
          unlocked = stats.totalTasksCompleted >= achievement.threshold;
          break;
        case 'streak':
          unlocked = stats.currentStreak >= achievement.threshold;
          break;
        case 'beat_estimate_20':
          unlocked = stats.beatEstimateCount >= achievement.threshold;
          break;
        case 'beat_estimate_count':
          unlocked = stats.beatEstimateCount >= achievement.threshold;
          break;
        case 'daily_focus':
          unlocked = stats.todayFocusTime >= achievement.threshold;
          break;
        case 'level':
          unlocked = stats.level >= achievement.threshold;
          break;
      }

      if (unlocked) {
        newAchievements.push(achievement);
      }
    });

    return newAchievements;
  }

  /**
   * Update streak based on last completion date
   */
  updateStreak(lastCompletionDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!lastCompletionDate) {
      // First task ever
      return { currentStreak: 1, longestStreak: 1, lastCompletionDate: today.toISOString() };
    }

    const lastDate = new Date(lastCompletionDate);
    lastDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change
      return null;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      const currentStreak = (this.state?.currentStreak || 0) + 1;
      const longestStreak = Math.max(currentStreak, this.state?.longestStreak || 0);
      return { currentStreak, longestStreak, lastCompletionDate: today.toISOString() };
    } else {
      // Streak broken, reset to 1
      return { currentStreak: 1, longestStreak: this.state?.longestStreak || 1, lastCompletionDate: today.toISOString() };
    }
  }

  /**
   * Get daily goal progress
   */
  getDailyGoalProgress(todayStats) {
    return {
      tasks: {
        current: todayStats.tasksCompleted || 0,
        goal: this.GOALS.DAILY_TASKS,
        percentage: Math.min(Math.floor(((todayStats.tasksCompleted || 0) / this.GOALS.DAILY_TASKS) * 100), 100)
      },
      focusTime: {
        current: todayStats.focusTime || 0,
        goal: this.GOALS.DAILY_FOCUS_TIME,
        percentage: Math.min(Math.floor(((todayStats.focusTime || 0) / this.GOALS.DAILY_FOCUS_TIME) * 100), 100)
      }
    };
  }

  /**
   * Get weekly goal progress
   */
  getWeeklyGoalProgress(weekStats) {
    return {
      tasks: {
        current: weekStats.tasksCompleted || 0,
        goal: this.GOALS.WEEKLY_TASKS,
        percentage: Math.min(Math.floor(((weekStats.tasksCompleted || 0) / this.GOALS.WEEKLY_TASKS) * 100), 100)
      },
      focusTime: {
        current: weekStats.focusTime || 0,
        goal: this.GOALS.WEEKLY_FOCUS_TIME,
        percentage: Math.min(Math.floor(((weekStats.focusTime || 0) / this.GOALS.WEEKLY_FOCUS_TIME) * 100), 100)
      }
    };
  }

  /**
   * Get all achievements
   */
  getAllAchievements() {
    return Object.values(this.ACHIEVEMENTS);
  }
}

module.exports = GamificationService;
