import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Layers, Eye, EyeOff } from 'lucide-react';
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: selectedAoi.center,
      zoom: selectedAoi.defaultZoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark Matter basemap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    modisLayerRef.current.addTo(map);
    viirsLayerRef.current.addTo(map);
    clusterLayerRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when AOI changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(selectedAoi.center, selectedAoi.defaultZoom);
  }, [selectedAoi]);

  // Update Markers when data or date changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    modisLayerRef.current.clearLayers();
    viirsLayerRef.current.clearLayers();
    clusterLayerRef.current.clearLayers();

    // 1. Raw MODIS markers
    if (layerVisibility.modis) {
      const modisSpots = hotspots.filter(h => h.instrument === 'MODIS');
      modisSpots.forEach((spot) => {
        const marker = L.circleMarker([spot.latitude, spot.longitude], {
          radius: 5,
          color: '#f59e0b',
          weight: 1.5,
          fillColor: '#fbbf24',
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: ui-monospace, monospace; font-size: 11px;">
            <div style="color: #fbbf24; font-weight: bold; margin-bottom: 4px;">🛰️ MODIS (${spot.satellite})</div>
            <div><strong>Date/Time:</strong> ${spot.acq_date} ${spot.acq_time} UTC</div>
            <div><strong>Coordinates:</strong> ${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}</div>
            <div><strong>Confidence:</strong> ${spot.confidence_raw}%</div>
            <div><strong>FRP:</strong> ${spot.frp} MW</div>
            <div><strong>Brightness:</strong> ${spot.brightness} K</div>
          </div>
        `);

        modisLayerRef.current.addLayer(marker);
      });
    }

    // 2. Raw VIIRS markers
    if (layerVisibility.viirs) {
      const viirsSpots = hotspots.filter(h => h.instrument === 'VIIRS');
      viirsSpots.forEach((spot) => {
        const marker = L.circleMarker([spot.latitude, spot.longitude], {
          radius: 4,
          color: '#06b6d4',
          weight: 1.5,
          fillColor: '#22d3ee',
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: ui-monospace, monospace; font-size: 11px;">
            <div style="color: #22d3ee; font-weight: bold; margin-bottom: 4px;">🛰️ VIIRS 375m (${spot.satellite})</div>
            <div><strong>Date/Time:</strong> ${spot.acq_date} ${spot.acq_time} UTC</div>
            <div><strong>Coordinates:</strong> ${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}</div>
            <div><strong>Confidence:</strong> ${spot.confidence_raw} (${spot.confidence_normalized})</div>
            <div><strong>FRP:</strong> ${spot.frp} MW</div>
            <div><strong>Brightness I4:</strong> ${spot.brightness} K</div>
          </div>
        `);

        viirsLayerRef.current.addLayer(marker);
      });
    }

    // 3. Harmonized Cluster markers
    if (layerVisibility.clusters) {
      clusters.forEach((cluster) => {
        const isDual = cluster.isDualConfirmed;
        const isSelected = cluster.id === selectedClusterId;

        const clusterMarker = L.circleMarker([cluster.centroidLat, cluster.centroidLon], {
          radius: Math.min(Math.max(6 + cluster.memberCount * 2, 8), 20),
          color: isSelected ? '#ffffff' : isDual ? '#a855f7' : '#ec4899',
          weight: isSelected ? 3 : 2,
          fillColor: isDual ? '#9333ea' : '#db2777',
          fillOpacity: 0.5,
          dashArray: isDual ? undefined : '3, 3',
        });

        clusterMarker.on('click', () => {
          onSelectCluster(cluster);
        });

        clusterMarker.bindPopup(`
          <div style="font-family: ui-monospace, monospace; font-size: 11px;">
            <div style="color: ${isDual ? '#c084fc' : '#f472b6'}; font-weight: bold; margin-bottom: 4px;">
              ${isDual ? '🔥 Dual-Confirmed Fire Incident' : '🔥 Single-Sensor Cluster'}
            </div>
            <div><strong>Cluster ID:</strong> ${cluster.id}</div>
            <div><strong>Members:</strong> ${cluster.memberCount} (MODIS: ${cluster.modisCount}, VIIRS: ${cluster.viirsCount})</div>
            <div><strong>Total FRP:</strong> ${cluster.totalFrp} MW</div>
            <div><strong>Approx Radius:</strong> ${cluster.approxRadiusKm} km</div>
            <div style="margin-top: 4px; color: #94a3b8; font-size: 10px;">Click marker to inspect constituent telemetry</div>
          </div>
        `);

        clusterLayerRef.current.addLayer(clusterMarker);
      });
    }
  }, [hotspots, clusters, layerVisibility, selectedClusterId]);

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl h-[420px] flex flex-col">
      {/* Map Control Overlay Header */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg p-2 shadow-lg">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white px-1">
          <Layers className="w-4 h-4 text-orange-400" />
          <span>Hotspot Layers ({selectedDateStr}):</span>
        </div>

        {/* MODIS Toggle */}
        <button
          onClick={() => onToggleLayer('modis')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition border cursor-pointer ${
            layerVisibility.modis
              ? 'bg-amber-950/50 text-amber-300 border-amber-600/70 font-semibold'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
        >
          {layerVisibility.modis ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>MODIS 1km ({hotspots.filter(h => h.instrument === 'MODIS').length})</span>
        </button>

        {/* VIIRS Toggle */}
        <button
          onClick={() => onToggleLayer('viirs')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition border cursor-pointer ${
            layerVisibility.viirs
              ? 'bg-cyan-950/50 text-cyan-300 border-cyan-600/70 font-semibold'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
        >
          {layerVisibility.viirs ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>VIIRS 375m ({hotspots.filter(h => h.instrument === 'VIIRS').length})</span>
        </button>

        {/* Harmonized Clusters Toggle */}
        <button
          onClick={() => onToggleLayer('clusters')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition border cursor-pointer ${
            layerVisibility.clusters
              ? 'bg-purple-950/50 text-purple-300 border-purple-600/70 font-semibold'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
        >
          {layerVisibility.clusters ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span>Harmonized Clusters ({clusters.length})</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
