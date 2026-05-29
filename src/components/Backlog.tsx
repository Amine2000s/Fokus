import { useState, useMemo } from 'react';
import { Play, Check, Trash2 } from 'lucide-react';
import { useFokus } from '@/store/FokusContext';
import { formatHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BoardView from './BoardView';

export default function Backlog() {
  const { state, addTask, updateTask, deleteTask, startSession, dispatch } = useFokus();
  const [newTitle, setNewTitle] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');

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

  const handleAddTask = () => {
    if (!newTitle.trim() || !selectedActivityId) return;
    const maxOrder = state.tasks
      .filter(t => t.board === 'todo')
      .reduce((max, t) => Math.max(max, t.sortOrder || 0), -1);
    addTask({
      id: crypto.randomUUID(),
      activityId: selectedActivityId,
      title: newTitle.trim(),
      description: '',
      completed: false,
      createdAt: new Date().toISOString(),
      board: 'todo',
      sortOrder: maxOrder + 1,
    });
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

  const handleComplete = (task: typeof state.tasks[0]) => {
    const maxOrder = state.tasks
      .filter(t => t.board === 'done')
      .reduce((max, t) => Math.max(max, t.sortOrder || 0), -1);
    updateTask({ ...task, completed: true, board: 'done', sortOrder: maxOrder + 1 });
  };

  return (
    <div className={viewMode === 'board' ? 'flex-1 flex flex-col overflow-hidden' : 'max-w-xl mx-auto space-y-6 pb-12'}>
      <div className="flex items-end justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Backlog</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingTasks.length} pending task{pendingTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'board')}>
          <TabsList className="h-8">
            <TabsTrigger value="list" className="text-xs px-3">List</TabsTrigger>
            <TabsTrigger value="board" className="text-xs px-3">Board</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {state.activities.map(activity => (
              <button
                key={activity.id}
                type="button"
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

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              className="flex-1 h-10 text-sm"
            />
            <Button
              onClick={handleAddTask}
              disabled={!newTitle.trim() || !selectedActivityId}
              size="sm"
            >
              Add
            </Button>
          </div>

          <div className="space-y-1">
            {pendingTasks.map(task => {
              const activity = state.activities.find(a => a.id === task.activityId);
              const timeSpent = getTaskTime(task.id);

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <button
                    onClick={() => handleComplete(task)}
                    className="w-5 h-5 rounded border-2 border-border flex items-center justify-center hover:border-primary transition-colors shrink-0"
                  >
                    <Check className="w-3 h-3 text-transparent group-hover:text-muted-foreground" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">{task.title}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activity?.color || '#3b82f6' }} />
                        {activity?.name}
                       </span>
                       {timeSpent > 0 && (
                         <span className="text-xs text-muted-foreground/60 font-mono">
                          &middot; {formatHours(timeSpent)}
                         </span>
                       )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => handleStartTask(task.id, task.activityId)}
                      size="sm"
                      className="text-xs h-7 px-2"
                    >
                      <Play className="w-3 h-3" />
                      Focus
                    </Button>
                    <Button
                      onClick={() => { if(confirm('Delete task?')) deleteTask(task.id) }}
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {pendingTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <BoardView />
      )}
    </div>
  );
}
