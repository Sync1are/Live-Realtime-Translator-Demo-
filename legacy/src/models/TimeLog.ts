export interface TimeLog {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  createdAt: string;
}

export interface CreateTimeLogInput {
  taskId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}
