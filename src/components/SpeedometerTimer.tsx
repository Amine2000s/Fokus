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

  const targetSecs = activeSession?.targetDuration || 0;
  const isCountdown = targetSecs > 0;
  const remaining = isCountdown ? Math.max(0, targetSecs - elapsed) : elapsed;
  const progress = isCountdown
    ? (elapsed / targetSecs)
    : (elapsed % 3600) / 3600;

  const r = 60;
  const c = Math.PI * r;
  const offset = c * (1 - Math.min(1, progress));

  const label = activeSession
    ? isCountdown ? 'remaining' : 'elapsed'
    : 'ready';

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-56 h-40 flex items-center justify-center">
        <svg className="absolute top-0 w-full h-full" viewBox="0 0 200 140">
          <path
            d="M 40 105 A 60 60 0 0 1 160 105"
            fill="none"
            stroke="currentColor"
            className="text-muted/10"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 40 105 A 60 60 0 0 1 160 105"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-linear"
            style={{ opacity: activeSession ? 1 : 0.15 }}
          />
        </svg>

        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 text-center">
          <div className="text-4xl font-mono font-semibold text-foreground tracking-tight tabular-nums leading-none">
            {activeSession ? formatTime(remaining) : '00:00'}
          </div>
          <p className="text-[10px] text-muted-foreground font-medium mt-1 tracking-wider uppercase">
            {label}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mt-1">
        <span className="font-semibold text-foreground">{todayMinutes}</span> min today
      </p>
    </div>
  );
}
