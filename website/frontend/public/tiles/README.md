# Hazard raster tiles (TEM PSHA2025)

The PSHA hazard console loads four raster overlays from this directory as a standard XYZ
pyramid. Nothing in the code needs to change once the tiles are here.

## Expected layout

```text
public/tiles/
├── mean_475/                 # Fig. 13 (a) - mean hazard map, site amplification, RP = 475 yr
│   ├── 0/
│   ├── 1/
│   └── .../{z}/{x}/{y}.png
├── median_475/               # Fig. 13 (b) - median hazard map, RP = 475 yr
├── mean_minus_median_475/    # Fig. 13 (c) - mean minus median anomaly, RP = 475 yr
└── median_2475/              # Fig. 13 (d) - median hazard map, RP = 2475 yr
```

URL template used by the Leaflet layer:

```text
/tiles/<layer_id>/{z}/{x}/{y}.png
```

- `layer_id` is one of the four directory names above.
- Tiles are **Web Mercator (EPSG:3857) XYZ**, 256×256 px, PNG with transparency where the
  raster has no value. Do not use TMS (flipped Y).
- Only the area covered by the paper matters (Taiwan, roughly `z0`–`z9`); `maxNativeZoom` is 9,
  so the layer is upscaled beyond that instead of requesting missing tiles.
- Missing tiles render as fully transparent (`errorTileUrl` is a blank pixel), and the control
  panel shows a warning while `/tiles/<layer_id>/7/107/55.png` does not answer.

## Producing the tiles

From georeferenced GeoTIFFs (e.g. rasterio + gdal2tiles):

```bash
gdal2tiles.py --profile=mercator --zoom=0-9 --resampling=bilinear \
  --srcnodata=255 --exclude_transparent \
  mean_475.tif public/tiles/mean_475
```

Keep the colour ramp of the paper: `0.0 → 1.6 g` for layers A, B and D (dark purple → blue →
green → yellow → dark red) and the diverging `−0.5 → +0.5 g` ramp for layer C (blue → grey →
red). The legend in the control panel is drawn with those ramps, so tiles must match to read
correctly.
