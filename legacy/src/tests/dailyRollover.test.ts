import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performDailyRollover, shouldPerformRollover, getLastRolloverDate } from '../utils/dailyRollover';
import { taskRepository } from '../db/TaskRepository';
import { getTodayDate, getYesterdayDate } from '../utils/timeUtils';

vi.mock('../db/TaskRepository', () => ({
  taskRepository: {
    markRollovers: vi.fn(),
  },
}));

describe('dailyRollover', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('shouldPerformRollover', () => {
    it('should return true when no rollover has been performed', () => {
      expect(shouldPerformRollover()).toBe(true);
    });

    it('should return false when rollover was already performed today', () => {
      const today = getTodayDate();
      localStorage.setItem('lastRolloverDate', today);
      expect(shouldPerformRollover()).toBe(false);
    });

    it('should return true when last rollover was yesterday', () => {
      const yesterday = getYesterdayDate();
      localStorage.setItem('lastRolloverDate', yesterday);
      expect(shouldPerformRollover()).toBe(true);
    });
  });

  describe('getLastRolloverDate', () => {
    it('should return null when no rollover has been performed', () => {
      expect(getLastRolloverDate()).toBeNull();
    });

    it('should return stored rollover date', () => {
      const date = '2024-01-15';
      localStorage.setItem('lastRolloverDate', date);
      expect(getLastRolloverDate()).toBe(date);
    });
  });

  describe('performDailyRollover', () => {
    it('should mark rollovers and update last rollover date', async () => {
      vi.mocked(taskRepository.markRollovers).mockResolvedValue(3);

      const result = await performDailyRollover();

      expect(result.rolledOver).toBe(3);
      expect(result.lastRolloverDate).toBe(getTodayDate());
      expect(taskRepository.markRollovers).toHaveBeenCalled();
    });

    it('should not perform rollover if already done today', async () => {
      const today = getTodayDate();
      localStorage.setItem('lastRolloverDate', today);
      vi.mocked(taskRepository.markRollovers).mockResolvedValue(5);

      const result = await performDailyRollover();

      expect(result.rolledOver).toBe(0);
      expect(result.lastRolloverDate).toBe(today);
      expect(taskRepository.markRollovers).not.toHaveBeenCalled();
    });

    it('should perform rollover on new day', async () => {
      const yesterday = getYesterdayDate();
      localStorage.setItem('lastRolloverDate', yesterday);
      vi.mocked(taskRepository.markRollovers).mockResolvedValue(2);

      const result = await performDailyRollover();

      expect(result.rolledOver).toBe(2);
      expect(result.lastRolloverDate).toBe(getTodayDate());
      expect(taskRepository.markRollovers).toHaveBeenCalled();
    });
  });
});
