import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Eye, EyeOff, RotateCcw, AlertCircle } from 'lucide-react';
import type { RawHotspot, HarmonizedCluster, AreaOfInterest } from '../types/fire';

interface MapViewProps {
  selectedAoi: AreaOfInterest;
  hotspots: RawHotspot[];
  clusters: HarmonizedCluster[];
  selectedDateStr: string;
  layerVisibility: {
    modis: boolean;
    viirs: boolean;
    clusters: boolean;
  };
  onToggleLayer: (layer: 'modis' | 'viirs' | 'clusters') => void;
  selectedClusterId: string | null;
  onSelectCluster: (cluster: HarmonizedCluster | null) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  selectedAoi,
  hotspots,
  clusters,
  selectedDateStr,
  layerVisibility,
  onToggleLayer,
  selectedClusterId,
  onSelectCluster,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const modisLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const viirsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const clusterLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const [tileError, setTileError] = useState<string | null>(null);

  // Initialize Map with OpenStreetMap Standard Raster Tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: selectedAoi.center,
        zoom: selectedAoi.defaultZoom,
        zoomControl: true,
        attributionControl: true,
      });

      // Standard OpenStreetMap raster tile provider (No paid API key required)
      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });

      tileLayer.on('tileerror', () => {
        setTileError('Notice: OpenStreetMap tile loading experienced a network timeout.');
      });

      tileLayer.addTo(map);

      modisLayerRef.current.addTo(map);
      viirsLayerRef.current.addTo(map);
      clusterLayerRef.current.addTo(map);

      mapInstanceRef.current = map;
    } catch (err: any) {
      console.error('Map initialization failed:', err);
      setTileError('Unable to initialize map canvas.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center when AOI changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(selectedAoi.center, selectedAoi.defaultZoom, { animate: true });
  }, [selectedAoi]);

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(selectedAoi.center, selectedAoi.defaultZoom, { animate: true });
  };

  // Render Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    modisLayerRef.current.clearLayers();
    viirsLayerRef.current.clearLayers();
    clusterLayerRef.current.clearLayers();

    // 1. Raw MODIS markers (Amber: #d97706)
    if (layerVisibility.modis) {
      const modisSpots = hotspots.filter(h => h.instrument === 'MODIS');
      modisSpots.forEach((spot) => {
        const marker = L.circleMarker([spot.latitude, spot.longitude], {
          radius: 5,
          color: '#b45309',
          weight: 1.5,
          fillColor: '#d97706',
          fillOpacity: 0.8,
        });

        marker.bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.5;">
            <div style="color: #b45309; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
              🛰️ MODIS (${spot.satellite})
            </div>
            <div><strong>Acquisition:</strong> ${spot.acq_date} ${spot.acq_time} UTC</div>
            <div><strong>Coordinates:</strong> ${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}</div>
            <div><strong>Confidence:</strong> ${spot.confidence_raw}%</div>
            <div><strong>FRP:</strong> ${spot.frp} MW</div>
            <div><strong>Brightness:</strong> ${spot.brightness} K</div>
          </div>
        `);

        modisLayerRef.current.addLayer(marker);
      });
    }

    // 2. Raw VIIRS markers (Blue: #0284c7)
    if (layerVisibility.viirs) {
      const viirsSpots = hotspots.filter(h => h.instrument === 'VIIRS');
      viirsSpots.forEach((spot) => {
        const marker = L.circleMarker([spot.latitude, spot.longitude], {
          radius: 4,
          color: '#0369a1',
          weight: 1.5,
          fillColor: '#0284c7',
          fillOpacity: 0.8,
        });

        marker.bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.5;">
            <div style="color: #0369a1; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
              🛰️ VIIRS 375m (${spot.satellite})
            </div>
            <div><strong>Acquisition:</strong> ${spot.acq_date} ${spot.acq_time} UTC</div>
            <div><strong>Coordinates:</strong> ${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}</div>
            <div><strong>Confidence:</strong> ${spot.confidence_raw} (${spot.confidence_normalized})</div>
            <div><strong>FRP:</strong> ${spot.frp} MW</div>
            <div><strong>Brightness I4:</strong> ${spot.brightness} K</div>
          </div>
        `);

        viirsLayerRef.current.addLayer(marker);
      });
    }

    // 3. Harmonized Clusters (Violet: #7c3aed)
    if (layerVisibility.clusters) {
      clusters.forEach((cluster) => {
        const isDual = cluster.isDualConfirmed;
        const isSelected = cluster.id === selectedClusterId;

        const clusterMarker = L.circleMarker([cluster.centroidLat, cluster.centroidLon], {
          radius: Math.min(Math.max(6 + cluster.memberCount * 1.5, 7), 18),
          color: isSelected ? '#0f172a' : isDual ? '#6d28d9' : '#8b5cf6',
          weight: isSelected ? 2.5 : 1.5,
          fillColor: isDual ? '#7c3aed' : '#a78bfa',
          fillOpacity: 0.45,
          dashArray: isDual ? undefined : '3, 3',
        });

        clusterMarker.on('click', () => {
          onSelectCluster(cluster);
        });

        clusterMarker.bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.5;">
            <div style="color: ${isDual ? '#6d28d9' : '#7c3aed'}; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
              ${isDual ? '🔥 Dual-Confirmed Cluster' : '🔥 Single-Sensor Cluster'}
            </div>
            <div><strong>Cluster ID:</strong> ${cluster.id}</div>
            <div><strong>Matched Observations:</strong> ${cluster.memberCount} (MODIS: ${cluster.modisCount}, VIIRS: ${cluster.viirsCount})</div>
            <div><strong>Total FRP:</strong> ${cluster.totalFrp} MW</div>
            <div><strong>Spatial Span:</strong> ~${cluster.approxRadiusKm} km</div>
            <div style="margin-top: 4px; color: #64748b; font-size: 10px;">Click marker to inspect constituent telemetry</div>
          </div>
        `);

        clusterLayerRef.current.addLayer(clusterMarker);
      });
    }
  }, [hotspots, clusters, layerVisibility, selectedClusterId]);

  return (
    <div className="relative bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs h-[420px] flex flex-col">
      {/* Tile Error Banner */}
      {tileError && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1001] bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1 rounded shadow flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{tileError}</span>
        </div>
      )}

      {/* Control Overlay Strip */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md p-1.5 shadow-xs pointer-events-auto">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 px-1.5">
            <Layers className="w-3.5 h-3.5 text-scientific-teal-700" />
            <span>Layers ({selectedDateStr}):</span>
          </div>

          {/* MODIS Toggle */}
          <button
            onClick={() => onToggleLayer('modis')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono transition border ${
              layerVisibility.modis
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-medium'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            {layerVisibility.modis ? <Eye className="w-3 h-3 text-amber-600" /> : <EyeOff className="w-3 h-3" />}
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>MODIS ({hotspots.filter(h => h.instrument === 'MODIS').length})</span>
          </button>

          {/* VIIRS Toggle */}
          <button
            onClick={() => onToggleLayer('viirs')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono transition border ${
              layerVisibility.viirs
                ? 'bg-sky-50 text-sky-900 border-sky-300 font-medium'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            {layerVisibility.viirs ? <Eye className="w-3 h-3 text-sky-600" /> : <EyeOff className="w-3 h-3" />}
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span>VIIRS ({hotspots.filter(h => h.instrument === 'VIIRS').length})</span>
          </button>

          {/* Harmonized Clusters Toggle */}
          <button
            onClick={() => onToggleLayer('clusters')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono transition border ${
              layerVisibility.clusters
                ? 'bg-violet-50 text-violet-900 border-violet-300 font-medium'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            {layerVisibility.clusters ? <Eye className="w-3 h-3 text-violet-600" /> : <EyeOff className="w-3 h-3" />}
            <span className="w-2 h-2 rounded-full bg-violet-600"></span>
            <span>Clusters ({clusters.length})</span>
          </button>
        </div>

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          className="flex items-center gap-1 px-2 py-1 rounded bg-white/95 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs pointer-events-auto transition"
          title="Reset map to AOI center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
