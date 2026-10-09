import React from 'react';
import { BarChart3, Info } from 'lucide-react';
import type { DailySummary } from '../types/fire';
import type { BaselineAnalysis } from '../utils/statistics';

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
  const chartHeightPx = 130;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Historical Fire Activity & Baseline
            </h3>
            <p className="text-[11px] text-slate-400">
              Daily cluster counts vs statistical baseline
            </p>
          </div>
        </div>

        {/* Statistical Metrics Badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <div className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            Mean: <span className="text-white font-semibold">{baseline.meanDailyCount}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300">
            Surge Threshold: <span className="font-semibold">{baseline.thresholdCount}</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="relative pt-6 pb-2">
        {/* Baseline Mean Guideline */}
        {baseline.meanDailyCount > 0 && (
          <div
            className="absolute w-full border-t border-dashed border-slate-600 z-10 pointer-events-none flex items-center justify-end pr-1"
            style={{
              bottom: `${(baseline.meanDailyCount / maxCount) * chartHeightPx + 20}px`,
            }}
          >
            <span className="text-[9px] font-mono text-slate-400 bg-slate-900/90 px-1 -translate-y-2">
              Mean ({baseline.meanDailyCount})
            </span>
          </div>
        )}

        {/* Baseline Anomaly Threshold Guideline */}
        {baseline.thresholdCount > 0 && (
          <div
            className="absolute w-full border-t border-dashed border-amber-500/70 z-10 pointer-events-none flex items-center justify-end pr-1"
            style={{
              bottom: `${(baseline.thresholdCount / maxCount) * chartHeightPx + 20}px`,
            }}
          >
            <span className="text-[9px] font-mono text-amber-400 bg-slate-900/90 px-1 -translate-y-2 font-semibold">
              Surge Threshold ({baseline.thresholdCount})
            </span>
          </div>
        )}

        {/* Scrollable / Responsive Bar Container */}
        <div
          className="flex items-end gap-1 overflow-x-auto pb-1 pt-4 scrollbar-thin"
          style={{ height: `${chartHeightPx + 40}px` }}
        >
          {dailySummaries.map((day) => {
            const isSelected = day.date === selectedDateStr;
            const barHeight = day.hasData ? Math.max((day.clusterCount / maxCount) * chartHeightPx, 3) : 2;
            const isSurge = day.isUnusual;

            return (
              <button
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                title={`${day.date}: ${day.clusterCount} fire clusters (MODIS: ${day.modisCount}, VIIRS: ${day.viirsCount})`}
                className={`group flex flex-col items-center flex-1 min-w-[14px] transition cursor-pointer relative ${
                  isSelected ? 'scale-105 z-20' : 'hover:opacity-80'
                }`}
              >
                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all ${
                    !day.hasData
                      ? 'bg-slate-800/40 border-b border-slate-700'
                      : isSelected
                      ? 'bg-orange-400 shadow-lg shadow-orange-500/40 ring-1 ring-white'
                      : isSurge
                      ? 'bg-gradient-to-t from-red-600 to-amber-500'
                      : day.clusterCount > 0
                      ? 'bg-slate-700 group-hover:bg-slate-600'
                      : 'bg-slate-800/60'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />

                {/* Day label on X axis */}
                <span
                  className={`text-[9px] font-mono mt-1 ${
                    isSelected ? 'text-orange-400 font-bold' : 'text-slate-500'
                  }`}
                >
                  {day.day}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scientific Disclaimer Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-start gap-1.5 text-[10px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p>
          Historical baseline is calculated from the local sample period (Mean + 1.5σ). Seasonal patterns reflect agricultural burning waves in Southeast Asia; baseline deviations indicate statistical surges rather than verified emergency events.
        </p>
      </div>
    </div>
  );
};
