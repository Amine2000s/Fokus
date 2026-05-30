import { useState, useMemo } from 'react';
import SpeedometerTimer from './SpeedometerTimer';
import HeatMap from './HeatMap';
import { useFokus } from '@/store/FokusContext';
import { Play, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

export default function Dashboard() {
  const { state, addTask, addActivity, startSession } = useFokus();
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [targetMins, setTargetMins] = useState<number | null>(null);
  const [customPresets, setCustomPresets] = useState<number[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const DEFAULT_PRESETS = [5, 10, 25];
  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  const handleTogglePreset = (mins: number) => {
    setTargetMins(targetMins === mins ? null : mins);
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

  useMemo(() => {
    if (!selectedActivityId && state.activities.length > 0) {
      setSelectedActivityId(state.activities[0].id);
    }
  }, [state.activities, selectedActivityId]);

  const handleQuickStart = async () => {
    if (!taskTitle.trim()) return;

    let activityId = selectedActivityId;

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

    let task = state.tasks.find(t =>
      t.title.toLowerCase() === taskTitle.trim().toLowerCase() &&
      t.activityId === activityId
    );

    if (!task) {
      const maxOrder = state.tasks
        .filter(t => t.board === 'in-progress')
        .reduce((max, t) => Math.max(max, t.sortOrder || 0), -1);
      const newTask = {
        id: crypto.randomUUID(),
        activityId,
        title: taskTitle.trim(),
        description: '',
        completed: false,
        createdAt: new Date().toISOString(),
        board: 'in-progress' as const,
        sortOrder: maxOrder + 1,
      };
      await addTask(newTask);
      task = newTask;
    }

    await startSession(task.id, activityId, targetMins ? targetMins * 60 : null);
    setTaskTitle('');
    setTargetMins(null);
  };

  const recentTasks = useMemo(() => {
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
      .slice(0, 5);
  }, [state.sessions, state.tasks]);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] max-w-lg mx-auto py-12">
        <SpeedometerTimer />

        <div className="w-full mt-8 space-y-5">
          {!state.activeSession ? (
            <>
              <div className="flex items-center justify-center gap-1.5">
                {allPresets.map(mins => (
                  <div key={mins} className="relative group">
                    <Button
                      onClick={() => handleTogglePreset(mins)}
                      variant={targetMins === mins ? "default" : "outline"}
                      size="sm"
                      className="text-xs px-3"
                    >
                      {mins}m
                    </Button>
                    {!DEFAULT_PRESETS.includes(mins) && (
                      <button
                        onClick={(e) => removePreset(e, mins)}
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-background text-muted-foreground hover:text-foreground border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  onClick={() => setIsAddingCustom(true)}
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Dialog open={isAddingCustom} onOpenChange={setIsAddingCustom}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Custom Duration</DialogTitle>
                    <DialogDescription>Set your focus session length</DialogDescription>
                  </DialogHeader>
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
                        className="w-full bg-background border border-input rounded-md py-5 text-center text-3xl font-mono font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/20"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium pointer-events-none">
                        MIN
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <DialogClose asChild>
                        <Button variant="outline" className="flex-1">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button onClick={handleAddCustom} className="flex-[2]">
                        Set
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <Input
                  type="text"
                  placeholder="What's your focus?"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickStart()}
                  className="pr-14 h-11 text-sm"
                />
                <Button
                  onClick={handleQuickStart}
                  disabled={!taskTitle.trim()}
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  {state.activities.map(activity => (
                    <button
                      key={activity.id}
                      onClick={() => setSelectedActivityId(activity.id)}
                      className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedActivityId === activity.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {activity.icon} {activity.name}
                    </button>
                  ))}
                </div>

                {recentTasks.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    {recentTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setTaskTitle(task.title);
                          setSelectedActivityId(task.activityId);
                        }}
                        className="shrink-0 px-2 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground bg-muted/40 transition-colors"
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-slow" />
                Focusing now
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {state.tasks.find(t => t.id === state.activeSession?.taskId)?.title}
              </p>
            </div>
          )}
        </div>

        <div className="w-full mt-10">
          <HeatMap />
        </div>
      </div>
    </>
  );
}
