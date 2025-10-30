import { initializeDataLayer, taskStore, taskRepository, statsRepository } from './index';

async function exampleUsage() {
  console.log('=== Task Manager Data Layer Example ===\n');

  console.log('1. Initializing data layer...');
  await initializeDataLayer({
    performRollover: true,
    onRolloverComplete: (count) => {
      console.log(`   ✓ Rolled over ${count} tasks from yesterday\n`);
    },
  });

  console.log('2. Creating tasks...');
  const task1 = await taskStore.getState().createTask({
    title: 'Write documentation',
    description: 'Complete the API documentation',
    estimatedMinutes: 120,
    priority: 'high',
    categories: ['Work', 'Documentation'],
    tags: ['important', 'writing'],
  });
  console.log(`   ✓ Created task: "${task1.title}" (${task1.id})\n`);

  const task2 = await taskStore.getState().createTask({
    title: 'Code review',
    estimatedMinutes: 60,
    priority: 'medium',
    categories: ['Work'],
  });
  console.log(`   ✓ Created task: "${task2.title}" (${task2.id})\n`);

  console.log('3. Starting timer for first task...');
  await taskStore.getState().startTimer(task1.id);
  console.log(`   ✓ Timer started\n`);

  console.log('4. Simulating work (waiting 3 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const activeTask = taskStore.getState().getActiveTaskWithElapsed();
  if (activeTask) {
    console.log(`   ✓ Active task: "${activeTask.title}"`);
    console.log(`   ✓ Elapsed time: ${activeTask.currentElapsedMinutes} minutes\n`);
  }

  console.log('5. Pausing timer...');
  await taskStore.getState().pauseTimer();
  console.log(`   ✓ Timer paused\n`);

  console.log('6. Checking task stats...');
  const stats = await taskRepository.getTaskStats();
  console.log(`   ✓ Total tasks: ${stats.total}`);
  console.log(`   ✓ In progress: ${stats.inProgress}`);
  console.log(`   ✓ Paused: ${stats.paused}`);
  console.log(`   ✓ Not started: ${stats.notStarted}\n`);

  console.log('7. Completing first task...');
  await taskStore.getState().completeTask(task1.id);
  console.log(`   ✓ Task completed\n`);

  console.log('8. Checking daily stats...');
  const today = new Date().toISOString().split('T')[0];
  const todayStats = await statsRepository.getDailyStats(today);
  console.log(`   ✓ Tasks completed today: ${todayStats.tasksCompleted}`);
  console.log(`   ✓ Focus time today: ${todayStats.focusTimeMinutes} minutes`);
  console.log(`   ✓ XP earned today: ${todayStats.totalXPEarned}\n`);

  console.log('9. Checking streak...');
  const streakStats = await statsRepository.getStreakStats();
  console.log(`   ✓ Current streak: ${streakStats.currentStreak} days`);
  console.log(`   ✓ Longest streak: ${streakStats.longestStreak} days\n`);

  console.log('10. Getting all tasks...');
  const allTasks = taskStore.getState().tasks;
  console.log(`   ✓ Total tasks in store: ${allTasks.length}`);
  allTasks.forEach(task => {
    console.log(`      - ${task.title} (${task.status})`);
  });

  console.log('\n=== Example completed successfully! ===');
}

if (typeof window === 'undefined' && require.main === module) {
  exampleUsage().catch(console.error);
}

export { exampleUsage };
