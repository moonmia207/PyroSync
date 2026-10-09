import React from 'react';
import { X, ShieldAlert, BookOpen, Satellite, Sliders } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Scientific Methodology & Limitations</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Satellite className="w-4 h-4 text-cyan-400" />
              1. MODIS vs. VIIRS Detection Characteristics
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 pl-1">
              <li>
                <strong>MODIS (Terra & Aqua):</strong> 1 km nadir resolution, expanding to ~2x4.8 km at scan edges. Detects middle-infrared thermal anomalies (Channels 21/22 and 31). Outputs 0–100% Bayesian confidence.
              </li>
              <li>
                <strong>VIIRS (Suomi-NPP & NOAA-20/21):</strong> 375 m nadir resolution (I-bands I4/I5) with pixel aggregation to maintain consistent resolution across the swath. Highly sensitive to small or cool agricultural fires. Outputs categorical confidence (low, nominal, high).
              </li>
              <li>
                <strong>Resolution Gap:</strong> A single 1 km MODIS pixel corresponds geographically to 4–12 VIIRS 375 m pixels.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-orange-400" />
              2. Harmonization Clustering Heuristic
            </h4>
            <p className="mb-2">
              PyroSync implements a deterministic spatio-temporal connected-component clustering algorithm:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
              <div><strong>Spatial Criterion:</strong> Haversine distance &le; 1.25 km (Prototype Default)</div>
              <div><strong>Temporal Criterion:</strong> Acquisition delta &le; 180 min (3 Hours)</div>
              <div><strong>Output:</strong> Centroid coordinates, total FRP, dual-sensor confirmation status</div>
            </div>
            <p className="mt-2 text-slate-400">
              *Provenance Preservation:* Raw observations are never discarded or permanently averaged. Every cluster retains full access to its constituent satellite observations.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              3. Unusual Condition Anomaly Detection
            </h4>
            <p>
              Daily fire cluster frequencies are compared against the regional baseline mean (&mu;) and sample standard deviation (&sigma;). Days with activity exceeding &mu; + 1.5&sigma; are flagged as <em>Unusual Conditions</em>.
            </p>
            <div className="mt-2 p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-amber-200/90">
              <strong>CRITICAL SCIENTIFIC CAVEAT:</strong>
              Statistical anomalies reflect heightened detection density relative to the historical sample. They DO NOT constitute verified disaster declarations or confirm on-the-ground burn damage, as variations in cloud cover, smoke dispersion, and sensor viewing angles directly influence detection rates.
            </div>
          </div>

          {/* Section 4 */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Data Citations & Attributions
            </h4>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>• <strong>NASA FIRMS:</strong> NASA LANCE / EOSDIS Fire Information for Resource Management System.</div>
              <div>• <strong>Basemap:</strong> CartoDB Dark Matter & OpenStreetMap contributors.</div>
              <div>• <strong>Libraries:</strong> Leaflet, React, TypeScript, Tailwind CSS, Lucide Icons.</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
