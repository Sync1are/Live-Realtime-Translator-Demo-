# Data Layer Integration Guide

This guide explains how to integrate the new TypeScript-based data layer into your existing Electron application.

## Overview

The data layer provides:
- **TypeScript-first**: Full type safety with domain models
- **Dexie IndexedDB**: Robust client-side persistence with migrations
- **Zustand Store**: Reactive global state management
- **Session Persistence**: Automatic timer/task state restoration
- **Daily Rollover**: Automated task carry-over from previous days
- **Comprehensive Testing**: Unit tests for all core functionality

## Installation

Dependencies are already installed. The key packages are:
- `dexie`: IndexedDB wrapper with schema versioning
- `zustand`: Lightweight state management
- `typescript`: Type safety and better DX
- `vitest`: Modern testing framework

## Quick Start

### 1. Initialize in Renderer Process

Add to your main HTML file or renderer entry point:

```html
<!-- In your HTML -->
<script type="module">
  import { initializeDataLayer, taskStore } from './dist/index.js';
  
  // Initialize on page load
  window.addEventListener('DOMContentLoaded', async () => {
    await initializeDataLayer({
      performRollover: true,
      onRolloverComplete: (count) => {
        if (count > 0) {
          console.log(`${count} tasks carried over from yesterday`);
          // Show notification or update UI
        }
      }
    });
    
    // Store is now ready to use
    console.log('Data layer initialized');
  });
</script>
```

### 2. Using the Task Store

The task store is the primary interface for task management:

```javascript
import { taskStore } from './dist/index.js';

// Get current state
const state = taskStore.getState();

// Create a task
const task = await state.createTask({
  title: 'New Task',
  description: 'Task description',
  estimatedMinutes: 60,
  priority: 'high',
  categories: ['Work'],
  tags: ['important']
});

// Start timer
await state.startTimer(task.id);

// Get active task with elapsed time
const activeTask = state.getActiveTaskWithElapsed();
console.log(`Working on: ${activeTask.title}`);
console.log(`Elapsed: ${activeTask.currentElapsedMinutes}m`);

// Pause timer
await state.pauseTimer();

// Complete task
await state.completeTask(task.id);

// Subscribe to state changes
const unsubscribe = taskStore.subscribe((state) => {
  console.log('Tasks updated:', state.tasks);
  updateUI(state.tasks);
});

// Unsubscribe when done
unsubscribe();
```

### 3. Direct Repository Access

For more advanced queries, use repositories directly:

```javascript
import { 
  taskRepository, 
  timeLogRepository, 
  statsRepository 
} from './dist/index.js';

// Get incomplete tasks
const incompleteTasks = await taskRepository.getIncomplete();

// Get tasks by category
const workTasks = await taskRepository.getByCategory('Work');

// Get tasks pending from yesterday
const rollovers = await taskRepository.getPendingFromYesterday();

// Get time logs for a task
const logs = await timeLogRepository.getByTaskId(taskId);

// Get today's statistics
const today = new Date().toISOString().split('T')[0];
const stats = await statsRepository.getDailyStats(today);

// Update streak
await statsRepository.updateStreak(today);
```

## Integration with Existing Code

### Replacing TaskService.js

The new data layer replaces `TaskService.js`. Here's a migration guide:

#### Old (TaskService.js):
```javascript
const taskService = new TaskService(timerService);
await taskService.initialize();

const task = await taskService.createTask({
  title: 'My Task',
  estimatedMinutes: 60
});

await taskService.startTimer(task.id);
```

#### New (Data Layer):
```javascript
import { initializeDataLayer, taskStore } from './dist/index.js';

await initializeDataLayer();

const task = await taskStore.getState().createTask({
  title: 'My Task',
  estimatedMinutes: 60
});

await taskStore.getState().startTimer(task.id);
```

### Accessing in Electron Main Process

You can expose the data layer to the main process via IPC:

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('taskManager', {
  createTask: (data) => ipcRenderer.invoke('task:create', data),
  startTimer: (taskId) => ipcRenderer.invoke('task:startTimer', taskId),
  pauseTimer: () => ipcRenderer.invoke('task:pauseTimer'),
  completeTask: (taskId) => ipcRenderer.invoke('task:complete', taskId),
  getTasks: () => ipcRenderer.invoke('task:getAll'),
  onTasksChanged: (callback) => {
    ipcRenderer.on('tasks:changed', (_, tasks) => callback(tasks));
  }
});

// main.js
const { ipcMain } = require('electron');
// Note: You'll need to set up communication with renderer for actual operations

ipcMain.handle('task:create', async (event, data) => {
  // Send to renderer process where data layer runs
  const win = BrowserWindow.getFocusedWindow();
  return await win.webContents.executeJavaScript(`
    taskStore.getState().createTask(${JSON.stringify(data)})
  `);
});
```

## Key Features

### 1. Time Accumulation

Tasks accurately track time across multiple sessions:

```javascript
// Start timer
await taskStore.getState().startTimer(taskId);

// Check elapsed time (updates every second)
const activeTask = taskStore.getState().getActiveTaskWithElapsed();
console.log(`Current session: ${activeTask.currentElapsedMinutes}m`);
console.log(`Total time: ${activeTask.actualMinutes}m`);

// Pause (time is persisted)
await taskStore.getState().pauseTimer();

// Resume later
await taskStore.getState().resumeTimer(taskId);
```

### 2. Session Persistence

Active task and timer state survive page reloads:

```javascript
// User closes browser/app with active timer
await taskStore.getState().startTimer(taskId);
// ... app closes ...

// On next launch, state is restored automatically
await initializeDataLayer();
const state = taskStore.getState();
if (state.activeTask) {
  console.log('Restored active task:', state.activeTask.taskId);
}
```

### 3. Daily Rollover

Incomplete tasks from previous days are automatically flagged:

```javascript
// Run at app startup (done automatically by initializeDataLayer)
import { performDailyRollover } from './dist/index.js';

const result = await performDailyRollover();
console.log(`${result.rolledOver} tasks marked as pending from yesterday`);

// Query rollover tasks
const rollovers = await taskRepository.getPendingFromYesterday();
rollovers.forEach(task => {
  console.log(`⚠️ ${task.title} - Pending from yesterday`);
});
```

### 4. Gamification & XP

Calculate XP and track streaks:

```javascript
import { calculateTaskXP, getLevelProgress } from './dist/index.js';

// XP is calculated automatically on task completion
// But you can also calculate manually:
const xp = calculateTaskXP({
  focusTimeMinutes: 25,
  currentStreak: 5,
  estimatedMinutes: 30,
  actualMinutes: 20 // Beat estimate!
});

// Check level progress
const progress = getLevelProgress(totalXP);
console.log(`Level ${progress.currentLevel}`);
console.log(`Progress: ${progress.currentLevelXP}/${progress.xpRequiredForNext}`);
console.log(`${progress.percentage}% to next level`);
```

## UI Integration Examples

### Display Active Timer

```javascript
// Update UI every second
let timerInterval;

taskStore.subscribe((state) => {
  if (state.activeTask) {
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        state.updateElapsedTime();
        updateTimerDisplay();
      }, 1000);
    }
  } else {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
});

function updateTimerDisplay() {
  const activeTask = taskStore.getState().getActiveTaskWithElapsed();
  if (activeTask) {
    const minutes = activeTask.currentElapsedMinutes;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    document.getElementById('timer').textContent = 
      `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}
```

### Display Task List

```javascript
function renderTasks() {
  const { tasks } = taskStore.getState();
  const taskList = document.getElementById('task-list');
  
  taskList.innerHTML = tasks.map(task => `
    <div class="task-card ${task.isPendingFromYesterday ? 'rollover' : ''}">
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <div class="task-meta">
        <span class="priority ${task.priority}">${task.priority}</span>
        <span class="status">${task.status}</span>
        ${task.isPendingFromYesterday ? '<span class="rollover-badge">From Yesterday</span>' : ''}
      </div>
      <div class="task-actions">
        ${task.status === 'not_started' ? 
          `<button onclick="startTask('${task.id}')">Start</button>` : ''}
        ${task.status === 'in_progress' ? 
          `<button onclick="pauseTask()">Pause</button>` : ''}
        ${task.status === 'paused' ? 
          `<button onclick="resumeTask('${task.id}')">Resume</button>` : ''}
        ${task.status !== 'completed' ? 
          `<button onclick="completeTask('${task.id}')">Complete</button>` : ''}
      </div>
    </div>
  `).join('');
}

// Subscribe to changes
taskStore.subscribe(renderTasks);
```

### Display Statistics Dashboard

```javascript
async function renderStats() {
  const today = new Date().toISOString().split('T')[0];
  const dailyStats = await statsRepository.getDailyStats(today);
  const streakStats = await statsRepository.getStreakStats();
  const taskStats = await taskRepository.getTaskStats();
  
  document.getElementById('stats').innerHTML = `
    <div class="stat-card">
      <h4>Today</h4>
      <p>${dailyStats.tasksCompleted} tasks completed</p>
      <p>${dailyStats.focusTimeMinutes}m focus time</p>
      <p>${dailyStats.totalXPEarned} XP earned</p>
    </div>
    <div class="stat-card">
      <h4>Streak</h4>
      <p>🔥 ${streakStats.currentStreak} days</p>
      <p>Best: ${streakStats.longestStreak} days</p>
    </div>
    <div class="stat-card">
      <h4>Tasks</h4>
      <p>${taskStats.completed} completed</p>
      <p>${taskStats.inProgress} in progress</p>
      <p>${taskStats.notStarted} not started</p>
    </div>
  `;
}
```

## Testing

Run the test suite to verify everything works:

```bash
# Run all tests
npm test

# Run in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## TypeScript Usage

If using TypeScript in your renderer process:

```typescript
import { 
  taskStore, 
  TaskStore,
  Task, 
  CreateTaskInput,
  initializeDataLayer 
} from './dist/index';

// Type-safe task creation
const taskInput: CreateTaskInput = {
  title: 'My Task',
  estimatedMinutes: 60,
  priority: 'high'
};

const task: Task = await taskStore.getState().createTask(taskInput);

// Type-safe store access
const state: TaskStore = taskStore.getState();
```

## Troubleshooting

### Tasks not persisting
- Check browser console for IndexedDB errors
- Verify `initializeDataLayer()` is called before any operations
- Check if browser has disabled IndexedDB

### Timer not restoring on reload
- Verify localStorage is enabled
- Check if task status is 'in_progress' when restoring
- Look for console warnings during hydration

### Rollover not working
- Verify `performRollover: true` in init options
- Check system date/time settings
- Look at `lastRolloverDate` in localStorage

### Type errors
- Rebuild TypeScript: `npm run build`
- Check TypeScript version compatibility
- Verify imports are from `./dist/` after build

## Performance Tips

1. **Batch operations**: Group multiple task updates together
2. **Subscribe wisely**: Unsubscribe from store when component unmounts
3. **Use repositories**: For read-heavy operations, use repositories directly
4. **Index usage**: Dexie automatically uses indexes for filtered queries

## Next Steps

1. Migrate existing task UI to use new store
2. Add real-time sync if needed (e.g., via WebSocket)
3. Implement task import/export using repositories
4. Add more gamification features using XP calculator
5. Create custom queries using Dexie directly

## Support

- See tests in `src/tests/` for usage examples
- Check `src/example.ts` for a complete demo
- Review inline TypeScript documentation
- Refer to Dexie docs: https://dexie.org/
- Refer to Zustand docs: https://github.com/pmndrs/zustand
