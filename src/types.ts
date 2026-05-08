export interface Activity {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Task {
  id: string;
  activityId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskId: string;
  activityId: string;
  startTime: string;
  endTime: string | null;
  duration: number; // in seconds
  targetDuration: number | null; // in seconds (for Pomodoro/Timed sessions)
  date: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'cancelled';
}

export type Theme = 'midnight' | 'paper' | 'obsidian';
export type View = 'dashboard' | 'activities' | 'timer' | 'history' | 'settings';
