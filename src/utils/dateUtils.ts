import type { DailySummary } from '../types/fire';

export interface CalendarDayCell {
  dateStr: string;          // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  summary?: DailySummary;
}

/**
 * Formats a YYYY-MM-DD string into a readable date string.
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Returns month name and year for header display.
 */
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Builds a 7x(4-6) calendar matrix for a given month and year.
 * Weeks start on Monday.
 */
export function buildMonthGrid(
  year: number,
  month: number, // 1 - 12
  dailyMap: Map<string, DailySummary>
): CalendarDayCell[][] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const totalDays = lastDay.getUTCDate();

  // Day of week: 0 = Sun, 1 = Mon ... Convert so Monday is 0
  let startDayOfWeek = firstDay.getUTCDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const weeks: CalendarDayCell[][] = [];
  let currentWeek: CalendarDayCell[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const padDay = prevMonthLastDay - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(padDay).padStart(2, '0')}`;
    currentWeek.push({
      dateStr,
      dayNumber: padDay,
      isCurrentMonth: false,
      isToday: false,
      summary: dailyMap.get(dateStr),
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    currentWeek.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: false,
      summary: dailyMap.get(dateStr),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Next month padding to fill the last week
  if (currentWeek.length > 0) {
    let nextDay = 1;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    while (currentWeek.length < 7) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      currentWeek.push({
        dateStr,
        dayNumber: nextDay,
        isCurrentMonth: false,
        isToday: false,
        summary: dailyMap.get(dateStr),
      });
      nextDay++;
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

/**
 * Returns a CSS heat level class depending on the daily fire count.
 */
export function getHeatClass(count: number, hasData: boolean = true): string {
  if (!hasData) return 'bg-slate-900/40 text-slate-600 border-dashed border-slate-800'; // Missing/no coverage
  if (count === 0) return 'bg-slate-900/80 text-slate-400 border-slate-800/80 hover:border-slate-700'; // Zero fires
  if (count <= 5) return 'bg-amber-950/40 text-amber-300 border-amber-900/50 hover:border-amber-700'; // Low
  if (count <= 15) return 'bg-orange-950/60 text-orange-300 border-orange-800/70 hover:border-orange-600'; // Moderate
  if (count <= 35) return 'bg-orange-900/80 text-orange-100 border-orange-600 hover:border-orange-500'; // High
  return 'bg-red-900/90 text-red-100 border-red-500 shadow-sm shadow-red-900/50 hover:border-red-400'; // Critical surge
}
