import { describe, it, expect } from 'vitest';
import {
  calculateTaskXP,
  calculateLevel,
  getXPForLevel,
  getXPRequiredForNextLevel,
  getLevelProgress,
} from '../utils/xpCalculator';

describe('xpCalculator', () => {
  describe('calculateTaskXP', () => {
    it('should calculate base XP for minimal task', () => {
      const xp = calculateTaskXP({
        focusTimeMinutes: 0,
        currentStreak: 0,
      });
      expect(xp).toBe(10);
    });

    it('should add XP for focus time', () => {
      const xp = calculateTaskXP({
        focusTimeMinutes: 25,
        currentStreak: 0,
      });
      expect(xp).toBe(35);
    });

    it('should add streak bonus', () => {
      const xp = calculateTaskXP({
        focusTimeMinutes: 25,
        currentStreak: 3,
      });
      expect(xp).toBe(50);
    });

    it('should add beat estimate bonus', () => {
      const xp = calculateTaskXP({
        focusTimeMinutes: 25,
        currentStreak: 3,
        estimatedMinutes: 30,
        actualMinutes: 20,
      });
      expect(xp).toBe(60);
    });

    it('should not add beat estimate bonus when over estimate', () => {
      const xp = calculateTaskXP({
        focusTimeMinutes: 25,
        currentStreak: 3,
        estimatedMinutes: 30,
        actualMinutes: 35,
      });
      expect(xp).toBe(50);
    });

    it('should handle large focus times', () => {
      const xp = calculateTaskXP({
        focusTimeMinutes: 120,
        currentStreak: 10,
        estimatedMinutes: 120,
        actualMinutes: 100,
      });
      expect(xp).toBe(190);
    });
  });

  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('should return level 1 for XP below first threshold', () => {
      expect(calculateLevel(99)).toBe(1);
    });

    it('should return level 2 at first threshold', () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it('should return level 2 for XP in level 2 range', () => {
      expect(calculateLevel(150)).toBe(2);
    });

    it('should calculate level 3 correctly', () => {
      expect(calculateLevel(250)).toBe(3);
    });

    it('should handle high levels', () => {
      expect(calculateLevel(1000)).toBeGreaterThanOrEqual(4);
    });
  });

  describe('getXPForLevel', () => {
    it('should return 0 XP for level 1', () => {
      expect(getXPForLevel(1)).toBe(0);
    });

    it('should return 100 XP for level 2', () => {
      expect(getXPForLevel(2)).toBe(100);
    });

    it('should calculate cumulative XP correctly', () => {
      const level3XP = getXPForLevel(3);
      expect(level3XP).toBe(250);
    });
  });

  describe('getXPRequiredForNextLevel', () => {
    it('should return 100 XP for level 1 to level 2', () => {
      expect(getXPRequiredForNextLevel(1)).toBe(100);
    });

    it('should return 150 XP for level 2 to level 3', () => {
      expect(getXPRequiredForNextLevel(2)).toBe(150);
    });

    it('should increase XP requirement with each level', () => {
      const level1to2 = getXPRequiredForNextLevel(1);
      const level2to3 = getXPRequiredForNextLevel(2);
      const level3to4 = getXPRequiredForNextLevel(3);
      
      expect(level2to3).toBeGreaterThan(level1to2);
      expect(level3to4).toBeGreaterThan(level2to3);
    });
  });

  describe('getLevelProgress', () => {
    it('should show 0% progress at level start', () => {
      const progress = getLevelProgress(100);
      expect(progress.currentLevel).toBe(2);
      expect(progress.currentLevelXP).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should show 50% progress midway through level', () => {
      const progress = getLevelProgress(175);
      expect(progress.currentLevel).toBe(2);
      expect(progress.currentLevelXP).toBe(75);
      expect(progress.xpRequiredForNext).toBe(150);
      expect(progress.percentage).toBe(50);
    });

    it('should show progress at level 1', () => {
      const progress = getLevelProgress(50);
      expect(progress.currentLevel).toBe(1);
      expect(progress.currentLevelXP).toBe(50);
      expect(progress.xpRequiredForNext).toBe(100);
      expect(progress.percentage).toBe(50);
    });

    it('should calculate total XP correctly', () => {
      const totalXP = 250;
      const progress = getLevelProgress(totalXP);
      expect(progress.totalXP).toBe(totalXP);
    });
  });
});
