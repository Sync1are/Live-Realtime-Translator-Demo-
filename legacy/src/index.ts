import { db } from './db/Database';
import { taskStore } from './store/taskStore';
import { performDailyRollover, shouldPerformRollover } from './utils/dailyRollover';

export { db } from './db/Database';
export { taskRepository } from './db/TaskRepository';
export { timeLogRepository } from './db/TimeLogRepository';
export { statsRepository } from './db/StatsRepository';
export { settingsRepository } from './db/SettingsRepository';
export { taskStore } from './store/taskStore';
export * from './models/Task';
export * from './models/TimeLog';
export * from './models/FocusEvent';
export * from './models/Achievement';
export * from './models/BreakSession';
export * from './models/Streak';
export * from './models/Settings';
export * from './utils/timeUtils';
export * from './utils/xpCalculator';
export * from './utils/dailyRollover';

export interface InitOptions {
  performRollover?: boolean;
  onRolloverComplete?: (rolledOverCount: number) => void;
}

export async function initializeDataLayer(options: InitOptions = {}): Promise<void> {
  const { performRollover: shouldRollover = true, onRolloverComplete } = options;

  await db.open();
  console.log('Database initialized');

  if (shouldRollover && shouldPerformRollover()) {
    const result = await performDailyRollover();
    console.log(`Daily rollover completed: ${result.rolledOver} tasks marked as pending from yesterday`);
    
    if (onRolloverComplete) {
      onRolloverComplete(result.rolledOver);
    }
  }

  await taskStore.getState().hydrate();
  console.log('Task store hydrated');

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      const state = taskStore.getState();
      if (state.activeTask) {
        console.log('Persisting active task state before unload');
      }
    });

    setInterval(() => {
      const state = taskStore.getState();
      if (state.activeTask) {
        state.updateElapsedTime();
      }
    }, 1000);
  }
}

export function getTaskStore() {
  return taskStore;
}
