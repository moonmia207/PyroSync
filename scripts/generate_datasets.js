import fs from 'fs';
import path from 'path';

// Seeded pseudo-random generator for reproducible datasets
let seed = 101;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const publicDataDir = path.resolve('public/data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Target AOIs: Shan Highlands, Central Dry Zone & Bago, Chiang Mai Transboundary
const aois = [
  { id: 'shan-highlands', minLat: 20.3, maxLat: 21.9, minLon: 96.6, maxLon: 98.1 },
  { id: 'central-dry-zone', minLat: 17.6, maxLat: 19.7, minLon: 95.1, maxLon: 96.5 },
  { id: 'chiang-mai-transboundary', minLat: 18.3, maxLat: 19.9, minLon: 98.3, maxLon: 99.7 }
];

const records = [];
let idCounter = 1000;

// Generate 2 full years: Jan 1, 2023 to Dec 31, 2024 (731 days)
const startDate = new Date(Date.UTC(2023, 0, 1));
const totalDays = 731;

for (let d = 0; d < totalDays; d++) {
  const curDate = new Date(startDate.getTime() + d * 86400000);
  const year = curDate.getUTCFullYear();
  const month = curDate.getUTCMonth() + 1; // 1 to 12
  const day = curDate.getUTCDate();
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Southeast Asian seasonal fire regime:
  // Jan: early dry season baseline
  // Feb: ramping up
  // Mar: peak burning window (El Niño boosts 2024)
  // Apr: late season burns
  // May: pre-monsoon drop
  // Jun - Oct: southwest monsoon rains (near zero fires, overcast)
  // Nov - Dec: post-monsoon harvest burning
  let seasonalFactor = 0;
  const isElNino2024 = year === 2024;

  if (month === 1) {
    // January: Early season baseline (0.15 - 0.25)
    seasonalFactor = 0.15 + (day / 31) * 0.12;
  } else if (month === 2) {
    // February: Accelerating agricultural burns (0.3 - 0.65)
    seasonalFactor = 0.28 + (day / 28) * 0.38;
  } else if (month === 3) {
    // March: Peak wildfire and agricultural wave (0.75 - 1.35)
    const midPeak = Math.sin((day / 31) * Math.PI);
    seasonalFactor = (isElNino2024 ? 0.95 : 0.8) + midPeak * (isElNino2024 ? 0.5 : 0.4);
  } else if (month === 4) {
    // April: Late season burns (0.6 - 0.25)
    seasonalFactor = 0.65 - (day / 30) * 0.38;
  } else if (month === 5) {
    // May: Pre-monsoon transition (0.2 - 0.05)
    seasonalFactor = Math.max(0.2 - (day / 31) * 0.18, 0.02);
  } else if (month >= 6 && month <= 10) {
    // June to October: Monsoon season (near zero fire activity)
    seasonalFactor = random() > 0.88 ? 0.04 : 0; // Very rare localized spot
  } else if (month === 11) {
    // November: Post-harvest clearing begins (0.05 - 0.15)
    seasonalFactor = 0.04 + (day / 30) * 0.12;
  } else if (month === 12) {
    // December: Winter harvest stubble burning (0.12 - 0.22)
    seasonalFactor = 0.14 + (day / 31) * 0.08;
  }

  // Periodic satellite coverage gaps / overcast days (e.g. 5% of days)
  if (random() < 0.05 && month !== 3) {
    continue;
  }

  // Statistically significant surge days in peak season (e.g. March 12-16, March 21-24)
  if (month === 3 && (day === 14 || day === 15 || day === 22 || day === 23)) {
    seasonalFactor *= 1.85;
  }

  for (const aoi of aois) {
    const rawCount = Math.floor(seasonalFactor * (3 + random() * 8));
    if (rawCount <= 0) continue;

    for (let c = 0; c < rawCount; c++) {
      const baseLat = aoi.minLat + random() * (aoi.maxLat - aoi.minLat);
      const baseLon = aoi.minLon + random() * (aoi.maxLon - aoi.minLon);
      const isDual = random() > 0.35;

      const passHour = 6 + Math.floor(random() * 2);
      const passMin = Math.floor(random() * 59);
      const timeStr = `${String(passHour).padStart(2, '0')}${String(passMin).padStart(2, '0')}`;
      const frpBase = 14 + random() * 95;

      // 1. VIIRS detections (375m high resolution)
      const viirsPoints = 1 + Math.floor(random() * 3);
      for (let vp = 0; vp < viirsPoints; vp++) {
        const offsetLat = (random() - 0.5) * 0.008;
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

      // 2. MODIS detections (1km nadir)
      if (isDual || random() > 0.65) {
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

console.log(`Generated ${records.length} records covering 2 full years (Jan 1, 2023 to Dec 31, 2024).`);
