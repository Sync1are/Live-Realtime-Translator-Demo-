export type BreakType = 'short' | 'long' | 'custom';

export interface BreakSession {
  id: string;
  type: BreakType;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  plannedDurationMinutes: number;
  completed: boolean;
  createdAt: string;
}

export interface CreateBreakSessionInput {
  type: BreakType;
  plannedDurationMinutes: number;
}
