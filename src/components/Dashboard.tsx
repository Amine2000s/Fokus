import { useState, useMemo } from 'react';
import SpeedometerTimer from './SpeedometerTimer';
import HeatMap from './HeatMap';
import { useFokus } from '@/store/FokusContext';
import { Play, Search, Plus } from 'lucide-react';

export default function Dashboard() {
  const { state, addTask, addActivity, startSession } = useFokus();
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [targetMins, setTargetMins] = useState<number | null>(null);
  const [customPresets, setCustomPresets] = useState<number[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const topActivities = state.activities.slice(0, 3);
  
  const DEFAULT_PRESETS = [5, 10, 25];
  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  const handleTogglePreset = (mins: number) => {
    setTargetMins(targetMins === mins ? null : mins);
  };

  const getThemeClass = (active: boolean) => {
    if (!active) return 'bg-app-dark/40 text-app-secondary border-app-subtle hover:text-app-primary hover:bg-app-dark/80';
    if (state.theme === 'paper') return 'bg-app-accent text-white border-app-accent shadow-xl shadow-app-accent/20 scale-105';
    if (state.theme === 'obsidian') return 'bg-white text-black border-white shadow-xl shadow-white/20 scale-105';
    return 'bg-app-accent text-white border-app-accent shadow-xl shadow-app-accent/20 scale-105';
  };

  const handleAddCustom = () => {
    const mins = parseInt(customVal);
    if (mins > 0) {
      if (!allPresets.includes(mins)) {
        setCustomPresets([...customPresets, mins]);
      }
      setTargetMins(mins);
      setCustomVal('');
      setIsAddingCustom(false);
    }
  };

  const removePreset = (e: React.MouseEvent, mins: number) => {
    e.stopPropagation();
    setCustomPresets(prev => prev.filter(p => p !== mins));
    if (targetMins === mins) setTargetMins(null);
  };
  
  // Set default activity if not set
  useMemo(() => {
    if (!selectedActivityId && state.activities.length > 0) {
      setSelectedActivityId(state.activities[0].id);
    }
  }, [state.activities, selectedActivityId]);

  const handleQuickStart = async () => {
    if (!taskTitle.trim()) return;

    let activityId = selectedActivityId;

    // Cold Start: Auto-create "Others" activity if nothing is selected
    if (!activityId) {
      const existingOthers = state.activities.find(a => a.name === 'Others');
      if (existingOthers) {
        activityId = existingOthers.id;
      } else {
        const othersId = crypto.randomUUID();
        await addActivity({
          id: othersId,
          name: 'Others',
          icon: '🧩',
          color: '#94a3b8',
          createdAt: new Date().toISOString(),
        });
        activityId = othersId;
      }
    }
    
    // Check if task already exists
    let task = state.tasks.find(t => 
      t.title.toLowerCase() === taskTitle.trim().toLowerCase() && 
      t.activityId === activityId
    );

    if (!task) {
      const newTask = {
        id: crypto.randomUUID(),
        activityId,
        title: taskTitle.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      await addTask(newTask);
      task = newTask;
    }

    await startSession(task.id, activityId, targetMins ? targetMins * 60 : null);
    setTaskTitle('');
    setTargetMins(null);
  };

  const recentTasks = useMemo(() => {
    // Get unique tasks from recent sessions
    const taskIds = new Set();
    return state.sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .map(s => state.tasks.find(t => t.id === s.taskId))
      .filter((t): t is any => {
        if (t && !taskIds.has(t.id)) {
          taskIds.add(t.id);
          return true;
        }
        return false;
      })
      .slice(0, 3);
  }, [state.sessions, state.tasks]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] py-12">
      <div className="w-full max-w-3xl bg-app-card rounded-[3rem] border border-app-subtle p-8 sm:p-12 shadow-fokus flex flex-col items-center transition-all duration-500">
        
        {/* Top Section: Timer */}
        <div className="w-full flex justify-center mb-8">
          <SpeedometerTimer />
        </div>

        {/* Quick Start Input or Active Session Meta */}
        <div className="w-full max-w-md mb-12">
          {!state.activeSession ? (
            <div className="space-y-6">
              {/* Duration Presets (Toggles) */}
              <div className="flex flex-col items-center gap-4 pb-1">
                <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide w-full">
                  {allPresets.map(mins => (
                    <div key={mins} className="relative group shrink-0">
                      <button
                        onClick={() => handleTogglePreset(mins)}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.15em] border transition-all ${getThemeClass(targetMins === mins)}`}
                      >
                        {mins}m
                      </button>
                      {!DEFAULT_PRESETS.includes(mins) && (
                        <button
                          onClick={(e) => removePreset(e, mins)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-app-card text-app-secondary hover:text-rose-500 border border-app-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                        >
                          <span className="text-[12px] font-bold leading-none">×</span>
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-app-dark/50 text-app-secondary border border-app-subtle hover:text-app-primary hover:bg-app-dark transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Custom Duration Modal */}
              {isAddingCustom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <div 
                    className="absolute inset-0 bg-app-dark/80 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsAddingCustom(false)}
                  />
                  
                  {/* Modal Card */}
                  <div className="relative w-full max-w-sm bg-app-card border border-app-subtle rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                    <div className="text-center mb-8">
                      <h3 className="text-lg font-bold text-app-primary">Custom Duration</h3>
                      <p className="text-xs text-app-secondary uppercase tracking-widest font-bold mt-1">Minutes to Focus</p>
                    </div>

                    <div className="flex flex-col gap-6">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="00"
                          autoFocus
                          value={customVal}
                          onChange={(e) => setCustomVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCustom();
                            if (e.key === 'Escape') setIsAddingCustom(false);
                          }}
                          className="w-full bg-app-dark border border-app-subtle rounded-2xl py-6 text-center text-5xl font-mono font-bold text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50 placeholder:text-app-secondary/20"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-app-secondary font-bold uppercase text-[10px] tracking-widest pointer-events-none">
                          MIN
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsAddingCustom(false)}
                          className="flex-1 py-4 rounded-xl bg-app-dark text-app-secondary font-bold text-xs uppercase tracking-widest hover:bg-app-dark/80 border border-app-subtle transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddCustom}
                          className="flex-1 py-4 rounded-xl bg-app-accent text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-lg shadow-app-accent/20 transition-all"
                        >
                          Set Timer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Task Input */}
              <div className="relative group">
                <input
                  type="text"
                  placeholder="What's your focus?"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickStart()}
                  className="w-full bg-app-dark/50 border border-app-subtle rounded-[1.25rem] py-5 pl-12 pr-16 text-sm text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50 placeholder:text-app-secondary transition-all shadow-inner"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-app-secondary group-focus-within:text-app-accent transition-colors" />
                <button
                  onClick={handleQuickStart}
                  disabled={!taskTitle.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-app-accent text-white flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all active:scale-95 shadow-lg shadow-app-accent/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Quick Activity Tags (Below input) */}
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  {state.activities.map(activity => (
                    <button
                      key={activity.id}
                      onClick={() => setSelectedActivityId(activity.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                        selectedActivityId === activity.id
                          ? 'bg-app-accent/10 border-app-accent/50 text-app-accent'
                          : 'bg-app-dark/5 border-app-subtle text-app-secondary hover:bg-app-dark/10'
                      }`}
                    >
                      {activity.icon} {activity.name}
                    </button>
                  ))}
                </div>

                {recentTasks.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-1">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold shrink-0 mr-1">Recent:</span>
                    {recentTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setTaskTitle(task.title);
                          setSelectedActivityId(task.activityId);
                        }}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-800/50 text-zinc-400 text-[10px] hover:text-zinc-200 transition-colors border border-white/5"
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  Currently Focusing
               </div>
               <p className="mt-3 text-zinc-400 text-sm font-medium">
                {state.tasks.find(t => t.id === state.activeSession?.taskId)?.title}
               </p>
            </div>
          )}
        </div>

        {/* Middle Section: Heat Map */}
        <div className="w-full flex justify-center">
          <HeatMap />
        </div>

        {/* Bottom Section: Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-white/5">
          {topActivities.length > 0 ? (
            topActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: activity.color }}
                />
                <span className="text-[12px] font-medium text-zinc-400">{activity.name}</span>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[12px] font-medium text-zinc-400">Coding</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[12px] font-medium text-zinc-400">Reading</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-[12px] font-medium text-zinc-400">Exercise</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
