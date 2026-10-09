import React from 'react';
import { BarChart3, Info, AlertCircle } from 'lucide-react';
import type { DailySummary, BaselineAnalysis } from '../types/fire';

interface HistoricalChartProps {
  dailySummaries: DailySummary[];
  baseline: BaselineAnalysis;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  dailySummaries,
  baseline,
  selectedDateStr,
  onSelectDate,
}) => {
  const maxCount = Math.max(baseline.maxDayCount, baseline.thresholdCount, 10);
  const chartHeightPx = 120;

  // Filter out days outside available dataset
  const activeDays = dailySummaries.filter(d => !d.isUnavailable);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-200 gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-teal-50 border border-teal-200 text-scientific-teal-700">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Historical Fire Activity & Baseline
            </h3>
            <p className="text-[11px] text-slate-500">
              Daily cluster counts vs statistical baseline
            </p>
          </div>
        </div>

        {/* Statistical Badges */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <div className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
            Mean: <span className="font-semibold text-slate-900">{baseline.meanDailyCount}</span>
          </div>
          {baseline.isBaselineSufficient ? (
            <div className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
              Surge: <span className="font-semibold">{baseline.thresholdCount}</span>
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-400">
              Baseline: Insufficient (&lt;14d)
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart Area */}
      {activeDays.length === 0 ? (
        <div className="h-[140px] flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded my-2">
          <AlertCircle className="w-4 h-4 text-slate-300 mb-1" />
          <span>No observations recorded for the selected month.</span>
        </div>
      ) : (
        <div className="relative pt-5 pb-2">
          {/* Baseline Mean Guideline */}
          {baseline.isBaselineSufficient && baseline.meanDailyCount > 0 && (
            <div
              className="absolute w-full border-t border-dashed border-slate-300 z-10 pointer-events-none flex items-center justify-end pr-1"
              style={{
                bottom: `${(baseline.meanDailyCount / maxCount) * chartHeightPx + 20}px`,
              }}
            >
              <span className="text-[9px] font-mono text-slate-500 bg-white/95 px-1 -translate-y-2 border border-slate-200 rounded">
                Mean ({baseline.meanDailyCount})
              </span>
            </div>
          )}

          {/* Baseline Anomaly Threshold Guideline */}
          {baseline.isBaselineSufficient && baseline.thresholdCount > 0 && (
            <div
              className="absolute w-full border-t border-dashed border-rose-400 z-10 pointer-events-none flex items-center justify-end pr-1"
              style={{
                bottom: `${(baseline.thresholdCount / maxCount) * chartHeightPx + 20}px`,
              }}
            >
              <span className="text-[9px] font-mono text-rose-700 bg-white/95 px-1 -translate-y-2 font-medium border border-rose-200 rounded">
                Surge ({baseline.thresholdCount})
              </span>
            </div>
          )}

          {/* Bars Container */}
          <div
            className="flex items-end gap-1 overflow-x-auto pb-1 pt-2 scrollbar-thin"
            style={{ height: `${chartHeightPx + 30}px` }}
          >
            {dailySummaries.map((day) => {
              const isSelected = day.date === selectedDateStr;
              const barHeight = day.hasData && !day.isUnavailable
                ? Math.max((day.clusterCount / maxCount) * chartHeightPx, 3)
                : 2;
              const isSurge = day.isUnusual;

              return (
                <button
                  key={day.date}
                  onClick={() => onSelectDate(day.date)}
                  disabled={day.isUnavailable}
                  title={`${day.date}: ${day.clusterCount} clusters (MODIS: ${day.modisCount}, VIIRS: ${day.viirsCount})`}
                  className={`group flex flex-col items-center flex-1 min-w-[12px] transition cursor-pointer relative ${
                    day.isUnavailable ? 'opacity-20 cursor-not-allowed' : isSelected ? 'scale-105 z-20' : 'hover:opacity-85'
                  }`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      day.isUnavailable
                        ? 'bg-slate-200'
                        : isSelected
                        ? 'bg-scientific-teal-700 ring-1 ring-scientific-teal-800'
                        : isSurge
                        ? 'bg-rose-500'
                        : day.clusterCount > 0
                        ? 'bg-slate-600 group-hover:bg-slate-700'
                        : 'bg-slate-200'
                    }`}
                    style={{ height: `${barHeight}px` }}
                  />
                  <span
                    className={`text-[8px] font-mono mt-1 ${
                      isSelected ? 'text-scientific-teal-700 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {day.day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scientific Baseline Note */}
      <div className="pt-2 border-t border-slate-200 flex items-start gap-1.5 text-[10px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-scientific-teal-700 flex-shrink-0 mt-0.5" />
        <p>
          {baseline.isBaselineSufficient
            ? `Statistical baseline evaluated over ${baseline.baselinePeriod}. Baseline threshold = ${baseline.thresholdCount} clusters/day.`
            : 'At least 14 days of active observation data required to compute a rigorous anomaly baseline.'}
        </p>
      </div>
    </div>
  );
};
