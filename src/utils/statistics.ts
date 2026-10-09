import type { DailySummary } from '../types/fire';

export interface BaselineAnalysis {
  meanDailyCount: number;
  stdDev: number;
  thresholdCount: number; // Mean + 1.5 * StdDev
  criticalThresholdCount: number; // Mean + 2.0 * StdDev
  totalObservationDays: number;
  daysWithFire: number;
  unusualDaysCount: number;
  maxDayCount: number;
  maxDate: string;
}

/**
 * Computes baseline statistical indicators across daily summaries to identify unusual conditions.
 * 
 * METHODOLOGY EXPLANATION:
 * The baseline uses a parametric standard deviation threshold (Z-score >= 1.5) on daily harmonized counts.
 * 
 * SCIENTIFIC LIMITATION:
 * An elevated statistical indicator reflects detection frequencies significantly higher than 
 * the sample average. It DOES NOT prove an emergency crisis or confirm ground-truth burn severity,
 * as clearing cloud cover, orbital pass geometry, or controlled agricultural burning can cause rapid spikes.
 */
export function calculateBaseline(dailySummaries: DailySummary[]): BaselineAnalysis {
  const activeDays = dailySummaries.filter(d => d.hasData);
  if (activeDays.length === 0) {
    return {
      meanDailyCount: 0,
      stdDev: 0,
      thresholdCount: 0,
      criticalThresholdCount: 0,
      totalObservationDays: 0,
      daysWithFire: 0,
      unusualDaysCount: 0,
      maxDayCount: 0,
      maxDate: '',
    };
  }

  const counts = activeDays.map(d => d.clusterCount);
  const sum = counts.reduce((acc, c) => acc + c, 0);
  const mean = sum / activeDays.length;

  const variance = counts.reduce((acc, c) => acc + Math.pow(c - mean, 2), 0) / (activeDays.length > 1 ? activeDays.length - 1 : 1);
  const stdDev = Math.sqrt(variance);

  const thresholdCount = Math.round((mean + 1.5 * stdDev) * 10) / 10;
  const criticalThresholdCount = Math.round((mean + 2.0 * stdDev) * 10) / 10;

  let maxDayCount = 0;
  let maxDate = '';
  let unusualDaysCount = 0;
  let daysWithFire = 0;

  for (const day of activeDays) {
    if (day.clusterCount > 0) daysWithFire++;
    if (day.clusterCount > maxDayCount) {
      maxDayCount = day.clusterCount;
      maxDate = day.date;
    }
    if (day.clusterCount >= thresholdCount && day.clusterCount > 0) {
      unusualDaysCount++;
    }
  }

  return {
    meanDailyCount: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    thresholdCount,
    criticalThresholdCount,
    totalObservationDays: activeDays.length,
    daysWithFire,
    unusualDaysCount,
    maxDayCount,
    maxDate,
  };
}
