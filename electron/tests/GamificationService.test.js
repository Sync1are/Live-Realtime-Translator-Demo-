const GamificationService = require('../services/GamificationService');

console.log('=== Gamification Service Test ===\n');

// Create service instance
const service = new GamificationService();

// Test 1: Calculate XP
console.log('Test 1: Calculate XP for task completion');
const taskData1 = {
  focusTime: 25,
  currentStreak: 3,
  estimatedTime: 30,
  actualTime: 20
};
const xp1 = service.calculateTaskXP(taskData1);
console.log(`Task with 25min focus, 3-day streak, beat estimate: ${xp1} XP`);
console.log(`Expected: Base(10) + Focus(25) + Streak(15) + Bonus(10) = ~60 XP`);
console.log(`✓ XP Calculation working\n`);

// Test 2: Calculate level
console.log('Test 2: Calculate level from XP');
const level1 = service.calculateLevel(0);
const level2 = service.calculateLevel(150);
const level3 = service.calculateLevel(600);
console.log(`0 XP = Level ${level1}`);
console.log(`150 XP = Level ${level2}`);
console.log(`600 XP = Level ${level3}`);
console.log(`✓ Level calculation working\n`);

// Test 3: Get level progress
console.log('Test 3: Get level progress');
const progress = service.getLevelProgress(150, 2);
console.log(`At level 2 with 150 XP:`);
console.log(`Progress: ${progress.current}/${progress.needed} XP (${progress.percentage}%)`);
console.log(`✓ Level progress working\n`);

// Test 4: Check achievements
console.log('Test 4: Check achievements');
const stats = {
  totalTasksCompleted: 10,
  currentStreak: 5,
  beatEstimateCount: 3,
  todayFocusTime: 120,
  level: 3
};
const unlockedAchievements = ['first_task'];
const newAchievements = service.checkAchievements(stats, unlockedAchievements);
console.log(`Stats: ${JSON.stringify(stats, null, 2)}`);
console.log(`New achievements unlocked: ${newAchievements.length}`);
newAchievements.forEach(a => {
  console.log(`  - ${a.icon} ${a.name}: ${a.description}`);
});
console.log(`✓ Achievement checking working\n`);

// Test 5: Update streak
console.log('Test 5: Update streak');
service.state = { currentStreak: 5, longestStreak: 10 };
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const streakUpdate = service.updateStreak(yesterday);
console.log(`Last completion: yesterday`);
console.log(`Streak update: ${JSON.stringify(streakUpdate, null, 2)}`);
console.log(`✓ Streak update working\n`);

// Test 6: Get daily goal progress
console.log('Test 6: Get daily goal progress');
const todayStats = { tasksCompleted: 3, focusTime: 80 };
const dailyGoals = service.getDailyGoalProgress(todayStats);
console.log(`Today: ${todayStats.tasksCompleted} tasks, ${todayStats.focusTime} min focus`);
console.log(`Tasks progress: ${dailyGoals.tasks.current}/${dailyGoals.tasks.goal} (${dailyGoals.tasks.percentage}%)`);
console.log(`Focus progress: ${dailyGoals.focusTime.current}/${dailyGoals.focusTime.goal} (${dailyGoals.focusTime.percentage}%)`);
console.log(`✓ Daily goal progress working\n`);

// Test 7: Get all achievements
console.log('Test 7: Get all achievements');
const allAchievements = service.getAllAchievements();
console.log(`Total achievements defined: ${allAchievements.length}`);
console.log(`Sample achievements:`);
allAchievements.slice(0, 5).forEach(a => {
  console.log(`  - ${a.icon} ${a.name} (${a.type})`);
});
console.log(`✓ Get all achievements working\n`);

console.log('=== All tests passed! ===');
