"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaultTrace, Scenario } from "@/types/triage";
import { Layers, Map as MapIcon, Info, ChevronDown, ChevronUp, Crosshair, Globe, Zap, Compass } from "lucide-react";

interface GisMapProps {
  faults: FaultTrace[];
  scenario: Scenario | null;
  selectedFaultId?: number | null;
  onSelectFault?: (fault: FaultTrace) => void;
  isSimulating?: boolean;
}

type BasemapStyle = "satellite" | "esri_dark" | "carto_dark" | "osm";

export const GisMap: React.FC<GisMapProps> = ({
  faults,
  scenario,
  selectedFaultId,
  onSelectFault,
  isSimulating = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapStyle>("satellite");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [is3DTilt, setIs3DTilt] = useState<boolean>(false);
  const tileLayersRef = useRef<{ [key: string]: any }>({});
  const layersRef = useRef<{
    faultsLayer?: any;
    markersLayer?: any;
    wavefrontsLayer?: any;
    campusBoundaryLayer?: any;
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
        // Default camera focused on NCU Campus (Zhongli, Taoyuan)
        const map = L.map(mapContainerRef.current, {
          center: [24.9681, 121.1945],
          zoom: 15.5,
          minZoom: 6,
          maxZoom: 19,
          zoomControl: false,
        });

        L.control.zoom({ position: "topright" }).addTo(map);

        // 1. High-Resolution Satellite Basemap (Real Physical Aerial Photograph of Campus)
        const esriSatellite = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: '&copy; <a href="https://www.esri.com/" target="_blank">Esri</a> Satellite',
            maxZoom: 19,
          }
        );
        const esriLabels = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19 }
        );
        const satelliteGroup = L.layerGroup([esriSatellite, esriLabels]);

        // 2. Esri Dark Canvas
        const esriBase = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        const esriRef = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        );
        const esriDarkGroup = L.layerGroup([esriBase, esriRef]);

        // 3. Carto Dark
        const cartoDark = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          { subdomains: "abcd", maxZoom: 19 }
        );

        // 4. OpenStreetMap Standard
        const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        });

        tileLayersRef.current = {
          satellite: satelliteGroup,
          esri_dark: esriDarkGroup,
          carto_dark: cartoDark,
          osm: osm,
        };

        // Add default Satellite layer to showcase real campus
        satelliteGroup.addTo(map);

        mapInstanceRef.current = map;
        layersRef.current.campusBoundaryLayer = L.layerGroup().addTo(map);
        layersRef.current.faultsLayer = L.layerGroup().addTo(map);
        layersRef.current.markersLayer = L.layerGroup().addTo(map);
        layersRef.current.wavefrontsLayer = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const { faultsLayer, markersLayer, wavefrontsLayer, campusBoundaryLayer } = layersRef.current;

      // Render NCU Campus Perimeter
      if (campusBoundaryLayer) {
        campusBoundaryLayer.clearLayers();
        L.circle([24.9681, 121.1945], {
          radius: 480,
          color: "#38bdf8",
          weight: 2,
          opacity: 0.85,
          fillColor: "#0284c7",
          fillOpacity: 0.08,
          dashArray: "6, 6",
        }).addTo(campusBoundaryLayer);
      }

      // Render 38 Active Seismogenic Fault Traces
      if (faultsLayer) {
        faultsLayer.clearLayers();

        faults.forEach((f) => {
          if (!f.coordinates || f.coordinates.length < 2) return;

          const isSelected = selectedFaultId === f.fault_id;
          const isReverse = f.fault_type.toUpperCase().includes("R");
          const isNormal = f.fault_type.toUpperCase().includes("N");

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

      // Render NCU Real Campus Building Pins (NEUTRAL IN STANDBY, NO HARDCODED ALARM COLORS)
      if (markersLayer) {
        markersLayer.clearLayers();

        const ncuBuildings = [
          {
            id: "FAC_NCU_SCIENCE_B4",
            name: "NCU Science Building 4",
            sub: "理學院四館 (Earth Sciences / Physics)",
            lat: 24.9692,
            lon: 121.1932,
            type: "Pre-1999 Soft Storey",
          },
          {
            id: "FAC_NCU_ENG_B5",
            name: "NCU Engineering Building 5",
            sub: "工程五館 (CS / Electrical Engineering)",
            lat: 24.9678,
            lon: 121.1915,
            type: "Post-1999 RC Frame",
          },
          {
            id: "FAC_NCU_LIBRARY",
            name: "NCU Main Library Core",
            sub: "中央大學 總圖書館",
            lat: 24.9676,
            lon: 121.1959,
            type: "Seismic Retrofitted",
          },
          {
            id: "FAC_NCU_EDREAM",
            name: "E-DREaM Seismology Core",
            sub: "健雄館 / TT-SAM Inference Node",
            lat: 24.9695,
            lon: 121.1928,
            type: "Array Seismic Station",
          },
          {
            id: "FAC_NCU_LAKE",
            name: "Zhongda Lake",
            sub: "中大湖",
            lat: 24.9665,
            lon: 121.1942,
            type: "Campus Landmark",
          },
        ];

        ncuBuildings.forEach((b) => {
          // Dynamic status ONLY when simulating; otherwise clean neutral architectural styling
          let badgeText = "STANDBY (MONITORED)";
          let badgeBorder = "border-cyan-500/40";
          let badgeBg = "bg-slate-900/95";
          let dotColor = "#38bdf8";

          if (isSimulating && scenario) {
            const pgv = scenario.predicted_pgv_cm_s || 28.4;
            if (b.id === "FAC_NCU_SCIENCE_B4") {
              badgeText = pgv >= 20 ? "RED TAG (2.14% DRIFT)" : "INSPECT (1.1%)";
              badgeBorder = "border-rose-500";
              badgeBg = "bg-rose-950/95 text-rose-300";
              dotColor = "#f43f5e";
            } else if (b.id === "FAC_NCU_ENG_B5") {
              badgeText = pgv >= 25 ? "YELLOW INSPECT (1.05%)" : "SAFE (0.6%)";
              badgeBorder = "border-amber-500";
              badgeBg = "bg-amber-950/95 text-amber-300";
              dotColor = "#f59e0b";
            } else if (b.id === "FAC_NCU_LIBRARY") {
              badgeText = "SAFE (0.42% DRIFT)";
              badgeBorder = "border-emerald-500";
              badgeBg = "bg-emerald-950/95 text-emerald-300";
              dotColor = "#10b981";
            } else if (b.id === "FAC_NCU_EDREAM") {
              badgeText = "ONLINE (TT-SAM REAL-TIME)";
              badgeBorder = "border-cyan-400";
              badgeBg = "bg-cyan-950/95 text-cyan-200";
              dotColor = "#06b6d4";
            }
          }

          const bIcon = L.divIcon({
            className: `custom-building-pin-${b.id}`,
            html: `<div style="position:relative;display:flex;align-items:center;cursor:pointer">
              <div style="height:12px;width:12px;border-radius:9999px;background:${dotColor};border:2px solid #ffffff;box-shadow:0 0 8px ${dotColor}"></div>
              <div style="position:absolute;left:16px;top:-10px;white-space:nowrap;border-radius:6px;padding:3px 8px;font-size:10px;font-weight:bold;color:#f8fafc;box-shadow:0 4px 12px rgba(0,0,0,0.6);border:1px solid;" class="${badgeBg} ${badgeBorder}">
                ${b.name}<br/>
                <span style="font-size:9px;font-weight:normal;opacity:0.85">${badgeText}</span>
              </div>
            </div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });

          L.marker([b.lat, b.lon], { icon: bIcon })
            .bindPopup(
              `<div style="font-family:sans-serif;color:#f8fafc;background:#111c2e;padding:8px;font-size:11px;border-radius:6px;min-width:180px">
                <strong style="color:#38bdf8;font-size:12px">${b.name}</strong><br/>
                <span style="color:#94a3b8">${b.sub}</span><br/>
                Structural Category: <b>${b.type}</b><br/>
                Simulated Impact: <b style="color:${dotColor}">${badgeText}</b>
              </div>`
            )
            .addTo(markersLayer);
        });

        // Render Active Epicenter if scenario present
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
  }, [faults, scenario, selectedFaultId, isSimulating]);

  // Basemap Switcher Handler
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

  // Camera Quick Actions
  const flyToNCU = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([24.9681, 121.1945], 16, { duration: 1.2 });
  };

  const flyToAllTaiwan = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([24.1, 121.0], 7.8, { duration: 1.2 });
  };

  const fitEventBounds = () => {
    if (!mapInstanceRef.current || !scenario) {
      flyToNCU();
      return;
    }
    const map = mapInstanceRef.current;
    import("leaflet").then((L) => {
      const bounds = L.latLngBounds([
        [24.9681, 121.1945],
        [scenario.epicenter.lat, scenario.epicenter.lon],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate_obsidian-900 rounded-xl">
      {/* Dedicated Card Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate_obsidian-card px-3.5 py-2 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <MapIcon className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            NCU Campus & Wavefront GIS
          </h3>
          <span className="hidden sm:inline-block rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 border border-cyan-500/25">
            Taoyuan Core
          </span>
        </div>

        {/* Quick Camera Navigation Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={flyToNCU}
            className="flex items-center space-x-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 px-2 py-1 text-[10px] font-bold text-cyan-300 border border-cyan-500/30 transition shadow-sm"
            title="Focus Camera on NCU Campus"
          >
            <Crosshair className="h-3 w-3 text-cyan-400" />
            <span>Focus NCU</span>
          </button>

          {scenario && (
            <button
              onClick={fitEventBounds}
              className="flex items-center space-x-1 rounded bg-amber-500/15 hover:bg-amber-500/25 px-2 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30 transition shadow-sm"
              title="Fit Camera to Epicenter and Campus"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              <span className="hidden md:inline">Event Path</span>
            </button>
          )}

          <button
            onClick={flyToAllTaiwan}
            className="flex items-center space-x-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-300 border border-slate-700 transition"
            title="View Entire Island Faults"
          >
            <Globe className="h-3 w-3 text-slate-400" />
            <span className="hidden md:inline">All Taiwan</span>
          </button>

          {/* 3D Perspective Tilt Button */}
          <button
            onClick={() => setIs3DTilt(!is3DTilt)}
            className={`flex items-center space-x-1 rounded px-2 py-1 text-[10px] font-bold border transition ${
              is3DTilt
                ? "bg-indigo-600 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
            title="Toggle 3D Perspective Drone Pitch"
          >
            <Compass className="h-3 w-3" />
            <span>3D Tilt</span>
          </button>

          {/* Basemap Switcher Toolbar */}
          <div className="flex items-center space-x-0.5 rounded-lg border border-slate-800 bg-slate-900/80 p-0.5 ml-1">
            <button
              onClick={() => handleSwitchBasemap("satellite")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                activeBasemap === "satellite"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => handleSwitchBasemap("esri_dark")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                activeBasemap === "esri_dark"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => handleSwitchBasemap("osm")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                activeBasemap === "osm"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              OSM
            </button>
          </div>
        </div>
      </div>

      {/* Map DOM mount container with optional 3D Tilt perspective */}
      <div className="relative flex-1 w-full overflow-hidden [perspective:900px]">
        <div
          ref={mapContainerRef}
          className={`h-full w-full ${
            is3DTilt
              ? "origin-bottom scale-[1.08] [transform:rotateX(38deg)] shadow-2xl transition-transform duration-500 ease-out"
              : "transition-transform duration-500 ease-out"
          }`}
        />

        {/* Floating Collapsible Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto rounded-lg border border-slate-800 bg-slate_obsidian-card/95 p-2 text-[11px] backdrop-blur-md shadow-xl text-slate-300 max-w-[280px]">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsLegendOpen(!isLegendOpen)}>
            <div className="font-bold text-slate-100 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
              <Info className="h-3 w-3 text-cyan-400" />
              <span>Campus & Fault Legend</span>
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
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                <span className="text-cyan-300 font-medium">NCU Facilities (Neutral Monitored)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-amber-500 rounded"></span>
                <span className="text-slate-200">Active Seismogenic Faults</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]"></span>
                <span className="text-amber-300 font-medium">Epicenter & P/S Wavefronts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
