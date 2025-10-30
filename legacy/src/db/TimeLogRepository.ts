import { db } from './Database';
import { TimeLog, CreateTimeLogInput } from '../models/TimeLog';
import { generateId } from '../utils/idGenerator';

export class TimeLogRepository {
  async create(input: CreateTimeLogInput): Promise<TimeLog> {
    const timeLog: TimeLog = {
      id: generateId('log'),
      taskId: input.taskId,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: input.durationMinutes,
      createdAt: new Date().toISOString(),
    };

    await db.timeLogs.add(timeLog);
    return timeLog;
  }

  async getByTaskId(taskId: string): Promise<TimeLog[]> {
    return await db.timeLogs.where('taskId').equals(taskId).toArray();
  }

  async getTotalTimeForTask(taskId: string): Promise<number> {
    const logs = await this.getByTaskId(taskId);
    return logs.reduce((total, log) => total + log.durationMinutes, 0);
  }

  async getLogsInRange(startDate: string, endDate: string): Promise<TimeLog[]> {
    return await db.timeLogs
      .where('startTime')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getTotalTimeInRange(startDate: string, endDate: string): Promise<number> {
    const logs = await this.getLogsInRange(startDate, endDate);
    return logs.reduce((total, log) => total + log.durationMinutes, 0);
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await db.timeLogs.where('taskId').equals(taskId).delete();
  }
}

export const timeLogRepository = new TimeLogRepository();
