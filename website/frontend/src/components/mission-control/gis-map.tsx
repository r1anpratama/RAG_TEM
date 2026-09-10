"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaultTrace, Scenario } from "@/types/triage";
import { Layers, Map as MapIcon } from "lucide-react";

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
          center: [24.3, 121.1],
          zoom: 8,
          minZoom: 7,
          maxZoom: 15,
          zoomControl: false,
        });

        L.control.zoom({ position: "topright" }).addTo(map);

        // 100% Free Tile Providers (NO API KEY REQUIRED)
        // 1. Esri Dark Gray Canvas (Default: Gorgeous scientific charcoal grey basemap)
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

        // 2. CartoDB Dark Matter (High Contrast Midnight, Free)
        const cartoDark = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a> (Free)',
            subdomains: "abcd",
            maxZoom: 19,
          }
        );

        // 3. CartoDB Voyager (Detailed Terrain / Topography, Free)
        const cartoVoyager = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a> (Free)',
            subdomains: "abcd",
            maxZoom: 19,
          }
        );

        // 4. OpenStreetMap Standard (Free Open GIS)
        const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (Free)',
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

      // Render 38 Active Seismogenic Fault Traces using new custom palette
      if (faultsLayer) {
        faultsLayer.clearLayers();

        faults.forEach((f) => {
          if (!f.coordinates || f.coordinates.length < 2) return;

          const isSelected = selectedFaultId === f.fault_id;
          const isReverse = f.fault_type.toUpperCase().includes("R");
          const isNormal = f.fault_type.toUpperCase().includes("N");

          // Palette: vivid_tangerine (#ff7d00), stormy_teal (#2199ab), papaya_whip (#ffc574)
          const color = isSelected
            ? "#3ec5da" // stormy_teal-700
            : isReverse
            ? "#ff7d00" // vivid_tangerine-500
            : isNormal
            ? "#2199ab" // stormy_teal-600
            : "#ffc574"; // papaya_whip-400

          const polyline = L.polyline(f.coordinates, {
            color,
            weight: isSelected ? 4.5 : 2.5,
            opacity: isSelected ? 1.0 : 0.85,
            dashArray: isNormal ? "5, 5" : undefined,
          });

          polyline.bindTooltip(
            `<div style="font-family:sans-serif;color:#ffecd1;background:#001524;border:1px solid #15616d;padding:6px;border-radius:6px;font-size:11px">
              <strong style="color:#ff7d00">#${f.fault_id} ${f.name}</strong><br/>
              Type: <b>${f.fault_type}</b> | Max Mw: <b>${f.mw_max}</b><br/>
              Slip Rate: <b>${f.slip_rate_mm_yr} mm/yr</b> | Dip: <b>${f.dip_deg}°</b>
            </div>`,
            { sticky: true, className: "custom-leaflet-tooltip" }
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
            <div style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(33,153,171,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
            <div style="height:16px;width:16px;border-radius:9999px;background:#2199ab;border:2px solid #001524;box-shadow:0 0 10px #3ec5da"></div>
            <div style="position:absolute;left:20px;top:-2px;white-space:nowrap;border-radius:4px;background:rgba(0,21,36,0.92);padding:3px 7px;font-size:10px;font-weight:bold;color:#bfecf3;border:1px solid rgba(33,153,171,0.5);box-shadow:0 2px 8px rgba(0,0,0,0.5)">
              NCU Campus Core
            </div>
          </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([ncuLat, ncuLon], { icon: ncuIcon })
          .bindPopup(
            `<div style="font-family:sans-serif;color:#001524;padding:4px;font-size:11px">
              <strong style="color:#15616d;font-size:12px">NCU Campus Core (E-DREaM Lab)</strong><br/>
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
              <div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(255,125,0,0.45);animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite"></div>
              <div style="height:22px;width:22px;border-radius:9999px;background:#ff7d00;border:2px solid #ffecd1;display:flex;align-items:center;justify-content:center;color:#001524;font-size:11px;font-weight:900;box-shadow:0 0 12px rgba(255,125,0,0.8)">
                ★
              </div>
              <div style="position:absolute;left:26px;top:-4px;white-space:nowrap;border-radius:4px;background:rgba(120,41,15,0.92);padding:3px 8px;font-size:10px;font-weight:bold;color:#ffecd1;border:1px solid #ff7d00;box-shadow:0 2px 8px rgba(0,0,0,0.6)">
                Epicenter Mw ${scenario.magnitude}
              </div>
            </div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          L.marker([epiLat, epiLon], { icon: epiIcon })
            .bindPopup(
              `<div style="font-family:sans-serif;color:#001524;padding:4px;font-size:11px">
                <strong style="color:#78290f;font-size:12px">Hypocenter: ${scenario.title}</strong><br/>
                Magnitude: <b>Mw ${scenario.magnitude}</b> | Depth: <b>${scenario.depth_km} km</b><br/>
                Predicted PGV at NCU: <b style="color:#ff7d00">${scenario.predicted_pgv_cm_s} cm/s</b>
              </div>`
            )
            .addTo(markersLayer);

          if (wavefrontsLayer) {
            wavefrontsLayer.clearLayers();

            // P-Wavefront (cyan / stormy_teal)
            L.circle([epiLat, epiLon], {
              radius: 45000,
              color: "#3ec5da",
              weight: 1.5,
              opacity: 0.7,
              fillColor: "#15616d",
              fillOpacity: 0.08,
              dashArray: "4, 4",
            }).addTo(wavefrontsLayer);

            // S-Wavefront (vivid_tangerine)
            L.circle([epiLat, epiLon], {
              radius: 25000,
              color: "#ff7d00",
              weight: 2,
              opacity: 0.85,
              fillColor: "#78290f",
              fillOpacity: 0.14,
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

    // Remove all basemaps
    Object.values(allLayers).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Add selected basemap
    if (allLayers[style]) {
      allLayers[style].addTo(map);
      setActiveBasemap(style);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink_black-500">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Floating Free Basemap Switcher (Top-Left) */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-1 rounded-lg border border-stormy_teal-400/40 bg-ink_black-500/90 p-1 backdrop-blur-md shadow-lg">
        <div className="flex items-center space-x-1 px-1.5 text-[10px] font-semibold text-stormy_teal-700">
          <Layers className="h-3 w-3" />
          <span className="hidden sm:inline">Map (No Key):</span>
        </div>
        <button
          onClick={() => handleSwitchBasemap("esri_dark")}
          className={`px-2 py-1 rounded text-[10px] font-medium transition ${
            activeBasemap === "esri_dark"
              ? "bg-stormy_teal-500 text-papaya_whip-500 shadow-sm"
              : "text-stormy_teal-800 hover:text-papaya_whip-500 hover:bg-stormy_teal-400/20"
          }`}
        >
          Esri Dark Gray
        </button>
        <button
          onClick={() => handleSwitchBasemap("carto_dark")}
          className={`px-2 py-1 rounded text-[10px] font-medium transition ${
            activeBasemap === "carto_dark"
              ? "bg-stormy_teal-500 text-papaya_whip-500 shadow-sm"
              : "text-stormy_teal-800 hover:text-papaya_whip-500 hover:bg-stormy_teal-400/20"
          }`}
        >
          Carto Dark
        </button>
        <button
          onClick={() => handleSwitchBasemap("carto_voyager")}
          className={`px-2 py-1 rounded text-[10px] font-medium transition ${
            activeBasemap === "carto_voyager"
              ? "bg-stormy_teal-500 text-papaya_whip-500 shadow-sm"
              : "text-stormy_teal-800 hover:text-papaya_whip-500 hover:bg-stormy_teal-400/20"
          }`}
        >
          Voyager
        </button>
        <button
          onClick={() => handleSwitchBasemap("osm")}
          className={`px-2 py-1 rounded text-[10px] font-medium transition ${
            activeBasemap === "osm"
              ? "bg-stormy_teal-500 text-papaya_whip-500 shadow-sm"
              : "text-stormy_teal-800 hover:text-papaya_whip-500 hover:bg-stormy_teal-400/20"
          }`}
        >
          OSM
        </button>
      </div>

      {/* Map Overlay Legend */}
      <div className="absolute bottom-3 left-3 z-20 rounded-lg border border-stormy_teal-400/30 bg-ink_black-500/90 p-2.5 text-[11px] backdrop-blur-md shadow-xl text-papaya_whip-500">
        <div className="font-bold text-papaya_whip-500 mb-1 uppercase tracking-wider text-[10px] flex items-center justify-between gap-2">
          <span>Taiwan Seismogenic Faults (38)</span>
          <span className="text-[9px] text-stormy_teal-700 font-mono">100% Free GIS</span>
        </div>
        <div className="space-y-1 text-stormy_teal-800 text-[10px]">
          <div className="flex items-center space-x-2">
            <span className="h-1 w-4 bg-vivid_tangerine-500 rounded"></span>
            <span className="text-papaya_whip-700">Reverse / Thrust (e.g. Chelungpu, Shuanglienpo)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-1 w-4 bg-stormy_teal-600 rounded border-b border-dashed border-stormy_teal-700"></span>
            <span className="text-papaya_whip-700">Normal Faults (e.g. Shanchiao)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-1 w-4 bg-papaya_whip-400 rounded"></span>
            <span className="text-papaya_whip-700">Strike-Slip Faults (e.g. Meishan)</span>
          </div>
          <div className="flex items-center space-x-2 pt-1 border-t border-stormy_teal-400/30">
            <span className="h-2 w-2 rounded-full bg-stormy_teal-600 shadow-[0_0_6px_#3ec5da]"></span>
            <span className="text-stormy_teal-700 font-medium">NCU Digital Twin Core</span>
            <span className="mx-1 text-ink_black-600">•</span>
            <span className="h-2 w-2 rounded-full bg-vivid_tangerine-500 shadow-[0_0_6px_#ff7d00]"></span>
            <span className="text-vivid_tangerine-600 font-medium">Epicenter & P/S Waves</span>
          </div>
        </div>
      </div>
    </div>
  );
};
