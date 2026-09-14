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

### 4. Tile Pyramid Generation, Bilinear Smoothing & Artifact Remediation
- **Continuous Sub-Pixel Bilinear Interpolation**:
  - Replaced nearest-neighbor integer sampling with `scipy.ndimage.map_coordinates(..., order=1, mode='constant')`.
  - Eliminates blocky staircasing and pixelated steps at high zoom levels (Zooms 8–11), yielding silky smooth hazard contours and clean coastline curves.
- **Hengchun Southern Tip Reconstruction**:
  - In Figure 13, Panel B has a rounded white box "— Seismogenic Structures" printed directly over the Hengchun Peninsula (Eluanbi & Maobitou tips).
  - Because Mean Hazard and Median Hazard at 475 yr RP are seismologically identical in Hengchun (Mean Minus Median is 0.00 g, as verified in Panel C), Panel B's obscured tip was seamlessly reconstructed using corresponding non-white pixels from Panel A (`ya in [955, 1020], xa in [180, 275]`).
  - Restores the natural two-pronged peninsula and the Hengchun fault trace without any flat cut-off.
- **Curved Northwest Coastline Masking**:
  - Traces the diagonal coastline down to letter 'n' at `ya = 78`, removing "(a) Mean Hazard Map...", "RP = 475 yr", and "with Site Amplification" without jagged stepped rectangular notches.
- **Edge Anti-Aliasing & White De-Matting**:
  - Smooth alpha boundary feathering using Gaussian filtering (`sigma=0.8`).
  - Coastal pixel color de-matting ($RGB_{\text{clean}} = (RGB - (1-\alpha) \cdot 255) / \alpha$) strips the white paper background fringe, allowing tiles to blend seamlessly into Leaflet Dark / Carto basemaps without a bright white halo.
- **Expanded Pyramid (Zooms 6–11)**:
  - Extended tile pyramid up to Zoom 11 for crisp, high-resolution rendering on modern displays.
  - Updated `maxNativeZoom: 11` in `psha-hazard-map.tsx`.

### 5. UI Layout Deconfliction & Color Scale Integration
- **Zero-Overlap Card Architecture**:
  - Identified collision where floating `HazardColorbar` at `bottom-3 right-3` overlapped the checkboxes and opacity slider of `HazardControlPanel` at `right-3 top-24`.
  - Integrated the color scale (legend) directly into `HazardControlPanel` right below the active layer radio options.
  - Re-anchored `HazardControlPanel` at `right-3 top-20` (just below the Leaflet zoom control).
  - Left the bottom-right map viewport completely open for clean topography and attribution.
- **Color Scale Direction Correction**:
  - Corrected gradient CSS interpolation: low hazard (0.0 g / -0.5 g) maps to dark purple/blue, high hazard (1.6 g / +0.5 g) maps to dark red, matching Fig. 13 verbatim.

## Verification
1. Tile generation confirmed across all 4 layers for Zooms 6–11.
2. Verified visual smoothness: zero pixelation, silky smooth gradient transitions, and seamless coastal anti-aliasing against dark basemaps.
3. Southern tip (Hengchun/Eluanbi) verified completely intact on both `mean_475` and `median_475`.
4. Verified that the missing tile warning in `HazardControlPanel` is resolved (`tilesAvailable: true`).
5. Test suite: all 46 pytest unit tests passing; frontend TypeScript build passing with 0 errors.
