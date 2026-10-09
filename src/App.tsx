import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BurningCalendar } from './components/BurningCalendar';
import { HistoricalChart } from './components/HistoricalChart';
import { MapView } from './components/MapView';
import { DailyDetailPanel } from './components/DailyDetailPanel';
import { AnomalyAlertBanner } from './components/AnomalyAlertBanner';
import { MethodologyModal } from './components/MethodologyModal';
import { AREAS_OF_INTEREST, DATASET_METADATA } from './services/dataLoader';
import type { RawHotspot, HarmonizedCluster, DailySummary, HarmonizationConfig } from './types/fire';
import { isWithinBounds } from './utils/geo';
import { harmonizeHotspots } from './utils/harmonization';
import { calculateBaseline } from './utils/statistics';

export function App() {
  const [selectedAoi, setSelectedAoi] = useState(AREAS_OF_INTEREST[0]);
  const [activeDatasetId, setActiveDatasetId] = useState('firms-sample');
  const [allHotspots, setAllHotspots] = useState<RawHotspot[]>([]);

  // Calendar State
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState(3); // March (Peak dry season)
  const [selectedDateStr, setSelectedDateStr] = useState('2024-03-15');

  // Harmonization Parameters
  const [harmonizationConfig, setHarmonizationConfig] = useState<HarmonizationConfig>({
    spatialThresholdKm: 1.25,
    temporalThresholdMin: 180,
  });

  // Map & Inspector State
  const [layerVisibility, setLayerVisibility] = useState({
    modis: true,
    viirs: true,
    clusters: true,
  });
  const [selectedCluster, setSelectedCluster] = useState<HarmonizedCluster | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Fetch Dataset on mount or source toggle
  useEffect(() => {
    async function loadData() {
      try {
        const filePath =
          activeDatasetId === 'firms-sample'
            ? '/data/firms_sea_historical_sample.json'
            : '/data/synthetic_demo.json';
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RawHotspot[] = await res.json();
        setAllHotspots(data);
      } catch (err) {
        console.error('Failed to load dataset, using fallback', err);
      }
    }
    loadData();
  }, [activeDatasetId]);

  // 1. Filter raw observations for the current Area of Interest
  const aoiHotspots = useMemo(() => {
    return allHotspots.filter((h) => {
      if (h.area_id && h.area_id === selectedAoi.id) return true;
      return isWithinBounds(h.latitude, h.longitude, selectedAoi.bounds);
    });
  }, [allHotspots, selectedAoi]);

  // 2. Harmonize clusters dynamically
  const aoiClusters = useMemo(() => {
    return harmonizeHotspots(aoiHotspots, harmonizationConfig);
  }, [aoiHotspots, harmonizationConfig]);

  // 3. Compute Daily Summaries across the observation period
  const { dailySummariesMap, dailySummariesList } = useMemo(() => {
    const map = new Map<string, DailySummary>();

    // Index hotspots by date
    const hotspotsByDate = new Map<string, RawHotspot[]>();
    for (const h of aoiHotspots) {
      const list = hotspotsByDate.get(h.acq_date) || [];
      list.push(h);
      hotspotsByDate.set(h.acq_date, list);
    }

    // Index clusters by date
    const clustersByDate = new Map<string, HarmonizedCluster[]>();
    for (const c of aoiClusters) {
      const list = clustersByDate.get(c.date) || [];
      list.push(c);
      clustersByDate.set(c.date, list);
    }

    // Determine observation range: Feb 1 to Apr 30, 2024 (90 days)
    const startDate = new Date(Date.UTC(2024, 1, 1));
    const totalDays = 90;
    const list: DailySummary[] = [];

    for (let d = 0; d < totalDays; d++) {
      const curDate = new Date(startDate.getTime() + d * 86400000);
      const year = curDate.getUTCFullYear();
      const month = curDate.getUTCMonth() + 1;
      const day = curDate.getUTCDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const dayHotspots = hotspotsByDate.get(dateStr) || [];
      const dayClusters = clustersByDate.get(dateStr) || [];

      let modisCount = 0;
      let viirsCount = 0;
      let totalFrp = 0;
      for (const h of dayHotspots) {
        if (h.instrument === 'MODIS') modisCount++;
        else viirsCount++;
        totalFrp += h.frp;
      }

      const dualConfirmedCount = dayClusters.filter((c) => c.isDualConfirmed).length;

      // Check if day was a known satellite gap day in the sample (day 14, 68)
      const isMissingPass = d === 14 || d === 68;

      const summary: DailySummary = {
        date: dateStr,
        year,
        month,
        day,
        modisCount,
        viirsCount,
        clusterCount: dayClusters.length,
        dualConfirmedCount,
        totalFrp: Math.round(totalFrp * 10) / 10,
        isUnusual: false, // will be updated with baseline below
        anomalyScore: 0,
        hasData: !isMissingPass,
      };

      map.set(dateStr, summary);
      list.push(summary);
    }

    return { dailySummariesMap: map, dailySummariesList: list };
  }, [aoiHotspots, aoiClusters]);

  // 4. Compute Statistical Baseline
  const baseline = useMemo(() => {
    return calculateBaseline(dailySummariesList);
  }, [dailySummariesList]);

  // 5. Annotate Daily Summaries with Anomaly Status
  useEffect(() => {
    if (baseline.thresholdCount > 0) {
      dailySummariesList.forEach((d) => {
        if (d.hasData && d.clusterCount >= baseline.thresholdCount && d.clusterCount > 0) {
          d.isUnusual = true;
          d.anomalyScore =
            baseline.stdDev > 0 ? (d.clusterCount - baseline.meanDailyCount) / baseline.stdDev : 0;
        } else {
          d.isUnusual = false;
          d.anomalyScore = 0;
        }
      });
    }
  }, [baseline, dailySummariesList]);

  // 6. Slices for Selected Date
  const currentDayHotspots = useMemo(() => {
    return aoiHotspots.filter((h) => h.acq_date === selectedDateStr);
  }, [aoiHotspots, selectedDateStr]);

  const currentDayClusters = useMemo(() => {
    return aoiClusters.filter((c) => c.date === selectedDateStr);
  }, [aoiClusters, selectedDateStr]);

  const selectedDaySummary = dailySummariesMap.get(selectedDateStr);

  // Month slice for historical chart (matching current month)
  const currentMonthSummaries = useMemo(() => {
    return dailySummariesList.filter(
      (d) => d.year === selectedYear && d.month === selectedMonth
    );
  }, [dailySummariesList, selectedYear, selectedMonth]);

  const currentMetadata = DATASET_METADATA[activeDatasetId] || DATASET_METADATA['firms-sample'];

  const toggleLayer = (layer: 'modis' | 'viirs' | 'clusters') => {
    setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <Header
        selectedAoi={selectedAoi}
        onSelectAoi={(aoi) => {
          setSelectedAoi(aoi);
          setSelectedCluster(null);
        }}
        metadata={currentMetadata}
        activeDatasetId={activeDatasetId}
        onSelectDataset={(id) => {
          setActiveDatasetId(id);
          setSelectedCluster(null);
        }}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Anomaly Surge Banner (if active day is an anomaly) */}
        <AnomalyAlertBanner selectedDaySummary={selectedDaySummary} baseline={baseline} />

        {/* Section 1: Burning Activity Calendar & Historical Time Series (Hero Core) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Central Burning Activity Calendar */}
          <div className="lg:col-span-7">
            <BurningCalendar
              year={selectedYear}
              month={selectedMonth}
              onChangeMonth={(yr, mo) => {
                setSelectedYear(yr);
                setSelectedMonth(mo);
                // Default to 15th of the new month
                setSelectedDateStr(`${yr}-${String(mo).padStart(2, '0')}-15`);
              }}
              selectedDateStr={selectedDateStr}
              onSelectDate={(dStr) => {
                setSelectedDateStr(dStr);
                const [y, m] = dStr.split('-').map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
                setSelectedCluster(null);
              }}
              dailySummariesMap={dailySummariesMap}
              criticalThreshold={baseline.thresholdCount}
            />
          </div>

          {/* Historical Activity Chart */}
          <div className="lg:col-span-5">
            <HistoricalChart
              dailySummaries={currentMonthSummaries}
              baseline={baseline}
              selectedDateStr={selectedDateStr}
              onSelectDate={(dStr) => {
                setSelectedDateStr(dStr);
                setSelectedCluster(null);
              }}
            />
          </div>
        </div>

        {/* Section 2: Synchronized Hotspot Map & Daily Activity Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Synchronized Hotspot Map */}
          <div className="lg:col-span-7">
            <MapView
              selectedAoi={selectedAoi}
              hotspots={currentDayHotspots}
              clusters={currentDayClusters}
              selectedDateStr={selectedDateStr}
              layerVisibility={layerVisibility}
              onToggleLayer={toggleLayer}
              selectedClusterId={selectedCluster?.id || null}
              onSelectCluster={setSelectedCluster}
            />
          </div>

          {/* Daily Detail & Harmonization Inspector */}
          <div className="lg:col-span-5">
            <DailyDetailPanel
              selectedDateStr={selectedDateStr}
              summary={selectedDaySummary}
              clusters={currentDayClusters}
              selectedClusterId={selectedCluster?.id || null}
              onSelectCluster={setSelectedCluster}
              config={harmonizationConfig}
              onChangeConfig={setHarmonizationConfig}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 text-slate-500 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>PyroSync</strong> — NASA Space Apps Yangon Practice Round 2026 • Team <strong>NovaCore</strong>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Harmonizing NASA MODIS & VIIRS Earth Observation Telemetry
          </div>
        </div>
      </footer>

      {/* Scientific Methodology & Caveats Modal */}
      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
    </div>
  );
}

export default App;
