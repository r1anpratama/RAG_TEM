"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaultTrace, Scenario } from "@/types/triage";
import { Layers, Map as MapIcon, Info, ChevronDown, ChevronUp, Crosshair, Globe, Zap, Box } from "lucide-react";

interface GisMapProps {
  faults: FaultTrace[];
  scenario: Scenario | null;
  selectedFaultId?: number | null;
  onSelectFault?: (fault: FaultTrace) => void;
  isSimulating?: boolean;
  onSwitchTo3D?: () => void;
}

type BasemapStyle = "satellite" | "esri_dark" | "carto_dark" | "osm";

export const GisMap: React.FC<GisMapProps> = ({
  faults,
  scenario,
  selectedFaultId,
  onSelectFault,
  isSimulating = false,
  onSwitchTo3D,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapStyle>("esri_dark");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
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
        // Center on NCU Campus Core (Zhongli, Taoyuan) - Exact campus centroid
        const map = L.map(mapContainerRef.current, {
          center: [24.9688, 121.1918],
          zoom: 16,
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

        // 2. Esri Dark Canvas (Primary Default)
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

        // Add default Dark layer
        esriDarkGroup.addTo(map);

        mapInstanceRef.current = map;
        layersRef.current.campusBoundaryLayer = L.layerGroup().addTo(map);
        layersRef.current.faultsLayer = L.layerGroup().addTo(map);
        layersRef.current.markersLayer = L.layerGroup().addTo(map);
        layersRef.current.wavefrontsLayer = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const { faultsLayer, markersLayer, wavefrontsLayer, campusBoundaryLayer } = layersRef.current;

      // Invalidate size once to ensure full tile coverage
      map.invalidateSize();

      // Render NCU Campus Perimeter (Exact boundary circle around campus ring road)
      if (campusBoundaryLayer) {
        campusBoundaryLayer.clearLayers();
        L.circle([24.9688, 121.1918], {
          radius: 540,
          color: "#38bdf8",
          weight: 2,
          opacity: 0.85,
          fillColor: "#0284c7",
          fillOpacity: 0.07,
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

      // Render NCU Real Campus Building Pins - EXACT VERIFIED OPENSTREETMAP COORDINATES
      if (markersLayer) {
        markersLayer.clearLayers();

        const ncuBuildings = [
          {
            id: "FAC_NCU_SCIENCE_B4",
            name: "Science Building 4 (S4)",
            nameZh: "科學四館 / 健雄館",
            lat: 24.971335,
            lon: 121.191798,
            type: "Pre-1999 Soft Storey (Physics / Earth Sciences)",
          },
          {
            id: "FAC_NCU_ENG_B5",
            name: "Engineering Building 5 (E6)",
            nameZh: "工程五館 (資電學院 / 工學院)",
            lat: 24.967028,
            lon: 121.187380,
            type: "Post-1999 RC Frame (CS / EE Department)",
          },
          {
            id: "FAC_NCU_LIBRARY",
            name: "NCU Main Library Core",
            nameZh: "中央大學 總圖書館",
            lat: 24.968316,
            lon: 121.194263,
            type: "Post-1999 Seismic Retrofitted",
          },
          {
            id: "FAC_NCU_EDREAM",
            name: "College of Earth Sciences (E-DREaM)",
            nameZh: "地球科學院 / TT-SAM Node",
            lat: 24.967340,
            lon: 121.194519,
            type: "Seismology Array Station Core",
          },
          {
            id: "FAC_NCU_ADMIN",
            name: "NCU Administration Building",
            nameZh: "中央大學 行政大樓",
            lat: 24.968295,
            lon: 121.195048,
            type: "Campus Operations Hub",
          },
          {
            id: "FAC_NCU_LAKE",
            name: "Zhongda Lake (中大湖)",
            nameZh: "中大湖 / 湖心亭",
            lat: 24.970343,
            lon: 121.191570,
            type: "Campus Landmark Water Reservoir",
          },
          {
            id: "FAC_NCU_GYM",
            name: "NCU Gymnasium (依仁堂)",
            nameZh: "依仁堂體育館",
            lat: 24.968225,
            lon: 121.190825,
            type: "Indoor Arena & Evacuation Site",
          },
        ];

        ncuBuildings.forEach((b) => {
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
            } else {
              badgeText = "SAFE (UNDAMAGED)";
              badgeBorder = "border-slate-600";
              badgeBg = "bg-slate-900/95 text-slate-300";
              dotColor = "#64748b";
            }
          }

          // Sleek minimalist pin - Clean dot without persistent floating text (info shown on click)
          const bIcon = L.divIcon({
            className: `custom-building-pin-${b.id}`,
            html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer">
              <div style="height:14px;width:14px;border-radius:9999px;background:${dotColor};border:2px solid #ffffff;box-shadow:0 0 10px ${dotColor};transition:transform 0.2s" class="hover:scale-125"></div>
            </div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          L.marker([b.lat, b.lon], { icon: bIcon })
            .bindPopup(
              `<div style="font-family:sans-serif;color:#f8fafc;background:#0f172a;padding:10px 12px;font-size:11px;border-radius:8px;min-width:220px;border:1px solid #1e293b;box-shadow:0 8px 24px rgba(0,0,0,0.85)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                  <strong style="color:#38bdf8;font-size:13px">${b.name}</strong>
                  <span style="font-size:9px;padding:2px 6px;border-radius:4px;background:#1e293b;color:#94a3b8">${b.id.replace('FAC_NCU_', '')}</span>
                </div>
                <div style="color:#cbd5e1;font-size:11px;margin-bottom:6px;font-weight:600">${b.nameZh}</div>
                <div style="font-size:10px;color:#94a3b8;line-height:1.5;margin-bottom:6px">
                  Structural Category: <b style="color:#f1f5f9">${b.type}</b><br/>
                  Exact GPS: <code style="color:#38bdf8">${b.lat.toFixed(5)}, ${b.lon.toFixed(5)}</code>
                </div>
                <div style="padding:4px 8px;border-radius:4px;font-size:10px;font-weight:bold;display:inline-block;" class="${badgeBg} ${badgeBorder}">
                  Simulated Status: ${badgeText}
                </div>
              </div>`,
              { maxWidth: 280 }
            )
            .addTo(markersLayer);
        });

        // Render Active Epicenter if scenario present (clean star icon without floating label)
        if (scenario) {
          const epiLat = scenario.epicenter.lat;
          const epiLon = scenario.epicenter.lon;

          const epiIcon = L.divIcon({
            className: "custom-epi-marker",
            html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer">
              <div style="position:absolute;inset:-10px;border-radius:9999px;background:rgba(245,158,11,0.45);animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite"></div>
              <div style="height:22px;width:22px;border-radius:9999px;background:#f59e0b;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;color:#0b0f19;font-size:12px;font-weight:900;box-shadow:0 0 14px rgba(245,158,11,0.9)">
                ★
              </div>
            </div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          L.marker([epiLat, epiLon], { icon: epiIcon })
            .bindPopup(
              `<div style="font-family:sans-serif;color:#f8fafc;background:#0f172a;padding:10px 12px;font-size:11px;border-radius:8px;border:1px solid #f59e0b;box-shadow:0 8px 24px rgba(0,0,0,0.85)">
                <strong style="color:#f59e0b;font-size:13px">★ Epicenter / Hypocenter</strong><br/>
                <div style="color:#cbd5e1;font-size:11px;font-weight:bold;margin:4px 0">${scenario.title}</div>
                Magnitude: <b>Mw ${scenario.magnitude}</b> | Depth: <b>${scenario.depth_km} km</b><br/>
                Coordinates: <code style="color:#38bdf8">${epiLat.toFixed(4)}°N, ${epiLon.toFixed(4)}°E</code><br/>
                Target Facility: <b>${scenario.target_facility}</b><br/>
                Distance to NCU: <b style="color:#fcd34d">${scenario.distance_to_target_km || 23.9} km</b>
              </div>`,
              { maxWidth: 280 }
            )
            .addTo(markersLayer);

          // If EQ 20883 scenario, render 5 Key Seismic Recording Stations (clean triangle pins without floating labels)
          if (scenario.id.includes("20883") || epiLat > 24.5) {
            const eqStations = [
              { code: "TCU083", name: "NCU Campus Seismometer Core", lat: 24.9674, lon: 121.1943, dist: "23.8 km", pga: "12.3 Gal", int: "3", isCampus: true },
              { code: "TCU009", name: "Zhongli / Pingzhen Station", lat: 24.9510, lon: 121.2180, dist: "22.6 km", pga: "14.8 Gal", int: "3", isCampus: false },
              { code: "TCU006", name: "Yangmei Station", lat: 24.9120, lon: 121.1450, dist: "19.9 km", pga: "32.1 Gal", int: "4", isCampus: false },
              { code: "TCU013", name: "Longtan / Daxi Strong Motion", lat: 24.8620, lon: 121.2130, dist: "12.3 km", pga: "198.3 Gal", int: "5-", isCampus: false },
              { code: "TCU021", name: "Guanxi Peak Near-Field", lat: 24.7950, lon: 121.1730, dist: "9.4 km", pga: "209.8 Gal", int: "5-", isCampus: false },
            ];

            eqStations.forEach((s) => {
              const staIcon = L.divIcon({
                className: `sta-marker-${s.code}`,
                html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer">
                  <div style="height:16px;width:16px;border-radius:4px;background:${s.isCampus ? '#f59e0b' : '#06b6d4'};border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px ${s.isCampus ? '#f59e0b' : '#06b6d4'};transition:transform 0.2s" class="hover:scale-125">
                    <span style="font-size:9px;font-weight:bold;color:#0b0f19">▲</span>
                  </div>
                </div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              });
              L.marker([s.lat, s.lon], { icon: staIcon })
                .bindPopup(
                  `<div style="font-family:sans-serif;color:#f8fafc;background:#0f172a;padding:10px 12px;font-size:11px;border-radius:8px;border:1px solid ${s.isCampus ? '#f59e0b' : '#0284c7'};box-shadow:0 8px 24px rgba(0,0,0,0.85)">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                      <strong style="color:${s.isCampus ? '#f59e0b' : '#38bdf8'};font-size:13px">Station ${s.code}</strong>
                      ${s.isCampus ? '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:#78350f;color:#fef08a;font-weight:bold">NCU CAMPUS</span>' : ''}
                    </div>
                    <b style="color:#e2e8f0">${s.name}</b><br/>
                    Measured PGA: <b style="color:#f59e0b">${s.pga}</b> | CWA Intensity: <b style="color:#f59e0b">${s.int}</b><br/>
                    Distance to Epicenter: <b>${s.dist}</b><br/>
                    GPS: <code style="color:#38bdf8">${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}</code>
                    ${s.isCampus ? '<br/><span style="color:#fcd34d;font-weight:bold">★ Located directly on NCU Campus (0.11 km from S4)</span>' : ''}
                  </div>`,
                  { maxWidth: 280 }
                )
                .addTo(markersLayer);
            });
          }

          if (wavefrontsLayer) {
            wavefrontsLayer.clearLayers();

            // Direct distance propagation ray from Epicenter to NCU Campus Core (info on click)
            const ray = L.polyline([[epiLat, epiLon], [24.9688, 121.1918]], {
              color: "#f59e0b",
              weight: 2.2,
              dashArray: "6, 6",
              opacity: 0.85,
            });
            ray.bindPopup(
              `<div style="font-family:monospace;font-size:11px;background:#0f172a;color:#fcd34d;padding:8px 12px;border:1px solid #f59e0b;border-radius:6px">
                <strong>Propagation Path: Epicenter → NCU Campus</strong><br/>
                Direct Hypocentral Distance: <b>23.90 km</b><br/>
                P-wave Arrival: <b>8.16s</b><br/>
                S-wave Arrival: <b>14.85s</b><br/>
                Warning Lead Time: <b>+6.69s</b>
              </div>`
            );
            ray.addTo(wavefrontsLayer);

            // P-Wave compressional wavefront (Fast)
            L.circle([epiLat, epiLon], {
              radius: 28000,
              color: "#06b6d4",
              weight: 1.8,
              opacity: 0.8,
              fillColor: "#0891b2",
              fillOpacity: 0.08,
              dashArray: "4, 4",
            }).addTo(wavefrontsLayer);

            // S-Wave shear damaging wavefront (Reaching NCU campus ring)
            L.circle([epiLat, epiLon], {
              radius: 23900,
              color: "#f59e0b",
              weight: 2.5,
              opacity: 0.9,
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
    mapInstanceRef.current.flyTo([24.9688, 121.1918], 16, { duration: 1.2 });
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
        [24.9688, 121.1918],
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

          {/* Dedicated Button to Switch to 3D Campus Digital Twin */}
          {onSwitchTo3D && (
            <button
              onClick={onSwitchTo3D}
              className="flex items-center space-x-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 text-[10px] font-bold border border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)] transition ml-1"
              title="Open Full Interactive NCU 3D Campus WebGL Twin"
            >
              <Box className="h-3 w-3" />
              <span>3D Campus Twin</span>
            </button>
          )}

          {/* Basemap Switcher Toolbar */}
          <div className="flex items-center space-x-0.5 rounded-lg border border-slate-800 bg-slate-900/80 p-0.5 ml-1">
            <button
              onClick={() => handleSwitchBasemap("esri_dark")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                activeBasemap === "esri_dark"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Dark Canvas
            </button>
            <button
              onClick={() => handleSwitchBasemap("carto_dark")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                activeBasemap === "carto_dark"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Carto Dark
            </button>
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

      {/* Map DOM mount container - Clean 2D Leaflet with full tile visibility (No broken CSS 3D pitch!) */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div
          ref={mapContainerRef}
          className="h-full w-full"
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
