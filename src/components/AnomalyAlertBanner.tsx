import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { DailySummary, BaselineAnalysis } from '../types/fire';
import { formatDisplayDate } from '../utils/dateUtils';

interface AnomalyAlertBannerProps {
  selectedDaySummary?: DailySummary;
  baseline: BaselineAnalysis;
}

export const AnomalyAlertBanner: React.FC<AnomalyAlertBannerProps> = ({
  selectedDaySummary,
  baseline,
}) => {
  if (!selectedDaySummary || !selectedDaySummary.isUnusual || !baseline.isBaselineSufficient) {
    return null;
  }

  const deviations = selectedDaySummary.anomalyScore.toFixed(1);

  return (
    <div className="bg-rose-50/80 border border-rose-300 rounded-lg p-3 shadow-xs mb-3">
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded bg-rose-100 text-rose-700 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
              <span>Unusual Fire Activity: {formatDisplayDate(selectedDaySummary.date)}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-200/80 text-rose-900 font-semibold border border-rose-300">
                +{deviations}σ above baseline
              </span>
            </h4>
            <span className="text-xs font-mono text-rose-900 font-semibold">
              {selectedDaySummary.clusterCount} Clusters (Baseline Mean: {baseline.meanDailyCount})
            </span>
          </div>

          <p className="text-xs text-rose-900/90 mt-0.5 leading-relaxed">
            Active fire cluster detections on this date exceed the regional baseline threshold ({baseline.thresholdCount} clusters/day). 
            This indicates an anomalous burning period, frequently associated with synchronized agricultural field clearing or extended dry spells.
          </p>

          <div className="mt-2 pt-1.5 border-t border-rose-200 flex flex-wrap items-center justify-between text-[11px] text-rose-800">
            <div className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
              <span>
                <strong>Scientific Caveat:</strong> Statistical anomalies reflect detection surges, not official emergency declarations or validated ground-truth burn perimeters.
              </span>
            </div>
            <span className="text-[10px] font-mono text-rose-700">
              Method: Z-score &ge; 1.5σ over {baseline.totalObservationDays} observation days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
