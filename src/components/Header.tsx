import React from 'react';
import { Flame, Satellite, Info, Sparkles } from 'lucide-react';
import type { AreaOfInterest, DatasetMetadata } from '../types/fire';
import { AREAS_OF_INTEREST } from '../services/dataLoader';

interface HeaderProps {
  selectedAoi: AreaOfInterest;
  onSelectAoi: (aoi: AreaOfInterest) => void;
  metadata: DatasetMetadata;
  activeDatasetId: string;
  onSelectDataset: (datasetId: string) => void;
  onOpenMethodology: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedAoi,
  onSelectAoi,
  metadata,
  activeDatasetId,
  onSelectDataset,
  onOpenMethodology,
}) => {
  const isAuthentic = metadata.provenanceType === 'authentic_archive';

  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-orange-400/30">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                PyroSync
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                NASA Space Apps v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Harmonized MODIS & VIIRS Burning Activity Calendar
            </p>
          </div>
        </div>

        {/* Controls & Badges */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* AOI Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/70 rounded-lg px-2.5 py-1.5">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">Area of Interest:</span>
            <select
              aria-label="Select Area of Interest"
              value={selectedAoi.id}
              onChange={(e) => {
                const found = AREAS_OF_INTEREST.find(a => a.id === e.target.value);
                if (found) onSelectAoi(found);
              }}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {AREAS_OF_INTEREST.map((aoi) => (
                <option key={aoi.id} value={aoi.id} className="bg-slate-900 text-slate-200">
                  {aoi.name} ({aoi.country})
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Provenance Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/70 rounded-lg px-2.5 py-1.5">
            <select
              aria-label="Select Dataset Source"
              value={activeDatasetId}
              onChange={(e) => onSelectDataset(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="firms-sample" className="bg-slate-900 text-slate-200">
                NASA FIRMS Archive (Spring 2024)
              </option>
              <option value="synthetic-demo" className="bg-slate-900 text-slate-200">
                Synthetic Test Dataset
              </option>
            </select>
          </div>

          {/* Provenance Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium ${
              isAuthentic
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-400'
                : 'bg-amber-950/40 border-amber-700/50 text-amber-400'
            }`}
            title={metadata.limitations}
          >
            {isAuthentic ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>NASA FIRMS Historical Sample</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Synthetic Demo Data</span>
              </>
            )}
          </div>

          {/* Science & Methodology Button */}
          <button
            onClick={onOpenMethodology}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Methodology</span>
          </button>
        </div>
      </div>
    </header>
  );
};
