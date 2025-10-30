import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskStore } from '../store/taskStore';
import { taskRepository } from '../db/TaskRepository';
import { timeLogRepository } from '../db/TimeLogRepository';
import { statsRepository } from '../db/StatsRepository';
import { Task, TaskStatus } from '../models/Task';

vi.mock('../db/TaskRepository', () => ({
  taskRepository: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../db/TimeLogRepository', () => ({
  timeLogRepository: {
    create: vi.fn(),
    deleteByTaskId: vi.fn(),
  },
}));

vi.mock('../db/StatsRepository', () => ({
  statsRepository: {
    incrementDailyTaskCount: vi.fn(),
    addDailyFocusTime: vi.fn(),
    addDailyXP: vi.fn(),
    getStreakStats: vi.fn(),
    updateStreak: vi.fn(),
  },
}));

describe('taskStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    taskStore.setState({
      tasks: [],
      activeTask: null,
      isLoading: false,
      isHydrated: false,
    });
  });

  describe('hydrate', () => {
    it('should load tasks from repository', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Test Task',
          description: '',
          estimatedMinutes: 30,
          actualMinutes: 0,
          priority: 'medium',
          categories: [],
          tags: [],
          status: 'not_started',
          createdDate: '2024-01-01T00:00:00.000Z',
          startedDate: null,
          completedDate: null,
          isPendingFromYesterday: false,
          scheduledDate: null,
          scheduledTimeBlock: null,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(taskRepository.getAll).mockResolvedValue(mockTasks);

      await taskStore.getState().hydrate();

      expect(taskStore.getState().tasks).toEqual(mockTasks);
      expect(taskStore.getState().isHydrated).toBe(true);
    });

    it('should restore active task from session storage', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Active Task',
          description: '',
          estimatedMinutes: 30,
          actualMinutes: 0,
          priority: 'medium',
          categories: [],
          tags: [],
          status: 'in_progress',
          createdDate: '2024-01-01T00:00:00.000Z',
          startedDate: '2024-01-01T10:00:00.000Z',
          completedDate: null,
          isPendingFromYesterday: false,
          scheduledDate: null,
          scheduledTimeBlock: null,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      localStorage.setItem(
        'taskManagerSession',
        JSON.stringify({ activeTaskId: 'task-1', startTime: Date.now() })
      );

      vi.mocked(taskRepository.getAll).mockResolvedValue(mockTasks);

      await taskStore.getState().hydrate();

      expect(taskStore.getState().activeTask).not.toBeNull();
      expect(taskStore.getState().activeTask?.taskId).toBe('task-1');
    });
  });

  describe('createTask', () => {
    it('should create a task and add to store', async () => {
      const newTask: Task = {
        id: 'task-1',
        title: 'New Task',
        description: 'Description',
        estimatedMinutes: 60,
        actualMinutes: 0,
        priority: 'high',
        categories: ['Work'],
        tags: ['important'],
        status: 'not_started',
        createdDate: '2024-01-01T00:00:00.000Z',
        startedDate: null,
        completedDate: null,
        isPendingFromYesterday: false,
        scheduledDate: null,
        scheduledTimeBlock: null,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(taskRepository.create).mockResolvedValue(newTask);

      const result = await taskStore.getState().createTask({
        title: 'New Task',
        description: 'Description',
        estimatedMinutes: 60,
        priority: 'high',
        categories: ['Work'],
        tags: ['important'],
      });

      expect(result).toEqual(newTask);
      expect(taskStore.getState().tasks).toContainEqual(newTask);
    });
  });

  describe('startTimer', () => {
    beforeEach(() => {
      const mockTask: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: '',
        estimatedMinutes: 30,
        actualMinutes: 0,
        priority: 'medium',
        categories: [],
        tags: [],
        status: 'not_started',
        createdDate: '2024-01-01T00:00:00.000Z',
        startedDate: null,
        completedDate: null,
        isPendingFromYesterday: false,
        scheduledDate: null,
        scheduledTimeBlock: null,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      taskStore.setState({ tasks: [mockTask] });
      vi.mocked(taskRepository.update).mockResolvedValue({ ...mockTask, status: 'in_progress' });
    });

    it('should start timer for a task', async () => {
      await taskStore.getState().startTimer('task-1');

      const state = taskStore.getState();
      expect(state.activeTask).not.toBeNull();
      expect(state.activeTask?.taskId).toBe('task-1');
      expect(state.activeTask?.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('should update task status to in_progress', async () => {
      await taskStore.getState().startTimer('task-1');

      expect(taskRepository.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ status: 'in_progress' })
      );
    });

    it('should save session state', async () => {
      await taskStore.getState().startTimer('task-1');

      const sessionData = localStorage.getItem('taskManagerSession');
      expect(sessionData).not.toBeNull();
      
      const session = JSON.parse(sessionData!);
      expect(session.activeTaskId).toBe('task-1');
    });
  });

  describe('pauseTimer', () => {
    beforeEach(() => {
      const mockTask: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: '',
        estimatedMinutes: 30,
        actualMinutes: 0,
        priority: 'medium',
        categories: [],
        tags: [],
        status: 'in_progress',
        createdDate: '2024-01-01T00:00:00.000Z',
        startedDate: '2024-01-01T10:00:00.000Z',
        completedDate: null,
        isPendingFromYesterday: false,
        scheduledDate: null,
        scheduledTimeBlock: null,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      taskStore.setState({
        tasks: [mockTask],
        activeTask: {
          taskId: 'task-1',
          startTime: Date.now() - 5 * 60 * 1000,
          currentElapsedMinutes: 0,
        },
      });

      vi.mocked(taskRepository.update).mockResolvedValue({ ...mockTask, status: 'paused', actualMinutes: 5 });
      vi.mocked(timeLogRepository.create).mockResolvedValue({} as any);
      vi.mocked(statsRepository.addDailyFocusTime).mockResolvedValue({} as any);
    });

    it('should pause active timer', async () => {
      await taskStore.getState().pauseTimer();

      expect(taskStore.getState().activeTask).toBeNull();
    });

    it('should create time log entry', async () => {
      await taskStore.getState().pauseTimer();

      expect(timeLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          durationMinutes: expect.any(Number),
        })
      );
    });

    it('should update task actual minutes', async () => {
      await taskStore.getState().pauseTimer();

      expect(taskRepository.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          actualMinutes: expect.any(Number),
          status: 'paused',
        })
      );
    });

    it('should update daily stats', async () => {
      await taskStore.getState().pauseTimer();

      expect(statsRepository.addDailyFocusTime).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number)
      );
    });
  });

  describe('completeTask', () => {
    beforeEach(() => {
      const mockTask: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: '',
        estimatedMinutes: 30,
        actualMinutes: 25,
        priority: 'medium',
        categories: [],
        tags: [],
        status: 'paused',
        createdDate: '2024-01-01T00:00:00.000Z',
        startedDate: '2024-01-01T10:00:00.000Z',
        completedDate: null,
        isPendingFromYesterday: false,
        scheduledDate: null,
        scheduledTimeBlock: null,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      taskStore.setState({ tasks: [mockTask] });

      vi.mocked(taskRepository.update).mockResolvedValue({ ...mockTask, status: 'completed' });
      vi.mocked(statsRepository.incrementDailyTaskCount).mockResolvedValue({} as any);
      vi.mocked(statsRepository.getStreakStats).mockResolvedValue({
        currentStreak: 5,
        longestStreak: 10,
        lastCompletionDate: null,
        totalDaysActive: 5,
      });
      vi.mocked(statsRepository.updateStreak).mockResolvedValue({
        currentStreak: 6,
        longestStreak: 10,
        lastCompletionDate: '2024-01-01',
        totalDaysActive: 6,
      });
      vi.mocked(statsRepository.addDailyXP).mockResolvedValue({} as any);
    });

    it('should mark task as completed', async () => {
      await taskStore.getState().completeTask('task-1');

      expect(taskRepository.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('should increment daily task count', async () => {
      await taskStore.getState().completeTask('task-1');

      expect(statsRepository.incrementDailyTaskCount).toHaveBeenCalled();
    });

    it('should update streak', async () => {
      await taskStore.getState().completeTask('task-1');

      expect(statsRepository.updateStreak).toHaveBeenCalled();
    });

    it('should add XP for completion', async () => {
      await taskStore.getState().completeTask('task-1');

      expect(statsRepository.addDailyXP).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number)
      );
    });
  });

  describe('deleteTask', () => {
    beforeEach(() => {
      const mockTask: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: '',
        estimatedMinutes: 30,
        actualMinutes: 0,
        priority: 'medium',
        categories: [],
        tags: [],
        status: 'not_started',
        createdDate: '2024-01-01T00:00:00.000Z',
        startedDate: null,
        completedDate: null,
        isPendingFromYesterday: false,
        scheduledDate: null,
        scheduledTimeBlock: null,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      taskStore.setState({ tasks: [mockTask] });
    });

    it('should delete task and remove from store', async () => {
      await taskStore.getState().deleteTask('task-1');

      expect(taskRepository.delete).toHaveBeenCalledWith('task-1');
      expect(timeLogRepository.deleteByTaskId).toHaveBeenCalledWith('task-1');
      expect(taskStore.getState().tasks).toHaveLength(0);
    });

    it('should throw error when trying to delete active task', async () => {
      taskStore.setState({
        activeTask: { taskId: 'task-1', startTime: Date.now(), currentElapsedMinutes: 0 },
      });

      await expect(taskStore.getState().deleteTask('task-1')).rejects.toThrow(
        'Cannot delete active task'
      );
    });
  });
});
