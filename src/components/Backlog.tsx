import { useState, useMemo } from 'react';
import { Plus, Play, Check, Trash2, Tag } from 'lucide-react';
import { useFokus } from '@/store/FokusContext';
import { formatHours } from '@/lib/utils';

export default function Backlog() {
  const { state, addTask, updateTask, deleteTask, startSession, dispatch } = useFokus();
  const [newTitle, setNewTitle] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');

  useMemo(() => {
    if (!selectedActivityId && state.activities.length > 0) {
      setSelectedActivityId(state.activities[0].id);
    }
  }, [state.activities, selectedActivityId]);

  const pendingTasks = useMemo(() => {
    return state.tasks
      .filter(t => !t.completed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.tasks]);

  const handleAddTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTitle.trim() || !selectedActivityId) return;

    const task = {
      id: crypto.randomUUID(),
      activityId: selectedActivityId,
      title: newTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await addTask(task);
    setNewTitle('');
  };

  const handleStartTask = async (taskId: string, activityId: string) => {
    await startSession(taskId, activityId);
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
  };

  const getTaskTime = (taskId: string) => {
    return state.sessions
      .filter(s => s.taskId === taskId && s.status === 'completed')
      .reduce((sum, s) => sum + s.duration, 0);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="flex items-end justify-between px-2">
        <div>
          <h2 className="text-4xl font-serif text-app-primary">Backlog</h2>
          <p className="text-xs text-app-secondary uppercase tracking-[0.2em] font-bold mt-2">
            {pendingTasks.length} tasks waiting for focus
          </p>
        </div>
      </div>

      <div className="bg-app-card rounded-3xl shadow-input border border-app-subtle transition-all overflow-hidden">
        <form onSubmit={handleAddTask}>
          <div className="relative group">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-transparent py-7 px-8 text-xl text-app-primary focus:outline-none placeholder:text-app-secondary/30 font-medium tracking-tight"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || !selectedActivityId}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-app-accent text-white flex items-center justify-center hover:opacity-90 disabled:opacity-10 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-3 bg-app-dark/20 border-t border-app-subtle">
            <Tag className="w-3.5 h-3.5 text-app-secondary opacity-50 shrink-0" />
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
              {state.activities.map(activity => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => setSelectedActivityId(activity.id)}
                  className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border transition-all ${
                    selectedActivityId === activity.id
                      ? 'bg-app-accent text-white border-app-accent shadow-sm'
                      : 'bg-transparent border-transparent text-app-secondary hover:text-app-primary'
                  }`}
                >
                  {activity.name}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-4 pb-12">
        {pendingTasks.map(task => {
          const activity = state.activities.find(a => a.id === task.activityId);
          const timeSpent = getTaskTime(task.id);

          return (
            <div
              key={task.id}
              className="group flex items-center gap-4 bg-zinc-900/30 border border-white/5 p-4 rounded-2xl hover:bg-zinc-900/50 hover:border-white/10 transition-all"
            >
              <button
                onClick={() => updateTask({ ...task, completed: true })}
                className="w-6 h-6 rounded-lg border-2 border-zinc-700 flex items-center justify-center hover:border-blue-500 transition-colors shrink-0"
              >
                <Check className="w-3 h-3 text-transparent group-hover:text-zinc-600" />
              </button>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-zinc-200 truncate">{task.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activity?.color || '#3b82f6' }} />
                    {activity?.name}
                   </span>
                   {timeSpent > 0 && (
                     <span className="text-[10px] text-zinc-600 font-mono">
                      • {formatHours(timeSpent)} spent
                     </span>
                   )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleStartTask(task.id, task.activityId)}
                  className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2 pr-3"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Focus</span>
                </button>
                <button
                  onClick={() => { if(confirm('Delete task?')) deleteTask(task.id) }}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {pendingTasks.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem]">
            <p className="text-zinc-600 text-sm">Your backlog is empty. Start fresh!</p>
          </div>
        )}
      </div>
    </div>
  );
}
