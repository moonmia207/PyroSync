import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BurningCalendar } from './components/BurningCalendar';
import { HistoricalChart } from './components/HistoricalChart';
import { MapView } from './components/MapView';
import { DailyDetailPanel } from './components/DailyDetailPanel';
import { AnomalyAlertBanner } from './components/AnomalyAlertBanner';
import { MethodologyModal } from './components/MethodologyModal';
import { DataImportModal } from './components/DataImportModal';
import { AREAS_OF_INTEREST, DATASET_METADATA } from './services/dataLoader';
import type { RawHotspot, HarmonizedCluster, DailySummary, HarmonizationConfig, DatasetMetadata } from './types/fire';
import { isWithinBounds } from './utils/geo';
import { harmonizeHotspots } from './utils/harmonization';
import { calculateBaseline } from './utils/statistics';

export function App() {
  const [selectedAoi, setSelectedAoi] = useState(AREAS_OF_INTEREST[0]);
  const [activeDatasetId, setActiveDatasetId] = useState('firms-sample');
  const [allHotspots, setAllHotspots] = useState<RawHotspot[]>([]);
  const [importedMetadata, setImportedMetadata] = useState<DatasetMetadata | null>(null);

  // Calendar Navigation State
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
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Fetch Dataset on mount or source toggle
  useEffect(() => {
    async function loadData() {
      if (activeDatasetId === 'user-import' && importedMetadata) {
        return; // Already in memory
      }
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
        console.error('Failed to load dataset', err);
      }
    }
    loadData();
  }, [activeDatasetId]);

  // Current Dataset Metadata
  const currentMetadata: DatasetMetadata = useMemo(() => {
    if (activeDatasetId === 'user-import' && importedMetadata) {
      return importedMetadata;
    }
    return DATASET_METADATA[activeDatasetId] || DATASET_METADATA['firms-sample'];
  }, [activeDatasetId, importedMetadata]);

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

  // 3. Dynamic Date Range & Daily Summaries across the active month and observation baseline
  const { dailySummariesMap, currentMonthSummaries, baselineSummariesList } = useMemo(() => {
    const map = new Map<string, DailySummary>();

    // Index hotspots and clusters by date string (YYYY-MM-DD)
    const hotspotsByDate = new Map<string, RawHotspot[]>();
    for (const h of aoiHotspots) {
      const list = hotspotsByDate.get(h.acq_date) || [];
      list.push(h);
      hotspotsByDate.set(h.acq_date, list);
    }

    const clustersByDate = new Map<string, HarmonizedCluster[]>();
    for (const c of aoiClusters) {
      const list = clustersByDate.get(c.date) || [];
      list.push(c);
      clustersByDate.set(c.date, list);
    }

    const earliestDate = currentMetadata.earliestDate;
    const latestDate = currentMetadata.latestDate;

    // Helper to build a daily summary
    const buildSummaryForDate = (dateStr: string, y: number, m: number, d: number): DailySummary => {
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
      const isWithinCoverage = dateStr >= earliestDate && dateStr <= latestDate;

      return {
        date: dateStr,
        year: y,
        month: m,
        day: d,
        modisCount,
        viirsCount,
        clusterCount: dayClusters.length,
        dualConfirmedCount,
        totalFrp: Math.round(totalFrp * 10) / 10,
        isUnusual: false,
        anomalyScore: 0,
        hasData: isWithinCoverage,
        isUnavailable: !isWithinCoverage,
      };
    };

    // A. Generate for the entire selected month (to render calendar cells)
    const daysInSelectedMonth = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
    const monthList: DailySummary[] = [];

    for (let day = 1; day <= daysInSelectedMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const summary = buildSummaryForDate(dateStr, selectedYear, selectedMonth, day);
      map.set(dateStr, summary);
      monthList.push(summary);
    }

    // B. Build list for baseline calculation (covering all dates in the loaded dataset extent)
    const baselineList: DailySummary[] = [];
    if (earliestDate && latestDate) {
      const start = new Date(`${earliestDate}T00:00:00Z`);
      const end = new Date(`${latestDate}T00:00:00Z`);
      const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

      for (let i = 0; i < Math.min(diffDays, 365); i++) {
        const cur = new Date(start.getTime() + i * 86400000);
        const y = cur.getUTCFullYear();
        const m = cur.getUTCMonth() + 1;
        const d = cur.getUTCDate();
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const summary = map.get(dateStr) || buildSummaryForDate(dateStr, y, m, d);
        map.set(dateStr, summary);
        baselineList.push(summary);
      }
    }

    return { dailySummariesMap: map, currentMonthSummaries: monthList, baselineSummariesList: baselineList };
  }, [aoiHotspots, aoiClusters, selectedYear, selectedMonth, currentMetadata]);

  // 4. Compute Statistical Baseline
  const baseline = useMemo(() => {
    return calculateBaseline(baselineSummariesList);
  }, [baselineSummariesList]);

  // 5. Annotate Summaries with Anomaly Status
  useEffect(() => {
    if (baseline.isBaselineSufficient && baseline.thresholdCount > 0) {
      dailySummariesMap.forEach((d) => {
        if (d.hasData && !d.isUnavailable && d.clusterCount >= baseline.thresholdCount && d.clusterCount > 0) {
          d.isUnusual = true;
          d.anomalyScore =
            baseline.stdDev > 0 ? (d.clusterCount - baseline.meanDailyCount) / baseline.stdDev : 0;
        } else {
          d.isUnusual = false;
          d.anomalyScore = 0;
        }
      });
    }
  }, [baseline, dailySummariesMap]);

  // 6. Active Date Slices
  const currentDayHotspots = useMemo(() => {
    return aoiHotspots.filter((h) => h.acq_date === selectedDateStr);
  }, [aoiHotspots, selectedDateStr]);

  const currentDayClusters = useMemo(() => {
    return aoiClusters.filter((c) => c.date === selectedDateStr);
  }, [aoiClusters, selectedDateStr]);

  const selectedDaySummary = dailySummariesMap.get(selectedDateStr);

  const toggleLayer = (layer: 'modis' | 'viirs' | 'clusters') => {
    setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleJumpToCoverage = () => {
    if (!currentMetadata.earliestDate) return;
    const [y, m] = currentMetadata.earliestDate.split('-').map(Number);
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDateStr(currentMetadata.earliestDate);
  };

  const handleImportSuccess = (
    newHotspots: RawHotspot[],
    earliest: string,
    latest: string,
    fileName: string
  ) => {
    setAllHotspots(newHotspots);
    const meta: DatasetMetadata = {
      id: 'user-import',
      name: `Imported NASA FIRMS Data (${fileName})`,
      provenanceType: 'user_import',
      sourceCitation: `User-imported NASA FIRMS active fire telemetry from ${fileName}`,
      retrievalDate: new Date().toISOString().slice(0, 10),
      coveragePeriod: `${earliest} to ${latest}`,
      geographicScope: 'User provided observation coordinates',
      earliestDate: earliest,
      latestDate: latest,
      totalObservations: newHotspots.length,
      limitations: 'Parsed client-side from user NASA FIRMS CSV/JSON file. Ensure proper coordinate bounding for selected AOI.',
    };
    setImportedMetadata(meta);
    setActiveDatasetId('user-import');
    setIsImportOpen(false);

    // Jump to earliest date
    if (earliest) {
      const [y, m] = earliest.split('-').map(Number);
      setSelectedYear(y);
      setSelectedMonth(m);
      setSelectedDateStr(earliest);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
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
          const meta = id === 'user-import' && importedMetadata ? importedMetadata : DATASET_METADATA[id];
          if (meta?.earliestDate) {
            const [y, m] = meta.earliestDate.split('-').map(Number);
            setSelectedYear(y);
            setSelectedMonth(m);
            setSelectedDateStr(meta.earliestDate);
          }
        }}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-3">
        {/* Anomaly Surge Banner (if active day exceeds baseline) */}
        <AnomalyAlertBanner selectedDaySummary={selectedDaySummary} baseline={baseline} />

        {/* Section 1: Burning Activity Calendar & Historical Time Series */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Central Burning Activity Calendar */}
          <div className="lg:col-span-7">
            <BurningCalendar
              year={selectedYear}
              month={selectedMonth}
              onChangeMonth={(yr, mo) => {
                setSelectedYear(yr);
                setSelectedMonth(mo);
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
              metadata={currentMetadata}
              onJumpToCoverage={handleJumpToCoverage}
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

        {/* Section 2: Interactive Leaflet Hotspot Map & Daily Activity Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Leaflet Map with OpenStreetMap Standard Raster Tiles */}
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

          {/* Daily Activity Inspector & CSV Exporter */}
          <div className="lg:col-span-5">
            <DailyDetailPanel
              selectedDateStr={selectedDateStr}
              selectedAoiName={selectedAoi.name}
              summary={selectedDaySummary}
              clusters={currentDayClusters}
              rawHotspots={currentDayHotspots}
              selectedClusterId={selectedCluster?.id || null}
              onSelectCluster={setSelectedCluster}
              config={harmonizationConfig}
              onChangeConfig={setHarmonizationConfig}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs py-3 px-6 mt-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>PyroSync</strong> — NASA Space Apps Yangon Practice Round 2026 • Team <strong>NovaCore</strong>
          </div>
          <div className="text-[11px] text-slate-400">
            Map tiles: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">OpenStreetMap contributors</a> • Active Fire Data: NASA FIRMS (MODIS & VIIRS)
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default App;
