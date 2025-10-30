import { db } from './Database';
import { DailyStats, WeeklyStats, StreakStats } from '../models/Streak';

export class StatsRepository {
  async getDailyStats(date: string): Promise<DailyStats> {
    const stats = await db.dailyStats.get(date);
    if (stats) return stats;

    const newStats: DailyStats = {
      date,
      tasksCompleted: 0,
      focusTimeMinutes: 0,
      breakTimeMinutes: 0,
      totalXPEarned: 0,
      achievementsUnlocked: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.dailyStats.add(newStats);
    return newStats;
  }

  async updateDailyStats(
    date: string,
    updates: Partial<Omit<DailyStats, 'date' | 'createdAt'>>
  ): Promise<DailyStats> {
    const stats = await this.getDailyStats(date);
    const updated: DailyStats = {
      ...stats,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.dailyStats.put(updated);
    return updated;
  }

  async incrementDailyTaskCount(date: string): Promise<DailyStats> {
    const stats = await this.getDailyStats(date);
    return await this.updateDailyStats(date, {
      tasksCompleted: stats.tasksCompleted + 1,
    });
  }

  async addDailyFocusTime(date: string, minutes: number): Promise<DailyStats> {
    const stats = await this.getDailyStats(date);
    return await this.updateDailyStats(date, {
      focusTimeMinutes: stats.focusTimeMinutes + minutes,
    });
  }

  async addDailyXP(date: string, xp: number): Promise<DailyStats> {
    const stats = await this.getDailyStats(date);
    return await this.updateDailyStats(date, {
      totalXPEarned: stats.totalXPEarned + xp,
    });
  }

  async getWeeklyStats(week: string): Promise<WeeklyStats> {
    const stats = await db.weeklyStats.get(week);
    if (stats) return stats;

    const newStats: WeeklyStats = {
      week,
      tasksCompleted: 0,
      focusTimeMinutes: 0,
      breakTimeMinutes: 0,
      totalXPEarned: 0,
      achievementsUnlocked: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.weeklyStats.add(newStats);
    return newStats;
  }

  async updateWeeklyStats(
    week: string,
    updates: Partial<Omit<WeeklyStats, 'week' | 'createdAt'>>
  ): Promise<WeeklyStats> {
    const stats = await this.getWeeklyStats(week);
    const updated: WeeklyStats = {
      ...stats,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.weeklyStats.put(updated);
    return updated;
  }

  async getStreakStats(): Promise<StreakStats> {
    const stats = await db.streakStats.get('main');
    if (stats) return stats;

    const newStats: StreakStats = {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      totalDaysActive: 0,
    };

    await db.streakStats.add({ id: 'main', ...newStats } as any);
    return newStats;
  }

  async updateStreakStats(updates: Partial<StreakStats>): Promise<StreakStats> {
    const stats = await this.getStreakStats();
    const updated: StreakStats = {
      ...stats,
      ...updates,
    };

    await db.streakStats.put({ id: 'main', ...updated } as any);
    return updated;
  }

  async updateStreak(lastCompletionDate: string): Promise<StreakStats> {
    const stats = await this.getStreakStats();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let currentStreak = stats.currentStreak;
    let longestStreak = stats.longestStreak;
    let totalDaysActive = stats.totalDaysActive;

    if (lastCompletionDate === yesterday) {
      currentStreak++;
    } else if (lastCompletionDate !== today) {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    if (lastCompletionDate !== today) {
      totalDaysActive++;
    }

    return await this.updateStreakStats({
      currentStreak,
      longestStreak,
      lastCompletionDate: today,
      totalDaysActive,
    });
  }

  async getDailyStatsRange(startDate: string, endDate: string): Promise<DailyStats[]> {
    return await db.dailyStats
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }
}

export const statsRepository = new StatsRepository();
