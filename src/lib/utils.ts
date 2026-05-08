export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatHours(seconds: number): string {
  const hrs = seconds / 3600;
  if (hrs >= 1) return `${hrs.toFixed(1)}h`;
  const mins = seconds / 60;
  return `${Math.round(mins)}m`;
}

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getDaysInRange(startDate: Date, endDate: Date): string[] {
  const days: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(getDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function getWeeksAgo(weeks: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - (weeks * 7));
  date.setHours(0, 0, 0, 0);
  return date;
}

export const ACTIVITY_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
];

export const ACTIVITY_ICONS = [
  '💻', '⌨️', '🖱️', '📚', '📖', '🎨', '🖌️', '🏋️', '🏃', '🚴',
  '🎵', '🎸', '🎹', '✍️', '📝', '🧘', '💆', '📐', '🔬', '🔬',
  '🎯', '🧠', '📊', '📈', '📉', '🔧', '🛠️', '🌱', '🌿', '🍎',
  '☕', '🍵', '🎮', '🕹️', '🎬', '📸', '📽️', '✈️', '🌍', '🏠',
];
