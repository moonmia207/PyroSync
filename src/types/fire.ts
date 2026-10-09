// PyroSync: Type definitions for satellite active fire observations and harmonized clusters

export type SatelliteSource = 'Terra' | 'Aqua' | 'Suomi-NPP' | 'NOAA-20' | 'NOAA-21' | string;
export type InstrumentType = 'MODIS' | 'VIIRS' | string;
export type ConfidenceLevel = 'low' | 'nominal' | 'high';

/**
 * Standardized Raw Hotspot observation from NASA FIRMS.
 * Preserves the original sensor telemetry without destructive transformations.
 */
export interface RawHotspot {
  id: string;
  latitude: number;
  longitude: number;
  acq_date: string;          // ISO Date: YYYY-MM-DD
  acq_time: string;          // UTC Time: HHMM
  satellite: SatelliteSource;
  instrument: InstrumentType;
  confidence_raw: number | string;  // MODIS: 0-100%, VIIRS: 'l', 'n', 'h'
  confidence_normalized: ConfidenceLevel; // Harmonized categorical level for filtering
  brightness: number;        // Kelvin (MODIS Ch 21/22 or VIIRS I4)
  bright_t31?: number;       // Kelvin (MODIS Ch 31 or VIIRS I5)
  frp: number;               // Fire Radiative Power in Megawatts (MW)
  daynight: 'D' | 'N' | string;       // Day ('D') or Night ('N') pass
  area_id?: string;          // Area of interest identifier
  cluster_id?: string;       // Assigned cluster ID if harmonized
}

/**
 * Harmonized Fire Cluster representing spatio-temporally grouped detections.
 * Preserves unbroken provenance through the `members` array.
 */
export interface HarmonizedCluster {
  id: string;
  date: string;
  centroidLat: number;
  centroidLon: number;
  memberCount: number;
  modisCount: number;
  viirsCount: number;
  totalFrp: number;
  avgBrightness: number;
  isDualConfirmed: boolean; // Confirmed by both MODIS and VIIRS
  members: RawHotspot[];
  approxRadiusKm: number;
}

/**
 * Daily aggregation metadata used by the Burning Activity Calendar and historical trends.
 */
export interface DailySummary {
  date: string;              // YYYY-MM-DD
  year: number;
  month: number;             // 1 - 12
  day: number;               // 1 - 31
  modisCount: number;
  viirsCount: number;
  clusterCount: number;
  dualConfirmedCount: number;
  totalFrp: number;
  isUnusual: boolean;        // Flagged if exceeding baseline threshold
  anomalyScore: number;      // Standard deviations above baseline mean
  hasData: boolean;          // True if observations are recorded or satellite pass confirmed
  isUnavailable?: boolean;   // True if the date lies outside loaded dataset
}

/**
 * Area of Interest (AOI) bounding and metadata.
 */
export interface AreaOfInterest {
  id: string;
  name: string;
  country: string;
  description: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  center: [number, number];
  defaultZoom: number;
}

/**
 * Spatio-temporal parameters for clustering.
 */
export interface HarmonizationConfig {
  spatialThresholdKm: number;  // Prototype default: 1.25 km
  temporalThresholdMin: number; // Prototype default: 180 min (3 hours)
}

/**
 * Statistical Baseline Analysis.
 */
export interface BaselineAnalysis {
  meanDailyCount: number;
  stdDev: number;
  thresholdCount: number; // Mean + 1.5 * StdDev
  criticalThresholdCount: number; // Mean + 2.0 * StdDev
  totalObservationDays: number;
  daysWithFire: number;
  unusualDaysCount: number;
  maxDayCount: number;
  maxDate: string;
  isBaselineSufficient: boolean; // Requires at least 14 days of valid observation
  baselinePeriod: string;
  methodDescription: string;
}

/**
 * Provenance metadata for loaded datasets.
 */
export interface DatasetMetadata {
  id: string;
  name: string;
  provenanceType: 'authentic_archive' | 'user_import' | 'synthetic_demo';
  sourceCitation: string;
  retrievalDate: string;
  coveragePeriod: string;
  geographicScope: string;
  earliestDate: string;
  latestDate: string;
  totalObservations: number;
  limitations: string;
}
