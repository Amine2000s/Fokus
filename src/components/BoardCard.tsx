import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Trash2, Pencil, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useFokus } from '@/store/FokusContext';
import { formatHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MarkdownEditor from './MarkdownEditor';
import type { Task } from '@/types';

interface Props {
  task: Task;
}

export default function BoardCard({ task }: Props) {
  const { state, startSession, updateTask, deleteTask, dispatch } = useFokus();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editActivityId, setEditActivityId] = useState(task.activityId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const activity = state.activities.find(a => a.id === task.activityId);
  const timeSpent = state.sessions
    .filter(s => s.taskId === task.id && s.status === 'completed')
    .reduce((sum, s) => sum + s.duration, 0);

  const hasDescription = (task.description || '').trim().length > 0;

  const handleSave = () => {
    if (!editTitle.trim()) return;
    updateTask({
      ...task,
      title: editTitle.trim(),
      description: editDescription.trim(),
      activityId: editActivityId,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditActivityId(task.activityId);
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card border border-primary/40 rounded-lg p-3 space-y-3"
      >
        <Input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="h-8 text-sm"
          autoFocus
        />
        <MarkdownEditor
          value={editDescription}
          onChange={setEditDescription}
          placeholder="Description (optional)"
          minRows={2}
        />
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {state.activities.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => setEditActivityId(a.id)}
              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                editActivityId === a.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {a.icon} {a.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSave} disabled={!editTitle.trim()}>
            <Check className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={handleCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all group ${
        isDragging ? 'opacity-50 ring-2 ring-primary shadow-lg z-50' : 'hover:border-muted-foreground/30'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {activity && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activity.color }} />
              <span className="text-[10px] text-muted-foreground font-medium truncate">{activity.name}</span>
            </div>
          )}

          <h4 className="text-sm font-medium text-foreground leading-snug">{task.title}</h4>

          {hasDescription && !expanded && (
            <p
              className="text-xs text-muted-foreground/70 mt-1 line-clamp-1 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            >
              {task.description}
            </p>
          )}

          {expanded && (
            <div className="mt-2 pt-2 border-t border-border animate-slide-up">
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {task.description}
                </ReactMarkdown>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                className="text-[10px] text-muted-foreground hover:text-foreground mt-1 flex items-center gap-0.5"
              >
                <ChevronRight className="w-3 h-3" /> Show less
              </button>
            </div>
          )}

          {timeSpent > 0 && (
            <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">{formatHours(timeSpent)}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              startSession(task.id, task.activityId);
              dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
            }}
            size="sm"
            className="text-xs h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="w-3 h-3" />
          </Button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete task?')) deleteTask(task.id);
            }}
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          {hasDescription && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
