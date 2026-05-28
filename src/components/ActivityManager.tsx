import { useState, useMemo } from 'react';
import { Plus, Trash2, Check, X, ChevronRight, BarChart3 } from 'lucide-react';
import { useFokus } from '@/store/FokusContext';
import type { Activity, Task } from '@/types';
import { ACTIVITY_COLORS, ACTIVITY_ICONS, formatHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

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
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Focus Distribution</CardTitle>
              <CardDescription>{formatHours(stats.totalDuration)} total</CardDescription>
            </div>
          </div>

          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as 'day' | 'week' | 'month')}>
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs px-3">Day</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-around gap-2 px-1 border-b border-border">
            {stats.activityData.length > 0 ? (
              stats.activityData.map((activity) => (
                <div key={activity.id} className="flex-1 flex flex-col items-center group relative h-full justify-end pb-1">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-1.5 py-0.5 rounded text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none leading-none">
                    {formatHours(activity.duration)}
                  </div>

                  <div
                    className="w-full max-w-[32px] rounded-t-sm transition-all duration-700 ease-out"
                    style={{
                      height: `${(activity.duration / stats.maxDuration) * 100}%`,
                      backgroundColor: activity.color,
                      minHeight: activity.duration > 0 ? '3px' : '0px'
                    }}
                  />

                  <div className="mt-1.5 text-sm" title={activity.name}>
                    {activity.icon}
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center mb-6">
                <p className="text-xs text-muted-foreground">No data for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Activities</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {state.activities.length} categor{state.activities.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <Button
          onClick={() => setShowNewActivity(!showNewActivity)}
          size="sm"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>

      {showNewActivity && (
        <Card className="animate-slide-up">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                type="text"
                placeholder="e.g., Deep Work, Reading..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                autoFocus
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label className="text-xs">Icon</Label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-0.5 scrollbar-hide">
                  <div className="relative w-9 h-9">
                     <input
                        type="text"
                        maxLength={2}
                        placeholder="+"
                        className="w-full h-full rounded-lg bg-muted border-2 border-dashed border-border text-center text-base focus:outline-none focus:border-primary transition-colors"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) setNewIcon(val);
                        }}
                     />
                  </div>
                  {ACTIVITY_ICONS.map((icon, idx) => (
                    <button
                      key={`${icon}-${idx}`}
                      onClick={() => setNewIcon(icon)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${
                        newIcon === icon
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-7 h-7 rounded-full transition-all border-2 ${
                        newColor === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-110 opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowNewActivity(false);
                  setEditingActivity(null);
                  setNewName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingActivity ? handleUpdateActivity : handleAddActivity}
                disabled={!newName.trim()}
                className="flex-[2]"
              >
                {editingActivity ? 'Save' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state.activities.length === 0 && !showNewActivity && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No activities yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {state.activities.map(activity => {
          const tasks = getTasksForActivity(activity.id);
          const totalTime = getActivityTime(activity.id);
          const isExpanded = expandedActivity === activity.id;

          return (
            <div key={activity.id} className="rounded-lg border border-border overflow-hidden transition-all">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: activity.color + '15' }}
                >
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{activity.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} &middot; {formatHours(totalTime)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(activity);
                    }}
                    className="w-7 h-7 text-muted-foreground hover:text-primary"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${activity.name}" and all its tasks?`)) {
                        deleteActivity(activity.id);
                      }
                    }}
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-muted/20">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-5 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <button
                        onClick={() => updateTask({ ...task, completed: !task.completed })}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          task.completed
                            ? 'border-primary bg-primary'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {task.completed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </button>
                      <span className={`flex-1 text-sm truncate ${
                        task.completed
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground'
                      }`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {formatHours(getTaskTime(task.id))}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete task "${task.title}"?`)) {
                            deleteTask(task.id);
                          }
                        }}
                        className="w-6 h-6 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {addingTaskFor === activity.id ? (
                    <div className="flex items-center gap-2 px-5 py-2.5 animate-slide-up">
                      <Input
                        type="text"
                        placeholder="What needs to be done?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTask(activity.id);
                          if (e.key === 'Escape') { setAddingTaskFor(null); setNewTaskTitle(''); }
                        }}
                        autoFocus
                        className="h-8 text-sm"
                      />
                      <Button
                        size="icon"
                        className="w-7 h-7 shrink-0"
                        onClick={() => handleAddTask(activity.id)}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 shrink-0"
                        onClick={() => { setAddingTaskFor(null); setNewTaskTitle(''); }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTaskFor(activity.id); setNewTaskTitle(''); }}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-primary hover:bg-muted/20 w-full transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add task
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
