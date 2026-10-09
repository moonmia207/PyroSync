import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, AlertCircle } from 'lucide-react';
import type { DailySummary, DatasetMetadata } from '../types/fire';
import { buildMonthGrid, formatMonthYear, getHeatClass } from '../utils/dateUtils';

interface BurningCalendarProps {
  year: number;
  month: number; // 1-12
  onChangeMonth: (year: number, month: number) => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  dailySummariesMap: Map<string, DailySummary>;
  criticalThreshold: number;
  metadata: DatasetMetadata;
  onJumpToCoverage: () => void;
}

export const BurningCalendar: React.FC<BurningCalendarProps> = ({
  year,
  month,
  onChangeMonth,
  selectedDateStr,
  onSelectDate,
  dailySummariesMap,
  criticalThreshold,
  metadata,
  onJumpToCoverage,
}) => {
  const weeks = buildMonthGrid(year, month, dailySummariesMap);

  const handlePrevMonth = () => {
    if (month === 1) onChangeMonth(year - 1, 12);
    else onChangeMonth(year, month - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) onChangeMonth(year + 1, 1);
    else onChangeMonth(year, month + 1);
  };

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Check if current month has any active data loaded
  const currentMonthHasData = Array.from(dailySummariesMap.values()).some(
    d => d.year === year && d.month === month && d.hasData && !d.isUnavailable
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between h-full">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-teal-50 border border-teal-200 text-scientific-teal-700">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Burning Activity Calendar
            </h2>
            <p className="text-[11px] text-slate-500">
              Daily active fire intensity & multi-sensor counts
            </p>
          </div>
        </div>

        {/* Year / Month Stepper Controls */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md p-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Dropdown */}
          <select
            value={month}
            onChange={(e) => onChangeMonth(year, parseInt(e.target.value, 10))}
            className="bg-transparent text-xs font-semibold text-slate-800 px-1 py-0.5 focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('en-US', { month: 'short' })}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={year}
            onChange={(e) => onChangeMonth(parseInt(e.target.value, 10), month)}
            className="bg-transparent text-xs font-semibold text-slate-800 px-1 py-0.5 focus:outline-none cursor-pointer"
          >
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dataset Range Context Notice */}
      {!currentMonthHasData && (
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 mb-2.5 text-xs flex items-center justify-between text-slate-600">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>
              No observations loaded for {formatMonthYear(year, month)}. (Dataset covers {metadata.earliestDate} to {metadata.latestDate})
            </span>
          </div>
          <button
            onClick={onJumpToCoverage}
            className="text-scientific-teal-700 hover:text-scientific-teal-800 font-medium underline text-xs ml-2 cursor-pointer"
          >
            Jump to Active Period
          </button>
        </div>
      )}

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {dayHeaders.map((day) => (
          <div key={day} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Heatmap Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {weeks.map((week, wIdx) =>
          week.map((cell, cIdx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const summary = cell.summary;
            const clusterCount = summary ? summary.clusterCount : 0;
            const hasData = summary ? summary.hasData : false;
            const isUnavailable = summary ? Boolean(summary.isUnavailable) : true;
            const isUnusual = summary?.isUnusual;
            const heatClass = getHeatClass(clusterCount, hasData, isUnavailable);

            return (
              <button
                key={`${wIdx}-${cIdx}`}
                onClick={() => onSelectDate(cell.dateStr)}
                disabled={!cell.isCurrentMonth}
                className={`group relative p-1 rounded border text-left transition flex flex-col justify-between min-h-[60px] ${heatClass} ${
                  !cell.isCurrentMonth
                    ? 'opacity-25 cursor-not-allowed bg-slate-50/50 border-transparent'
                    : isSelected
                    ? 'ring-2 ring-scientific-teal-700 border-scientific-teal-700 shadow-sm z-10 cursor-pointer'
                    : 'cursor-pointer'
                }`}
              >
                {/* Day Number and Surge Badge */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono font-semibold ${
                      isSelected ? 'text-slate-900 font-bold' : cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.isCurrentMonth && isUnusual && (
                    <span
                      title="Statistical Surge: Hotspot frequency significantly above baseline"
                      className="text-[9px] font-mono px-1 rounded bg-rose-600 text-white font-medium"
                    >
                      Surge
                    </span>
                  )}
                </div>

                {/* Fire Count & Sensor Breakdown */}
                {cell.isCurrentMonth && (
                  <div className="mt-1">
                    {isUnavailable ? (
                      <span className="text-[9px] font-mono text-slate-400 italic">No data</span>
                    ) : !hasData ? (
                      <span className="text-[9px] font-mono text-slate-400 italic">No pass</span>
                    ) : clusterCount === 0 ? (
                      <span className="text-[9px] font-mono text-slate-400">0 fires</span>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1 font-mono text-xs font-semibold leading-tight text-slate-800">
                          <Flame className="w-3 h-3 text-amber-600" />
                          <span>{clusterCount}</span>
                          <span className="text-[9px] font-normal text-slate-500">cl.</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[8px] font-mono text-slate-500">
                          <span className="text-amber-700 font-semibold" title="MODIS detections">M:{summary?.modisCount || 0}</span>
                          <span>/</span>
                          <span className="text-sky-700 font-semibold" title="VIIRS detections">V:{summary?.viirsCount || 0}</span>
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
      <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">Activity Level:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-white border border-slate-200" title="Zero Detections"></span>
            <span className="text-[10px]">0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200" title="1-5 fires"></span>
            <span className="text-[10px]">1-5</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" title="6-15 fires"></span>
            <span className="text-[10px]">6-15</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-orange-100 border border-orange-300" title="16-35 fires"></span>
            <span className="text-[10px]">16-35</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-100 border border-rose-400" title="36+ fires (Critical)"></span>
            <span className="text-[10px] text-rose-800 font-semibold">&gt;35</span>
          </div>
          <div className="flex items-center gap-1 ml-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-dashed border-slate-300" title="Data Not Loaded / Satellite Gap"></span>
            <span className="text-[10px] text-slate-400">Unavailable</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          Surge threshold: {criticalThreshold > 0 ? `>${criticalThreshold} clusters` : 'N/A'}
        </div>
      </div>
    </div>
  );
};
