import React from 'react';
import { Flame, Satellite, Info, Upload, CheckCircle2 } from 'lucide-react';
import type { AreaOfInterest, DatasetMetadata } from '../types/fire';
import { AREAS_OF_INTEREST } from '../services/dataLoader';

interface HeaderProps {
  selectedAoi: AreaOfInterest;
  onSelectAoi: (aoi: AreaOfInterest) => void;
  metadata: DatasetMetadata;
  activeDatasetId: string;
  onSelectDataset: (datasetId: string) => void;
  onOpenMethodology: () => void;
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedAoi,
  onSelectAoi,
  metadata,
  activeDatasetId,
  onSelectDataset,
  onOpenMethodology,
  onOpenImport,
}) => {
  const isAuthentic = metadata.provenanceType === 'authentic_archive';
  const isImported = metadata.provenanceType === 'user_import';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        {/* Brand & Purpose Statement */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-200 text-scientific-teal-700 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900">
                PyroSync
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Harmonized MODIS & VIIRS active fire observations for historical activity and unusual condition analysis
            </p>
          </div>
        </div>

        {/* Control Strip */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* AOI Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs">
            <Satellite className="w-3.5 h-3.5 text-scientific-teal-700" />
            <span className="text-slate-500 font-medium">AOI:</span>
            <select
              aria-label="Select Area of Interest"
              value={selectedAoi.id}
              onChange={(e) => {
                const found = AREAS_OF_INTEREST.find(a => a.id === e.target.value);
                if (found) onSelectAoi(found);
              }}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              {AREAS_OF_INTEREST.map((aoi) => (
                <option key={aoi.id} value={aoi.id} className="bg-white text-slate-800">
                  {aoi.name} ({aoi.country})
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs">
            <select
              aria-label="Select Dataset Source"
              value={activeDatasetId}
              onChange={(e) => onSelectDataset(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="firms-sample" className="bg-white text-slate-800">
                NASA FIRMS Sample (Feb–Apr 2024)
              </option>
              <option value="synthetic-demo" className="bg-white text-slate-800">
                Synthetic Test Dataset
              </option>
              {isImported && (
                <option value="user-import" className="bg-white text-slate-800">
                  User-Imported FIRMS Dataset
                </option>
              )}
            </select>
          </div>

          {/* Provenance Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-mono ${
              isAuthentic
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isImported
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
            title={metadata.limitations}
          >
            {isAuthentic ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>FIRMS Sample Archive</span>
              </>
            ) : isImported ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-sky-600" />
                <span>User-Imported FIRMS</span>
              </>
            ) : (
              <span>Synthetic Calibration Data</span>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
            title="Import NASA FIRMS CSV or JSON"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Import</span>
          </button>

          {/* Methodology Button */}
          <button
            onClick={onOpenMethodology}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-scientific-teal-700" />
            <span>Methodology</span>
          </button>
        </div>
      </div>
    </header>
  );
};
