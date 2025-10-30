# Gamification System Guide

## Overview

The task management notification engine now includes a comprehensive gamification system that rewards users for completing tasks, maintaining streaks, and achieving goals. The system includes:

- **XP (Experience Points)** and **Levels**
- **Achievement System** with 15+ unique achievements
- **Streak Tracking** for consecutive days of task completion
- **Daily and Weekly Goals** for tasks and focus time
- **Celebratory Feedback** with confetti, animations, and sounds
- **Persistent Storage** using IndexedDB

## Features

### 1. XP and Leveling System

#### XP Calculation Rules

When you complete a task, you earn XP based on:

- **Base XP**: 10 XP per task
- **Focus Time Bonus**: 1 XP per minute of focus time
- **Streak Bonus**: 5 XP per day of your current streak
- **Beat Estimate Bonus**: 20% bonus if you complete the task 20% faster than estimated

**Example**: A task with 25 minutes of focus time, on a 3-day streak, that beat the estimate by 20%:
- Base: 10 XP
- Focus: 25 XP (25 minutes)
- Streak: 15 XP (3 days × 5)
- Bonus: 10 XP (20% of 50)
- **Total**: 60 XP

#### Level Progression

The system has 20 levels with increasing XP requirements:

| Level | XP Required | Level | XP Required |
|-------|-------------|-------|-------------|
| 1     | 0           | 11    | 11,500      |
| 2     | 100         | 12    | 15,000      |
| 3     | 250         | 13    | 20,000      |
| 4     | 500         | 14    | 25,000      |
| 5     | 1,000       | 15    | 30,000      |
| 6     | 1,500       | 16    | 40,000      |
| 7     | 2,500       | 17    | 50,000      |
| 8     | 4,000       | 18    | 65,000      |
| 9     | 6,000       | 19    | 80,000      |
| 10    | 8,500       | 20    | 100,000     |

### 2. Streak System

**How it works**:
- Complete at least one task each day to maintain your streak
- Streaks are calculated based on consecutive calendar days
- Missing a day resets your streak to 1
- Your longest streak is tracked separately

**Streak Benefits**:
- Bonus XP for each day of your streak (5 XP/day)
- Unlock streak-based achievements at 3, 5, 7, and 30 days

### 3. Achievements

The system tracks 15 unique achievements across different categories:

#### Task Completion Achievements
- 🎯 **Getting Started**: Complete your first task
- ⭐ **Productive**: Complete 10 tasks
- 🏆 **Task Master**: Complete 50 tasks
- 👑 **Centurion**: Complete 100 tasks

#### Streak Achievements
- 🔥 **On a Roll**: Maintain a 3-day streak
- 💪 **Consistency**: Maintain a 5-day streak
- 🌟 **Week Warrior**: Maintain a 7-day streak
- 💎 **Unstoppable**: Maintain a 30-day streak

#### Efficiency Achievements
- ⚡ **Speed Demon**: Beat estimate by 20% or more
- 🎖️ **Efficiency Expert**: Beat estimate 5 times

#### Focus Achievements
- 🧠 **Focused Mind**: Complete 60 minutes of focus time in a day
- 🎓 **Deep Work**: Complete 240 minutes of focus time in a day

#### Level Achievements
- ⬆️ **Rising Star**: Reach level 5
- 🚀 **Expert**: Reach level 10
- 🏅 **Legend**: Reach level 20

### 4. Daily and Weekly Goals

#### Daily Goals
- **Tasks**: 5 tasks per day
- **Focus Time**: 120 minutes (2 hours) per day

#### Weekly Goals
- **Tasks**: 25 tasks per week
- **Focus Time**: 600 minutes (10 hours) per week

Progress bars show your current progress toward each goal.

### 5. Celebratory Feedback

When you complete a task, the system provides immediate positive feedback:

#### Visual Effects
- 🎊 **Confetti Burst**: Colorful confetti animation using canvas-confetti
- ✅ **Checkmark Animation**: Animated checkmark with SVG stroke animation
- 📊 **XP Popup**: Shows XP earned and level-up notifications
- 🏆 **Achievement Notifications**: Pop-up displays for newly unlocked achievements

#### Audio Feedback
- **Completion Sound**: Two-tone musical chime (C5 → E5) using Web Audio API
- Can be toggled on/off in settings

### 6. Settings and Controls

You can customize the gamification experience:

- **Confetti Effects**: Enable/disable confetti animations
- **Animations**: Enable/disable checkmark and other animations
- **Sound Effects**: Enable/disable completion sounds

All settings are persisted and respect your preferences across sessions.

## Technical Implementation

### Data Storage

All gamification data is stored in **IndexedDB** for persistence:

#### Object Stores

1. **gamification**: Main state (XP, level, streak, etc.)
   ```javascript
   {
     totalXP: 150,
     level: 2,
     currentStreak: 5,
     longestStreak: 10,
     totalTasksCompleted: 25,
     beatEstimateCount: 7,
     lastCompletionDate: "2024-01-15T00:00:00.000Z"
   }
   ```

2. **achievements**: Unlocked achievements
   ```javascript
   {
     id: "tasks_10",
     name: "Productive",
     icon: "⭐",
     unlockedAt: "2024-01-15T10:30:00.000Z"
   }
   ```

3. **dailyStats**: Daily task and focus time tracking
   ```javascript
   {
     date: "2024-01-15",
     tasksCompleted: 3,
     focusTime: 75
   }
   ```

4. **weeklyStats**: Weekly aggregates
   ```javascript
   {
     week: "2024-W03",
     tasksCompleted: 18,
     focusTime: 425
   }
   ```

### Services

#### GamificationService (Main Process)
Located: `electron/services/GamificationService.js`

Handles all gamification logic:
- XP calculation
- Level determination
- Achievement checking
- Streak updates
- Goal progress

#### StorageService (Renderer Process)
Located: `electron/services/StorageService.js`

Manages IndexedDB operations:
- Initialize database
- Save/load gamification state
- Track daily and weekly stats
- Unlock achievements

### API Reference

#### Calculate XP
```javascript
await window.notificationAPI.gamificationCalculateXP(taskData);
```

#### Check Achievements
```javascript
const newAchievements = await window.notificationAPI.gamificationCheckAchievements(
  stats,
  unlockedAchievements
);
```

#### Update Streak
```javascript
const streakUpdate = await window.notificationAPI.gamificationUpdateStreak(
  lastCompletionDate
);
```

#### Get Goal Progress
```javascript
const dailyGoals = await window.notificationAPI.gamificationGetDailyGoalProgress(todayStats);
const weeklyGoals = await window.notificationAPI.gamificationGetWeeklyGoalProgress(weekStats);
```

## Usage

### Integration with Task Completion

When a task is completed, call the `onTaskCompleted` function:

```javascript
await onTaskCompleted({
  focusTime: 25,           // minutes of focus time
  estimatedTime: 30,       // estimated minutes (optional)
  actualTime: 23           // actual minutes taken (optional)
});
```

This will:
1. Calculate and award XP
2. Update streak if applicable
3. Check for new achievements
4. Update daily/weekly stats
5. Show celebration effects
6. Persist all data to IndexedDB

### Testing

Use the **"Test Task Completion"** button in the gamification widget to simulate a task completion and see all the effects in action.

### Running Tests

```bash
node electron/tests/GamificationService.test.js
```

## Best Practices

1. **Complete Tasks Daily**: Maintain your streak for bonus XP
2. **Beat Estimates**: Try to complete tasks faster for bonus XP
3. **Track Focus Time**: The more you focus, the more XP you earn
4. **Set Realistic Goals**: Start with achievable daily goals and increase gradually
5. **Customize Settings**: Disable effects if they become distracting

## Troubleshooting

### Gamification Widget Not Loading

Check browser console for errors. Ensure:
- IndexedDB is supported and available
- StorageService.js is loaded correctly
- IPC communication is working

### Data Not Persisting

- Check that IndexedDB is not disabled in browser/Electron settings
- Verify that userData directory is writable
- Clear browser cache and restart app if needed

### Achievements Not Unlocking

- Ensure stats are being tracked correctly
- Check that achievement thresholds are met
- Verify that the achievement hasn't already been unlocked

## Future Enhancements

Potential additions to the gamification system:

- **Leaderboards**: Compare progress with other users
- **Custom Achievements**: User-defined achievement goals
- **Reward Shop**: Spend XP on themes, avatars, etc.
- **Daily Challenges**: Special tasks for bonus XP
- **Statistics Dashboard**: Detailed analytics and graphs
- **Export Progress**: Share achievements on social media

## Credits

Built with:
- [canvas-confetti](https://github.com/catdad/canvas-confetti) for celebration effects
- [lottie-web](https://github.com/airbnb/lottie-web) for advanced animations
- Web Audio API for sound effects
- IndexedDB for data persistence
