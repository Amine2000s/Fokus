import { FokusProvider, useFokus } from '@/store/FokusContext';
import { Loader2, Play, Pause, Square, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/Dashboard';
import Backlog from '@/components/Backlog';
import ActivityManager from '@/components/ActivityManager';
import History from '@/components/History';
import Settings from '@/components/Settings';
import type { View } from '@/types';

function AppContent() {
  const { state, dispatch, togglePause, completeSession, cancelSession } = useFokus();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state.activeSession && !state.isPaused) {
      const update = () => {
        const start = new Date(state.activeSession!.startTime).getTime();
        const currentElapsed = Math.max(0, Math.floor((Date.now() - start) / 1000) - state.pauseOffset);
        setElapsed(currentElapsed);
        if (state.activeSession?.targetDuration && currentElapsed >= state.activeSession.targetDuration) {
          completeSession(state.activeSession);
        }
      };
      update();
      interval = setInterval(update, 1000);
    }
    return () => clearInterval(interval);
  }, [state.activeSession, state.isPaused, state.pauseOffset, completeSession]);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const setView = (view: View) => dispatch({ type: 'SET_VIEW', payload: view });

  const navItems: { view: View; label: string }[] = [
    { view: 'dashboard', label: 'Dashboard' },
    { view: 'timer', label: 'Backlog' },
    { view: 'activities', label: 'Activities' },
    { view: 'history', label: 'History' },
    { view: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 cursor-pointer"
            onClick={() => setView('dashboard')}
          >
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="6.5" opacity="0.45" />
              <circle cx="12" cy="12" r="10.5" opacity="0.15" />
            </svg>
            <span className="text-sm font-semibold tracking-tight text-foreground">Fokus</span>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  state.currentView === item.view
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {state.activeSession && (
              <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1">
                <div className="hidden md:block text-right leading-none">
                   <p className="text-[10px] text-muted-foreground font-medium leading-none mb-0.5">
                    {state.activeSession?.targetDuration ? 'Left' : 'Elapsed'}
                   </p>
                   <p className="text-xs font-mono font-semibold text-primary tabular-nums leading-none">
                     {formatTime(state.activeSession?.targetDuration ? Math.max(0, state.activeSession.targetDuration - elapsed) : elapsed)}
                   </p>
                </div>

                <div className="flex items-center gap-0.5">
                  <Button
                    onClick={togglePause}
                    variant="ghost"
                    size="icon"
                    title={state.isPaused ? "Resume" : "Pause"}
                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                  >
                    {state.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    onClick={() => completeSession(state.activeSession!)}
                    variant="ghost"
                    size="icon"
                    title="Complete"
                    className="w-7 h-7 text-muted-foreground hover:text-emerald-500"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => { if(confirm('Cancel session?')) cancelSession() }}
                    variant="ghost"
                    size="icon"
                    title="Cancel"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="animate-fade-in" key={state.currentView}>
          {state.currentView === 'dashboard' && <Dashboard />}
          {state.currentView === 'timer' && <Backlog />}
          {state.currentView === 'activities' && <ActivityManager />}
          {state.currentView === 'history' && <History />}
          {state.currentView === 'settings' && <Settings />}
        </div>
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40">
        <div className="flex justify-around py-2.5">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                state.currentView === item.view ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <FokusProvider>
      <AppContent />
    </FokusProvider>
  );
}
