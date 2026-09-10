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

      // Render 38 Active Seismogenic Fault Traces
      if (faultsLayer) {
        faultsLayer.clearLayers();

        faults.forEach((f) => {
          if (!f.coordinates || f.coordinates.length < 2) return;

          const isSelected = selectedFaultId === f.fault_id;
          const isReverse = f.fault_type.toUpperCase().includes("R");
          const isNormal = f.fault_type.toUpperCase().includes("N");

          // New Palette Mapping:
          // Reverse: #fca311 (orange-500)
          // Normal: #3e67bf (prussian_blue-700)
          // Strike-Slip: #e5e5e5 (alabaster_grey-500)
          // Selected: #fdb541
          const color = isSelected
            ? "#fdb541"
            : isReverse
            ? "#fca311"
            : isNormal
            ? "#3e67bf"
            : "#e5e5e5";

          const polyline = L.polyline(f.coordinates, {
            color,
            weight: isSelected ? 4.5 : 2.5,
            opacity: isSelected ? 1.0 : 0.85,
            dashArray: isNormal ? "5, 5" : undefined,
          });

          polyline.bindTooltip(
            `<div style="font-family:sans-serif;color:#e5e5e5;background:#000000;border:1px solid #14213d;padding:6px;border-radius:6px;font-size:11px">
              <strong style="color:#fca311">#${f.fault_id} ${f.name}</strong><br/>
              Type: <b>${f.fault_type}</b> | Max Mw: <b>${f.mw_max}</b><br/>
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
            <div style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(62,103,191,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
            <div style="height:16px;width:16px;border-radius:9999px;background:#3e67bf;border:2px solid #000000;box-shadow:0 0 10px #7e99d5"></div>
            <div style="position:absolute;left:20px;top:-2px;white-space:nowrap;border-radius:4px;background:rgba(4,7,12,0.92);padding:3px 7px;font-size:10px;font-weight:bold;color:#beccea;border:1px solid rgba(41,68,126,0.5);box-shadow:0 2px 8px rgba(0,0,0,0.7)">
              NCU Campus Core
            </div>
          </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([ncuLat, ncuLon], { icon: ncuIcon })
          .bindPopup(
            `<div style="font-family:sans-serif;color:#000000;padding:4px;font-size:11px">
              <strong style="color:#14213d;font-size:12px">NCU Campus Core (E-DREaM Lab)</strong><br/>
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
              <div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(252,163,17,0.45);animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite"></div>
              <div style="height:22px;width:22px;border-radius:9999px;background:#fca311;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;color:#000000;font-size:11px;font-weight:900;box-shadow:0 0 12px rgba(252,163,17,0.85)">
                ★
              </div>
              <div style="position:absolute;left:26px;top:-4px;white-space:nowrap;border-radius:4px;background:rgba(20,33,61,0.95);padding:3px 8px;font-size:10px;font-weight:bold;color:#ffedd0;border:1px solid #fca311;box-shadow:0 2px 8px rgba(0,0,0,0.8)">
                Epicenter Mw ${scenario.magnitude}
              </div>
            </div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          L.marker([epiLat, epiLon], { icon: epiIcon })
            .bindPopup(
              `<div style="font-family:sans-serif;color:#000000;padding:4px;font-size:11px">
                <strong style="color:#14213d;font-size:12px">Hypocenter: ${scenario.title}</strong><br/>
                Magnitude: <b>Mw ${scenario.magnitude}</b> | Depth: <b>${scenario.depth_km} km</b><br/>
                Predicted PGV at NCU: <b style="color:#fca311">${scenario.predicted_pgv_cm_s} cm/s</b>
              </div>`
            )
            .addTo(markersLayer);

          if (wavefrontsLayer) {
            wavefrontsLayer.clearLayers();

            L.circle([epiLat, epiLon], {
              radius: 45000,
              color: "#3e67bf",
              weight: 1.5,
              opacity: 0.75,
              fillColor: "#14213d",
              fillOpacity: 0.1,
              dashArray: "4, 4",
            }).addTo(wavefrontsLayer);

            L.circle([epiLat, epiLon], {
              radius: 25000,
              color: "#fca311",
              weight: 2,
              opacity: 0.85,
              fillColor: "#14213d",
              fillOpacity: 0.18,
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
    <div className="flex flex-col h-full w-full overflow-hidden bg-black-500 rounded-xl">
      {/* Dedicated Card Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-prussian_blue-600/40 bg-black-500 px-3.5 py-2 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <MapIcon className="h-4 w-4 text-orange-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white-500">
            Taiwan Seismogenic Faults (38 Structures)
          </h3>
          <span className="hidden sm:inline-block rounded bg-prussian_blue-600/40 px-1.5 py-0.5 text-[9px] font-mono text-prussian_blue-800 border border-prussian_blue-600/60">
            TEM PSHA2025
          </span>
        </div>

        {/* Free Basemap Switcher Toolbar */}
        <div className="flex items-center space-x-1 rounded-lg border border-prussian_blue-600/40 bg-prussian_blue-400/40 p-1">
          <div className="flex items-center space-x-1 px-1.5 text-[10px] font-semibold text-prussian_blue-800">
            <Layers className="h-3 w-3 text-orange-500" />
            <span className="hidden md:inline">Basemap:</span>
          </div>
          <button
            onClick={() => handleSwitchBasemap("esri_dark")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
              activeBasemap === "esri_dark"
                ? "bg-orange-500 text-black-500 font-bold shadow-sm"
                : "text-prussian_blue-800 hover:text-white-500 hover:bg-prussian_blue-600/30"
            }`}
          >
            Esri Dark
          </button>
          <button
            onClick={() => handleSwitchBasemap("carto_dark")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
              activeBasemap === "carto_dark"
                ? "bg-orange-500 text-black-500 font-bold shadow-sm"
                : "text-prussian_blue-800 hover:text-white-500 hover:bg-prussian_blue-600/30"
            }`}
          >
            Carto Dark
          </button>
          <button
            onClick={() => handleSwitchBasemap("carto_voyager")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
              activeBasemap === "carto_voyager"
                ? "bg-orange-500 text-black-500 font-bold shadow-sm"
                : "text-prussian_blue-800 hover:text-white-500 hover:bg-prussian_blue-600/30"
            }`}
          >
            Voyager
          </button>
          <button
            onClick={() => handleSwitchBasemap("osm")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
              activeBasemap === "osm"
                ? "bg-orange-500 text-black-500 font-bold shadow-sm"
                : "text-prussian_blue-800 hover:text-white-500 hover:bg-prussian_blue-600/30"
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
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto rounded-lg border border-prussian_blue-600/40 bg-black-500/95 p-2 text-[11px] backdrop-blur-md shadow-xl text-alabaster_grey-500 max-w-[280px]">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsLegendOpen(!isLegendOpen)}>
            <div className="font-bold text-white-500 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
              <Info className="h-3 w-3 text-orange-500" />
              <span>Fault Mechanism Legend</span>
            </div>
            {isLegendOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-prussian_blue-800" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-prussian_blue-800" />
            )}
          </div>

          {isLegendOpen && (
            <div className="space-y-1 text-prussian_blue-800 text-[10px] mt-1.5 pt-1.5 border-t border-prussian_blue-600/30">
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-orange-500 rounded"></span>
                <span className="text-alabaster_grey-500">Reverse / Thrust Faults</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-prussian_blue-700 rounded border-b border-dashed border-prussian_blue-800"></span>
                <span className="text-alabaster_grey-500">Normal Faults</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-alabaster_grey-500 rounded"></span>
                <span className="text-alabaster_grey-500">Strike-Slip Faults</span>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-prussian_blue-600/30">
                <span className="h-2 w-2 rounded-full bg-prussian_blue-700 shadow-[0_0_6px_#7e99d5]"></span>
                <span className="text-prussian_blue-800 font-medium">NCU Core</span>
                <span className="text-prussian_blue-700">•</span>
                <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_#fca311]"></span>
                <span className="text-orange-500 font-medium">Epicenter & Wavefronts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
