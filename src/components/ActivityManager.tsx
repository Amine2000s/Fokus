import { useState, useMemo } from 'react';
import { Plus, Trash2, Check, X, ChevronRight, BarChart2, Calendar, Edit2 } from 'lucide-react';
import { useFokus } from '@/store/FokusContext';
import type { Activity, Task } from '@/types';
import { ACTIVITY_COLORS, ACTIVITY_ICONS, formatHours } from '@/lib/utils';

export default function ActivityManager() {
  const { state, addActivity, updateActivity, deleteActivity, addTask, updateTask, deleteTask } = useFokus();
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(ACTIVITY_COLORS[0]);
  const [newIcon, setNewIcon] = useState(ACTIVITY_ICONS[0]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTaskFor, setAddingTaskFor] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');

  const stats = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    if (timeframe === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const filteredSessions = state.sessions.filter(s => 
      s.status === 'completed' && new Date(s.startTime) >= startDate
    );

    const activityData = state.activities.map(activity => {
      const duration = filteredSessions
        .filter(s => s.activityId === activity.id)
        .reduce((sum, s) => sum + s.duration, 0);
      return {
        ...activity,
        duration,
      };
    }).sort((a, b) => b.duration - a.duration);

    const maxDuration = Math.max(...activityData.map(d => d.duration), 1);
    const totalDuration = activityData.reduce((sum, d) => sum + d.duration, 0);

    return { activityData, maxDuration, totalDuration };
  }, [state.sessions, state.activities, timeframe]);

  const handleAddActivity = async () => {
    if (!newName.trim()) return;
    const activity: Activity = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      color: newColor,
      icon: newIcon,
      createdAt: new Date().toISOString(),
    };
    await addActivity(activity);
    setNewName('');
    setNewColor(ACTIVITY_COLORS[Math.floor(Math.random() * ACTIVITY_COLORS.length)]);
    setNewIcon(ACTIVITY_ICONS[Math.floor(Math.random() * ACTIVITY_ICONS.length)]);
    setShowNewActivity(false);
  };

  const startEditing = (activity: Activity) => {
    setEditingActivity(activity);
    setNewName(activity.name);
    setNewColor(activity.color);
    setNewIcon(activity.icon);
    setShowNewActivity(true);
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity || !newName.trim()) return;
    await updateActivity({
      ...editingActivity,
      name: newName.trim(),
      color: newColor,
      icon: newIcon,
    });
    setEditingActivity(null);
    setNewName('');
    setShowNewActivity(false);
  };

  const handleAddTask = async (activityId: string) => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      activityId,
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    await addTask(task);
    setNewTaskTitle('');
    setAddingTaskFor(null);
  };

  const getActivityTime = (activityId: string) => {
    return state.sessions
      .filter(s => s.activityId === activityId && s.status === 'completed')
      .reduce((sum, s) => sum + s.duration, 0);
  };

  const getTaskTime = (taskId: string) => {
    return state.sessions
      .filter(s => s.taskId === taskId && s.status === 'completed')
      .reduce((sum, s) => sum + s.duration, 0);
  };

  const getTasksForActivity = (activityId: string) => {
    return state.tasks.filter(t => t.activityId === activityId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Statistics Section */}
      <div className="bg-app-card rounded-[2.5rem] border border-app-subtle p-8 shadow-fokus">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-app-accent/10 flex items-center justify-center text-app-accent">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-app-primary leading-tight">Focus Distribution</h2>
              <p className="text-[10px] text-app-secondary uppercase tracking-[0.2em] font-extrabold mt-1">
                {formatHours(stats.totalDuration)} Total
              </p>
            </div>
          </div>
          
          <div className="flex bg-app-dark/50 p-1 rounded-xl border border-app-subtle">
            {(['day', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  timeframe === t 
                    ? 'bg-app-accent text-white shadow-lg shadow-app-accent/20' 
                    : 'text-app-secondary hover:text-app-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Bar Chart */}
        <div className="h-64 flex items-end justify-around gap-2 px-2 pt-4 border-b border-app-subtle">
          {stats.activityData.length > 0 ? (
            stats.activityData.map((activity) => (
              <div key={activity.id} className="flex-1 flex flex-col items-center group relative h-full">
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-app-dark border border-app-subtle px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {formatHours(activity.duration)}
                </div>
                
                {/* Bar */}
                <div 
                  className="w-full max-w-[40px] rounded-t-lg transition-all duration-1000 ease-out relative group-hover:opacity-80"
                  style={{ 
                    height: `${(activity.duration / stats.maxDuration) * 100}%`,
                    backgroundColor: activity.color,
                    minHeight: activity.duration > 0 ? '4px' : '0px'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg" />
                </div>
                
                {/* X-Axis Label (Icon) */}
                <div className="mt-3 text-lg" title={activity.name}>
                  {activity.icon}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-app-subtle rounded-2xl mb-8">
              <Calendar className="w-8 h-8 text-app-secondary opacity-30 mb-3" />
              <p className="text-xs text-app-secondary uppercase font-bold tracking-widest">No data for this period</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-center">
           <p className="text-[10px] text-app-secondary font-bold uppercase tracking-widest">Activities</p>
        </div>
      </div>

      {/* Activities Management Section */}
      <div className="flex items-end justify-between pt-8 px-2">
        <div>
          <h2 className="text-3xl font-serif text-app-primary">Activities</h2>
          <p className="text-[10px] text-app-secondary uppercase tracking-[0.2em] font-extrabold mt-1">
            Create and organize focus categories
          </p>
        </div>
        <button
          onClick={() => setShowNewActivity(!showNewActivity)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-app-accent hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-app-accent/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {/* New Activity Form */}
      {showNewActivity && (
        <div className="bg-app-card rounded-[2.5rem] p-8 border border-app-subtle space-y-8 shadow-fokus animate-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <label className="text-[10px] text-app-secondary uppercase tracking-widest font-bold px-1">Activity Name</label>
            <input
              type="text"
              placeholder="e.g., Deep Work, Reading..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
              className="w-full bg-app-dark/30 border border-app-subtle px-6 py-4 rounded-2xl text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50 placeholder:text-app-secondary/30 transition-all shadow-inner"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] text-app-secondary uppercase tracking-widest font-bold px-1">Icon</label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                <div className="relative w-11 h-11 group">
                   <input 
                      type="text" 
                      maxLength={2}
                      placeholder="+"
                      className="w-full h-full rounded-xl bg-app-dark/40 border-2 border-dashed border-app-subtle text-center text-xl focus:outline-none focus:border-app-accent transition-colors"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) setNewIcon(val);
                      }}
                   />
                   <div className="absolute -top-1 -right-1 bg-app-accent text-white text-[8px] px-1 rounded font-bold uppercase">Custom</div>
                </div>
                {ACTIVITY_ICONS.map((icon, idx) => (
                  <button
                    key={`${icon}-${idx}`}
                    onClick={() => setNewIcon(icon)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                      newIcon === icon
                        ? 'bg-app-accent text-white scale-105 shadow-lg shadow-app-accent/30'
                        : 'bg-app-dark/40 border border-app-subtle text-app-secondary hover:text-app-primary'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] text-app-secondary uppercase tracking-widest font-bold px-1">Color Theme</label>
              <div className="flex flex-wrap gap-3">
                {ACTIVITY_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-8 h-8 rounded-full transition-all border-4 ${
                      newColor === color 
                        ? 'border-app-primary scale-125 shadow-xl' 
                        : 'border-transparent hover:scale-110 opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowNewActivity(false);
                setEditingActivity(null);
                setNewName('');
              }}
              className="flex-1 py-4 rounded-2xl bg-app-dark text-app-secondary font-bold text-xs uppercase tracking-widest hover:bg-app-dark/80 transition-all border border-app-subtle"
            >
              Cancel
            </button>
            <button
              onClick={editingActivity ? handleUpdateActivity : handleAddActivity}
              disabled={!newName.trim()}
              className="flex-[2] py-4 rounded-2xl bg-app-accent text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-30 transition-all shadow-lg shadow-app-accent/20"
            >
              {editingActivity ? 'Save Changes' : 'Create Activity'}
            </button>
          </div>
        </div>
      )}

      {/* Activity List */}
      {state.activities.length === 0 && !showNewActivity && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No activities yet. Create one to get started!</p>
        </div>
      )}

      <div className="space-y-4">
        {state.activities.map(activity => {
          const tasks = getTasksForActivity(activity.id);
          const totalTime = getActivityTime(activity.id);
          const isExpanded = expandedActivity === activity.id;

          return (
            <div key={activity.id} className="bg-[#161d2a] rounded-2xl border border-white/5 overflow-hidden shadow-xl transition-all hover:border-white/10">
              {/* Activity Header */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: activity.color + '15', border: `1px solid ${activity.color}30` }}
                >
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg truncate">{activity.name}</h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} • {formatHours(totalTime)} total focus
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(activity);
                    }}
                    className="p-2.5 rounded-xl text-zinc-600 hover:text-app-accent hover:bg-app-accent/10 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${activity.name}" and all its tasks?`)) {
                        deleteActivity(activity.id);
                      }
                    }}
                    className="p-2.5 rounded-xl text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className={`p-1 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                </div>
              </div>

              {/* Tasks */}
              {isExpanded && (
                <div className="border-t border-white/5 bg-black/20">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] last:border-0"
                    >
                      <button
                        onClick={() => updateTask({ ...task, completed: !task.completed })}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                          task.completed
                            ? 'border-blue-500 bg-blue-500 shadow-lg shadow-blue-500/20'
                            : 'border-zinc-700 hover:border-blue-400'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <span className={`flex-1 text-sm font-medium truncate ${
                        task.completed
                          ? 'text-zinc-600 line-through decoration-blue-500/30'
                          : 'text-zinc-300'
                      }`}>
                        {task.title}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-zinc-600 shrink-0">
                        {formatHours(getTaskTime(task.id))}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete task "${task.title}"?`)) {
                            deleteTask(task.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                          {/* Add Task */}
                  {addingTaskFor === activity.id ? (
                    <div className="flex items-center gap-3 px-6 py-4 animate-in slide-in-from-top-2 duration-200">
                      <input
                        type="text"
                        placeholder="What needs to be done?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTask(activity.id);
                          if (e.key === 'Escape') { setAddingTaskFor(null); setNewTaskTitle(''); }
                        }}
                        className="flex-1 bg-zinc-900 border border-white/5 px-4 py-2 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddTask(activity.id)}
                        className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setAddingTaskFor(null); setNewTaskTitle(''); }}
                        className="p-2 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTaskFor(activity.id); setNewTaskTitle(''); }}
                      className="flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 hover:bg-white/[0.01] w-full transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Quick Task
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
