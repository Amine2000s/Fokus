import { useMemo, useState, useRef } from 'react';
import { Trash2, Calendar, Download, Upload, ShieldCheck, Database } from 'lucide-react';
import { useFokus } from '@/store/FokusContext';
import { formatDuration } from '@/lib/utils';

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
          // Clear and rewrite DB (Direct IndexedDB access for bulk import)
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

  // Group by date
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between px-2">
        <div>
          <h2 className="text-4xl font-serif text-app-primary">Sync</h2>
          <p className="text-xs text-app-secondary uppercase tracking-[0.2em] font-bold mt-2">
            Manage your local data & history
          </p>
        </div>
      </div>

      {/* Backup Card */}
      <div className="bg-app-card rounded-[2.5rem] border border-app-subtle p-8 shadow-fokus">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-app-primary">Backup & Restore</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-app-secondary font-medium">Portable JSON backup</p>
              {state.lastBackupAt && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Last: {new Date(state.lastBackupAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-app-dark border border-app-subtle text-app-primary hover:bg-app-dark/80 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Download className="w-4 h-4" />
            Export Backup
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-app-accent text-white shadow-lg shadow-app-accent/20 hover:opacity-90 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Upload className="w-4 h-4" />
            Import Backup
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      {/* History Log */}
      <div className="pt-4 space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-app-secondary" />
            <h3 className="text-sm font-bold text-app-secondary uppercase tracking-widest">Focus Log</h3>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-app-dark/50 border border-app-subtle px-3 py-1.5 rounded-xl text-[11px] font-bold text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50 appearance-none min-w-[140px] text-center"
          >
            <option value="all">All Activities</option>
            {state.activities.map(a => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
        </div>

        {groupedSessions.length === 0 && (
          <div className="text-center py-20 bg-app-card rounded-[2.5rem] border border-app-subtle">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-app-secondary text-sm font-medium">No focus history found.</p>
          </div>
        )}

        <div className="space-y-8">
          {groupedSessions.map(([date, sessions]) => {
            const dayTotal = sessions.reduce((sum, s) => sum + s.duration, 0);
            return (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-app-secondary uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(date)}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-app-secondary bg-app-dark px-2 py-1 rounded-lg">
                    {formatDuration(dayTotal)}
                  </span>
                </div>
                <div className="space-y-3">
                  {sessions.map(session => {
                    const task = state.tasks.find(t => t.id === session.taskId);
                    const activity = state.activities.find(a => a.id === session.activityId);
                    return (
                      <div
                        key={session.id}
                        className="flex items-center gap-4 bg-app-card rounded-2xl px-5 py-4 border border-app-subtle shadow-sm hover:shadow-md transition-all group"
                      >
                        <div
                          className="w-1.5 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: activity?.color || 'var(--accent-primary)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-app-primary truncate">
                            {task?.title || 'Deleted task'}
                          </p>
                          <p className="text-[11px] text-app-secondary mt-0.5 font-bold uppercase tracking-wide">
                            {activity?.icon} {activity?.name || 'Unknown'} • {formatTimeOfDay(session.startTime)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-mono font-bold text-app-primary">
                            {formatDuration(session.duration)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Delete this session?')) {
                              deleteSession(session.id);
                            }
                          }}
                          className="p-2.5 rounded-xl text-app-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0 sm:opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
