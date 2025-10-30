// Script to populate test data for analytics dashboards
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Generate random data for the past week
function generateTestData() {
  const now = Date.now();
  const sessions = [];
  const taskHistory = [];

  // Generate data for the past 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayStart = now - (dayOffset * 24 * 60 * 60 * 1000);
    
    // Generate 3-6 focus sessions per day
    const numSessions = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numSessions; i++) {
      const sessionStart = dayStart + (i * 2 * 60 * 60 * 1000) + Math.random() * 60 * 60 * 1000;
      const duration = 20 + Math.floor(Math.random() * 60);
      
      sessions.push({
        id: `session-${dayStart}-${i}`,
        type: 'focus',
        startTime: sessionStart,
        endTime: sessionStart + duration * 60 * 1000,
        durationMinutes: duration,
        isPomodoroMode: Math.random() > 0.5
      });
    }

    // Generate 1-3 break sessions per day
    const numBreaks = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numBreaks; i++) {
      const sessionStart = dayStart + (i * 2.5 * 60 * 60 * 1000) + Math.random() * 60 * 60 * 1000;
      const duration = 5 + Math.floor(Math.random() * 15);
      
      sessions.push({
        id: `break-${dayStart}-${i}`,
        type: 'break',
        startTime: sessionStart,
        endTime: sessionStart + duration * 60 * 1000,
        durationMinutes: duration,
        isPomodoroMode: Math.random() > 0.5
      });
    }

    // Generate 2-5 completed tasks per day
    const numTasks = 2 + Math.floor(Math.random() * 4);
    const categories = ['Development', 'Design', 'Meeting', 'Research', 'Documentation'];
    
    for (let i = 0; i < numTasks; i++) {
      const date = new Date(dayStart);
      taskHistory.push({
        id: `task-${dayStart}-${i}`,
        title: `Task ${i + 1} for ${date.toISOString().split('T')[0]}`,
        status: 'completed',
        category: categories[Math.floor(Math.random() * categories.length)],
        completedAt: dayStart + i * 60 * 60 * 1000,
        completedDate: date.toISOString().split('T')[0]
      });
    }
  }

  return { sessions, taskHistory };
}

// Write test data to files
async function writeTestData() {
  try {
    const userDataPath = app.getPath('userData');
    const { sessions, taskHistory } = generateTestData();

    // Write timer sessions
    const timerPath = path.join(userDataPath, 'timer-sessions.json');
    fs.writeFileSync(timerPath, JSON.stringify(sessions, null, 2));
    console.log(`✓ Written ${sessions.length} timer sessions to ${timerPath}`);

    // Write task history
    const taskPath = path.join(userDataPath, 'task-history.json');
    fs.writeFileSync(taskPath, JSON.stringify(taskHistory, null, 2));
    console.log(`✓ Written ${taskHistory.length} tasks to ${taskPath}`);

    console.log('\n✅ Test data generated successfully!');
    console.log('You can now view the analytics dashboards.');
  } catch (error) {
    console.error('Failed to write test data:', error);
  }
}

// Export for use in Electron
module.exports = { generateTestData, writeTestData };

// If run directly, execute the function
if (require.main === module) {
  writeTestData().then(() => {
    process.exit(0);
  });
}
