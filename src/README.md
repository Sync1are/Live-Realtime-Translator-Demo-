# Task Manager Data Layer

A modern TypeScript-based data layer for the task management application, featuring IndexedDB persistence with Dexie, reactive state management with Zustand, and comprehensive testing with Vitest.

## Features

- 📦 **TypeScript Domain Models**: Fully typed entities for tasks, time logs, focus events, achievements, break sessions, streaks, and settings
- 🗄️ **Dexie-backed IndexedDB**: Robust client-side persistence with versioning and migrations
- 🔄 **Zustand State Management**: Reactive global store with automatic hydration from IndexedDB
- 💾 **Session Persistence**: Automatic restoration of active tasks and timer state across app restarts
- 📅 **Daily Rollover**: Automated routine that marks incomplete tasks from previous days
- ✅ **Comprehensive Testing**: Unit tests for all core functionality with Vitest

## Getting Started

### Installation

The dependencies are already installed:

```bash
npm install
```

### Building

Compile TypeScript to JavaScript:

```bash
npm run build
```

Watch mode for development:

```bash
npm run build:watch
```

Type checking only:

```bash
npm run type-check
```

### Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Usage

### Initialize the Data Layer

```typescript
import { initializeDataLayer } from './src/index';

// Initialize on app startup
await initializeDataLayer({
  performRollover: true,
  onRolloverComplete: (count) => {
    console.log(`${count} tasks marked as pending from yesterday`);
  },
});
```

### Using the Task Store

```typescript
import { taskStore } from './src/store/taskStore';

// Create a task
const task = await taskStore.getState().createTask({
  title: 'Complete project documentation',
  description: 'Write comprehensive docs',
  estimatedMinutes: 120,
  priority: 'high',
  categories: ['Work'],
  tags: ['documentation'],
});

// Start timer
await taskStore.getState().startTimer(task.id);

// Get active task with current elapsed time
const activeTask = taskStore.getState().getActiveTaskWithElapsed();
console.log(`Active task: ${activeTask?.title}, elapsed: ${activeTask?.currentElapsedMinutes}m`);

// Pause timer
await taskStore.getState().pauseTimer();

// Complete task
await taskStore.getState().completeTask(task.id);
```

### Using Repositories Directly

```typescript
import { taskRepository, timeLogRepository, statsRepository } from './src/index';

// Get all incomplete tasks
const incompleteTasks = await taskRepository.getIncomplete();

// Get time logs for a task
const logs = await timeLogRepository.getByTaskId(taskId);

// Get today's stats
const today = new Date().toISOString().split('T')[0];
const todayStats = await statsRepository.getDailyStats(today);

// Update streak
await statsRepository.updateStreak(today);
```

## Architecture

### Domain Models

Located in `src/models/`:

- **Task.ts**: Task entity with status, priority, categories, and time tracking
- **TimeLog.ts**: Individual time tracking sessions for tasks
- **FocusEvent.ts**: Focus monitoring events for productivity tracking
- **Achievement.ts**: Gamification achievements
- **BreakSession.ts**: Break tracking for Pomodoro technique
- **Streak.ts**: Daily/weekly stats and streak tracking
- **Settings.ts**: Application settings with defaults

### Database Layer

Located in `src/db/`:

- **Database.ts**: Dexie database schema with versioning
- **TaskRepository.ts**: CRUD operations and queries for tasks
- **TimeLogRepository.ts**: Time log management
- **StatsRepository.ts**: Statistics and streak management
- **SettingsRepository.ts**: Settings persistence

### State Management

Located in `src/store/`:

- **taskStore.ts**: Zustand store for global task state with:
  - Automatic hydration from IndexedDB
  - Active task tracking with real-time elapsed time
  - Write-through caching to database
  - Session persistence

### Utilities

Located in `src/utils/`:

- **idGenerator.ts**: Unique ID generation
- **timeUtils.ts**: Time calculation and formatting utilities
- **xpCalculator.ts**: Experience points and level calculation
- **dailyRollover.ts**: Daily rollover routine implementation

## Key Features

### Time Accumulation

Tasks accurately track time across multiple sessions:

```typescript
// Timer tracks elapsed time in real-time
const activeTask = taskStore.getState().getActiveTaskWithElapsed();
console.log(`Current session: ${activeTask?.currentElapsedMinutes}m`);
console.log(`Total time: ${activeTask?.actualMinutes}m`);

// Time is persisted when paused
await taskStore.getState().pauseTimer();
```

### Daily Rollover

Automatically marks incomplete tasks from previous days:

```typescript
import { performDailyRollover, shouldPerformRollover } from './src/utils/dailyRollover';

if (shouldPerformRollover()) {
  const result = await performDailyRollover();
  console.log(`${result.rolledOver} tasks marked as pending from yesterday`);
}
```

### Session Persistence

Active task and timer state survive app reloads:

```typescript
// State is automatically saved on timer start
await taskStore.getState().startTimer(taskId);

// State is automatically restored on hydration
await taskStore.getState().hydrate();
```

### XP and Streak Calculation

Gamification features with automatic calculation:

```typescript
import { calculateTaskXP, getLevelProgress } from './src/utils/xpCalculator';

// Calculate XP for task completion
const xp = calculateTaskXP({
  focusTimeMinutes: 25,
  currentStreak: 5,
  estimatedMinutes: 30,
  actualMinutes: 20, // Beat estimate = bonus!
});

// Get level progress
const progress = getLevelProgress(totalXP);
console.log(`Level ${progress.currentLevel} (${progress.percentage}% to next)`);
```

## Testing

Tests are located in `src/tests/`:

- **timeUtils.test.ts**: Time calculation and formatting
- **xpCalculator.test.ts**: XP and level calculations
- **dailyRollover.test.ts**: Rollover logic
- **taskStore.test.ts**: Store operations and state management

All tests use Vitest with mocked dependencies for isolated unit testing.

## Migration from Legacy System

The new data layer coexists with the existing JavaScript services. To migrate:

1. Initialize the data layer alongside existing services
2. Gradually replace TaskService.js calls with taskStore operations
3. Use the new TypeScript models for type safety
4. Migrate UI components to use Zustand store

## API Reference

See inline TypeScript documentation and type definitions for detailed API reference.

## Contributing

When adding new features:

1. Add TypeScript models in `src/models/`
2. Update database schema in `src/db/Database.ts` with new version
3. Create/update repositories in `src/db/`
4. Add utility functions in `src/utils/`
5. Write comprehensive tests in `src/tests/`
6. Update this README
