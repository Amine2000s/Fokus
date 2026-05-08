import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Activity, Task, FocusSession } from '@/types';

interface FokusDB extends DBSchema {
  activities: {
    key: string;
    value: Activity;
    indexes: { 'by-name': string };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-activity': string; 'by-created': string };
  };
  sessions: {
    key: string;
    value: FocusSession;
    indexes: { 'by-task': string; 'by-activity': string; 'by-date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<FokusDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FokusDB>('fokus-db', 1, {
      upgrade(db) {
        const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
        activityStore.createIndex('by-name', 'name');

        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-activity', 'activityId');
        taskStore.createIndex('by-created', 'createdAt');

        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-task', 'taskId');
        sessionStore.createIndex('by-activity', 'activityId');
        sessionStore.createIndex('by-date', 'date');
      },
    });
  }
  return dbPromise;
}

// Activities
export async function getAllActivities(): Promise<Activity[]> {
  const db = await getDB();
  return db.getAll('activities');
}

export async function addActivity(activity: Activity): Promise<void> {
  const db = await getDB();
  await db.put('activities', activity);
}

export async function deleteActivity(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('activities', id);
  // Also delete related tasks and sessions
  const tasks = await db.getAllFromIndex('tasks', 'by-activity', id);
  const tx = db.transaction(['tasks', 'sessions'], 'readwrite');
  for (const task of tasks) {
    await tx.objectStore('tasks').delete(task.id);
    const sessions = await db.getAllFromIndex('sessions', 'by-task', task.id);
    for (const session of sessions) {
      await tx.objectStore('sessions').delete(session.id);
    }
  }
  // Delete sessions directly linked to activity
  const actSessions = await db.getAllFromIndex('sessions', 'by-activity', id);
  for (const session of actSessions) {
    await tx.objectStore('sessions').delete(session.id);
  }
  await tx.done;
}

export async function updateActivity(activity: Activity): Promise<void> {
  const db = await getDB();
  await db.put('activities', activity);
}

// Tasks
export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function addTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function updateTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tasks', id);
  const sessions = await db.getAllFromIndex('sessions', 'by-task', id);
  const tx = db.transaction('sessions', 'readwrite');
  for (const session of sessions) {
    await tx.store.delete(session.id);
  }
  await tx.done;
}

// Sessions
export async function getAllSessions(): Promise<FocusSession[]> {
  const db = await getDB();
  return db.getAll('sessions');
}

export async function addSession(session: FocusSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function updateSession(session: FocusSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}
