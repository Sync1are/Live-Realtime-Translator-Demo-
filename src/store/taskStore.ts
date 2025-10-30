import { createStore } from 'zustand/vanilla';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '../models/Task';
import { TimeLog } from '../models/TimeLog';
import { taskRepository } from '../db/TaskRepository';
import { timeLogRepository } from '../db/TimeLogRepository';
import { statsRepository } from '../db/StatsRepository';
import { calculateElapsedMinutes, getTodayDate } from '../utils/timeUtils';
import { calculateTaskXP } from '../utils/xpCalculator';

interface ActiveTaskState {
  taskId: string;
  startTime: number;
  currentElapsedMinutes: number;
}

export interface TaskStore {
  tasks: Task[];
  activeTask: ActiveTaskState | null;
  isLoading: boolean;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<Task | undefined>;
  deleteTask: (id: string) => Promise<boolean>;
  startTimer: (taskId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  getActiveTaskWithElapsed: () => (Task & { currentElapsedMinutes: number }) | null;
  updateElapsedTime: () => void;
}

export const taskStore = createStore<TaskStore>((set, get) => ({
  tasks: [],
  activeTask: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const tasks = await taskRepository.getAll();
      
      const sessionState = loadSessionState();
      let activeTask: ActiveTaskState | null = null;

      if (sessionState?.activeTaskId) {
        const task = tasks.find(t => t.id === sessionState.activeTaskId);
        if (task && task.status === 'in_progress') {
          activeTask = {
            taskId: sessionState.activeTaskId,
            startTime: sessionState.startTime || Date.now(),
            currentElapsedMinutes: 0,
          };
        }
      }

      set({ tasks, activeTask, isHydrated: true, isLoading: false });
    } catch (error) {
      console.error('Failed to hydrate store:', error);
      set({ isLoading: false, isHydrated: true });
    }
  },

  createTask: async (input: CreateTaskInput) => {
    const task = await taskRepository.create(input);
    set(state => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id: string, updates: UpdateTaskInput) => {
    const task = await taskRepository.update(id, updates);
    if (task) {
      set(state => ({
        tasks: state.tasks.map(t => (t.id === id ? task : t)),
      }));
    }
    return task;
  },

  deleteTask: async (id: string) => {
    const state = get();
    if (state.activeTask?.taskId === id) {
      throw new Error('Cannot delete active task');
    }

    await taskRepository.delete(id);
    await timeLogRepository.deleteByTaskId(id);

    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
    }));

    return true;
  },

  startTimer: async (taskId: string) => {
    const state = get();
    
    if (state.activeTask?.taskId === taskId) {
      return;
    }

    if (state.activeTask) {
      await get().pauseTimer();
    }

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const now = Date.now();
    const updates: UpdateTaskInput = {
      status: 'in_progress' as TaskStatus,
    };

    if (task.status === 'not_started') {
      updates.startedDate = new Date().toISOString();
    }

    await taskRepository.update(taskId, updates);

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
      activeTask: {
        taskId,
        startTime: now,
        currentElapsedMinutes: 0,
      },
    }));

    saveSessionState({ activeTaskId: taskId, startTime: now });
  },

  pauseTimer: async () => {
    const state = get();
    if (!state.activeTask) {
      throw new Error('No active task');
    }

    const { taskId, startTime } = state.activeTask;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Active task not found');
    }

    const elapsedMinutes = calculateElapsedMinutes(startTime);
    const now = new Date().toISOString();

    await timeLogRepository.create({
      taskId,
      startTime: new Date(startTime).toISOString(),
      endTime: now,
      durationMinutes: elapsedMinutes,
    });

    await taskRepository.update(taskId, {
      actualMinutes: task.actualMinutes + elapsedMinutes,
      status: 'paused' as TaskStatus,
    });

    const today = getTodayDate();
    await statsRepository.addDailyFocusTime(today, elapsedMinutes);

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              actualMinutes: t.actualMinutes + elapsedMinutes,
              status: 'paused' as TaskStatus,
            }
          : t
      ),
      activeTask: null,
    }));

    clearSessionState();
  },

  resumeTimer: async (taskId: string) => {
    return await get().startTimer(taskId);
  },

  completeTask: async (taskId: string) => {
    const state = get();

    if (state.activeTask?.taskId === taskId) {
      await get().pauseTimer();
    }

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const now = new Date().toISOString();
    const today = getTodayDate();

    await taskRepository.update(taskId, {
      status: 'completed' as TaskStatus,
      completedDate: now,
    });

    await statsRepository.incrementDailyTaskCount(today);

    const streakStats = await statsRepository.getStreakStats();
    const updatedStreak = await statsRepository.updateStreak(today);

    const xp = calculateTaskXP({
      focusTimeMinutes: task.actualMinutes,
      currentStreak: updatedStreak.currentStreak,
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: task.actualMinutes,
    });

    await statsRepository.addDailyXP(today, xp);

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? { ...t, status: 'completed' as TaskStatus, completedDate: now }
          : t
      ),
    }));
  },

  refreshTasks: async () => {
    const tasks = await taskRepository.getAll();
    set({ tasks });
  },

  getActiveTaskWithElapsed: () => {
    const state = get();
    if (!state.activeTask) return null;

    const task = state.tasks.find(t => t.id === state.activeTask?.taskId);
    if (!task) return null;

    const currentElapsedMinutes = calculateElapsedMinutes(state.activeTask.startTime);

    return {
      ...task,
      currentElapsedMinutes,
    };
  },

  updateElapsedTime: () => {
    const state = get();
    if (!state.activeTask) return;

    const currentElapsedMinutes = calculateElapsedMinutes(state.activeTask.startTime);
    set(state => ({
      activeTask: state.activeTask
        ? { ...state.activeTask, currentElapsedMinutes }
        : null,
    }));
  },
}));

interface SessionState {
  activeTaskId: string | null;
  startTime: number | null;
}

function saveSessionState(state: SessionState): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskManagerSession', JSON.stringify(state));
    }
  } catch (error) {
    console.error('Failed to save session state:', error);
  }
}

function loadSessionState(): SessionState | null {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('taskManagerSession');
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (error) {
    console.error('Failed to load session state:', error);
  }
  return null;
}

function clearSessionState(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskManagerSession');
    }
  } catch (error) {
    console.error('Failed to clear session state:', error);
  }
}
