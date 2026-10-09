# PyroSync: Harmonized Burning Activity Calendar & Hotspot Intelligence
**NASA Space Apps Yangon Practice Round 2026**  
**Team NovaCore**

---

## 1. Challenge Overview

### Official Challenge Objective
> *"Build a web application that harmonizes these records into a **burning activity calendar** based on active fire hotspots, enabling early warning and emergency responders, scientists, and land managers to examine **historical fire patterns**, **unusual conditions**, and **critical periods** within a **selected area of interest**."*

NASA's polar-orbiting satellites provide crucial thermal anomaly detection:
* **MODIS** (Terra & Aqua) at 1 km nadir resolution
* **VIIRS** (Suomi-NPP, NOAA-20, NOAA-21) at 375 m nadir resolution

Due to differences in spatial resolution, orbital overpass times, and sensor sensitivity, these instruments frequently produce overlapping or fragmented records. **PyroSync** harmonizes these disparate detections into an interactive **Burning Activity Calendar**, enabling emergency planners and environmental researchers to track seasonal fire regimes, detect statistical surges, and drill down into raw satellite telemetry without losing data provenance.

---

## 2. Key Features

1. **Burning Activity Calendar Heatmap (Core Hero)**
   * Monthly calendar grid with color-coded daily fire intensity (Zero, Low, Moderate, High, Critical Surge).
   * Visual indicators for complete data, zero-fire days, and missing satellite passes.
   * Month-by-month navigation (February, March, April 2024 peak dry season).
   * Separate daily counts for **MODIS Raw**, **VIIRS Raw**, and **Harmonized Incident Clusters**.

2. **Area of Interest (AOI) Selection**
   * Predefined regional focus areas:
     * **Shan Highlands (Myanmar)** — Shifting cultivation & forest clearing plateau
     * **Central Dry Zone & Bago (Myanmar)** — Agricultural crop residue burning belt
     * **Chiang Mai Transboundary (Thailand)** — Mountainous transboundary smoke basin
   * Dynamically filters observations, calendar heat levels, historical baselines, and map bounding extents.

3. **Historical Fire Activity & Baseline Trendline**
   * Time-series chart showing daily hotspot frequency across the observation period.
   * Visual baseline mean ($\mu$) and surge threshold line ($\mu + 1.5\sigma$).
   * Interactive cross-filtering: clicking any bar synchronizes the calendar, map, and inspector drawer.

4. **Transparent Unusual Condition Anomaly Detection**
   * Parametric Z-score baseline flagging days with statistically abnormal fire activity ($> 1.5\sigma$).
   * Clear scientific disclaimers: explains that statistical anomalies represent detection spikes relative to the sample average, not verified ground-truth disaster declarations.

5. **Spatio-Temporal Harmonization Engine**
   * Deterministic connected-component clustering (configurable prototype parameters: default $1.25\text{ km}$, $180\text{ minutes}$).
   * Groups collocated detections while preserving 100% of raw observations in `members`.
   * Flags **Dual-Sensor Confirmed** incidents vs single-sensor detections.

6. **Synchronized Leaflet Hotspot Map & Telemetry Inspector**
   * CartoDB Dark Matter basemap rendering active fire spots for the selected day.
   * Independent layer toggles for MODIS 1km, VIIRS 375m, and Harmonized Clusters.
   * Inspection drawer displaying constituent sensor records, satellite names, acquisition times, confidence, and FRP.

---

## 3. Technology Stack

* **Framework:** React 18 + TypeScript + Vite (Static Single Page Application)
* **Styling:** Tailwind CSS (Dark theme with custom combustion palette)
* **Mapping:** Leaflet (Lightweight, zero API-token dependencies, CartoDB Dark Matter tiles)
* **Icons:** Lucide React
* **Hosting:** Vercel (Primary) & Netlify (Fallback)
* **Backend:** None required (Pure client-side static application)

---

## 4. Data Sources & Scientific Integrity

* **Authentic Historical Sample:** Curated from **NASA LANCE / EOSDIS FIRMS** (Fire Information for Resource Management System) active fire products:
  * MODIS Collection 6.1 (`MCD14DL`)
  * VIIRS 375 m NRT (`VNP14IMGTDL`, `VJ114IMGTDL`)
  * Coverage: Peak dry season fire wave (February–April 2024) across Myanmar and Southeast Asia.
* **Synthetic Test Dataset:** Programmatically generated calibration set clearly badged as *Synthetic Demo Data* for UI verification.
* **Integrity Commitment:** Synthetic data is never presented as authentic NASA observations. Live real-time warnings are not claimed without live feeds.

---

## 5. Local Setup & Verification

### Prerequisites
* Node.js v18+ (tested on Node v24.19)
* npm v9+

### Installation & Launch
```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>
cd pyrosync

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
# Validate TypeScript and compile production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Deployment Guide

### Deploy to Vercel (Recommended)
1. Push the code to a GitHub repository.
2. Import the repository in [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Root Directory: `./`.
5. Deploy. `vercel.json` will automatically configure client-side SPA routing.

### Deploy to Netlify (Fallback)
1. Import the repository in [Netlify](https://netlify.com).
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Deploy. `netlify.toml` will handle single-page application rewrites.

---

## 7. Project Declarations & Attributions

* **Generative AI & Tools Declaration:**  
  In accordance with NASA Space Apps guidelines, Team NovaCore declares the use of **Gemini Antigravity** as our primary architecture, planning, and coding agent, with **Cursor Free** and **OpenCode** for secondary review and debugging.
* **Third-Party Citations:**
  * NASA FIRMS (LANCE / EOSDIS) for Earth observation active fire data products.
  * OpenStreetMap contributors & CARTO for Dark Matter map tiles.
  * Leaflet, React, Vite, and Tailwind CSS open-source communities.
