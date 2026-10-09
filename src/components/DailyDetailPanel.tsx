import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sliders, ShieldCheck, Download } from 'lucide-react';
import type { DailySummary, HarmonizedCluster, HarmonizationConfig, RawHotspot } from '../types/fire';
import { formatDisplayDate } from '../utils/dateUtils';
import { exportObservationsToCsv } from '../utils/exportUtils';

interface DailyDetailPanelProps {
  selectedDateStr: string;
  selectedAoiName: string;
  summary?: DailySummary;
  clusters: HarmonizedCluster[];
  rawHotspots: RawHotspot[];
  selectedClusterId: string | null;
  onSelectCluster: (cluster: HarmonizedCluster | null) => void;
  config: HarmonizationConfig;
  onChangeConfig: (config: HarmonizationConfig) => void;
}

export const DailyDetailPanel: React.FC<DailyDetailPanelProps> = ({
  selectedDateStr,
  selectedAoiName,
  summary,
  clusters,
  rawHotspots,
  selectedClusterId,
  onSelectCluster,
  config,
  onChangeConfig,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(selectedClusterId);

  const handleExportCsv = () => {
    exportObservationsToCsv(rawHotspots, clusters, `pyrosync_${selectedDateStr}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col h-full justify-between">
      {/* Panel Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-slate-200 gap-2 mb-3">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
              Daily Activity Inspector • {selectedAoiName}
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              {formatDisplayDate(selectedDateStr)}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {/* CSV Export Button */}
            <button
              onClick={handleExportCsv}
              disabled={rawHotspots.length === 0}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition cursor-pointer ${
                rawHotspots.length > 0
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
              }`}
              title="Export filtered observations as CSV"
            >
              <Download className="w-3 h-3 text-slate-600" />
              <span>Export CSV</span>
            </button>

            {/* Thresholds toggle button */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono transition cursor-pointer"
              title="Configure Spatio-Temporal Clustering Parameters"
            >
              <Sliders className="w-3 h-3 text-scientific-teal-700" />
              <span>Parameters</span>
            </button>
          </div>
        </div>

        {/* Prototype Parameter Slider Drawer */}
        {showConfig && (
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 mb-3 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-800">Clustering Parameters</span>
              <span className="text-[10px] text-slate-500 font-mono">Prototype Heuristics</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                  <span>Spatial Radius:</span>
                  <span className="font-mono font-semibold text-slate-800">{config.spatialThresholdKm} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.25"
                  value={config.spatialThresholdKm}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      spatialThresholdKm: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-scientific-teal-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                  <span>Temporal Window:</span>
                  <span className="font-mono font-semibold text-slate-800">{config.temporalThresholdMin} min</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="360"
                  step="30"
                  value={config.temporalThresholdMin}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      temporalThresholdMin: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-scientific-teal-700 cursor-pointer"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 italic">
              1.25 km and 180 min are configurable starting prototype thresholds, not universally validated NASA standards.
            </p>
          </div>
        )}

        {/* Daily Summary Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
          <div className="bg-amber-50/60 border border-amber-200 rounded p-2 text-center">
            <span className="text-[10px] text-amber-800 font-mono font-medium">MODIS Raw</span>
            <div className="text-base font-bold font-mono text-amber-950">{summary?.modisCount ?? 0}</div>
          </div>
          <div className="bg-sky-50/60 border border-sky-200 rounded p-2 text-center">
            <span className="text-[10px] text-sky-800 font-mono font-medium">VIIRS Raw</span>
            <div className="text-base font-bold font-mono text-sky-950">{summary?.viirsCount ?? 0}</div>
          </div>
          <div className="bg-violet-50/60 border border-violet-200 rounded p-2 text-center">
            <span className="text-[10px] text-violet-800 font-mono font-medium">Harmonized</span>
            <div className="text-base font-bold font-mono text-violet-950">{summary?.clusterCount ?? 0}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center">
            <span className="text-[10px] text-slate-600 font-mono font-medium">Dual-Matched</span>
            <div className="text-base font-bold font-mono text-slate-900">{summary?.dualConfirmedCount ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Harmonized Clusters List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>Harmonized Fire Clusters ({clusters.length})</span>
          <span className="text-[10px] text-slate-400 font-mono">Click to expand members</span>
        </div>

        <div className="space-y-1.5 overflow-y-auto max-h-[200px] pr-1 flex-1">
          {clusters.length === 0 ? (
            <div className="p-4 rounded border border-dashed border-slate-200 text-center text-xs text-slate-500 bg-slate-50/50">
              No active fire clusters recorded for {selectedDateStr}.
            </div>
          ) : (
            clusters.map((cluster) => {
              const isExpanded = expandedClusterId === cluster.id;
              const isDual = cluster.isDualConfirmed;

              return (
                <div
                  key={cluster.id}
                  className={`border rounded transition overflow-hidden ${
                    isExpanded
                      ? 'border-scientific-teal-700 bg-teal-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Cluster Header Row */}
                  <button
                    onClick={() => {
                      const next = isExpanded ? null : cluster.id;
                      setExpandedClusterId(next);
                      onSelectCluster(isExpanded ? null : cluster);
                    }}
                    className="w-full p-2 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-scientific-teal-700 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">{cluster.id}</span>
                          {isDual ? (
                            <span className="text-[9px] font-mono px-1 rounded bg-violet-100 text-violet-800 border border-violet-200 flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> Dual-Matched
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-600">
                              Single-Sensor
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {cluster.centroidLat.toFixed(4)}°N, {cluster.centroidLon.toFixed(4)}°E (Span: {cluster.approxRadiusKm} km)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-amber-700">{cluster.totalFrp} MW</div>
                      <div className="text-[10px] font-mono text-slate-400">{cluster.memberCount} obs</div>
                    </div>
                  </button>

                  {/* Expanded Constituent Telemetry */}
                  {isExpanded && (
                    <div className="p-2 pt-1 border-t border-slate-200 bg-slate-50 text-xs">
                      <div className="text-[10px] font-semibold text-slate-500 mb-1 uppercase font-mono">
                        Constituent Satellite Observations ({cluster.members.length})
                      </div>
                      <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                        {cluster.members.map((m) => (
                          <div
                            key={m.id}
                            className="p-1 rounded bg-white border border-slate-200 flex items-center justify-between font-mono text-[10px]"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  m.instrument === 'MODIS' ? 'bg-amber-600' : 'bg-sky-600'
                                }`}
                              />
                              <span className="font-semibold text-slate-800">
                                {m.instrument} ({m.satellite})
                              </span>
                              <span className="text-slate-400">
                                {m.acq_time} UTC
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                Conf: <strong className="text-slate-700">{m.confidence_raw}</strong>
                              </span>
                              <span className="text-amber-700 font-medium">{m.frp} MW</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
