export function getCurrentWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const firstDay = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

export function calculateElapsedMinutes(startTime: number, endTime: number = Date.now()): number {
  return Math.round((endTime - startTime) / 1000 / 60);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function isToday(dateString: string): boolean {
  return dateString === getTodayDate();
}

export function isYesterday(dateString: string): boolean {
  return dateString === getYesterdayDate();
}
