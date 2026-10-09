import type { DailySummary, BaselineAnalysis } from '../types/fire';

const MIN_BASELINE_DAYS = 14;

/**
 * Computes baseline statistical indicators across daily summaries to identify unusual conditions.
 * 
 * SCIENTIFIC METHODOLOGY:
 * Uses a parametric standard deviation threshold (Z-score >= 1.5) on daily harmonized counts,
 * strictly conditioned on having at least 14 days of active observation data.
 * 
 * SCIENTIFIC LIMITATIONS:
 * An elevated statistical indicator reflects detection frequencies significantly higher than 
 * the sample average. It DOES NOT prove an emergency crisis or confirm ground-truth burn severity,
 * as cloud clearing, orbital pass geometry, or controlled agricultural burning can cause rapid spikes.
 */
export function calculateBaseline(dailySummaries: DailySummary[]): BaselineAnalysis {
  const activeDays = dailySummaries.filter(d => d.hasData && !d.isUnavailable);
  
  if (activeDays.length < MIN_BASELINE_DAYS) {
    const counts = activeDays.map(d => d.clusterCount);
    const sum = counts.reduce((acc, c) => acc + c, 0);
    const mean = activeDays.length > 0 ? Math.round((sum / activeDays.length) * 10) / 10 : 0;
    
    return {
      meanDailyCount: mean,
      stdDev: 0,
      thresholdCount: 0,
      criticalThresholdCount: 0,
      totalObservationDays: activeDays.length,
      daysWithFire: activeDays.filter(d => d.clusterCount > 0).length,
      unusualDaysCount: 0,
      maxDayCount: counts.length > 0 ? Math.max(...counts) : 0,
      maxDate: '',
      isBaselineSufficient: false,
      baselinePeriod: activeDays.length > 0 ? `${activeDays[0].date} to ${activeDays[activeDays.length - 1].date}` : 'None',
      methodDescription: `Insufficient observation days (${activeDays.length}/${MIN_BASELINE_DAYS} required) to calculate a statistically valid anomaly baseline.`,
    };
  }

  const counts = activeDays.map(d => d.clusterCount);
  const sum = counts.reduce((acc, c) => acc + c, 0);
  const mean = sum / activeDays.length;

  const variance = counts.reduce((acc, c) => acc + Math.pow(c - mean, 2), 0) / (activeDays.length - 1);
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

  const earliest = activeDays[0]?.date || '';
  const latest = activeDays[activeDays.length - 1]?.date || '';

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
    isBaselineSufficient: true,
    baselinePeriod: `${earliest} to ${latest} (${activeDays.length} days)`,
    methodDescription: `Parametric threshold (Mean + 1.5σ) calculated over ${activeDays.length} observation days. Baseline threshold = ${thresholdCount} clusters/day.`,
  };
}
