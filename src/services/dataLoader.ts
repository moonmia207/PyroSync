import type { AreaOfInterest, DatasetMetadata } from '../types/fire';

export const AREAS_OF_INTEREST: AreaOfInterest[] = [
  {
    id: 'shan-highlands',
    name: 'Shan Highlands',
    country: 'Myanmar',
    description: 'Highland plateau characterized by seasonal shifting cultivation and forest clearing (Peak: March).',
    bounds: {
      minLat: 20.2,
      maxLat: 22.0,
      minLon: 96.5,
      maxLon: 98.2,
    },
    center: [21.1, 97.35],
    defaultZoom: 8,
  },
  {
    id: 'central-dry-zone',
    name: 'Central Dry Zone & Bago',
    country: 'Myanmar',
    description: 'Intense agricultural rice-paddy and crop residue burning belt along the Ayeyarwady basin.',
    bounds: {
      minLat: 17.5,
      maxLat: 19.8,
      minLon: 95.0,
      maxLon: 96.6,
    },
    center: [18.65, 95.8],
    defaultZoom: 8,
  },
  {
    id: 'chiang-mai-transboundary',
    name: 'Chiang Mai & Upper Border',
    country: 'Thailand / Transboundary',
    description: 'Mountainous transboundary basin prone to severe seasonal biomass burning smoke inversions.',
    bounds: {
      minLat: 18.2,
      maxLat: 20.0,
      minLon: 98.2,
      maxLon: 99.8,
    },
    center: [19.1, 99.0],
    defaultZoom: 8,
  },
];

export const DATASET_METADATA: Record<string, DatasetMetadata> = {
  'firms-sample': {
    id: 'firms-sample',
    name: 'NASA FIRMS Archive (2023–2024 Southeast Asia)',
    provenanceType: 'authentic_archive',
    sourceCitation: 'NASA LANCE / EOSDIS Fire Information for Resource Management System (MODIS C6.1 MCD14DL & VIIRS 375m VNP14IMGTDL / VJ114IMGTDL)',
    retrievalDate: 'Archive Export 2023–2024',
    coveragePeriod: 'January 1, 2023 – December 31, 2024 (Full 2-Year Seasonal Cycle)',
    geographicScope: 'Myanmar (Shan Highlands, Bago/Dry Zone) & Chiang Mai Transboundary',
    earliestDate: '2023-01-01',
    latestDate: '2024-12-31',
    totalObservations: 8096,
    limitations: 'Curated historical sample structured for demonstration of harmonization and calendar heatmap workflows. Does not represent real-time live emergency telemetry.',
  },
  'synthetic-demo': {
    id: 'synthetic-demo',
    name: 'Synthetic Calibration & Edge-Case Dataset',
    provenanceType: 'synthetic_demo',
    sourceCitation: 'Programmatically generated test dataset created by Team NovaCore for UI calibration and multi-sensor overlap validation.',
    retrievalDate: 'October 2026',
    coveragePeriod: 'March 1, 2024 – March 31, 2024',
    geographicScope: 'Simulated 1km and sub-pixel hotspots within test coordinates',
    earliestDate: '2024-03-01',
    latestDate: '2024-03-31',
    totalObservations: 3,
    limitations: 'COMPLETELY SYNTHETIC. Contains simulated multi-sensor collocations to test clustering edge cases. Not actual NASA observations.',
  },
};
