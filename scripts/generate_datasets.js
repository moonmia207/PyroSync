import fs from 'fs';
import path from 'path';

// Seeded pseudo-random generator for reproducible datasets
let seed = 42;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const publicDataDir = path.resolve('public/data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// 1. Generate authentic-format historical sample for Shan Highlands, Central Dry Zone, Chiang Mai
const aois = [
  { id: 'shan-highlands', minLat: 20.3, maxLat: 21.9, minLon: 96.6, maxLon: 98.1 },
  { id: 'central-dry-zone', minLat: 17.6, maxLat: 19.7, minLon: 95.1, maxLon: 96.5 },
  { id: 'chiang-mai-transboundary', minLat: 18.3, maxLat: 19.9, minLon: 98.3, maxLon: 99.7 }
];

const records = [];
let idCounter = 1000;

// Generate 90 days from Feb 1, 2024 to Apr 30, 2024
const startDate = new Date(Date.UTC(2024, 1, 1)); // Feb 1, 2024
const totalDays = 90;

for (let d = 0; d < totalDays; d++) {
  const curDate = new Date(startDate.getTime() + d * 86400000);
  const year = curDate.getUTCFullYear();
  const month = curDate.getUTCMonth() + 1;
  const day = curDate.getUTCDate();
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Seasonal curve: peak in mid-late March (days 35 to 55)
  let seasonalFactor = 0.2;
  if (d >= 20 && d < 35) seasonalFactor = 0.5 + (d - 20) * 0.03; // Ramping up late Feb
  else if (d >= 35 && d <= 55) seasonalFactor = 0.85 + Math.sin((d - 35) / 20 * Math.PI) * 0.45; // Peak March
  else if (d > 55 && d < 75) seasonalFactor = 0.7 - (d - 55) * 0.02; // Tapering April
  else if (d >= 75) seasonalFactor = 0.25;

  // Occasional missing satellite pass / cloud occlusion (e.g., day 14, day 68)
  if (d === 14 || d === 68) {
    continue; // No detections recorded
  }

  // Rare surge / critical burning condition day (e.g., March 15, March 22)
  if (d === 43 || d === 50) {
    seasonalFactor *= 2.0;
  }

  for (const aoi of aois) {
    // Number of fire clusters in this AOI today
    const clusterCount = Math.floor(seasonalFactor * (3 + random() * 8));

    for (let c = 0; c < clusterCount; c++) {
      // Base center for this fire incident
      const baseLat = aoi.minLat + random() * (aoi.maxLat - aoi.minLat);
      const baseLon = aoi.minLon + random() * (aoi.maxLon - aoi.minLon);
      const isDual = random() > 0.35; // 65% chance of being co-detected by both instruments

      // Acquisition time for afternoon pass: ~06:30 - 07:45 UTC (13:00 - 14:15 local)
      const passHour = 6 + Math.floor(random() * 2);
      const passMin = Math.floor(random() * 59);
      const timeStr = `${String(passHour).padStart(2, '0')}${String(passMin).padStart(2, '0')}`;

      const frpBase = 12 + random() * 85;

      // 1. VIIRS detections (higher resolution, 1 to 4 detections per cluster)
      const viirsPoints = 1 + Math.floor(random() * 3);
      for (let vp = 0; vp < viirsPoints; vp++) {
        const offsetLat = (random() - 0.5) * 0.008; // ~400m offset
        const offsetLon = (random() - 0.5) * 0.008;
        const sat = random() > 0.5 ? 'NOAA-20' : 'Suomi-NPP';
        const confLevels = ['nominal', 'nominal', 'high', 'high', 'low'];
        const conf = confLevels[Math.floor(random() * confLevels.length)];

        records.push({
          id: `firms-viirs-${idCounter++}`,
          latitude: Math.round((baseLat + offsetLat) * 100000) / 100000,
          longitude: Math.round((baseLon + offsetLon) * 100000) / 100000,
          acq_date: dateStr,
          acq_time: timeStr,
          satellite: sat,
          instrument: 'VIIRS',
          confidence_raw: conf,
          confidence_normalized: conf,
          brightness: Math.round((325 + random() * 45) * 10) / 10,
          bright_t31: Math.round((295 + random() * 20) * 10) / 10,
          frp: Math.round((frpBase / viirsPoints + (random() - 0.5) * 5) * 10) / 10,
          daynight: 'D',
          area_id: aoi.id
        });
      }

      // 2. MODIS detections (if dual-detected or MODIS-only)
      if (isDual || random() > 0.7) {
        const offsetLat = (random() - 0.5) * 0.006;
        const offsetLon = (random() - 0.5) * 0.006;
        const sat = random() > 0.6 ? 'Aqua' : 'Terra';
        const rawConf = Math.floor(45 + random() * 54);
        const normConf = rawConf >= 80 ? 'high' : rawConf >= 30 ? 'nominal' : 'low';

        records.push({
          id: `firms-modis-${idCounter++}`,
          latitude: Math.round((baseLat + offsetLat) * 100000) / 100000,
          longitude: Math.round((baseLon + offsetLon) * 100000) / 100000,
          acq_date: dateStr,
          acq_time: sat === 'Terra' ? '0415' : timeStr,
          satellite: sat,
          instrument: 'MODIS',
          confidence_raw: rawConf,
          confidence_normalized: normConf,
          brightness: Math.round((320 + random() * 40) * 10) / 10,
          bright_t31: Math.round((292 + random() * 18) * 10) / 10,
          frp: Math.round((frpBase + (random() - 0.5) * 8) * 10) / 10,
          daynight: 'D',
          area_id: aoi.id
        });
      }
    }
  }
}

fs.writeFileSync(
  path.join(publicDataDir, 'firms_sea_historical_sample.json'),
  JSON.stringify(records, null, 2)
);

// 2. Synthetic demonstration dataset for edge cases
const synthetic = [
  {
    id: 'syn-01',
    latitude: 21.1500,
    longitude: 97.3500,
    acq_date: '2024-03-15',
    acq_time: '0715',
    satellite: 'Aqua',
    instrument: 'MODIS',
    confidence_raw: 92,
    confidence_normalized: 'high',
    brightness: 348.5,
    bright_t31: 301.2,
    frp: 74.2,
    daynight: 'D',
    area_id: 'shan-highlands'
  },
  {
    id: 'syn-02',
    latitude: 21.1525,
    longitude: 97.3518,
    acq_date: '2024-03-15',
    acq_time: '0718',
    satellite: 'NOAA-20',
    instrument: 'VIIRS',
    confidence_raw: 'high',
    confidence_normalized: 'high',
    brightness: 355.1,
    bright_t31: 303.4,
    frp: 38.6,
    daynight: 'D',
    area_id: 'shan-highlands'
  },
  {
    id: 'syn-03',
    latitude: 21.1480,
    longitude: 97.3485,
    acq_date: '2024-03-15',
    acq_time: '0718',
    satellite: 'NOAA-20',
    instrument: 'VIIRS',
    confidence_raw: 'nominal',
    confidence_normalized: 'nominal',
    brightness: 338.0,
    bright_t31: 298.5,
    frp: 21.4,
    daynight: 'D',
    area_id: 'shan-highlands'
  }
];

fs.writeFileSync(
  path.join(publicDataDir, 'synthetic_demo.json'),
  JSON.stringify(synthetic, null, 2)
);

console.log(`Successfully generated ${records.length} historical sample records and ${synthetic.length} synthetic records.`);
