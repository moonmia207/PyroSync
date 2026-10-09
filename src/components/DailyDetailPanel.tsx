import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sliders, ShieldCheck } from 'lucide-react';
import type { DailySummary, HarmonizedCluster, HarmonizationConfig } from '../types/fire';
import { formatDisplayDate } from '../utils/dateUtils';

interface DailyDetailPanelProps {
  selectedDateStr: string;
  summary?: DailySummary;
  clusters: HarmonizedCluster[];
  selectedClusterId: string | null;
  onSelectCluster: (cluster: HarmonizedCluster | null) => void;
  config: HarmonizationConfig;
  onChangeConfig: (config: HarmonizationConfig) => void;
}

export const DailyDetailPanel: React.FC<DailyDetailPanelProps> = ({
  selectedDateStr,
  summary,
  clusters,
  selectedClusterId,
  onSelectCluster,
  config,
  onChangeConfig,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(selectedClusterId);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full justify-between">
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
              Daily Activity Inspector
            </span>
            <h3 className="text-base font-bold text-white">
              {formatDisplayDate(selectedDateStr)}
            </h3>
          </div>

          {/* Thresholds toggle button */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition cursor-pointer"
            title="Adjust Harmonization Prototype Parameters"
          >
            <Sliders className="w-3.5 h-3.5 text-orange-400" />
            <span>Parameters</span>
          </button>
        </div>

        {/* Prototype Parameter Slider Drawer */}
        {showConfig && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 mb-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200">Harmonization Parameters</span>
              <span className="text-[10px] text-amber-400/90 font-mono">Prototype Heuristics</span>
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Spatial Tolerance:</span>
                  <span className="font-mono text-white">{config.spatialThresholdKm} km</span>
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
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Temporal Tolerance:</span>
                  <span className="font-mono text-white">{config.temporalThresholdMin} min</span>
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
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic">
              Note: 1.25 km & 180 min are prototype starting parameters, not certified universal constants.
            </p>
          </div>
        )}

        {/* Daily Summary Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="bg-slate-950/60 border border-amber-900/40 rounded-lg p-2 text-center">
            <span className="text-[10px] text-amber-400 font-mono">MODIS Raw</span>
            <div className="text-base font-bold font-mono text-white">{summary?.modisCount ?? 0}</div>
          </div>
          <div className="bg-slate-950/60 border border-cyan-900/40 rounded-lg p-2 text-center">
            <span className="text-[10px] text-cyan-400 font-mono">VIIRS Raw</span>
            <div className="text-base font-bold font-mono text-white">{summary?.viirsCount ?? 0}</div>
          </div>
          <div className="bg-slate-950/60 border border-purple-900/40 rounded-lg p-2 text-center">
            <span className="text-[10px] text-purple-300 font-mono">Harmonized</span>
            <div className="text-base font-bold font-mono text-white">{summary?.clusterCount ?? 0}</div>
          </div>
          <div className="bg-slate-950/60 border border-violet-900/40 rounded-lg p-2 text-center">
            <span className="text-[10px] text-violet-300 font-mono">Dual-Confirmed</span>
            <div className="text-base font-bold font-mono text-white">{summary?.dualConfirmedCount ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Harmonized Clusters List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Harmonized Incident Clusters ({clusters.length})</span>
          <span className="text-[10px] text-slate-500 font-mono">Click to inspect constituent telemetry</span>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 flex-1">
          {clusters.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
              No fire detections recorded in this area for {selectedDateStr}.
            </div>
          ) : (
            clusters.map((cluster) => {
              const isExpanded = expandedClusterId === cluster.id;
              const isDual = cluster.isDualConfirmed;

              return (
                <div
                  key={cluster.id}
                  className={`border rounded-lg transition overflow-hidden ${
                    isExpanded
                      ? 'border-orange-500/70 bg-slate-950/80 shadow-md'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  {/* Cluster Header Row */}
                  <button
                    onClick={() => {
                      const next = isExpanded ? null : cluster.id;
                      setExpandedClusterId(next);
                      onSelectCluster(isExpanded ? null : cluster);
                    }}
                    className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{cluster.id}</span>
                          {isDual ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/60 flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5" /> Dual-Confirmed
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              Single-Sensor
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {cluster.centroidLat.toFixed(4)}°N, {cluster.centroidLon.toFixed(4)}°E (Radius: {cluster.approxRadiusKm} km)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-orange-400">{cluster.totalFrp} MW</div>
                      <div className="text-[10px] font-mono text-slate-500">{cluster.memberCount} observations</div>
                    </div>
                  </button>

                  {/* Expanded Constituent Telemetry */}
                  {isExpanded && (
                    <div className="p-2.5 pt-0 border-t border-slate-800/80 bg-slate-900/40 text-xs">
                      <div className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">
                        Constituent Sensor Observations ({cluster.members.length})
                      </div>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {cluster.members.map((m) => (
                          <div
                            key={m.id}
                            className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[11px]"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  m.instrument === 'MODIS' ? 'bg-amber-400' : 'bg-cyan-400'
                                }`}
                              />
                              <span className="font-semibold text-slate-200">
                                {m.instrument} ({m.satellite})
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {m.acq_time} UTC
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-slate-400">
                                Conf: <strong className="text-slate-200">{m.confidence_raw}</strong>
                              </span>
                              <span className="text-orange-400 font-semibold">{m.frp} MW</span>
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
