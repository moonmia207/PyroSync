import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { parseFirmsData, type ParseResult } from '../utils/firmsParser';
import type { RawHotspot } from '../types/fire';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (hotspots: RawHotspot[], earliest: string, latest: string, sourceName: string) => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setParseResult(null);
    }
  };

  const handleParseAndLoad = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const text = await file.text();
      const res = parseFirmsData(text, file.name);
      setParseResult(res);

      if (res.hotspots.length > 0 && !res.error) {
        onImportSuccess(res.hotspots, res.earliestDate, res.latestDate, file.name);
      }
    } catch (err: any) {
      setParseResult({
        hotspots: [],
        earliestDate: '',
        latestDate: '',
        recordCount: 0,
        modisCount: 0,
        viirsCount: 0,
        error: `Failed to read file: ${err.message}`,
      });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-scientific-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Import NASA FIRMS Active Fire Data</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] leading-relaxed">
            <div className="flex items-start gap-1.5 font-medium text-slate-800 mb-1">
              <Info className="w-3.5 h-3.5 text-scientific-teal-700 flex-shrink-0 mt-0.5" />
              <span>Supported Formats:</span>
            </div>
            <p>
              Standard NASA FIRMS CSV or GeoJSON/JSON export. Required fields: <code className="bg-white px-1 py-0.5 border rounded">latitude</code>, <code className="bg-white px-1 py-0.5 border rounded">longitude</code>, <code className="bg-white px-1 py-0.5 border rounded">acq_date</code>, and optional <code className="bg-white px-1 py-0.5 border rounded">acq_time</code>, <code className="bg-white px-1 py-0.5 border rounded">frp</code>, <code className="bg-white px-1 py-0.5 border rounded">confidence</code>.
            </p>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-scientific-teal-700 rounded-lg p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-teal-50/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.geojson"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="font-semibold text-slate-700">
              {file ? file.name : 'Click to select NASA FIRMS CSV or JSON file'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'All parsing happens client-side. No data is sent to external servers.'}
            </div>
          </div>

          {/* Parse Result Feedback */}
          {parseResult && (
            <div
              className={`p-3 rounded border text-xs ${
                parseResult.error
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {parseResult.error ? (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{parseResult.error}</span>
                </div>
              ) : (
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center gap-1 font-semibold text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Successfully validated {parseResult.recordCount} observations!</span>
                  </div>
                  <div>• Date Coverage: {parseResult.earliestDate} to {parseResult.latestDate}</div>
                  <div>• Sensor Breakdown: MODIS: {parseResult.modisCount} | VIIRS: {parseResult.viirsCount}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Source: NASA FIRMS LANCE/EOSDIS
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleParseAndLoad}
              disabled={!file || parsing}
              className={`px-4 py-1.5 rounded text-white text-xs font-medium cursor-pointer ${
                !file || parsing
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-scientific-teal-700 hover:bg-scientific-teal-800'
              }`}
            >
              {parsing ? 'Parsing...' : 'Load Dataset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
