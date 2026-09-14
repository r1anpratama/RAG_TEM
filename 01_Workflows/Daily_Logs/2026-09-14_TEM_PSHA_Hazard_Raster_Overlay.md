---
title: "TEM PSHA2025 Hazard Raster Overlay: High-Precision Georeferencing and XYZ Tile Pyramid"
date: 2026-09-14
category: workflow
tags:
  - psha
  - gis
  - leaflet
  - tiles
  - georeferencing
---

# 2026-09-14: TEM PSHA2025 Hazard Raster Overlay

## Context & Problem
In the TEM PSHA Hazard Console (`/?tab=psha`), the raster overlay UI controls, opacity slider, layer selector, and Leaflet pane architecture (`hazardPane` at z-260) were present, but `website/frontend/public/tiles/` contained only documentation (`README.md`). As a result, the probe tile (`/tiles/<layer_id>/7/107/55.png`) failed, triggering the warning notice *"No tiles answered..."*, and the hazard heat maps could not be overlaid on the interactive Leaflet map.

The user requested that the four maps from TEM PSHA2025 Figure 13 be overlaid directly and accurately on the PSHA map page.

## Methodology & Engineering Implementation

### 1. High-Resolution Source Extraction
- Extracted Figure 13 directly from `assets/TEM PSHA2025-draft.pdf` (Page 80 image, 1179×2129 px, RGB).
- Unlike screenshots or paper scans, this native stream extract contains no diagonal SSRN watermark and has a pure white sea background (`#ffffff`), allowing clean alpha-channel extraction.

### 2. Sub-Pixel Affine Georeferencing
- Used the 1,334 coordinate points across Taiwan's 38 on-land seismogenic structures from `assets/Fault Alignments.xlsx` to compute an exact 6-parameter affine coordinate transform:
  $$\begin{aligned}
  x_A &= 270.0 \cdot \text{lon} + 2.70 \cdot \text{lat} - 32432.63 \\
  y_A &= -291.3 \cdot \text{lat} + 7394.57
  \end{aligned}$$
- Calibrated offsets across the four panels in Figure 13:
  - **Panel A (`mean_475`)**: Base coordinates $(x_A, y_A)$.
  - **Panel B (`median_475`)**: $(x_A + 578, y_A)$.
  - **Panel C (`mean_minus_median_475`)**: $(x_A, y_A + 1066)$.
  - **Panel D (`median_2475`)**: $(x_A + 578, y_A + 1066)$.
- Confirmed with visual verification (`all_four_panels_aligned.png`) that all 38 active fault lines (including Chihshang, Hengchun, Chelungpu, Shanchiao, Hukou) sit directly inside the printed black-and-white fault strokes.

### 3. Geographic Feature Masking
To ensure no paper annotations (titles, return period labels, colorbars, legends) pollute the live GIS map while keeping Taiwan and offshore islands 100% intact:
- **Colorbar Mask (Pacific Ocean)**: Masked `(lon > 121.66) & (lat < 24.35)`. Green Island (121.49° E) and Orchid Island (121.55° E) remain completely safe.
- **Northwest Ocean Title & RP Mask**: Smoothly traces the diagonal coastline from Fugui Cape to Taichung, eliminating "(a) Mean Hazard Map...", "RP = 475 yr", and similar headings.
- **Legend Mask (Panel B)**: Masked `(lon > 120.95) & (lat < 22.05)` in the ocean southeast of Eluanbi.

### 4. XYZ Tile Pyramid Generation
- Created `generate_hazard_tiles.py` to generate standard Web Mercator (EPSG:3857) XYZ tiles at 256×256 px PNG with full alpha transparency.
- Rendered pyramids across Zoom 6 through Zoom 10 for all 4 layers:
  - `mean_475`: 83 non-empty tiles.
  - `median_475`: 117 non-empty tiles.
  - `mean_minus_median_475`: 83 non-empty tiles.
  - `median_2475`: 113 non-empty tiles.
- Updated `maxNativeZoom: 10` in `psha-hazard-map.tsx`.

## Verification
1. Probed all layers at Zoom 7:
   - `/tiles/mean_475/7/107/55.png` -> 200 OK.
   - `/tiles/median_475/7/107/55.png` -> 200 OK.
   - `/tiles/mean_minus_median_475/7/107/55.png` -> 200 OK.
   - `/tiles/median_2475/7/107/55.png` -> 200 OK.
2. Verified that the missing tile warning in `HazardControlPanel` is automatically resolved (`tilesAvailable: true`).
3. Running `npx tsc --noEmit` confirmed 0 TypeScript errors.
