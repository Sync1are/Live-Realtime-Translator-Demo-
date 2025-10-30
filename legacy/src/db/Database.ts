import Dexie, { Table } from 'dexie';
import { Task } from '../models/Task';
import { TimeLog } from '../models/TimeLog';
import { FocusEvent } from '../models/FocusEvent';
import { Achievement } from '../models/Achievement';
import { BreakSession } from '../models/BreakSession';
import { DailyStats, WeeklyStats, StreakStats } from '../models/Streak';
import { AppSettings } from '../models/Settings';

export class AppDatabase extends Dexie {
  tasks!: Table<Task, string>;
  timeLogs!: Table<TimeLog, string>;
  focusEvents!: Table<FocusEvent, string>;
  achievements!: Table<Achievement, string>;
  breakSessions!: Table<BreakSession, string>;
  dailyStats!: Table<DailyStats, string>;
  weeklyStats!: Table<WeeklyStats, string>;
  streakStats!: Table<StreakStats, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('TaskManagerDB');

    this.version(1).stores({
      tasks: 'id, status, priority, createdDate, scheduledDate, isPendingFromYesterday, *categories, *tags',
      timeLogs: 'id, taskId, startTime, endTime',
      focusEvents: 'id, taskId, type, timestamp',
      achievements: 'id, type, unlockedAt',
      breakSessions: 'id, type, startTime, endTime, completed',
      dailyStats: 'date, tasksCompleted, focusTimeMinutes',
      weeklyStats: 'week, tasksCompleted, focusTimeMinutes',
      streakStats: 'id',
      settings: 'id',
    });
  }
}

export const db = new AppDatabase();
