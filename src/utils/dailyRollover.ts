import { taskRepository } from '../db/TaskRepository';
import { getTodayDate } from './timeUtils';

export interface RolloverResult {
  rolledOver: number;
  lastRolloverDate: string;
}

const LAST_ROLLOVER_KEY = 'lastRolloverDate';

export async function performDailyRollover(): Promise<RolloverResult> {
  const today = getTodayDate();
  const lastRollover = getLastRolloverDate();

  if (lastRollover === today) {
    return {
      rolledOver: 0,
      lastRolloverDate: lastRollover,
    };
  }

  const rolledOver = await taskRepository.markRollovers();

  setLastRolloverDate(today);

  return {
    rolledOver,
    lastRolloverDate: today,
  };
}

export function getLastRolloverDate(): string | null {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LAST_ROLLOVER_KEY);
    }
  } catch (error) {
    console.error('Failed to get last rollover date:', error);
  }
  return null;
}

function setLastRolloverDate(date: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_ROLLOVER_KEY, date);
    }
  } catch (error) {
    console.error('Failed to set last rollover date:', error);
  }
}

export function shouldPerformRollover(): boolean {
  const today = getTodayDate();
  const lastRollover = getLastRolloverDate();
  return lastRollover !== today;
}
