# PyroSync: Harmonized Burning Activity Calendar & Hotspot Intelligence
**NASA Space Apps Yangon Practice Round 2026**  
**Team NovaCore**

---

## 1. Challenge Overview

### Official Challenge Objective
> *"Build a web application that harmonizes these records into a **burning activity calendar** based on active fire hotspots, enabling early warning and emergency responders, scientists, and land managers to examine **historical fire patterns**, **unusual conditions**, and **critical periods** within a **selected area of interest**."*

NASA's polar-orbiting satellites provide essential thermal anomaly detections:
* **MODIS** (Terra & Aqua) at 1 km nadir resolution
* **VIIRS** (Suomi-NPP, NOAA-20, NOAA-21) at 375 m nadir resolution

Due to differences in spatial resolution, orbital overpass times, and sensor sensitivity, these instruments frequently produce overlapping or fragmented records. **PyroSync** harmonizes these disparate detections into an interactive **Burning Activity Calendar**, enabling emergency responders, environmental researchers, and land managers to track seasonal fire regimes, detect statistical surges against an explainable baseline, and inspect raw satellite telemetry without losing data provenance.

---

## 2. Key Features

1. **Burning Activity Calendar Heatmap (Core Hero)**
   * Monthly calendar grid with color-coded daily fire intensity (Zero observations, Low 1–5, Moderate 6–15, High 16–35, Critical Surge >35).
   * Visual indicators for complete data, zero-fire days, and missing satellite passes.
   * Universal Year and Month navigation (supports any year and month with clear dataset extent notices).
   * Separate daily counts for **MODIS Raw**, **VIIRS Raw**, and **Harmonized Incident Clusters**.

2. **Area of Interest (AOI) Selection**
   * Predefined regional focus areas:
     * **Shan Highlands (Myanmar)** — Shifting cultivation & forest clearing plateau
     * **Central Dry Zone & Bago (Myanmar)** — Agricultural crop residue burning belt
     * **Chiang Mai Transboundary (Thailand)** — Mountainous transboundary smoke basin
   * Dynamically filters observations, calendar heat levels, historical baselines, and map bounding extents.

3. **API-Key-Free Interactive Map (OpenStreetMap)**
   * Standard OpenStreetMap raster basemap (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
   * **Zero paid API key required** (no Mapbox, Google Maps, or MapTiler tokens needed).
   * Distinct marker styling:
     * **MODIS:** Amber (`#d97706`)
     * **VIIRS:** Sky / Blue (`#0284c7`)
     * **Harmonized Clusters:** Violet (`#7c3aed`)
   * Reset-view control button returning map directly to AOI center and zoom.
   * Popups displaying observation timestamp, satellite, confidence, and Fire Radiative Power (MW).

4. **Historical Activity Chart & Statistically Valid Baseline**
   * Daily cluster time-series chart with baseline mean ($\mu$) and surge threshold ($\mu + 1.5\sigma$).
   * **Scientific baseline sufficiency rule:** Enforces a minimum of 14 valid observation days before computing statistical anomalies.
   * Clicking any bar synchronizes the calendar, map, and daily inspector.

5. **Spatio-Temporal Harmonization Engine**
   * Deterministic connected-component clustering (configurable prototype parameters: default $1.25\text{ km}$, $180\text{ minutes}$).
   * Preserves 100% of raw constituent observations in `members`.
   * Flags **Dual-Matched** clusters vs single-sensor detections.

6. **Local NASA FIRMS Data Import (CSV / JSON)**
   * Client-side file import modal accepting standard NASA FIRMS CSV, GeoJSON, or JSON files.
   * Validates mandatory coordinates and acquisition timestamps, calculates date bounds, and updates active views with zero external backend dependency.

7. **Sanitized CSV Data Export**
   * One-click download of filtered observations including observation IDs, timestamps, coordinates, sensor, confidence, FRP, and assigned cluster IDs.

---

## 3. Technology Stack

* **Framework:** React 19 + TypeScript + Vite 8 (Static Single Page Application)
* **Styling:** Tailwind CSS 3.4 (Editorial scientific light theme)
* **Mapping:** Leaflet 1.9 + OpenStreetMap standard raster tiles (Zero API token dependency)
* **Icons:** Lucide React
* **Hosting:** Vercel (Primary) & Netlify (Fallback)
* **Backend:** None required (Pure client-side static application)

---

## 4. Data Sources & Scientific Integrity

* **NASA FIRMS Historical Sample:** Curated from NASA LANCE / EOSDIS Fire Information for Resource Management System (MODIS C6.1 `MCD14DL` and VIIRS 375m `VNP14IMGTDL` / `VJ114IMGTDL`), covering the February–April 2024 peak dry season.
* **Synthetic Test Set:** Programmatically generated test records clearly labeled as *Synthetic Calibration Data* for UI verification.
* **User Data Import:** Direct parsing of official NASA FIRMS CSV/JSON exports with client-side validation.
* **Scientific Disclaimers:** Statistical anomalies represent detection frequencies above sample average, not official disaster declarations.

---

## 5. Local Setup & Verification

```bash
# Clone the repository
git clone https://github.com/moonmia207/PyroSync.git
cd PyroSync

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
# Validate TypeScript and bundle application
npm run build

# Preview production build
npm run preview
```

---

## 6. Attributions & References

* **Active Fire Data:** NASA FIRMS (LANCE / EOSDIS).
* **Basemap Tiles:** &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
* **Generative AI Disclosure:** Developed by Team NovaCore with architecture and planning assistance from Gemini Antigravity, and review using Cursor Free and OpenCode.
