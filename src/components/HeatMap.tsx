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
    const ratio = minutes / 120; // 120 mins as max for scaling
    if (ratio <= 0.25) return '#3b82f630';
    if (ratio <= 0.5) return '#3b82f660';
    if (ratio <= 0.75) return '#3b82f6a0';
    return '#3b82f6';
  }

  const totalMinutesLast4Months = useMemo(() => {
    return grid.flat().reduce((sum, d) => sum + (d?.minutes || 0), 0);
  }, [grid]);

  return (
    <div className="w-full select-none flex flex-col items-center">
      <div className="w-full overflow-x-auto pb-6 scrollbar-hide flex justify-center">
        {/* Grid Container */}
        <div className="relative inline-block w-[336px]">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-4 relative h-4 w-full">
            {monthLabels.slice(-4).map((m, i) => {
              const leftPos = (m.col - (grid.length - 20)) * 17;
              if (leftPos < 0) return null;
              return (
                <div
                  key={i}
                  className="text-[11px] font-medium text-zinc-400 absolute whitespace-nowrap"
                  style={{ left: leftPos }}
                >
                  {m.label}
                </div>
              );
            })}
          </div>
          {/* Cells */}
          <div className="flex gap-[4px]">
            {grid.slice(-20).map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[4px]">
                {Array.from({ length: 7 }).map((_, di) => {
                  const cell = week.find(d => d.dayOfWeek === di);
                  if (!cell) return <div key={di} className="w-[13px] h-[13px]" />;
                  return (
                    <div
                      key={di}
                      className="w-[13px] h-[13px] rounded-[2px] transition-colors cursor-pointer group relative"
                      style={{ backgroundColor: getColor(cell.minutes) }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-xl border border-white/10">
                        {cell.minutes}m • {cell.date}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="w-full max-w-[340px] flex flex-col items-center gap-4 border-t border-white/5 pt-4 mt-2">
        <div className="text-[11px] text-zinc-500 text-center">
          <span className="text-zinc-300 font-bold">{totalMinutesLast4Months}</span> total minutes focused in the last 4 months
        </div>
        
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span>0 mins</span>
          <div className="flex gap-[3px]">
            <div className="w-3 h-3 rounded-[1px] bg-[#1e293b]" />
            <div className="w-3 h-3 rounded-[1px] bg-[#3b82f630]" />
            <div className="w-3 h-3 rounded-[1px] bg-[#3b82f660]" />
            <div className="w-3 h-3 rounded-[1px] bg-[#3b82f6a0]" />
            <div className="w-3 h-3 rounded-[1px] bg-[#3b82f6]" />
          </div>
          <span>120+ mins</span>
        </div>
      </div>
    </div>
  );
}
