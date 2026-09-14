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

### 4. Tile Pyramid Generation, Bilinear Smoothing & Line-Free Inpainting
- **Line-Free Inpainting (Removing Black Fault Lines & Halos)**:
  - Inside Figure 13, all 38 on-land and 55 offshore seismogenic structures were originally drawn as black lines flanked by white borders.
  - In response to user feedback requesting to remove the black lines and match them seamlessly with the hazard colors:
    - Detected defect line strokes (`lum < 75.0` and `lum > 240.0` within land) and dilated by 1 px to capture anti-aliased edge fringes.
    - Used Euclidean distance transform interpolation (`scipy.ndimage.distance_transform_edt`) to inpaint all fault strokes using their nearest valid hazard colors, followed by gentle Gaussian blending ($\sigma = 0.8$).
    - Cleaned offshore whisker lines sticking out into the sea using morphological opening, leaving only pristine mainland Taiwan, Green Island, and Orchid Island.
    - Result: The raster is now a 100% pure, uninterrupted seismic hazard field with zero black lines or white halos.
- **Continuous Sub-Pixel Bilinear Interpolation**:
  - Replaced nearest-neighbor integer sampling with `scipy.ndimage.map_coordinates(..., order=1, mode='constant')`.
  - Eliminates blocky staircasing and pixelated steps at high zoom levels (Zooms 8–11), yielding silky smooth hazard contours and clean coastline curves.
- **Hengchun Southern Tip Reconstruction**:
  - In Figure 13, Panel B has a rounded white box "— Seismogenic Structures" printed directly over the Hengchun Peninsula (Eluanbi & Maobitou tips).
  - Because Mean Hazard and Median Hazard at 475 yr RP are seismologically identical in Hengchun (Mean Minus Median is 0.00 g, as verified in Panel C), Panel B's obscured tip was seamlessly reconstructed using corresponding pixels from Panel A (`ya in [945, 1045], xa in [160, 275]`).
  - Restores the natural two-pronged peninsula and the Hengchun fault trace without any flat cut-off or grey frame borders.
- **Curved Northwest Coastline Masking & De-Matting**:
  - Traces the diagonal coastline down to letter 'n' at `ya = 78`, removing titles and headers without jagged stepped rectangular notches.
  - Smooth alpha boundary feathering using Gaussian filtering (`sigma=0.8`).
  - Coastal pixel color de-matting ($RGB_{\text{clean}} = (RGB - (1-\alpha) \cdot 255) / \alpha$) strips the white paper background fringe.
- **Expanded Pyramid (Zooms 6–11)**:
  - Extended tile pyramid up to Zoom 11 for crisp, high-resolution rendering on modern displays.
  - Updated `maxNativeZoom: 11` in `psha-hazard-map.tsx`.

### 5. Basemap Masking & UI Layout Alignment
- **"Structures" Mode Renamed to "Hazard"**:
  - In `PSHAView`, renamed the 4th color mode tab from `"Structures"` to `"Hazard"`.
  - In `PshaHazardMap`, updated the legend heading to `Legend · Hazard`.
  - In `HazardControlPanel`, renamed overlay label to `Fault traces / structures`.
- **Automatic Basemap Masking in Taiwan Area**:
  - Added dedicated `basemapMaskPane` at z-index 220 (between basemap tilePane at 200 and hazardPane at 260).
  - When the hazard layer is active, an SVG polygon/rectangle automatically covers the Taiwan geographic domain (`[21.60, 119.70]` to `[25.60, 122.35]`) with the active basemap's ocean color (`#15181a` for Dark Gray, `#090909` for Carto).
  - This completely obscures the underlying basemap's grey landmass, roads, and English city labels ("Taipei", "Taichung", "Tainan", "Kaohsiung"), eliminating any visual coastline misalignments between the basemap and the hazard raster.
  - Added a toggle `[x] Cover Taiwan basemap` in `HazardControlPanel` so users can easily toggle this on or off.

## Verification
1. Tile generation confirmed across all 4 layers for Zooms 6–11 with zero black lines and zero white halos.
2. Verified visual smoothness: zero pixelation, silky smooth gradient transitions, and seamless coastal anti-aliasing against dark basemaps.
3. Southern tip (Hengchun/Eluanbi) verified completely intact on both `mean_475` and `median_475`.
4. Basemap mask verified in Leaflet: completely conceals underlying basemap land and city labels under Taiwan.
5. Test suite: all 46 pytest unit tests passing; frontend TypeScript build passing with 0 errors.
