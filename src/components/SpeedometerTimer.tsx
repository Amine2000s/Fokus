import { useMemo, useEffect, useState, useRef } from 'react';
import { useFokus } from '@/store/FokusContext';
import { formatTime } from '@/lib/utils';

export default function SpeedometerTimer() {
  const { state } = useFokus();
  const [elapsed, setElapsed] = useState(0);
  const activeSession = state.activeSession;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeSession && !state.isPaused) {
      const update = () => {
        const start = new Date(activeSession.startTime).getTime();
        setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000) - state.pauseOffset));
      };
      update();
      intervalRef.current = setInterval(update, 1000);
    } else if (activeSession && state.isPaused) {
      // Keep showing elapsed but don't increment
      const start = new Date(activeSession.startTime).getTime();
      setElapsed(Math.max(0, Math.floor((state.pauseStartTime! - start) / 1000) - state.pauseOffset));
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSession, state.isPaused, state.pauseOffset, state.pauseStartTime]);

  const todayMinutes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const completed = state.sessions
      .filter(s => s.date === today && s.status === 'completed')
      .reduce((sum, s) => sum + s.duration, 0);
    return Math.round(completed / 60);
  }, [state.sessions]);

  // SVG Gauge constants
  const radius = 80;
  const circumference = Math.PI * radius; // Half circle
  
  const targetSecs = activeSession?.targetDuration || 0;
  const isCountdown = targetSecs > 0;
  const remaining = isCountdown ? Math.max(0, targetSecs - elapsed) : elapsed;
  const progress = isCountdown 
    ? (elapsed / targetSecs) 
    : (elapsed % 3600) / 3600;
  
  const strokeDashoffset = circumference * (1 - Math.min(1, progress));

  return (
    <div className="flex flex-col items-center py-8 bg-app-dark/30 rounded-[2.5rem] border border-app-subtle w-full max-w-sm mx-auto transition-all shadow-inner">
      <span className="text-[11px] tracking-[0.3em] text-app-secondary font-bold mb-8 uppercase font-serif italic">
        {activeSession ? (isCountdown ? 'Focus Countdown' : 'Focus Elapsed') : 'Ready to Focus'}
      </span>
      
      <div className="relative w-48 h-32 flex items-center justify-center overflow-hidden">
        <svg className="absolute top-0 w-full h-full" viewBox="0 0 200 120">
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            className="text-app-secondary/10"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          {activeSession && (
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          )}
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 text-center">
          <div className="text-3xl font-mono font-bold text-app-primary tracking-wider">
            {activeSession ? formatTime(remaining) : '00:00'}
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="text-xs text-zinc-400">
          Today: <span className="text-emerald-400 font-bold">{todayMinutes}</span> min focused
        </p>
        {!activeSession && (
          <p className="text-[11px] text-zinc-500 mt-4 px-8">
            No active session. Go to <span className="text-zinc-300 font-medium">Add Task</span> to start.
          </p>
        )}
      </div>
    </div>
  );
}
