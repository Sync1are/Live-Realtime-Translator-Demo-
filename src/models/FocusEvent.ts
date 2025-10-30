export type FocusEventType = 'focus_start' | 'focus_end' | 'distraction_detected' | 'window_change';

export interface FocusEvent {
  id: string;
  taskId: string | null;
  type: FocusEventType;
  timestamp: string;
  windowTitle?: string;
  appName?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface CreateFocusEventInput {
  taskId: string | null;
  type: FocusEventType;
  windowTitle?: string;
  appName?: string;
  duration?: number;
  metadata?: Record<string, any>;
}
