import { useMemo, useState, useRef } from 'react';
import { Trash2, Download, Upload, ShieldCheck } from 'lucide-react';
import { useFokus } from '@/store/FokusContext';
import { formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function History() {
  const { state, deleteSession, dispatch } = useFokus();
  const [filter, setFilter] = useState<'all' | string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const now = new Date().toISOString();
    const backup = {
      activities: state.activities,
      tasks: state.tasks,
      sessions: state.sessions,
      version: 1,
      exportedAt: now
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fokus-backup-${now.split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    dispatch({ type: 'SET_BACKUP_DATE', payload: now });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.activities || !data.tasks || !data.sessions) {
          throw new Error('Invalid backup file');
        }

        if (confirm('Importing will overwrite current data. Are you sure?')) {
          const request = indexedDB.open('fokus-db', 1);
          request.onsuccess = (event: any) => {
            const db = event.target.result;
            const tx = db.transaction(['activities', 'tasks', 'sessions'], 'readwrite');

            tx.objectStore('activities').clear();
            tx.objectStore('tasks').clear();
            tx.objectStore('sessions').clear();

            data.activities.forEach((item: any) => tx.objectStore('activities').put(item));
            data.tasks.forEach((item: any) => tx.objectStore('tasks').put(item));
            data.sessions.forEach((item: any) => tx.objectStore('sessions').put(item));

            tx.oncomplete = () => {
              alert('Import successful! Reloading...');
              window.location.reload();
            };
          };
        }
      } catch (err) {
        alert('Error importing backup: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
  };

  const completedSessions = useMemo(() => {
    let sessions = state.sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (filter !== 'all') {
      sessions = sessions.filter(s => s.activityId === filter);
    }
    return sessions;
  }, [state.sessions, filter]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof completedSessions> = {};
    for (const session of completedSessions) {
      if (!groups[session.date]) groups[session.date] = [];
      groups[session.date].push(session);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [completedSessions]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTimeOfDay = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const totalFocusTime = useMemo(() => {
    return completedSessions.reduce((sum, s) => sum + s.duration, 0);
  }, [completedSessions]);

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">History</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatDuration(totalFocusTime)} across {completedSessions.length} session{completedSessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm">Backup & Restore</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {state.lastBackupAt
                  ? `Last backup: ${new Date(state.lastBackupAt).toLocaleDateString()}`
                  : 'Portable JSON backup'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Log</h3>
          <Select value={filter} onValueChange={(value) => setFilter(value)}>
            <SelectTrigger className="w-[140px] h-7 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {state.activities.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {groupedSessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
          </div>
        )}

        <div className="space-y-5">
          {groupedSessions.map(([date, sessions]) => {
            const dayTotal = sessions.reduce((sum, s) => sum + s.duration, 0);
            return (
              <div key={date} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{formatDate(date)}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{formatDuration(dayTotal)}</span>
                </div>
                <div className="space-y-1">
                  {sessions.map(session => {
                    const task = state.tasks.find(t => t.id === session.taskId);
                    const activity = state.activities.find(a => a.id === session.activityId);
                    return (
                      <div
                        key={session.id}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors group"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: activity?.color || 'var(--primary)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate leading-snug">
                            {task?.title || <span className="italic text-muted-foreground">Deleted task</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {activity?.icon} {activity?.name || 'Unknown'} &middot; {formatTimeOfDay(session.startTime)}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground shrink-0 mr-1">
                          {formatDuration(session.duration)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { if (confirm('Delete this session?')) deleteSession(session.id) }}
                          className="w-6 h-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
