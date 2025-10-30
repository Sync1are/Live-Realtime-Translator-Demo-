export type TaskStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TimeBlock {
  start: string;
  end: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  actualMinutes: number;
  priority: TaskPriority;
  categories: string[];
  tags: string[];
  status: TaskStatus;
  createdDate: string;
  startedDate: string | null;
  completedDate: string | null;
  isPendingFromYesterday: boolean;
  scheduledDate: string | null;
  scheduledTimeBlock: TimeBlock | null;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  priority?: TaskPriority;
  categories?: string[];
  tags?: string[];
  isPendingFromYesterday?: boolean;
  scheduledDate?: string | null;
  scheduledTimeBlock?: TimeBlock | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  priority?: TaskPriority;
  categories?: string[];
  tags?: string[];
  status?: TaskStatus;
  startedDate?: string | null;
  completedDate?: string | null;
  isPendingFromYesterday?: boolean;
  scheduledDate?: string | null;
  scheduledTimeBlock?: TimeBlock | null;
}
