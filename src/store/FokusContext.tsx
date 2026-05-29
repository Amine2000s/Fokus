import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Activity, Task, FocusSession, View, Theme } from '@/types';
import * as db from '@/lib/db';
import { playStartChime, playEndChime, sendNotification, requestNotificationPermission } from '@/lib/sounds';

interface State {
  activities: Activity[];
  tasks: Task[];
  sessions: FocusSession[];
  currentView: View;
  theme: Theme;
  lastBackupAt: string | null;
  activeSession: FocusSession | null;
  isPaused: boolean;
  pauseOffset: number; // seconds spent paused
  pauseStartTime: number | null;
  loading: boolean;
  soundEnabled: boolean;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: { activities: Activity[]; tasks: Task[]; sessions: FocusSession[] } }
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_BACKUP_DATE'; payload: string }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'UPDATE_ACTIVITY'; payload: Activity }
  | { type: 'DELETE_ACTIVITY'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_SESSION'; payload: FocusSession }
  | { type: 'UPDATE_SESSION'; payload: FocusSession }
  | { type: 'SET_ACTIVE_SESSION'; payload: FocusSession | null }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_DATA':
      return { ...state, ...action.payload, loading: false };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_THEME':
      localStorage.setItem('fokus-theme', action.payload);
      return { ...state, theme: action.payload };
    case 'SET_BACKUP_DATE':
      localStorage.setItem('fokus-last-backup', action.payload);
      return { ...state, lastBackupAt: action.payload };
    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] };
    case 'UPDATE_ACTIVITY':
      return { ...state, activities: state.activities.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.filter(a => a.id !== action.payload),
        tasks: state.tasks.filter(t => t.activityId !== action.payload),
        sessions: state.sessions.filter(s => s.activityId !== action.payload),
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
        sessions: state.sessions.filter(s => s.taskId !== action.payload),
      };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return { ...state, sessions: state.sessions.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSession: action.payload, isPaused: false, pauseOffset: 0, pauseStartTime: null };
    case 'SET_PAUSED':
      if (action.payload) {
        return { ...state, isPaused: true, pauseStartTime: Date.now() };
      } else {
        const offset = state.pauseStartTime ? Math.floor((Date.now() - state.pauseStartTime) / 1000) : 0;
        return { ...state, isPaused: false, pauseOffset: state.pauseOffset + offset, pauseStartTime: null };
      }
    case 'DELETE_SESSION':
      return { ...state, sessions: state.sessions.filter(s => s.id !== action.payload) };
    case 'SET_SOUND_ENABLED':
      localStorage.setItem('fokus-sound', JSON.stringify(action.payload));
      return { ...state, soundEnabled: action.payload };
    default:
      return state;
  }
}

const initialState: State = {
  activities: [],
  tasks: [],
  sessions: [],
  currentView: 'dashboard',
  theme: (localStorage.getItem('fokus-theme') as Theme) || 'midnight',
  lastBackupAt: localStorage.getItem('fokus-last-backup'),
  activeSession: null,
  isPaused: false,
  pauseOffset: 0,
  pauseStartTime: null,
  loading: true,
  soundEnabled: localStorage.getItem('fokus-sound') === null ? true : JSON.parse(localStorage.getItem('fokus-sound')!),
};

interface ContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  addActivity: (activity: Activity) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  startSession: (taskId: string, activityId: string, targetDuration?: number | null) => Promise<FocusSession>;
  togglePause: () => void;
  completeSession: (session: FocusSession) => Promise<void>;
  cancelSession: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  toggleSound: () => void;
}

const FokusContext = createContext<ContextType | null>(null);

export function FokusProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function loadData() {
      try {
        let [activities, tasks, sessions] = await Promise.all([
          db.getAllActivities(),
          db.getAllTasks(),
          db.getAllSessions(),
        ]);
        tasks = tasks.map(t => ({
          ...t,
          description: t.description ?? '',
          board: t.board ?? 'todo',
          sortOrder: t.sortOrder ?? Date.now(),
        }));
        const activeSession = sessions.find(s => s.status === 'active') || null;
        dispatch({ type: 'SET_DATA', payload: { activities, tasks, sessions } });
        if (activeSession) {
          dispatch({ type: 'SET_ACTIVE_SESSION', payload: activeSession });
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    loadData();
    requestNotificationPermission();
  }, []);

  const addActivity = useCallback(async (activity: Activity) => {
    await db.addActivity(activity);
    dispatch({ type: 'ADD_ACTIVITY', payload: activity });
  }, []);

  const updateActivity = useCallback(async (activity: Activity) => {
    await db.updateActivity(activity);
    dispatch({ type: 'UPDATE_ACTIVITY', payload: activity });
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    await db.deleteActivity(id);
    dispatch({ type: 'DELETE_ACTIVITY', payload: id });
  }, []);

  const addTask = useCallback(async (task: Task) => {
    await db.addTask(task);
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  const updateTask = useCallback(async (task: Task) => {
    await db.updateTask(task);
    dispatch({ type: 'UPDATE_TASK', payload: task });
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await db.deleteTask(id);
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, []);

  const startSession = useCallback(async (taskId: string, activityId: string, targetDuration: number | null = null): Promise<FocusSession> => {
    const now = new Date();
    const session: FocusSession = {
      id: crypto.randomUUID(),
      taskId,
      activityId,
      startTime: now.toISOString(),
      endTime: null,
      duration: 0,
      targetDuration,
      date: now.toISOString().split('T')[0],
      status: 'active',
    };
    await db.addSession(session);
    dispatch({ type: 'ADD_SESSION', payload: session });
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: session });
    if (state.soundEnabled) {
      playStartChime();
      sendNotification('Fokus', 'Session started');
    }
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.board !== 'in-progress') {
      const maxOrder = state.tasks
        .filter(t => t.board === 'in-progress')
        .reduce((max, t) => Math.max(max, t.sortOrder || 0), -1);
      await db.updateTask({ ...task, board: 'in-progress', sortOrder: maxOrder + 1 });
      dispatch({ type: 'UPDATE_TASK', payload: { ...task, board: 'in-progress', sortOrder: maxOrder + 1 } });
    }
    return session;
  }, [state.soundEnabled, state.tasks]);

  const togglePause = useCallback(() => {
    dispatch({ type: 'SET_PAUSED', payload: !state.isPaused });
  }, [state.isPaused]);

  const completeSession = useCallback(async (session: FocusSession) => {
    const now = new Date();
    const totalPauseTime = state.pauseOffset + (state.isPaused && state.pauseStartTime ? Math.floor((Date.now() - state.pauseStartTime) / 1000) : 0);
    const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000) - totalPauseTime);
    const updated: FocusSession = {
      ...session,
      endTime: now.toISOString(),
      duration: session.targetDuration ? Math.min(elapsed, session.targetDuration) : elapsed,
      status: 'completed',
    };
    await db.updateSession(updated);
    dispatch({ type: 'UPDATE_SESSION', payload: updated });
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: null });
    if (state.soundEnabled) {
      playEndChime();
      sendNotification('Fokus', 'Session completed');
    }
  }, [state.isPaused, state.pauseStartTime, state.pauseOffset, state.soundEnabled]);

  const cancelSession = useCallback(async () => {
    if (state.activeSession) {
      const updated: FocusSession = {
        ...state.activeSession,
        endTime: new Date().toISOString(),
        duration: 0,
        status: 'cancelled',
      };
      await db.updateSession(updated);
      dispatch({ type: 'UPDATE_SESSION', payload: updated });
      dispatch({ type: 'SET_ACTIVE_SESSION', payload: null });
    }
  }, [state.activeSession]);

  const deleteSession = useCallback(async (id: string) => {
    await db.deleteSession(id);
    dispatch({ type: 'DELETE_SESSION', payload: id });
  }, []);

  const toggleSound = useCallback(() => {
    dispatch({ type: 'SET_SOUND_ENABLED', payload: !state.soundEnabled });
  }, [state.soundEnabled]);

  return (
    <FokusContext.Provider value={{
      state,
      dispatch,
      addActivity,
      updateActivity,
      deleteActivity,
      addTask,
      updateTask,
      deleteTask,
      startSession,
      togglePause,
      completeSession,
      cancelSession,
      deleteSession,
      toggleSound,
    }}>
      {children}
    </FokusContext.Provider>
  );
}

export function useFokus() {
  const context = useContext(FokusContext);
  if (!context) throw new Error('useFokus must be used within FokusProvider');
  return context;
}
