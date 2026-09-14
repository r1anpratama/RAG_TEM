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

### 4. Tile Pyramid Generation & Cross-Panel Containment
- Created `scripts/generate_hazard_tiles.py` to generate standard Web Mercator (EPSG:3857) XYZ tiles at 256×256 px PNG with full alpha transparency.
- **Cross-Panel Containment**: Enforced strict quadrant boundaries:
  $xa \in [0, 577], ya \in [0, h_{\text{panel}}-1]$. Pixels falling outside the panel's bounding box are discarded ($A = 0$), completely preventing adjacent panels (such as Panel C in the Taiwan Strait for Panel D) from leaking into ocean waters.
- **Refined Masking Geometry**:
  - Title & RP Text: `((ya < 50) & (xa < 415)) | ((ya >= 50) & (ya < 86) & (xa < 385)) | ((ya >= 86) & (ya < 210) & (xa < 255))` removes all panel headers without stepping into Taiwan's coastline.
  - Colorbars: `(xa >= 475) & (ya >= 580)` eliminates colorbars, numbers, and the bottom "0.0" arrow tip, while keeping Orchid Island ($xa \le 470$) and Green Island ($xa \approx 440$) 100% intact.
  - Legend Box (Panel B): `((ya >= 958) & (xa >= 175) & (xa < 430)) | ((ya >= 985) & (xa >= 430))` cleanly removes the paper legend box.
- Generated clean tile pyramids across Zoom 6 through 10:
  - `mean_475`: 87 non-empty tiles.
  - `median_475`: 78 non-empty tiles.
  - `mean_minus_median_475`: 87 non-empty tiles.
  - `median_2475`: 88 non-empty tiles.
- Updated `maxNativeZoom: 10` in `psha-hazard-map.tsx`.

### 5. UI Layout Deconfliction & Color Scale Integration
- **Zero-Overlap Card Architecture**:
  - Identified collision where floating `HazardColorbar` at `bottom-3 right-3` overlapped the checkboxes and opacity slider of `HazardControlPanel` at `right-3 top-24`.
  - Integrated the color scale (legend) directly into `HazardControlPanel` right below the active layer radio options.
  - Re-anchored `HazardControlPanel` at `right-3 top-20` (just below the Leaflet zoom control).
  - Left the bottom-right map viewport completely open for clean topography and attribution.
- **Color Scale Direction Correction**:
  - Corrected gradient CSS interpolation: low hazard (0.0 g / -0.5 g) maps to dark purple/blue, high hazard (1.6 g / +0.5 g) maps to dark red, matching Fig. 13 verbatim.

## Verification
1. Probed all layers at Zoom 7:
   - `/tiles/mean_475/7/107/55.png` -> 200 OK.
   - `/tiles/median_475/7/107/55.png` -> 200 OK.
   - `/tiles/mean_minus_median_475/7/107/55.png` -> 200 OK.
   - `/tiles/median_2475/7/107/55.png` -> 200 OK.
2. Verified that the missing tile warning in `HazardControlPanel` is automatically resolved (`tilesAvailable: true`).
3. Verified visual cleanliness: zero leaks in Taiwan Strait, zero stray colorbar tips in Pacific, seamless non-overlapping UI layout.
4. Test suite: 46 of 46 pytest unit tests passing; frontend TypeScript build passing with 0 errors.
