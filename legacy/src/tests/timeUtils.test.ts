import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCurrentWeekKey,
  getTodayDate,
  getYesterdayDate,
  calculateElapsedMinutes,
  formatDuration,
  isToday,
  isYesterday,
} from '../utils/timeUtils';

describe('timeUtils', () => {
  describe('getCurrentWeekKey', () => {
    it('should return a week key in format YYYY-WW', () => {
      const weekKey = getCurrentWeekKey();
      expect(weekKey).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('getTodayDate', () => {
    it('should return today\'s date in ISO format', () => {
      const today = getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      const now = new Date();
      const expected = now.toISOString().split('T')[0];
      expect(today).toBe(expected);
    });
  });

  describe('getYesterdayDate', () => {
    it('should return yesterday\'s date in ISO format', () => {
      const yesterday = getYesterdayDate();
      expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const expected = yesterdayDate.toISOString().split('T')[0];
      expect(yesterday).toBe(expected);
    });
  });

  describe('calculateElapsedMinutes', () => {
    it('should calculate elapsed minutes correctly', () => {
      const startTime = Date.now() - 5 * 60 * 1000;
      const elapsed = calculateElapsedMinutes(startTime);
      expect(elapsed).toBe(5);
    });

    it('should round to nearest minute', () => {
      const startTime = Date.now() - 5.6 * 60 * 1000;
      const elapsed = calculateElapsedMinutes(startTime);
      expect(elapsed).toBe(6);
    });

    it('should accept custom end time', () => {
      const startTime = 1000000000000;
      const endTime = 1000000300000;
      const elapsed = calculateElapsedMinutes(startTime, endTime);
      expect(elapsed).toBe(5);
    });

    it('should return 0 for start time equal to end time', () => {
      const time = Date.now();
      const elapsed = calculateElapsedMinutes(time, time);
      expect(elapsed).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only when less than 60', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(59)).toBe('59m');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(60)).toBe('1h 0m');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(125)).toBe('2h 5m');
    });

    it('should handle zero minutes', () => {
      expect(formatDuration(0)).toBe('0m');
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const today = getTodayDate();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday\'s date', () => {
      const yesterday = getYesterdayDate();
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for arbitrary past date', () => {
      expect(isToday('2020-01-01')).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should return true for yesterday\'s date', () => {
      const yesterday = getYesterdayDate();
      expect(isYesterday(yesterday)).toBe(true);
    });

    it('should return false for today\'s date', () => {
      const today = getTodayDate();
      expect(isYesterday(today)).toBe(false);
    });

    it('should return false for arbitrary past date', () => {
      expect(isYesterday('2020-01-01')).toBe(false);
    });
  });
});
