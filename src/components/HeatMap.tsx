import { useMemo } from 'react';
import { useFokus } from '@/store/FokusContext';
import { getDateString } from '@/lib/utils';

const WEEKS = 20;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HeatMap() {
  const { state } = useFokus();

  const { grid, monthLabels } = useMemo(() => {
    const dateMap: Record<string, number> = {};
    for (const session of state.sessions) {
      if (session.status === 'completed') {
        dateMap[session.date] = (dateMap[session.date] || 0) + session.duration;
      }
    }

    const today = new Date();
    const todayDay = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - ((WEEKS - 1) * 7 + todayDay));

    const weeks: { date: string; minutes: number; dayOfWeek: number }[][] = [];
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;

    const current = new Date(startDate);
    let weekIdx = 0;

    while (current <= today) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0) {
        weeks.push([]);
        weekIdx = weeks.length - 1;
        const month = current.getMonth();
        if (month !== lastMonth) {
          months.push({ label: MONTHS[month], col: weekIdx });
          lastMonth = month;
        }
      }
      if (!weeks[weekIdx]) weeks[weekIdx] = [];
      const dateStr = getDateString(current);
      const seconds = dateMap[dateStr] || 0;
      weeks[weekIdx].push({
        date: dateStr,
        minutes: Math.round(seconds / 60),
        dayOfWeek,
      });
      current.setDate(current.getDate() + 1);
    }

    return { grid: weeks, monthLabels: months };
  }, [state.sessions]);

  function getColor(minutes: number): string {
    if (minutes === 0) return 'var(--cell-empty)';
    const ratio = minutes / 120;
    if (ratio <= 0.25) return 'var(--heat-1)';
    if (ratio <= 0.5) return 'var(--heat-2)';
    if (ratio <= 0.75) return 'var(--heat-3)';
    return 'var(--heat-4)';
  }

  return (
    <div className="w-full select-none flex flex-col items-center">
      <div className="overflow-x-auto pb-4 scrollbar-hide flex justify-center">
        <div className="relative inline-block w-[308px]">
          <div className="flex gap-[2px] mb-3 relative h-3 w-full">
            {monthLabels.slice(-4).map((m, i) => {
              const leftPos = (m.col - (grid.length - 20)) * 15.5;
              if (leftPos < 0) return null;
              return (
                <div
                  key={i}
                  className="text-[9px] font-medium text-muted-foreground absolute whitespace-nowrap"
                  style={{ left: leftPos }}
                >
                  {m.label}
                </div>
              );
            })}
          </div>
          <div className="flex gap-[2px]">
            {grid.slice(-20).map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {Array.from({ length: 7 }).map((_, di) => {
                  const cell = week.find(d => d.dayOfWeek === di);
                  if (!cell) return <div key={di} className="w-[10px] h-[10px]" />;
                  return (
                    <div
                      key={di}
                      className="w-[10px] h-[10px] rounded-[1px] transition-colors cursor-default group relative"
                      style={{ backgroundColor: getColor(cell.minutes) }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-foreground text-background text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity leading-none">
                        {cell.minutes}m &middot; {cell.date}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-[2px]">
          <div className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: 'var(--cell-empty)' }} />
          <div className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: 'var(--heat-1)' }} />
          <div className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: 'var(--heat-2)' }} />
          <div className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: 'var(--heat-3)' }} />
          <div className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: 'var(--heat-4)' }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
