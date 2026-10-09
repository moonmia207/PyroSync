import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, AlertTriangle } from 'lucide-react';
import type { DailySummary } from '../types/fire';
import { buildMonthGrid, formatMonthYear, getHeatClass } from '../utils/dateUtils';

interface BurningCalendarProps {
  year: number;
  month: number; // 1-12
  onChangeMonth: (year: number, month: number) => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  dailySummariesMap: Map<string, DailySummary>;
  criticalThreshold: number;
}

export const BurningCalendar: React.FC<BurningCalendarProps> = ({
  year,
  month,
  onChangeMonth,
  selectedDateStr,
  onSelectDate,
  dailySummariesMap,
  criticalThreshold,
}) => {
  const weeks = buildMonthGrid(year, month, dailySummariesMap);

  const handlePrevMonth = () => {
    if (month === 1) {
      onChangeMonth(year - 1, 12);
    } else {
      onChangeMonth(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onChangeMonth(year + 1, 1);
    } else {
      onChangeMonth(year, month + 1);
    }
  };

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between h-full">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Burning Activity Calendar
            </h2>
            <p className="text-xs text-slate-400">
              Daily active fire intensity & multi-sensor counts
            </p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-2 text-slate-200 min-w-[110px] text-center">
            {formatMonthYear(year, month)}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
        {dayHeaders.map((day) => (
          <div key={day} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Heatmap Grid */}
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {weeks.map((week, wIdx) =>
          week.map((cell, cIdx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const summary = cell.summary;
            const clusterCount = summary ? summary.clusterCount : 0;
            const hasData = summary ? summary.hasData : false;
            const isUnusual = summary?.isUnusual;
            const heatClass = getHeatClass(clusterCount, hasData);

            return (
              <button
                key={`${wIdx}-${cIdx}`}
                onClick={() => onSelectDate(cell.dateStr)}
                disabled={!cell.isCurrentMonth}
                className={`group relative p-1.5 rounded-lg border text-left transition flex flex-col justify-between min-h-[64px] ${heatClass} ${
                  !cell.isCurrentMonth
                    ? 'opacity-20 cursor-not-allowed bg-slate-950/30 border-transparent'
                    : isSelected
                    ? 'ring-2 ring-orange-400 border-orange-400 shadow-md shadow-orange-500/20 scale-[1.02] z-10 cursor-pointer'
                    : 'hover:scale-[1.01] cursor-pointer'
                }`}
              >
                {/* Day Number and Surge Badge */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isSelected ? 'text-white' : cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.isCurrentMonth && isUnusual && (
                    <span
                      title="Statistical Surge: Hotspot frequency significantly above baseline"
                      className="flex items-center text-[10px] text-amber-300 bg-amber-500/20 px-1 rounded animate-pulse"
                    >
                      <AlertTriangle className="w-2.5 h-2.5 mr-0.5 text-amber-400" />
                      Surge
                    </span>
                  )}
                </div>

                {/* Fire Count & Multi-sensor mini tag */}
                {cell.isCurrentMonth && (
                  <div className="mt-1">
                    {!hasData ? (
                      <span className="text-[10px] font-mono text-slate-500 italic">No Data</span>
                    ) : clusterCount === 0 ? (
                      <span className="text-[10px] font-mono text-slate-500">0 fires</span>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1 font-mono text-xs font-semibold leading-tight">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span>{clusterCount}</span>
                          <span className="text-[9px] font-normal text-slate-400">clusters</span>
                        </div>
                        {/* Breakdown pills */}
                        <div className="flex items-center gap-1 mt-0.5 text-[9px] font-mono text-slate-400">
                          <span className="text-amber-400" title="MODIS detections">M:{summary?.modisCount || 0}</span>
                          <span>/</span>
                          <span className="text-cyan-400" title="VIIRS detections">V:{summary?.viirsCount || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Legend & Summary Info */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-300">Heat Level:</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800" title="Zero Detections"></span>
            <span className="text-[10px]">0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-amber-950/60 border border-amber-900" title="1-5 fires"></span>
            <span className="text-[10px]">1-5</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-orange-950/70 border border-orange-800" title="6-15 fires"></span>
            <span className="text-[10px]">6-15</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-orange-900 border border-orange-600" title="16-35 fires"></span>
            <span className="text-[10px]">16-35</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-red-900 border border-red-500" title="36+ fires (Critical)"></span>
            <span className="text-[10px] text-red-300 font-semibold">&gt;35</span>
          </div>
          <div className="flex items-center gap-1 ml-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-950 border border-dashed border-slate-800" title="No Coverage / Cloud Blocked"></span>
            <span className="text-[10px] text-slate-500">No pass</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          Threshold: &gt;{criticalThreshold} fires = Unusual condition
        </div>
      </div>
    </div>
  );
};
