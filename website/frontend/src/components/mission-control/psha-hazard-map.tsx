"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Hexagon,
} from "lucide-react";
import { FaultTrace, PshaAreaSource, PshaColorMode, PshaPairing } from "@/types/triage";
import {
  HAZARD_PROBE_TILE,
  HazardControlPanel,
  HazardLayerId,
  hazardTileUrl,
} from "@/components/mission-control/psha-hazard-controls";


interface PshaHazardMapProps {
  faults: FaultTrace[];
  pairings: PshaPairing[];
  areaSources: PshaAreaSource[];
  colorMode: PshaColorMode;
  selectedFaultId: number | null;
  blinkingFaultId?: number | null;
  focusedPairingLabel: string | null;
  userLocation?: { lat: number; lon: number; label?: string } | null;
  onSelectFault: (fault: FaultTrace) => void;
  onSelectPairing: (pairing: PshaPairing) => void;
}

/** Areal source zones are an opt-in overlay; the map opens on the seismogenic structures. */
const AREA_SOURCE_COLOR = "#000000";

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

export const PshaHazardMap: React.FC<PshaHazardMapProps> = ({
  faults,
  pairings,
  areaSources,
  colorMode,
  selectedFaultId,
  blinkingFaultId = null,
  focusedPairingLabel,
  userLocation,
  onSelectFault,
  onSelectPairing,
}) => {
  const isHazardMode = colorMode === "structures" || (colorMode as string) === "hazard";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const tilesRef = useRef<Record<string, any>>({});
  const layersRef = useRef<Record<string, any>>({});
  const didFitRef = useRef<boolean>(false);
  const hillshadeRef = useRef<any>(null);
  const hazardRasterRef = useRef<any>(null);

  const [basemap, setBasemap] = useState<string>("dark");
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [showAreaSources, setShowAreaSources] = useState<boolean>(false);
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
          preferCanvas: false,
        });
        L.control.zoom({ position: "topright" }).addTo(map);

        // Stacking: basemap (tilePane 200) -> hillshade (250) -> hazard raster (260) -> vector overlays (400).
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

        layersRef.current = {
          areaSources: L.layerGroup().addTo(map),
          faults: L.layerGroup().addTo(map),
          userLocation: L.layerGroup().addTo(map),
        };
        mapRef.current = map;
        setMapReady(true);
      }

      const map = mapRef.current;
      const {
        areaSources: areaSourceLayer,
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
              `<div style="font-family:sans-serif;font-size:11px;background:#111c2e;color:#f8fafc;border:1px solid #38bdf8;padding:7px 10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5)">
                 <strong style="color:#38bdf8">Areal source zone ${source.id}</strong><br/>
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
                html: `<div style="font-family:monospace;font-size:11px;font-weight:800;color:${AREA_SOURCE_COLOR};text-shadow:0 0 3px #ffffff,0 0 6px #ffffff;pointer-events:none">${source.a_value}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
              }),
            }).addTo(areaSourceLayer);
          }
        });
      }

      // 1. Fault traces (the "Seismogenic structures" overlay).
      faultLayer.clearLayers();
      const drawTraces = !isHazardMode || showStructures;
      if (drawTraces || blinkingFaultId) {
        faults.forEach((f) => {
          if (f.coordinates.length < 2) return;
          const isSelected = selectedFaultId === f.fault_id;
          const isBlinking = blinkingFaultId === f.fault_id;
          if (!drawTraces && !isBlinking) return;
          const neutral = isHazardMode;

          const polyline = L.polyline(f.coordinates, {
            color: isBlinking ? "#f43f5e" : isSelected ? "#38bdf8" : traceColor(f, colorMode),
            weight: isBlinking ? 6 : isSelected ? 3.5 : neutral ? 1.5 : 2.6,
            opacity: isBlinking ? 1 : isSelected ? 1 : 0.9,
            className: isBlinking ? "psha-fault-blinking" : undefined,
            dashArray: neutral && !isBlinking ? undefined : f.fault_type === "N" ? "5, 5" : undefined,
          });

          // Beacon pointer for AI-targeted structure
          if (isBlinking && f.coordinates.length > 0) {
            const midIdx = Math.floor(f.coordinates.length / 2);
            const midPt = f.coordinates[midIdx];
            const beaconIcon = L.divIcon({
              className: "psha-fault-beacon-wrapper",
              html: `
                <div style="position:relative;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);pointer-events:none;">
                  <span class="psha-fault-beacon-ring" style="position:absolute;width:44px;height:44px;border-radius:50%;background:#f43f5e;opacity:0.85;"></span>
                  <div style="display:flex;align-items:center;gap:6px;background:rgba(15,23,42,0.95);backdrop-filter:blur(6px);border:1.5px solid #f43f5e;box-shadow:0 0 18px rgba(244,63,94,0.75);padding:4px 9px;border-radius:9999px;white-space:nowrap;">
                    <span style="width:8px;height:8px;border-radius:50%;background:#f43f5e;box-shadow:0 0 8px #ffffff;animation:pulse 1s infinite;"></span>
                    <span style="color:#ffffff;font-family:monospace;font-size:10px;font-weight:700;">⚡ Target: ID ${f.fault_id} · ${f.name}</span>
                  </div>
                </div>
              `,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            });
            L.marker(midPt, { icon: beaconIcon, zIndexOffset: 2500 }).addTo(faultLayer);
          }

          polyline.bindTooltip(
            `<div style="font-family:sans-serif;color:#f8fafc;background:#111c2e;border:1px solid ${
              isSelected ? "#38bdf8" : "#1e293b"
            };padding:8px 11px;border-radius:8px;font-size:11px;box-shadow:0 4px 14px rgba(0,0,0,0.6)">
               <strong style="color:#38bdf8;font-size:12px">ID ${f.fault_id} · ${f.name}</strong><br/>
               Type <b style="color:#f59e0b">${f.fault_type}</b> · Max <b>Mw ${f.mw_max}</b><br/>
               Slip rate <b>${f.slip_rate_mm_yr} mm/yr</b> · Dip <b>${f.dip_deg}°</b><br/>
               Rake <b>${f.rake_deg ?? "—"}°</b> · Max depth <b>${f.depth_max_km ?? "—"} km</b><br/>
               <span style="color:#94a3b8">Click for the full structure dossier</span>
             </div>`,
            { sticky: true }
          );
          polyline.on("click", () => onSelectFault(f));
          polyline.addTo(faultLayer);
          if (isBlinking) {
            polyline.bringToFront();
          }
        });
      }

      // 2. Frame the island once, on first render with data.
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
    areaSources,
    faultsById,
    colorMode,
    isHazardMode,
    selectedFaultId,
    blinkingFaultId,
    showAreaSources,
    showStructures,
    onSelectFault,
  ]);

  // Set dark canvas background on the Leaflet container in Hazard mode
  useEffect(() => {
    if (!containerRef.current) return;
    if (isHazardMode) {
      containerRef.current.classList.add("psha-hazard-canvas");
    } else {
      containerRef.current.classList.remove("psha-hazard-canvas");
    }
  }, [isHazardMode]);

  // --- User location pin & fly-to lifecycle ---------------------------------
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map || !layersRef.current?.userLocation) return;

    const userLayer = layersRef.current.userLocation;
    userLayer.clearLayers();

    if (!userLocation) return;

    const { lat, lon, label } = userLocation;

    // Custom pulsing radar pin icon
    const pingIcon = L.divIcon({
      className: "psha-user-location-pin",
      html: `
        <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
          <span class="psha-radar-pulse" style="position:absolute;width:30px;height:30px;border-radius:50%;background:#06b6d4;opacity:0.6;"></span>
          <span style="position:relative;width:22px;height:22px;border-radius:50%;background:#0891b2;border:2px solid #ffffff;box-shadow:0 0 12px #06b6d4, 0 4px 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:12px;">📍</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const marker = L.marker([lat, lon], {
      icon: pingIcon,
      zIndexOffset: 1000,
    });

    marker.bindPopup(
      `<div style="font-family:sans-serif;font-size:11px;background:#0f172a;color:#f8fafc;padding:9px 12px;border-radius:8px;border:1px solid #06b6d4;box-shadow:0 4px 14px rgba(0,0,0,0.6);min-width:180px">
         <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
           <span style="font-size:13px">📍</span>
           <strong style="color:#38bdf8;font-size:12px">${label || "Your Location"}</strong>
         </div>
         <div style="color:#cbd5e1;font-size:11px;line-height:1.4">
           <b>${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E</b><br/>
           <span style="color:#94a3b8;font-size:10px">TEM PSHA2025 ground motion &amp; site hazard assessment</span>
         </div>
       </div>`,
      { offset: [0, -10] }
    );

    marker.addTo(userLayer);
    marker.openPopup();

    if (!blinkingFaultId) {
      map.flyTo([lat, lon], 11, { duration: 1.4 });
    }
  }, [mapReady, userLocation, blinkingFaultId]);

  // --- Frame both user location and AI-pointed blinking structure -----------
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map || !blinkingFaultId) return;

    const targetFault = faults.find((f) => f.fault_id === blinkingFaultId);
    if (!targetFault || targetFault.coordinates.length === 0) return;

    if (userLocation) {
      const allPts: [number, number][] = [
        [userLocation.lat, userLocation.lon],
        ...targetFault.coordinates,
      ];
      map.flyToBounds(L.latLngBounds(allPts), {
        padding: [60, 60],
        maxZoom: 13,
        duration: 1.3,
      });
    } else {
      map.flyToBounds(L.latLngBounds(targetFault.coordinates), {
        padding: [50, 50],
        maxZoom: 12,
        duration: 1.3,
      });
    }
  }, [mapReady, blinkingFaultId, userLocation, faults]);

  // --- Basemap layer lifecycle ----------------------------------------------
  // In Hazard mode, completely hide/detach the basemap so focus is 100% on the seismic hazard raster.
  // In Kinematics / Max Mw / Slip rate modes, attach the active basemap.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    Object.values(tilesRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });

    if (!isHazardMode && tilesRef.current[basemap]) {
      tilesRef.current[basemap].addTo(map);
    }
  }, [mapReady, basemap, isHazardMode]);

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
    attach(hillshadeRef.current, isHazardMode && showHillshade);
    attach(hazardRasterRef.current, isHazardMode);
  }, [mapReady, hazardLayer, hazardOpacity, showHillshade, isHazardMode]);

  // Opacity is applied in its own effect: no URL or layer churn while dragging.
  useEffect(() => {
    hazardRasterRef.current?.setOpacity(hazardOpacity / 100);
  }, [hazardOpacity]);

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
      ? [{ color: STRUCTURE_COLOR, label: "Seismogenic structure" }]
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
            onClick={() => flyTo(23.7, 120.95, 7.4)}
            className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Globe className="h-3 w-3" />
            <span>Taiwan</span>
          </button>

          {!isHazardMode && (
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
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        {/* Floating hazard-raster control panel with integrated color scale (Hazard mode only) */}
        {isHazardMode && (
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
              tilesAvailable={tilesAvailable}
            />
          </div>
        )}

        {/* Dynamic legend, follows the active colour mode */}
        <div className="pointer-events-auto absolute bottom-3 left-3 z-[1000] max-w-[260px] rounded-lg border border-slate-300 bg-white/95 p-2 text-[10px] shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate_obsidian-card/95 dark:text-slate-300">
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={() => setLegendOpen((v) => !v)}
          >
            <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-100">
              <Info className="h-3 w-3 text-cyan-500" />
              <span>Legend · {isHazardMode ? "Hazard" : colorMode.replace("_", " ")}</span>
            </div>
            {legendOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>

          {legendOpen && (
            <div className="mt-1.5 space-y-1 border-t border-slate-200 pt-1.5 dark:border-slate-800">
              {(!isHazardMode || showStructures) &&
                legendEntries.map((entry) => (
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
                    className="h-1.5 w-4 rounded border border-dashed border-black bg-black dark:border-slate-400 dark:bg-black"
                  />
                  <span className="text-slate-900 dark:text-slate-200">
                    Areal source zone{areaSources.some((s) => s.a_value !== null) ? " (a-value)" : ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-md border border-slate-300 bg-white/90 px-2.5 py-1 font-mono text-[10px] text-slate-600 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-300">
          <Layers className="mr-1 inline h-3 w-3 text-cyan-500" />
          TEM PSHA2025
        </div>
      </div>
    </div>
  );
};
