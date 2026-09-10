"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaultTrace, Scenario } from "@/types/triage";
import { Layers, Map as MapIcon, Info, ChevronDown, ChevronUp } from "lucide-react";

interface GisMapProps {
  faults: FaultTrace[];
  scenario: Scenario | null;
  selectedFaultId?: number | null;
  onSelectFault?: (fault: FaultTrace) => void;
}

type BasemapStyle = "esri_dark" | "carto_dark" | "carto_voyager" | "osm";

export const GisMap: React.FC<GisMapProps> = ({
  faults,
  scenario,
  selectedFaultId,
  onSelectFault,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapStyle>("esri_dark");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const tileLayersRef = useRef<{ [key: string]: any }>({});
  const layersRef = useRef<{
    faultsLayer?: any;
    markersLayer?: any;
    wavefrontsLayer?: any;
  }>({});

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [24.1, 121.0],
          zoom: 7.8,
          minZoom: 7,
          maxZoom: 15,
          zoomControl: false,
        });

        // Add zoom controls at top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // 100% Free Tile Providers (NO API KEY REQUIRED)
        const esriBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: '&copy; <a href="https://www.esri.com/" target="_blank">Esri</a>, USGS, NOAA (Free)',
            maxZoom: 16,
          }
        );
        const esriRef = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        const esriGroup = L.layerGroup([esriBase, esriRef]);

        const cartoDark = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a> (Free)',
            subdomains: "abcd",
            maxZoom: 19,
          }
        );

        const cartoVoyager = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a> (Free)',
            subdomains: "abcd",
            maxZoom: 19,
          }
        );

        const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (Free)',
          maxZoom: 19,
        });

        tileLayersRef.current = {
          esri_dark: esriGroup,
          carto_dark: cartoDark,
          carto_voyager: cartoVoyager,
          osm: osm,
        };

        // Add default layer
        esriGroup.addTo(map);

        mapInstanceRef.current = map;
        layersRef.current.faultsLayer = L.layerGroup().addTo(map);
        layersRef.current.markersLayer = L.layerGroup().addTo(map);
        layersRef.current.wavefrontsLayer = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const { faultsLayer, markersLayer, wavefrontsLayer } = layersRef.current;

      // Render 38 Active Seismogenic Fault Traces with Ergonomic Cyber Palette
      if (faultsLayer) {
        faultsLayer.clearLayers();

        faults.forEach((f) => {
          if (!f.coordinates || f.coordinates.length < 2) return;

          const isSelected = selectedFaultId === f.fault_id;
          const isReverse = f.fault_type.toUpperCase().includes("R");
          const isNormal = f.fault_type.toUpperCase().includes("N");

          // Cyber Slate color mapping:
          // Reverse: #f59e0b (Warm Amber)
          // Normal: #06b6d4 (Cyber Cyan)
          // Strike-Slip: #a78bfa (Soft Violet)
          // Selected: #38bdf8 (Electric Sky)
          const color = isSelected
            ? "#38bdf8"
            : isReverse
            ? "#f59e0b"
            : isNormal
            ? "#06b6d4"
            : "#a78bfa";

          const polyline = L.polyline(f.coordinates, {
            color,
            weight: isSelected ? 4.5 : 2.5,
            opacity: isSelected ? 1.0 : 0.85,
            dashArray: isNormal ? "5, 5" : undefined,
          });

          polyline.bindTooltip(
            `<div style="font-family:sans-serif;color:#f8fafc;background:#111c2e;border:1px solid #1e293b;padding:7px 10px;border-radius:8px;font-size:11px;box-shadow:0 4px 12px rgba(0,0,0,0.5)">
              <strong style="color:#38bdf8;font-size:12px">#${f.fault_id} ${f.name}</strong><br/>
              Type: <b style="color:#f59e0b">${f.fault_type}</b> | Max Mw: <b>${f.mw_max}</b><br/>
              Slip Rate: <b>${f.slip_rate_mm_yr} mm/yr</b> | Dip: <b>${f.dip_deg}°</b>
            </div>`,
            { sticky: true }
          );

          polyline.on("click", () => {
            if (onSelectFault) onSelectFault(f);
          });

          polyline.addTo(faultsLayer);
        });
      }

      // Render NCU Target Facility & Active Epicenter
      if (markersLayer) {
        markersLayer.clearLayers();

        const ncuLat = 24.968;
        const ncuLon = 121.194;

        const ncuIcon = L.divIcon({
          className: "custom-ncu-marker",
          html: `<div style="position:relative;display:flex;align-items:center;justify-content:center">
            <div style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(6,182,212,0.3);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite"></div>
            <div style="height:16px;width:16px;border-radius:9999px;background:#06b6d4;border:2px solid #0b0f19;box-shadow:0 0 12px #06b6d4"></div>
            <div style="position:absolute;left:20px;top:-2px;white-space:nowrap;border-radius:6px;background:rgba(17,28,46,0.95);padding:3px 8px;font-size:10px;font-weight:bold;color:#f8fafc;border:1px solid rgba(6,182,212,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.5)">
              NCU Campus Core
            </div>
          </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([ncuLat, ncuLon], { icon: ncuIcon })
          .bindPopup(
            `<div style="font-family:sans-serif;color:#f8fafc;background:#111c2e;padding:6px;font-size:11px;border-radius:6px">
              <strong style="color:#06b6d4;font-size:12px">NCU Campus Core (E-DREaM Lab)</strong><br/>
              Target Monitoring Site (Taoyuan Corridor)<br/>
              Coordinates: ${ncuLat}, ${ncuLon}
            </div>`
          )
          .addTo(markersLayer);

        if (scenario) {
          const epiLat = scenario.epicenter.lat;
          const epiLon = scenario.epicenter.lon;

          const epiIcon = L.divIcon({
            className: "custom-epi-marker",
            html: `<div style="position:relative;display:flex;align-items:center;justify-content:center">
              <div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(245,158,11,0.4);animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite"></div>
              <div style="height:22px;width:22px;border-radius:9999px;background:#f59e0b;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;color:#0b0f19;font-size:11px;font-weight:900;box-shadow:0 0 14px rgba(245,158,11,0.8)">
                ★
              </div>
              <div style="position:absolute;left:26px;top:-4px;white-space:nowrap;border-radius:6px;background:rgba(17,28,46,0.96);padding:3px 9px;font-size:10px;font-weight:bold;color:#fcd34d;border:1px solid #f59e0b;box-shadow:0 4px 12px rgba(0,0,0,0.6)">
                Epicenter Mw ${scenario.magnitude}
              </div>
            </div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          L.marker([epiLat, epiLon], { icon: epiIcon })
            .bindPopup(
              `<div style="font-family:sans-serif;color:#f8fafc;background:#111c2e;padding:6px;font-size:11px;border-radius:6px">
                <strong style="color:#f59e0b;font-size:12px">Hypocenter: ${scenario.title}</strong><br/>
                Magnitude: <b>Mw ${scenario.magnitude}</b> | Depth: <b>${scenario.depth_km} km</b><br/>
                Predicted PGV at NCU: <b style="color:#38bdf8">${scenario.predicted_pgv_cm_s} cm/s</b>
              </div>`
            )
            .addTo(markersLayer);

          if (wavefrontsLayer) {
            wavefrontsLayer.clearLayers();

            L.circle([epiLat, epiLon], {
              radius: 45000,
              color: "#06b6d4",
              weight: 1.5,
              opacity: 0.7,
              fillColor: "#0891b2",
              fillOpacity: 0.08,
              dashArray: "4, 4",
            }).addTo(wavefrontsLayer);

            L.circle([epiLat, epiLon], {
              radius: 25000,
              color: "#f59e0b",
              weight: 2,
              opacity: 0.85,
              fillColor: "#f59e0b",
              fillOpacity: 0.12,
            }).addTo(wavefrontsLayer);
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [faults, scenario, selectedFaultId]);

  // Handle Basemap Switcher
  const handleSwitchBasemap = (style: BasemapStyle) => {
    if (!mapInstanceRef.current || !tileLayersRef.current) return;
    const map = mapInstanceRef.current;
    const allLayers = tileLayersRef.current;

    Object.values(allLayers).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    if (allLayers[style]) {
      allLayers[style].addTo(map);
      setActiveBasemap(style);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate_obsidian-900 rounded-xl">
      {/* Dedicated Card Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate_obsidian-card px-3.5 py-2 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <MapIcon className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Taiwan Seismogenic Faults (38 Structures)
          </h3>
          <span className="hidden sm:inline-block rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 border border-cyan-500/25">
            TEM PSHA2025
          </span>
        </div>

        {/* Free Basemap Switcher Toolbar */}
        <div className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/80 p-1">
          <div className="flex items-center space-x-1 px-1.5 text-[10px] font-semibold text-slate-400">
            <Layers className="h-3 w-3 text-cyan-400" />
            <span className="hidden md:inline">Basemap:</span>
          </div>
          <button
            onClick={() => handleSwitchBasemap("esri_dark")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
              activeBasemap === "esri_dark"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Esri Dark
          </button>
          <button
            onClick={() => handleSwitchBasemap("carto_dark")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
              activeBasemap === "carto_dark"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Carto Dark
          </button>
          <button
            onClick={() => handleSwitchBasemap("carto_voyager")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
              activeBasemap === "carto_voyager"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Voyager
          </button>
          <button
            onClick={() => handleSwitchBasemap("osm")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
              activeBasemap === "osm"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            OSM
          </button>
        </div>
      </div>

      {/* Map DOM mount container */}
      <div className="relative flex-1 w-full overflow-hidden">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Floating Collapsible Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto rounded-lg border border-slate-800 bg-slate_obsidian-card/95 p-2 text-[11px] backdrop-blur-md shadow-xl text-slate-300 max-w-[280px]">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsLegendOpen(!isLegendOpen)}>
            <div className="font-bold text-slate-100 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
              <Info className="h-3 w-3 text-cyan-400" />
              <span>Fault Mechanism Legend</span>
            </div>
            {isLegendOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>

          {isLegendOpen && (
            <div className="space-y-1 text-slate-400 text-[10px] mt-1.5 pt-1.5 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-amber-500 rounded"></span>
                <span className="text-slate-200">Reverse / Thrust Faults</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-cyan-400 rounded border-b border-dashed border-cyan-300"></span>
                <span className="text-slate-200">Normal Faults</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-violet-400 rounded"></span>
                <span className="text-slate-200">Strike-Slip Faults</span>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                <span className="text-cyan-300 font-medium">NCU Core</span>
                <span className="text-slate-600">•</span>
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]"></span>
                <span className="text-amber-300 font-medium">Epicenter & Wavefronts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
