import React from 'react';
import { X, ShieldAlert, BookOpen, Satellite, Sliders } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-scientific-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Scientific Methodology, Data Provenance & Caveats</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          {/* Section 1 */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 font-mono">
              <Satellite className="w-3.5 h-3.5 text-scientific-teal-700" />
              1. MODIS vs. VIIRS Sensor Characteristics
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <p>
                <strong>MODIS (Terra & Aqua):</strong> Standard resolution of 1 km at nadir, swelling to ~2×4.8 km at scan edges. Measures mid-infrared (3.96 µm) and thermal (11.0 µm) bands. Outputs Bayesian confidence (0–100%) and Fire Radiative Power (MW).
              </p>
              <p>
                <strong>VIIRS (Suomi-NPP, NOAA-20, NOAA-21):</strong> 375 m resolution imaging channels (I-bands I4/I5). Uses onboard pixel aggregation to constrain pixel growth across scan swaths (~800 m at scan edge). Highly sensitive to sub-pixel agricultural fires. Outputs categorical confidence (low, nominal, high).
              </p>
              <p className="text-[11px] text-slate-500 italic">
                *Resolution Differential:* A single 1 km MODIS pixel geographically encloses between 4 and 12 VIIRS 375 m pixels.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 font-mono">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              2. Harmonization Clustering Heuristic
            </h4>
            <p className="mb-2">
              To consolidate concurrent detections across sensor passes into unified fire events, PyroSync executes a spatio-temporal connected-component clustering algorithm:
            </p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px] space-y-1 text-slate-800">
              <div>• <strong>Spatial Distance Threshold:</strong> Haversine spherical distance &le; 1.25 km (Prototype Default)</div>
              <div>• <strong>Temporal Window Threshold:</strong> Observation time delta &le; 180 min / 3 hours (Prototype Default)</div>
              <div>• <strong>Dual-Matched Status:</strong> Flagged if at least 1 MODIS detection and 1 VIIRS detection co-occur within the threshold envelope.</div>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              *Provenance Guarantee:* Original raw MODIS and VIIRS records are never discarded or permanently altered. Every cluster retains its complete constituent observation array.
            </p>
          </div>

          {/* Section 3 */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              3. Unusual Condition Anomaly Detection
            </h4>
            <p className="mb-1.5">
              Daily fire cluster frequencies are compared against the regional baseline mean (&mu;) and sample standard deviation (&sigma;). Days exceeding &mu; + 1.5&sigma; are flagged as <em>Unusual Conditions</em>.
            </p>
            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
              <strong>SCIENTIFIC DISCLAIMER:</strong>
              Statistical anomalies reflect detection spikes relative to the sample average. They DO NOT prove an official emergency or confirm on-the-ground burn damage, as variations in cloud cover, smoke plumes, and viewing geometry influence satellite detection rates.
            </div>
          </div>

          {/* Section 4 */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 font-mono">
              Attributions & References
            </h4>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div>• <strong>NASA FIRMS:</strong> NASA LANCE / EOSDIS Fire Information for Resource Management System.</div>
              <div>• <strong>Basemap:</strong> OpenStreetMap contributors. Standard raster tiles: <code className="bg-slate-100 px-1 py-0.5 rounded">https://tile.openstreetmap.org/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png</code>.</div>
              <div>• <strong>Open Source Libraries:</strong> Leaflet, React, TypeScript, Vite, Tailwind CSS, Lucide Icons.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-scientific-teal-700 hover:bg-scientific-teal-800 text-white font-medium text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
