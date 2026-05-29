import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, X } from 'lucide-react';
import { useFokus } from '@/store/FokusContext';
import BoardCard from './BoardCard';
import MarkdownEditor from './MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Task } from '@/types';

const COLUMNS: { id: Task['board']; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-primary/10 text-primary' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-amber-500/10 text-amber-500' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500/10 text-emerald-500' },
];

export default function BoardView() {
  const { state, addTask, updateTask } = useFokus();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActivityId, setNewActivityId] = useState('');

  useMemo(() => {
    if (!newActivityId && state.activities.length > 0) {
      setNewActivityId(state.activities[0].id);
    }
  }, [state.activities, newActivityId]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {
      'todo': [],
      'in-progress': [],
      'done': [],
    };
    for (const task of state.tasks) {
      const col = task.board || 'todo';
      if (map[col]) {
        map[col].push(task);
      } else {
        map['todo'].push(task);
      }
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [state.tasks]);

  const columnTaskIds = useMemo(() => ({
    'todo': tasksByColumn['todo'].map(t => t.id),
    'in-progress': tasksByColumn['in-progress'].map(t => t.id),
    'done': tasksByColumn['done'].map(t => t.id),
  }), [tasksByColumn]);

  const findColumn = useCallback((id: string): Task['board'] => {
    for (const [col, tasks] of Object.entries(tasksByColumn)) {
      if (tasks.some(t => t.id === id)) return col as Task['board'];
    }
    return 'todo';
  }, [tasksByColumn]);

  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(async (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceCol = findColumn(active.id);
    const destCol = findColumn(over.id);

    const sourceTasks = [...tasksByColumn[sourceCol]];
    const destTasks = sourceCol === destCol ? sourceTasks : [...tasksByColumn[destCol]];

    const activeIndex = sourceTasks.findIndex(t => t.id === active.id);
    const overIndex = destTasks.findIndex(t => t.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;

    const [moved] = sourceTasks.splice(activeIndex, 1);

    if (sourceCol === destCol) {
      sourceTasks.splice(overIndex, 0, moved);
    } else {
      destTasks.splice(overIndex, 0, moved);
    }

    const updates: Promise<void>[] = [];

    if (sourceCol !== destCol) {
      sourceTasks.forEach((t, i) => {
        if (t.board !== sourceCol || t.sortOrder !== i) {
          updates.push(updateTask({ ...t, board: sourceCol, sortOrder: i }));
        }
      });
      destTasks.forEach((t, i) => {
        const newBoard = t.id === moved.id ? destCol : t.board;
        if (newBoard !== t.board || t.sortOrder !== i) {
          updates.push(updateTask({
            ...t,
            board: newBoard as Task['board'],
            sortOrder: i,
            completed: newBoard === 'done',
          }));
        }
      });
    } else {
      sourceTasks.forEach((t, i) => {
        if (t.sortOrder !== i) {
          updates.push(updateTask({ ...t, sortOrder: i }));
        }
      });
    }

    await Promise.all(updates);
  }, [tasksByColumn, findColumn, updateTask]);

  const activeTask = activeId ? state.tasks.find(t => t.id === activeId) : null;

  const handleAddTask = () => {
    if (!newTitle.trim() || !newActivityId) return;
    const maxOrder = tasksByColumn['todo'].reduce((max, t) => Math.max(max, t.sortOrder), -1);
    addTask({
      id: crypto.randomUUID(),
      activityId: newActivityId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      board: 'todo',
      sortOrder: maxOrder + 1,
    });
    setNewTitle('');
    setNewDescription('');
    setShowAddForm(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 flex-1 overflow-hidden pb-4">
        {COLUMNS.map(col => {
          const tasks = tasksByColumn[col.id];
          return (
            <div key={col.id} className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{tasks.length}</span>
                </div>
              </div>

              <SortableContext items={columnTaskIds[col.id]} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col space-y-2 flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                  {col.id === 'todo' && !showAddForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="w-full shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </button>
                  )}

                  {col.id === 'todo' && showAddForm && (
                    <div className="bg-card border border-border rounded-lg p-3 space-y-3 animate-slide-up shrink-0">
                      <Input
                        type="text"
                        placeholder="Task title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddTask()}
                        className="h-8 text-sm"
                        autoFocus
                      />

                      <MarkdownEditor
                        value={newDescription}
                        onChange={setNewDescription}
                        placeholder="Description (optional)"
                      />

                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                        {state.activities.map(activity => (
                          <button
                            key={activity.id}
                            type="button"
                            onClick={() => setNewActivityId(activity.id)}
                            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                              newActivityId === activity.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {activity.icon} {activity.name}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={handleAddTask}
                          disabled={!newTitle.trim() || !newActivityId}
                        >
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => { setShowAddForm(false); setNewTitle(''); setNewDescription(''); }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {tasks.map(task => (
                    <BoardCard key={task.id} task={task} />
                  ))}

                  {tasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg">
                      <p className="text-[10px] text-muted-foreground">No tasks</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bg-card border border-border rounded-lg p-3 shadow-lg ring-1 ring-primary/20">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activeTask.title}</p>
                {activeTask.description && (
                  <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{activeTask.description}</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
