import { FokusProvider, useFokus } from '@/store/FokusContext';
import { Loader2, Play, Pause, Square, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';
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
    let interval: ReturnType<typeof setInterval>;
    if (state.activeSession && !state.isPaused) {
      const update = () => {
        const start = new Date(state.activeSession!.startTime).getTime();
        const currentElapsed = Math.max(0, Math.floor((Date.now() - start) / 1000) - state.pauseOffset);
        setElapsed(currentElapsed);
        
        // Handle target reached
        if (state.activeSession?.targetDuration && currentElapsed >= state.activeSession.targetDuration) {
          // You could auto-complete here, but usually it's better to let the user finish their thought
        }
      };
      update();
      interval = setInterval(update, 1000);
    }
    return () => clearInterval(interval);
  }, [state.activeSession, state.isPaused, state.pauseOffset]);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e17]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-zinc-500 font-medium tracking-widest uppercase text-[10px]">Loading Fokus</p>
        </div>
      </div>
    );
  }

  const setView = (view: View) => dispatch({ type: 'SET_VIEW', payload: view });

  const navItems: { view: View; label: string }[] = [
    { view: 'dashboard', label: 'Dashboard' },
    { view: 'timer', label: 'Backlog' },
    { view: 'activities', label: 'Activities' },
    { view: 'history', label: 'Sync' },
    { view: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-app-dark flex flex-col text-app-primary transition-colors" data-theme={state.theme}>
      {/* Header */}
      <header className="border-b border-app-subtle sticky top-0 z-40 bg-app-dark/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setView('dashboard')}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-7 h-7 bg-app-accent rounded-lg opacity-10 absolute group-hover:scale-125 transition-transform duration-500" />
              <svg className="w-5 h-5 text-app-accent relative" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l2.5 2.5" />
              </svg>
            </div>
            <h1 className="text-lg font-black tracking-[-0.05em] uppercase text-app-primary">
              Fokus
            </h1>
          </div>

          {/* Top Navigation */}
          <nav className="hidden sm:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`relative px-1 py-2 text-sm font-bold transition-all ${
                  state.currentView === item.view
                    ? 'text-app-primary'
                    : 'text-app-secondary hover:text-app-primary opacity-60 hover:opacity-100'
                }`}
              >
                {item.label}
                {state.currentView === item.view && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-app-accent rounded-full shadow-lg shadow-app-accent/40" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            {state.activeSession && (
              <div className="flex items-center gap-4 bg-app-card px-4 py-2 rounded-2xl border border-app-subtle shadow-fokus">
                <div className="hidden md:block text-right mr-2">
                   <p className="text-[10px] text-app-secondary font-bold uppercase tracking-widest leading-none mb-1">
                    {state.activeSession?.targetDuration ? 'Time Left' : 'Focus Time'}
                   </p>
                   <p className="text-sm font-mono font-bold text-app-accent tabular-nums leading-none">
                     {formatTime(state.activeSession?.targetDuration ? Math.max(0, state.activeSession.targetDuration - elapsed) : elapsed)}
                   </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={togglePause}
                    title={state.isPaused ? "Resume" : "Pause"}
                    className="p-2 rounded-xl bg-app-dark text-app-secondary hover:text-app-primary transition-all active:scale-95"
                  >
                    {state.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                  </button>
                  <button
                    onClick={() => completeSession(state.activeSession!)}
                    title="Complete Session"
                    className="p-2 rounded-xl bg-app-dark text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                  <button
                    onClick={() => { if(confirm('Cancel session?')) cancelSession() }}
                    title="Cancel Session"
                    className="p-2 rounded-xl bg-app-dark text-app-secondary hover:text-rose-500 transition-all active:scale-95"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-app-dark border border-app-subtle hidden sm:block shadow-inner" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {state.currentView === 'dashboard' && <Dashboard />}
        {state.currentView === 'timer' && <Backlog />}
        {state.currentView === 'activities' && <ActivityManager />}
        {state.currentView === 'history' && <History />}
        {state.currentView === 'settings' && <Settings />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-app-dark/95 backdrop-blur-md border-t border-app-subtle z-40">
        <div className="flex justify-around py-4">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`text-xs font-bold uppercase tracking-tighter ${
                state.currentView === item.view ? 'text-app-accent' : 'text-app-secondary opacity-60'
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
