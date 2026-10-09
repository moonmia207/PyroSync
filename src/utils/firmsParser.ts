import type { RawHotspot, ConfidenceLevel } from '../types/fire';

export interface ParseResult {
  hotspots: RawHotspot[];
  earliestDate: string;
  latestDate: string;
  recordCount: number;
  modisCount: number;
  viirsCount: number;
  error?: string;
}

/**
 * Normalizes raw instrument confidence into standard categorical scale.
 */
function normalizeConfidence(conf: any, _instrument: string): ConfidenceLevel {
  if (typeof conf === 'string') {
    const lower = conf.trim().toLowerCase();
    if (lower === 'l' || lower === 'low') return 'low';
    if (lower === 'h' || lower === 'high') return 'high';
    return 'nominal';
  }
  const num = Number(conf);
  if (!isNaN(num)) {
    if (num < 30) return 'low';
    if (num >= 80) return 'high';
    return 'nominal';
  }
  return 'nominal';
}

/**
 * Parses user-provided NASA FIRMS text (CSV or JSON).
 */
export function parseFirmsData(fileContent: string, _fileName: string): ParseResult {
  const trimmed = fileContent.trim();
  if (!trimmed) {
    return { hotspots: [], earliestDate: '', latestDate: '', recordCount: 0, modisCount: 0, viirsCount: 0, error: 'File is empty.' };
  }

  // Check if JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : parsed.records || parsed.features || [];
      return parseJsonRecords(items);
    } catch (e: any) {
      return { hotspots: [], earliestDate: '', latestDate: '', recordCount: 0, modisCount: 0, viirsCount: 0, error: `Invalid JSON syntax: ${e.message}` };
    }
  }

  // Parse CSV
  return parseCsvContent(trimmed);
}

function parseJsonRecords(records: any[]): ParseResult {
  const hotspots: RawHotspot[] = [];
  let modisCount = 0;
  let viirsCount = 0;

  records.forEach((r, idx) => {
    // Check GeoJSON feature vs flat object
    const props = r.properties || r;
    const coords = r.geometry?.coordinates;
    const lat = Number(props.latitude ?? (coords ? coords[1] : undefined));
    const lon = Number(props.longitude ?? (coords ? coords[0] : undefined));
    const acqDate = String(props.acq_date || '').trim();
    const acqTime = String(props.acq_time || '1200').padStart(4, '0');

    if (isNaN(lat) || isNaN(lon) || !acqDate) return;

    const instrument = String(props.instrument || (props.satellite?.includes('NOAA') || props.satellite?.includes('NPP') ? 'VIIRS' : 'MODIS')).toUpperCase();
    if (instrument.includes('MODIS')) modisCount++;
    else viirsCount++;

    const frp = Number(props.frp ?? 0);
    const brightness = Number(props.brightness ?? props.bright_ti4 ?? props.bright_t31 ?? 320);

    hotspots.push({
      id: `imported-${idx + 1}`,
      latitude: lat,
      longitude: lon,
      acq_date: acqDate,
      acq_time: acqTime,
      satellite: String(props.satellite || 'Unknown'),
      instrument: instrument.includes('MODIS') ? 'MODIS' : 'VIIRS',
      confidence_raw: props.confidence ?? 'nominal',
      confidence_normalized: normalizeConfidence(props.confidence, instrument),
      brightness: isNaN(brightness) ? 320 : brightness,
      frp: isNaN(frp) ? 10 : frp,
      daynight: String(props.daynight || 'D').toUpperCase(),
    });
  });

  return finalizeResult(hotspots, modisCount, viirsCount);
}

function parseCsvContent(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { hotspots: [], earliestDate: '', latestDate: '', recordCount: 0, modisCount: 0, viirsCount: 0, error: 'CSV requires a header and at least one data row.' };
  }

  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const latIdx = header.findIndex(h => h === 'latitude' || h === 'lat');
  const lonIdx = header.findIndex(h => h === 'longitude' || h === 'lon');
  const dateIdx = header.findIndex(h => h === 'acq_date' || h === 'date');
  const timeIdx = header.findIndex(h => h === 'acq_time' || h === 'time');
  const satIdx = header.findIndex(h => h === 'satellite');
  const instIdx = header.findIndex(h => h === 'instrument');
  const confIdx = header.findIndex(h => h === 'confidence');
  const frpIdx = header.findIndex(h => h === 'frp');
  const brightIdx = header.findIndex(h => h === 'brightness' || h === 'bright_ti4');
  const daynightIdx = header.findIndex(h => h === 'daynight');

  if (latIdx === -1 || lonIdx === -1 || dateIdx === -1) {
    return {
      hotspots: [],
      earliestDate: '',
      latestDate: '',
      recordCount: 0,
      modisCount: 0,
      viirsCount: 0,
      error: 'CSV missing required NASA FIRMS fields (latitude, longitude, acq_date).',
    };
  }

  const hotspots: RawHotspot[] = [];
  let modisCount = 0;
  let viirsCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const lat = Number(cols[latIdx]);
    const lon = Number(cols[lonIdx]);
    const acqDate = cols[dateIdx];
    const acqTime = timeIdx !== -1 ? cols[timeIdx].padStart(4, '0') : '1200';

    if (isNaN(lat) || isNaN(lon) || !acqDate) continue;

    const sat = satIdx !== -1 ? cols[satIdx] : 'Unknown';
    const rawInst = instIdx !== -1 ? cols[instIdx].toUpperCase() : '';
    const instrument = rawInst.includes('MODIS') || sat === 'Terra' || sat === 'Aqua' ? 'MODIS' : 'VIIRS';

    if (instrument === 'MODIS') modisCount++;
    else viirsCount++;

    const rawConf = confIdx !== -1 ? cols[confIdx] : 'nominal';
    const frp = frpIdx !== -1 ? Number(cols[frpIdx]) : 10;
    const brightness = brightIdx !== -1 ? Number(cols[brightIdx]) : 320;
    const daynight = daynightIdx !== -1 ? cols[daynightIdx] : 'D';

    hotspots.push({
      id: `imported-csv-${i}`,
      latitude: lat,
      longitude: lon,
      acq_date: acqDate,
      acq_time: acqTime,
      satellite: sat,
      instrument,
      confidence_raw: rawConf,
      confidence_normalized: normalizeConfidence(rawConf, instrument),
      brightness: isNaN(brightness) ? 320 : brightness,
      frp: isNaN(frp) ? 10 : frp,
      daynight,
    });
  }

  return finalizeResult(hotspots, modisCount, viirsCount);
}

function finalizeResult(hotspots: RawHotspot[], modisCount: number, viirsCount: number): ParseResult {
  if (hotspots.length === 0) {
    return { hotspots: [], earliestDate: '', latestDate: '', recordCount: 0, modisCount: 0, viirsCount: 0, error: 'No valid active fire records found in file.' };
  }

  const dates = hotspots.map(h => h.acq_date).sort();
  return {
    hotspots,
    earliestDate: dates[0],
    latestDate: dates[dates.length - 1],
    recordCount: hotspots.length,
    modisCount,
    viirsCount,
  };
}
