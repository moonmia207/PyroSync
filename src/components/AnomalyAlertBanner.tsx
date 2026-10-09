import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { DailySummary } from '../types/fire';
import type { BaselineAnalysis } from '../utils/statistics';
import { formatDisplayDate } from '../utils/dateUtils';

interface AnomalyAlertBannerProps {
  selectedDaySummary?: DailySummary;
  baseline: BaselineAnalysis;
}

export const AnomalyAlertBanner: React.FC<AnomalyAlertBannerProps> = ({
  selectedDaySummary,
  baseline,
}) => {
  if (!selectedDaySummary || !selectedDaySummary.isUnusual) {
    return null;
  }

  const deviations = selectedDaySummary.anomalyScore.toFixed(1);

  return (
    <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3.5 shadow-lg shadow-amber-950/20 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <span>Unusual Fire Activity Detected: {formatDisplayDate(selectedDaySummary.date)}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40">
                +{deviations}σ above baseline
              </span>
            </h4>
            <span className="text-xs font-mono text-amber-300 font-semibold">
              {selectedDaySummary.clusterCount} Fire Clusters (Baseline Mean: {baseline.meanDailyCount})
            </span>
          </div>

          <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
            Hotspot detections on this day exceed the regional baseline threshold ({baseline.thresholdCount} clusters). 
            This indicates a critical burning window, typically associated with seasonal agricultural stubble clearing or dry-spell fire spread.
          </p>

          <div className="mt-2.5 pt-2 border-t border-amber-700/40 flex items-center justify-between text-[11px] text-amber-400/80">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                <strong>Scientific Disclaimer:</strong> Statistical anomalies indicate satellite detection surges, not official emergency declarations or validated ground-truth perimeters.
              </span>
            </div>
            <span className="text-[10px] font-mono opacity-80 hidden sm:inline">
              Method: Z-score &ge; 1.5σ (Parametric Baseline)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
