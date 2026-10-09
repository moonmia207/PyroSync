import type { RawHotspot, HarmonizedCluster } from '../types/fire';

/**
 * Generates and triggers download of a sanitized CSV export containing active fire observations.
 * 
 * SCIENTIFIC INTEGRITY:
 * Handles missing values honestly using empty strings.
 * Preserves raw observation coordinates, timestamps, confidence, and FRP.
 */
export function exportObservationsToCsv(
  hotspots: RawHotspot[],
  clusters: HarmonizedCluster[],
  fileNamePrefix: string = 'pyrosync_observations'
): void {
  if (hotspots.length === 0) {
    alert('No observations available in current filter to export.');
    return;
  }

  // Create lookup for cluster membership and confirmation status
  const clusterLookup = new Map<string, { clusterId: string; isDual: boolean }>();
  for (const cluster of clusters) {
    for (const member of cluster.members) {
      clusterLookup.set(member.id, {
        clusterId: cluster.id,
        isDual: cluster.isDualConfirmed,
      });
    }
  }

  const headers = [
    'observation_id',
    'acquisition_date',
    'acquisition_time_utc',
    'latitude',
    'longitude',
    'instrument',
    'satellite',
    'confidence_raw',
    'confidence_normalized',
    'brightness_kelvin',
    'frp_mw',
    'daynight',
    'area_id',
    'cluster_id',
    'cluster_dual_confirmed',
  ];

  const rows = hotspots.map((h) => {
    const clusterInfo = clusterLookup.get(h.id);
    return [
      h.id,
      h.acq_date,
      h.acq_time,
      h.latitude.toFixed(5),
      h.longitude.toFixed(5),
      h.instrument,
      h.satellite,
      h.confidence_raw ?? '',
      h.confidence_normalized ?? '',
      h.brightness != null ? h.brightness.toFixed(1) : '',
      h.frp != null ? h.frp.toFixed(1) : '',
      h.daynight || '',
      h.area_id || '',
      clusterInfo ? clusterInfo.clusterId : '',
      clusterInfo ? (clusterInfo.isDual ? 'true' : 'false') : 'false',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
