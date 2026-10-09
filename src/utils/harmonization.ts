import type { RawHotspot, HarmonizedCluster, HarmonizationConfig } from '../types/fire';
import { haversineDistanceKm } from './geo';

/**
 * Parses acquisition date (YYYY-MM-DD) and time (HHMM string) into epoch milliseconds.
 */
export function getHotspotEpochMs(hotspot: RawHotspot): number {
  const [year, month, day] = hotspot.acq_date.split('-').map(Number);
  const timeStr = hotspot.acq_time.padStart(4, '0');
  const hours = parseInt(timeStr.slice(0, 2), 10);
  const minutes = parseInt(timeStr.slice(2, 4), 10);
  return Date.UTC(year, month - 1, day, hours, minutes);
}

/**
 * Harmonizes raw MODIS and VIIRS detections into spatio-temporal fire clusters.
 * 
 * IMPORTANT SCIENTIFIC CAVEAT:
 * This clustering algorithm groups nearby detections occurring within prototype tolerances.
 * It provides an operational consolidation of cross-satellite feeds, but does NOT constitute
 * ground-truth physical validation of a single biological flame or official wildfire perimeter.
 *
 * @param hotspots Array of raw satellite observations
 * @param config Spatial (km) and temporal (minutes) thresholds
 * @returns Array of HarmonizedCluster objects with full constituent provenance
 */
export function harmonizeHotspots(
  hotspots: RawHotspot[],
  config: HarmonizationConfig = { spatialThresholdKm: 1.25, temporalThresholdMin: 180 }
): HarmonizedCluster[] {
  if (hotspots.length === 0) return [];

  const thresholdMs = config.temporalThresholdMin * 60 * 1000;
  const timestamps = hotspots.map(getHotspotEpochMs);
  const visited = new Uint8Array(hotspots.length);
  const clusters: HarmonizedCluster[] = [];

  let clusterIndex = 1;

  for (let i = 0; i < hotspots.length; i++) {
    if (visited[i]) continue;

    visited[i] = 1;
    const currentMembers: RawHotspot[] = [hotspots[i]];
    const queue: number[] = [i];

    // Breadth-first connected component search
    while (queue.length > 0) {
      const currIdx = queue.shift()!;
      const currSpot = hotspots[currIdx];
      const currTime = timestamps[currIdx];

      for (let j = 0; j < hotspots.length; j++) {
        if (visited[j]) continue;

        // Check temporal tolerance first (fast arithmetic)
        const timeDiff = Math.abs(currTime - timestamps[j]);
        if (timeDiff > thresholdMs) continue;

        // Check spatial tolerance (Haversine)
        const distance = haversineDistanceKm(
          currSpot.latitude,
          currSpot.longitude,
          hotspots[j].latitude,
          hotspots[j].longitude
        );

        if (distance <= config.spatialThresholdKm) {
          visited[j] = 1;
          currentMembers.push(hotspots[j]);
          queue.push(j);
        }
      }
    }

    // Aggregate cluster metrics
    let totalLat = 0;
    let totalLon = 0;
    let totalFrp = 0;
    let totalBrightness = 0;
    let modisCount = 0;
    let viirsCount = 0;

    for (const member of currentMembers) {
      totalLat += member.latitude;
      totalLon += member.longitude;
      totalFrp += member.frp;
      totalBrightness += member.brightness;

      if (member.instrument === 'MODIS') {
        modisCount++;
      } else {
        viirsCount++;
      }
    }

    const memberCount = currentMembers.length;
    const centroidLat = totalLat / memberCount;
    const centroidLon = totalLon / memberCount;

    // Calculate maximum radius from centroid
    let maxRadius = 0;
    for (const member of currentMembers) {
      const d = haversineDistanceKm(centroidLat, centroidLon, member.latitude, member.longitude);
      if (d > maxRadius) maxRadius = d;
    }

    clusters.push({
      id: `cluster-${hotspots[i].acq_date}-${clusterIndex++}`,
      date: hotspots[i].acq_date,
      centroidLat,
      centroidLon,
      memberCount,
      modisCount,
      viirsCount,
      totalFrp: Math.round(totalFrp * 10) / 10,
      avgBrightness: Math.round((totalBrightness / memberCount) * 10) / 10,
      isDualConfirmed: modisCount > 0 && viirsCount > 0,
      members: currentMembers,
      approxRadiusKm: Math.round(maxRadius * 100) / 100,
    });
  }

  return clusters;
}
