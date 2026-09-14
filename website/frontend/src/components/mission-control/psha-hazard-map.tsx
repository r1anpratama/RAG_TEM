"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Hexagon,
  Link2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { FaultTrace, PshaAreaSource, PshaColorMode, PshaPairing } from "@/types/triage";
import {
  HAZARD_PROBE_TILE,
  HazardControlPanel,
  HazardLayerId,
  hazardTileUrl,
} from "@/components/mission-control/psha-hazard-controls";

/**
 * Hazard changes published in TEM PSHA2025 Section 4 for the structures whose hazard moved
 * relative to TEM PSHA2020. Values are quoted, not interpolated: `label` is the published
 * statement, `sign` only drives the halo colour.
 *
 * The paper also reports changes for IDs 39 and 45-48 and for the Kouhsiaoli fault (ID 47);
 * those structures sit outside this project's 38-structure catalog, so those entries simply
 * never render instead of being approximated.
 */
const PSHA2020_DELTA: Record<number, { sign: 1 | -1; label: string }> = {
  29: { sign: 1, label: "Hazard increased ~0.1 g (higher geodetic slip rate)" },
  34: { sign: -1, label: "Hazard decreased 0.1 g" },
  47: { sign: -1, label: "Hazard decreased 0.1–0.2 g" },
  5: { sign: -1, label: "Hazard decreased 0.05 g" },
};

interface PshaHazardMapProps {
  faults: FaultTrace[];
  pairings: PshaPairing[];
  areaSources: PshaAreaSource[];
  colorMode: PshaColorMode;
  selectedFaultId: number | null;
  focusedPairingLabel: string | null;
  onSelectFault: (fault: FaultTrace) => void;
  onSelectPairing: (pairing: PshaPairing) => void;
}

/** Areal source zones are an opt-in overlay; the map opens on the seismogenic structures. */
const AREA_SOURCE_COLOR = "#84cc16";

/** Neutral structure traces, matching the hazard-map figures in the paper. */
const STRUCTURE_COLOR = "#6b7280";

/** Free Esri hillshade relief - no API key, drawn beneath the hazard raster. */
const HILLSHADE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}";

/** Missing tiles stay silent instead of rendering broken-image icons. */
const BLANK_TILE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const TYPE_COLORS: Record<string, string> = {
  N: "#06b6d4",
  R: "#f59e0b",
  SS: "#a78bfa",
};

const RAMP = ["#0ea5e9", "#22d3ee", "#34d399", "#fbbf24", "#f43f5e"];

const MW_BREAKS = [6.0, 6.5, 7.0, 7.3];
const SLIP_BREAKS = [0.5, 1.5, 3.0, 6.0];

/** Map a value onto the shared 5-stop hazard ramp. */
function rampColor(value: number, breaks: number[]): string {
  const index = breaks.findIndex((b) => value < b);
  return RAMP[index === -1 ? RAMP.length - 1 : index];
}

function typeColor(faultType: string): string {
  if (faultType.includes("/")) return "#f472b6";
  return TYPE_COLORS[faultType] ?? "#94a3b8";
}

function traceColor(fault: FaultTrace, mode: PshaColorMode): string {
  if (mode === "structures") return STRUCTURE_COLOR;
  if (mode === "mw_max") return rampColor(fault.mw_max, MW_BREAKS);
  if (mode === "slip_rate") return rampColor(fault.slip_rate_mm_yr, SLIP_BREAKS);
  return typeColor(fault.fault_type);
}

function centroidOf(coordinates: [number, number][]): [number, number] {
  const lat = coordinates.reduce((sum, c) => sum + c[0], 0) / coordinates.length;
  const lon = coordinates.reduce((sum, c) => sum + c[1], 0) / coordinates.length;
  return [lat, lon];
}

export const PshaHazardMap: React.FC<PshaHazardMapProps> = ({
  faults,
  pairings,
  areaSources,
  colorMode,
  selectedFaultId,
  focusedPairingLabel,
  onSelectFault,
  onSelectPairing,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const tilesRef = useRef<Record<string, any>>({});
  const layersRef = useRef<Record<string, any>>({});
  const didFitRef = useRef<boolean>(false);
  const hillshadeRef = useRef<any>(null);
  const hazardRasterRef = useRef<any>(null);
  const basemapMaskRef = useRef<any>(null);

  const [basemap, setBasemap] = useState<string>("dark");
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [coverBasemap, setCoverBasemap] = useState<boolean>(true);
  const [showPairings, setShowPairings] = useState<boolean>(true);
  const [showAreaSources, setShowAreaSources] = useState<boolean>(false);
  const [showDeltas, setShowDeltas] = useState<boolean>(true);
  const [legendOpen, setLegendOpen] = useState<boolean>(true);

  // Hazard raster controls
  const [hazardLayer, setHazardLayer] = useState<HazardLayerId>("mean_475");
  const [hazardOpacity, setHazardOpacity] = useState<number>(80);
  const [showStructures, setShowStructures] = useState<boolean>(true);
  const [showHillshade, setShowHillshade] = useState<boolean>(true);
  const [tilesAvailable, setTilesAvailable] = useState<boolean | null>(null);

  const faultsById = useMemo(() => {
    const map = new Map<number, FaultTrace>();
    faults.forEach((f) => map.set(f.fault_id, f));
    return map;
  }, [faults]);

  const activePairings = useMemo(
    () => pairings.filter((p) => p.fault_ids.every((id) => faultsById.has(id))),
    [pairings, faultsById]
  );

  // --- Leaflet lifecycle -----------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [23.8, 120.9],
          zoom: 7,
          minZoom: 6,
          maxZoom: 15,
          zoomControl: false,
          preferCanvas: true,
        });
        L.control.zoom({ position: "topright" }).addTo(map);

        // Stacking: basemap (tilePane 200) -> basemap mask (220) -> hillshade (250) -> hazard raster (260) -> vector overlays (400).
        map.createPane("basemapMaskPane").style.zIndex = "220";
        map.createPane("hillshadePane").style.zIndex = "250";
        map.createPane("hazardPane").style.zIndex = "260";

        tilesRef.current = {
          dark: L.layerGroup([
            L.tileLayer(
              "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
              { maxZoom: 16 }
            ),
            L.tileLayer(
              "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
              { maxZoom: 16 }
            ),
          ]),
          carto: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            subdomains: "abcd",
            maxZoom: 19,
          }),
          satellite: L.layerGroup([
            L.tileLayer(
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              { maxZoom: 19 }
            ),
            L.tileLayer(
              "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
              { maxZoom: 19 }
            ),
          ]),
          osm: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }),
        };
        tilesRef.current.dark.addTo(map);

        layersRef.current = {
          areaSources: L.layerGroup().addTo(map),
          deltas: L.layerGroup().addTo(map),
          pairings: L.layerGroup().addTo(map),
          faults: L.layerGroup().addTo(map),
        };
        mapRef.current = map;
        setMapReady(true);
      }

      const map = mapRef.current;
      const {
        areaSources: areaSourceLayer,
        deltas,
        pairings: pairingLayer,
        faults: faultLayer,
      } = layersRef.current;
      map.invalidateSize();

      // 0. Shallow areal source zones (off by default): outline plus the published a-value.
      areaSourceLayer.clearLayers();
      if (showAreaSources) {
        areaSources.forEach((source) => {
          if (source.coordinates.length < 3) return;

          L.polygon(source.coordinates, {
            color: AREA_SOURCE_COLOR,
            weight: 1.4,
            opacity: 0.85,
            dashArray: "4, 4",
            // Transparent rather than absent: the zone stays hoverable without a fill.
            fillColor: AREA_SOURCE_COLOR,
            fillOpacity: 0,
          })
            .bindTooltip(
              `<div style="font-family:sans-serif;font-size:11px;background:#111c2e;color:#f8fafc;border:1px solid ${AREA_SOURCE_COLOR};padding:7px 10px;border-radius:8px">
                 <strong style="color:${AREA_SOURCE_COLOR}">Areal source zone ${source.id}</strong><br/>
                 ${
                   source.a_value === null || source.a_value === undefined
                     ? '<span style="color:#94a3b8">a-value not in the asset</span><br/>'
                     : `Gutenberg-Richter a-value <b>${source.a_value}</b><br/>`
                 }
                 ${source.vertex_count} vertices<br/>
                 Centroid <code>${source.centroid[0].toFixed(4)}, ${source.centroid[1].toFixed(4)}</code>
               </div>`,
              { sticky: true }
            )
            .addTo(areaSourceLayer);

          if (source.a_value !== null && source.a_value !== undefined) {
            L.marker(source.centroid, {
              interactive: false,
              icon: L.divIcon({
                className: "psha-area-a-label",
                html: `<div style="font-family:monospace;font-size:11px;font-weight:800;color:${AREA_SOURCE_COLOR};text-shadow:0 0 3px #0b0f19,0 0 6px #0b0f19;pointer-events:none">${source.a_value}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
              }),
            }).addTo(areaSourceLayer);
          }
        });
      }

      // 1. Published hazard change halos (TEM PSHA2025 Section 4).
      deltas.clearLayers();
      if (showDeltas) {
        faults.forEach((f) => {
          const delta = PSHA2020_DELTA[f.fault_id];
          if (!delta || f.coordinates.length < 2) return;
          L.polyline(f.coordinates, {
            color: delta.sign > 0 ? "#f43f5e" : "#10b981",
            weight: 11,
            opacity: 0.28,
            lineCap: "round",
          })
            .bindTooltip(
              `<div style="font-family:monospace;font-size:11px;background:#0f172a;color:#e2e8f0;border:1px solid ${
                delta.sign > 0 ? "#f43f5e" : "#10b981"
              };padding:6px 9px;border-radius:6px">
                 <strong>ID ${f.fault_id} ${f.name}</strong><br/>
                 ${delta.sign > 0 ? "▲" : "▼"} ${delta.label}<br/>
                 <span style="color:#94a3b8">TEM PSHA2025 vs TEM PSHA2020 (§4)</span>
               </div>`,
              { sticky: true }
            )
            .addTo(deltas);
        });
      }

      // 2. Table 2 multiple-structure rupture links.
      pairingLayer.clearLayers();
      if (showPairings) {
        activePairings.forEach((pairing) => {
          const [a, b] = pairing.fault_ids.map((id) => faultsById.get(id)!);
          if (!a?.coordinates.length || !b?.coordinates.length) return;

          const isFocused = pairing.pairing_label === focusedPairingLabel;
          L.polyline([centroidOf(a.coordinates), centroidOf(b.coordinates)], {
            color: pairing.combined_mw >= 7.1 ? "#f43f5e" : "#f59e0b",
            weight: isFocused ? 4.5 : Math.max(1.2, (pairing.combined_mw - 6.3) * 3),
            opacity: isFocused ? 1 : focusedPairingLabel ? 0.5 : 0.8,
            dashArray: "7, 5",
          })
            .bindTooltip(
              `<div style="font-family:sans-serif;font-size:11px;background:#111c2e;color:#f8fafc;border:1px solid #f59e0b;padding:7px 10px;border-radius:8px">
                 <strong style="color:#fbbf24">Table 2 · ${pairing.pairing_label}</strong><br/>
                 ${pairing.fault_names[0]} + ${pairing.fault_names[1]}<br/>
                 Combined magnitude <b>Mw ${pairing.combined_mw}</b><br/>
                 Recurrence interval <b>${pairing.recurrence_interval_yr.toLocaleString()} yr</b><br/>
                 <span style="color:#94a3b8">Click to frame both structures</span>
               </div>`,
              { sticky: true }
            )
            .on("click", () => onSelectPairing(pairing))
            .addTo(pairingLayer);
        });
      }

      // 3. Fault traces (the "Seismogenic structures" overlay).
      faultLayer.clearLayers();
      faults.forEach((f) => {
        if (!showStructures || f.coordinates.length < 2) return;
        const isSelected = selectedFaultId === f.fault_id;
        const delta = PSHA2020_DELTA[f.fault_id];
        const neutral = colorMode === "structures";

        const polyline = L.polyline(f.coordinates, {
          color: isSelected ? "#38bdf8" : traceColor(f, colorMode),
          weight: isSelected ? 3 : neutral ? 1.5 : 2.6,
          opacity: isSelected ? 1 : 0.9,
          dashArray: neutral ? undefined : f.fault_type === "N" ? "5, 5" : undefined,
        });

        const pairingCount = activePairings.filter((p) => p.fault_ids.includes(f.fault_id)).length;
        polyline.bindTooltip(
          `<div style="font-family:sans-serif;color:#f8fafc;background:#111c2e;border:1px solid ${
            isSelected ? "#38bdf8" : "#1e293b"
          };padding:8px 11px;border-radius:8px;font-size:11px;box-shadow:0 4px 14px rgba(0,0,0,0.6)">
             <strong style="color:#38bdf8;font-size:12px">ID ${f.fault_id} · ${f.name}</strong><br/>
             Type <b style="color:#f59e0b">${f.fault_type}</b> · Max <b>Mw ${f.mw_max}</b><br/>
             Slip rate <b>${f.slip_rate_mm_yr} mm/yr</b> · Dip <b>${f.dip_deg}°</b><br/>
             Rake <b>${f.rake_deg ?? "—"}°</b> · Max depth <b>${f.depth_max_km ?? "—"} km</b><br/>
             ${pairingCount > 0 ? `Table 2 pairings: <b style="color:#fbbf24">${pairingCount}</b><br/>` : ""}
             ${delta ? `<span style="color:${delta.sign > 0 ? "#fb7185" : "#34d399"}">${
               delta.sign > 0 ? "▲" : "▼"
             } ${delta.label}</span><br/>` : ""}
             <span style="color:#94a3b8">Click for the full structure dossier</span>
           </div>`,
          { sticky: true }
        );
        polyline.on("click", () => onSelectFault(f));
        polyline.addTo(faultLayer);
      });

      // 4. Frame the island once, on first render with data.
      if (!didFitRef.current && faults.length > 0) {
        const points: [number, number][] = faults.flatMap((f) => f.coordinates);
        if (points.length > 0) {
          map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
          didFitRef.current = true;
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    faults,
    activePairings,
    areaSources,
    faultsById,
    colorMode,
    selectedFaultId,
    focusedPairingLabel,
    showPairings,
    showAreaSources,
    showDeltas,
    showStructures,
    onSelectFault,
    onSelectPairing,
  ]);

  // --- Hazard raster + hillshade tile layers ---------------------------------
  // Kept in their own effects so dragging the opacity slider never rebuilds the vector layers.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    if (!hillshadeRef.current) {
      hillshadeRef.current = L.tileLayer(HILLSHADE_URL, {
        pane: "hillshadePane",
        opacity: 0.55,
        maxZoom: 16,
        maxNativeZoom: 13,
      });
    }
    if (!hazardRasterRef.current) {
      hazardRasterRef.current = L.tileLayer(hazardTileUrl(hazardLayer), {
        pane: "hazardPane",
        opacity: hazardOpacity / 100,
        maxZoom: 16,
        maxNativeZoom: 11,
        errorTileUrl: BLANK_TILE,
        className: "psha-hazard-raster",
      });
    } else {
      hazardRasterRef.current.setUrl(hazardTileUrl(hazardLayer), false);
    }

    const attach = (layer: any, wanted: boolean) => {
      if (wanted && !map.hasLayer(layer)) layer.addTo(map);
      if (!wanted && map.hasLayer(layer)) map.removeLayer(layer);
    };
    attach(hillshadeRef.current, showHillshade);
    attach(hazardRasterRef.current, true);
  }, [mapReady, hazardLayer, hazardOpacity, showHillshade]);

  // Opacity is applied in its own effect: no URL or layer churn while dragging.
  useEffect(() => {
    hazardRasterRef.current?.setOpacity(hazardOpacity / 100);
  }, [hazardOpacity]);

  // Mask Taiwan basemap under the hazard raster so no gray basemap land or labels clash with the hazard raster:
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    const oceanColor =
      basemap === "carto" ? "#090909" : basemap === "dark" ? "#15181a" : "#0b0f19";

    const TAIWAN_COVER_BOUNDS: [[number, number], [number, number]] = [
      [21.60, 119.70],
      [25.60, 122.35],
    ];

    if (!basemapMaskRef.current) {
      basemapMaskRef.current = L.rectangle(TAIWAN_COVER_BOUNDS, {
        pane: "basemapMaskPane",
        stroke: false,
        fillColor: oceanColor,
        fillOpacity: 1.0,
        interactive: false,
      });
    } else {
      basemapMaskRef.current.setStyle({ fillColor: oceanColor });
    }

    const wantMask = coverBasemap && hazardOpacity > 0;
    if (wantMask && !map.hasLayer(basemapMaskRef.current)) {
      basemapMaskRef.current.addTo(map);
    }
    if (!wantMask && map.hasLayer(basemapMaskRef.current)) {
      map.removeLayer(basemapMaskRef.current);
    }
  }, [mapReady, basemap, coverBasemap, hazardOpacity]);

  // Report whether the raster for the active layer actually exists on disk.
  useEffect(() => {
    let cancelled = false;
    setTilesAvailable(null);
    fetch(HAZARD_PROBE_TILE(hazardLayer), { method: "HEAD" })
      .then((res) => !cancelled && setTilesAvailable(res.ok))
      .catch(() => !cancelled && setTilesAvailable(false));
    return () => {
      cancelled = true;
    };
  }, [hazardLayer]);

  const switchBasemap = (key: string) => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(tilesRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    tilesRef.current[key]?.addTo(map);
    setBasemap(key);
  };

  const flyTo = (lat: number, lon: number, zoom: number) =>
    mapRef.current?.flyTo([lat, lon], zoom, { duration: 1.1 });

  /** Frame the seismogenic structures plus, when requested, the wider areal source zones. */
  const fitToSources = (includeAreaSources: boolean) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const points: [number, number][] = faults.flatMap((f) => f.coordinates);
    if (includeAreaSources) {
      areaSources.forEach((s) => points.push(...s.coordinates));
    }
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
    }
  };

  const toggleAreaSources = () => {
    const next = !showAreaSources;
    setShowAreaSources(next);
    // The zones reach ~1° beyond the fault traces, so reveal them instead of clipping them.
    if (next) fitToSources(true);
  };

  const legendEntries =
    colorMode === "structures"
      ? [{ color: STRUCTURE_COLOR, label: "Seismogenic structure (neutral)" }]
      : colorMode === "kinematics"
      ? [
          { color: "#06b6d4", label: "Normal fault (N)" },
          { color: "#f59e0b", label: "Reverse fault (R)" },
          { color: "#a78bfa", label: "Strike-slip (SS)" },
          { color: "#f472b6", label: "Mixed SS/R or R/SS" },
        ]
      : colorMode === "mw_max"
      ? [
          { color: RAMP[0], label: "Mw < 6.0" },
          { color: RAMP[1], label: "Mw 6.0 – 6.5" },
          { color: RAMP[2], label: "Mw 6.5 – 7.0" },
          { color: RAMP[3], label: "Mw 7.0 – 7.3" },
          { color: RAMP[4], label: "Mw ≥ 7.3" },
        ]
      : [
          { color: RAMP[0], label: "Slip < 0.5 mm/yr" },
          { color: RAMP[1], label: "0.5 – 1.5 mm/yr" },
          { color: RAMP[2], label: "1.5 – 3 mm/yr" },
          { color: RAMP[3], label: "3 – 6 mm/yr" },
          { color: RAMP[4], label: "≥ 6 mm/yr" },
        ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate_obsidian-card">
      <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate_obsidian-card/95">
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            TEM PSHA2025 On-Land Source Map
          </h3>
          <span className="rounded border border-cyan-500/25 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] text-cyan-600 dark:text-cyan-300">
            {faults.length} structures
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={toggleAreaSources}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold transition ${
              showAreaSources
                ? "border-lime-500/50 bg-lime-500/15 text-lime-600 dark:text-lime-300"
                : "border-slate-300 text-slate-400 hover:text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            title="Show or hide the TEM PSHA2025 shallow areal source zones"
          >
            <Hexagon className="h-3 w-3" />
            <span>Area sources ({areaSources.length})</span>
          </button>

          <button
            onClick={() => setShowPairings((v) => !v)}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold transition ${
              showPairings
                ? "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300"
                : "border-slate-300 text-slate-400 dark:border-slate-700"
            }`}
            title="Toggle TEM PSHA2025 Table 2 multiple-structure rupture links"
          >
            <Link2 className="h-3 w-3" />
            <span>Table 2 links</span>
          </button>

          <button
            onClick={() => setShowDeltas((v) => !v)}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold transition ${
              showDeltas
                ? "border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-300"
                : "border-slate-300 text-slate-400 dark:border-slate-700"
            }`}
            title="Toggle published hazard change versus TEM PSHA2020"
          >
            <TrendingUp className="h-3 w-3" />
            <span>Δ vs 2020</span>
          </button>

          <button
            onClick={() => flyTo(23.7, 120.95, 7.4)}
            className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Globe className="h-3 w-3" />
            <span>Taiwan</span>
          </button>

          <div className="ml-1 flex items-center space-x-0.5 rounded-lg border border-slate-300 p-0.5 dark:border-slate-800 dark:bg-slate-900/80">
            {[
              { key: "dark", label: "Dark" },
              { key: "carto", label: "Carto" },
              { key: "satellite", label: "Sat" },
              { key: "osm", label: "OSM" },
            ].map((b) => (
              <button
                key={b.key}
                onClick={() => switchBasemap(b.key)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition ${
                  basemap === b.key
                    ? "bg-cyan-500 font-bold text-slate-950"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        {/* Floating hazard-raster control panel with integrated color scale */}
        <div className="absolute right-3 top-20 z-[1000] flex justify-end">
          <HazardControlPanel
            activeLayer={hazardLayer}
            onSelectLayer={setHazardLayer}
            opacity={hazardOpacity}
            onOpacityChange={setHazardOpacity}
            showStructures={showStructures}
            onToggleStructures={() => setShowStructures((v) => !v)}
            showHillshade={showHillshade}
            onToggleHillshade={() => setShowHillshade((v) => !v)}
            coverBasemap={coverBasemap}
            onToggleCoverBasemap={() => setCoverBasemap((v) => !v)}
            tilesAvailable={tilesAvailable}
          />
        </div>

        {/* Dynamic legend, follows the active colour mode */}
        <div className="pointer-events-auto absolute bottom-3 left-3 z-[1000] max-w-[260px] rounded-lg border border-slate-300 bg-white/95 p-2 text-[10px] shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate_obsidian-card/95 dark:text-slate-300">
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={() => setLegendOpen((v) => !v)}
          >
            <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-100">
              <Info className="h-3 w-3 text-cyan-500" />
              <span>Legend · {colorMode === "structures" ? "Hazard" : colorMode.replace("_", " ")}</span>
            </div>
            {legendOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>

          {legendOpen && (
            <div className="mt-1.5 space-y-1 border-t border-slate-200 pt-1.5 dark:border-slate-800">
              {legendEntries.map((entry) => (
                <div key={entry.label} className="flex items-center space-x-2">
                  <span
                    className="h-1.5 w-4 rounded"
                    style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
                  />
                  <span className="text-slate-600 dark:text-slate-300">{entry.label}</span>
                </div>
              ))}
              {showAreaSources && (
                <div className="flex items-center space-x-2">
                  <span
                    className="h-1.5 w-4 rounded border border-dashed"
                    style={{ borderColor: AREA_SOURCE_COLOR }}
                  />
                  <span className="text-lime-600 dark:text-lime-300">
                    Areal source zone{areaSources.some((s) => s.a_value !== null) ? " (a-value)" : ""}
                  </span>
                </div>
              )}
              {showPairings && (
                <div className="flex items-center space-x-2">
                  <span className="h-0.5 w-4 rounded border-t-2 border-dashed border-amber-400" />
                  <span className="text-amber-600 dark:text-amber-300">Table 2 rupture link</span>
                </div>
              )}
              {showDeltas && (
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-4 rounded bg-rose-500/40" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Published Δ hazard vs PSHA2020
                  </span>
                </div>
              )}
              {showDeltas && (
                <div className="flex items-center gap-2 pt-0.5 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-rose-400" /> increase
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-emerald-400" /> decrease
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-md border border-slate-300 bg-white/90 px-2.5 py-1 font-mono text-[10px] text-slate-600 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-300">
          <Layers className="mr-1 inline h-3 w-3 text-cyan-500" />
          {pairings.length} Table 2 pairings · study radius 320 km
        </div>
      </div>
    </div>
  );
};
