"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaultTrace, Scenario } from "@/types/triage";
import {
  Layers,
  Map as MapIcon,
  Info,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Globe,
  Zap,
  Box,
  Radio,
  Maximize2,
} from "lucide-react";
import { CwaIntensityColorbar } from "@/components/mission-control/cwa-intensity-colorbar";
import { getCwaLevelInfo } from "@/lib/cwa-intensity";
import eq20122Data from "@/data/eq_20122_simulation.json";
import eq20883Data from "@/data/eq_20883_simulation.json";

interface GisMapProps {
  faults: FaultTrace[];
  scenario: Scenario | null;
  selectedFaultId?: number | null;
  onSelectFault?: (fault: FaultTrace) => void;
  isSimulating?: boolean;
  simTimeSec?: number;
  isPlaying?: boolean;
  onSwitchTo3D?: () => void;
}

type BasemapStyle = "satellite" | "esri_dark" | "carto_dark" | "osm";

interface StationGeoInfo {
  code: string;
  name: string;
  lat: number;
  lon: number;
  distEpi: number;
  distNcu: number;
  pPickSec: number;
  cwaIntensity: string;
  pgaGal: number;
  isCampus?: boolean;
}

export const GisMap: React.FC<GisMapProps> = ({
  faults,
  scenario,
  selectedFaultId,
  onSelectFault,
  isSimulating = false,
  simTimeSec = 0,
  isPlaying = false,
  onSwitchTo3D,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapStyle>("esri_dark");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [showColorbar, setShowColorbar] = useState<boolean>(true);

  const tileLayersRef = useRef<{ [key: string]: any }>({});
  const layersRef = useRef<{
    faultsLayer?: any;
    markersLayer?: any;
    stationsLayer?: any;
    dynamicWavefrontsLayer?: any;
    staticWavefrontsLayer?: any;
    campusBoundaryLayer?: any;
  }>({});

  const stationMarkersRef = useRef<Record<string, any>>({});
  const pWaveCircleRef = useRef<any>(null);
  const sWaveCircleRef = useRef<any>(null);

  // Extract ALL stations for active scenario
  const getActiveStations = (): StationGeoInfo[] => {
    if (!scenario) return [];

    const is20122 = scenario.id.includes("20122");
    const is20883 = scenario.id.includes("20883");

    if (is20122) {
      const prev = eq20122Data.waveform_previews as Record<string, any>;
      return Object.entries(prev).map(([code, s]) => ({
        code,
        name: s.label?.split("•")[1]?.split("(")[0]?.trim() || `${code} Station`,
        lat: s.latitude,
        lon: s.longitude,
        distEpi: s.distance_km,
        distNcu: s.dist_to_ncu_km || 15.0,
        pPickSec: s.p_pick_sec,
        cwaIntensity: s.cwa_intensity,
        pgaGal: s.max_abs_acc_gal,
        isCampus: code === "TCU083",
      }));
    } else if (is20883) {
      const prev = eq20883Data.waveform_previews as Record<string, any>;
      return Object.entries(prev).map(([code, s]) => ({
        code,
        name: s.label?.split("•")[1]?.split("(")[0]?.trim() || `${code} Station`,
        lat: s.latitude || 24.9674,
        lon: s.longitude || 121.1943,
        distEpi: s.distance_km,
        distNcu: s.dist_to_ncu_km || 0.11,
        pPickSec: s.p_pick_sec,
        cwaIntensity: s.cwa_intensity,
        pgaGal: s.max_abs_acc_gal,
        isCampus: code === "TCU083",
      }));
    }

    return [];
  };

  const activeStations = getActiveStations();

  // Helper to create station HTML icon based on trigger status & CWA Intensity
  const createStationIconHtml = (
    station: StationGeoInfo,
    isTriggered: boolean,
    isNewlyDetected: boolean
  ) => {
    const cwa = getCwaLevelInfo(station.cwaIntensity);

    if (!isTriggered) {
      // Standby Station (waiting for P-wave arrival)
      return `<div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer" title="${station.code} (Standby - Expected P-Arrival @ ${station.pPickSec}s)">
        <div style="height:11px;width:11px;border-radius:2.5px;background:#334155;border:1.5px solid #64748b;opacity:0.55;display:flex;align-items:center;justify-content:center">
          <span style="font-size:7px;color:#cbd5e1">▲</span>
        </div>
      </div>`;
    }

    // Triggered Station: Lights up in official CWA Intensity Color with optional Radar Ping Ring
    return `<div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer" title="${station.code}: Detected @ ${station.pPickSec}s • Intensity ${cwa.level} (${cwa.nameZh})">
      ${
        isNewlyDetected
          ? `<div style="position:absolute;inset:-10px;border-radius:9999px;background:${cwa.glowColor};animation:ping 1s cubic-bezier(0,0,0.2,1) infinite"></div>`
          : ""
      }
      <div style="height:17px;width:17px;border-radius:4px;background:${cwa.color};border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px ${cwa.color};transition:transform 0.25s" class="hover:scale-125">
        <span style="font-size:9px;font-weight:900;color:${cwa.textColor}">▲</span>
      </div>
      <div style="position:absolute;top:-13px;background:#090d16;color:${cwa.color};border:1px solid ${cwa.color};font-size:8px;font-weight:bold;font-family:monospace;padding:1px 3px;border-radius:3px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.8)">
        ${station.code} • ${cwa.level}
      </div>
    </div>`;
  };

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
        // Center on Taoyuan/NCU region
        const map = L.map(mapContainerRef.current, {
          center: [24.88, 121.22],
          zoom: 11,
          minZoom: 6,
          maxZoom: 19,
          zoomControl: false,
        });

        L.control.zoom({ position: "topright" }).addTo(map);

        // 1. High-Resolution Satellite Basemap
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
        layersRef.current.stationsLayer = L.layerGroup().addTo(map);
        layersRef.current.staticWavefrontsLayer = L.layerGroup().addTo(map);
        layersRef.current.dynamicWavefrontsLayer = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const {
        faultsLayer,
        markersLayer,
        campusBoundaryLayer,
        stationsLayer,
        staticWavefrontsLayer,
        dynamicWavefrontsLayer,
      } = layersRef.current;

      map.invalidateSize();

      // Render NCU Campus Perimeter
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

      // Render Active Fault Traces
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
            weight: isSelected ? 4.5 : 2.2,
            opacity: isSelected ? 1.0 : 0.8,
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

      // Render NCU Buildings
      if (markersLayer) {
        markersLayer.clearLayers();

        const ncuBuildings = [
          {
            id: "FAC_NCU_SCIENCE_B4",
            name: "Science Building 4 (S4)",
            nameZh: "科學四館 / 健雄館",
            lat: 24.971335,
            lon: 121.191798,
            type: "Pre-1999 Soft Storey (Earth Sciences / Physics)",
          },
          {
            id: "FAC_NCU_ENG_B5",
            name: "Engineering Building 5 (E6)",
            nameZh: "工程五館 (工學院 / 資電學院)",
            lat: 24.967028,
            lon: 121.187380,
            type: "Post-1999 RC Frame",
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
        ];

        ncuBuildings.forEach((b) => {
          const bIcon = L.divIcon({
            className: `custom-building-pin-${b.id}`,
            html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer">
              <div style="height:14px;width:14px;border-radius:9999px;background:#38bdf8;border:2px solid #ffffff;box-shadow:0 0 10px #38bdf8;transition:transform 0.2s" class="hover:scale-125"></div>
            </div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          L.marker([b.lat, b.lon], { icon: bIcon })
            .bindPopup(
              `<div style="font-family:sans-serif;color:#f8fafc;background:#0f172a;padding:10px 12px;font-size:11px;border-radius:8px;min-width:220px;border:1px solid #1e293b;box-shadow:0 8px 24px rgba(0,0,0,0.85)">
                <strong style="color:#38bdf8;font-size:13px">${b.name}</strong><br/>
                <b style="color:#cbd5e1">${b.nameZh}</b><br/>
                Type: <b>${b.type}</b><br/>
                GPS: <code>${b.lat.toFixed(5)}, ${b.lon.toFixed(5)}</code>
              </div>`,
              { maxWidth: 280 }
            )
            .addTo(markersLayer);
        });

        // Render Active Epicenter
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
                Magnitude: <b>ML ${scenario.magnitude}</b> | Depth: <b>${scenario.depth_km} km</b><br/>
                Coordinates: <code style="color:#38bdf8">${epiLat.toFixed(4)}°N, ${epiLon.toFixed(4)}°E</code><br/>
                Distance to NCU: <b style="color:#fcd34d">${scenario.distance_to_target_km || 19.8} km</b>
              </div>`,
              { maxWidth: 280 }
            )
            .addTo(markersLayer);

          // Propagation Path Ray to NCU
          if (staticWavefrontsLayer) {
            staticWavefrontsLayer.clearLayers();
            const ray = L.polyline([[epiLat, epiLon], [24.9688, 121.1918]], {
              color: "#f59e0b",
              weight: 2.0,
              dashArray: "6, 6",
              opacity: 0.85,
            });
            ray.bindPopup(
              `<div style="font-family:monospace;font-size:11px;background:#0f172a;color:#fcd34d;padding:8px 12px;border:1px solid #f59e0b;border-radius:6px">
                <strong>Propagation Ray: Epicenter → NCU Campus</strong><br/>
                Direct Epicentral Distance: <b>${scenario.distance_to_target_km || 19.8} km</b><br/>
                P-wave Arrival @ NCU: <b>${scenario.id.includes("20122") ? "6.85s" : "8.16s"}</b><br/>
                S-wave Arrival @ NCU: <b>${scenario.id.includes("20122") ? "12.45s" : "14.85s"}</b><br/>
                Warning Lead Time: <b>${scenario.id.includes("20122") ? "+5.60s" : "+6.69s"}</b>
              </div>`
            );
            ray.addTo(staticWavefrontsLayer);
          }
        }
      }

      // Initialize ALL Station Markers for Active Scenario
      if (stationsLayer && scenario) {
        stationsLayer.clearLayers();
        stationMarkersRef.current = {};

        const stations = getActiveStations();
        stations.forEach((st) => {
          const initialHtml = createStationIconHtml(st, false, false);
          const icon = L.divIcon({
            className: `sta-marker-${st.code}`,
            html: initialHtml,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });

          const marker = L.marker([st.lat, st.lon], { icon }).addTo(stationsLayer);

          const cwa = getCwaLevelInfo(st.cwaIntensity);
          marker.bindPopup(
            `<div style="font-family:sans-serif;color:#f8fafc;background:#0f172a;padding:10px 12px;font-size:11px;border-radius:8px;border:1px solid ${cwa.color};box-shadow:0 8px 24px rgba(0,0,0,0.85)">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <strong style="color:${cwa.color};font-size:13px">Station ${st.code}</strong>
                <span style="background:${cwa.color};color:${cwa.textColor};font-size:9px;font-weight:bold;padding:1px 5px;border-radius:3px">
                  CWA ${cwa.level} (${cwa.nameZh})
                </span>
              </div>
              <b style="color:#e2e8f0">${st.name}</b><br/>
              P-Wave Pick Time: <b style="color:#38bdf8">${st.pPickSec}s</b><br/>
              Peak Acceleration (PGA): <b style="color:#f59e0b">${st.pgaGal.toFixed(1)} Gal</b><br/>
              Distance to Epicenter: <b>${st.distEpi} km</b> | To NCU: <b>${st.distNcu} km</b><br/>
              GPS: <code style="color:#38bdf8">${st.lat.toFixed(4)}°N, ${st.lon.toFixed(4)}°E</code>
              ${st.isCampus ? '<br/><span style="color:#fcd34d;font-weight:bold">★ Located directly on NCU Campus</span>' : ''}
            </div>`,
            { maxWidth: 280 }
          );

          stationMarkersRef.current[st.code] = {
            marker,
            station: st,
            lastTriggered: false,
          };
        });

        // Frame all stations on load
        if (stations.length > 0) {
          const points: [number, number][] = [
            [scenario.epicenter.lat, scenario.epicenter.lon],
            [24.9688, 121.1918],
          ];
          stations.forEach((s) => points.push([s.lat, s.lon]));
          const bounds = L.latLngBounds(points);
          map.fitBounds(bounds, { padding: [35, 35], maxZoom: 12 });
        }
      }

      // Initialize Dynamic Wavefront Expanding Circles
      if (dynamicWavefrontsLayer && scenario) {
        dynamicWavefrontsLayer.clearLayers();

        const epiLat = scenario.epicenter.lat;
        const epiLon = scenario.epicenter.lon;

        // P-Wave circle (Compressional, calibrated surface velocity)
        pWaveCircleRef.current = L.circle([epiLat, epiLon], {
          radius: 1,
          color: "#06b6d4",
          weight: 2.2,
          opacity: 0,
          fillColor: "#0891b2",
          fillOpacity: 0,
          dashArray: "4, 4",
        }).addTo(dynamicWavefrontsLayer);

        // S-Wave circle (Shear / Damaging, calibrated shear velocity)
        sWaveCircleRef.current = L.circle([epiLat, epiLon], {
          radius: 1,
          color: "#f59e0b",
          weight: 2.8,
          opacity: 0,
          fillColor: "#f59e0b",
          fillOpacity: 0,
        }).addTo(dynamicWavefrontsLayer);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [faults, scenario, selectedFaultId, isSimulating]);

  // PHYSICAL PROPAGATING WAVEFRONT RADIUS & STATION SYNCHRONIZATION
  // Matches exact arrival times of recording stations based on 3D spherical wavefront surface projection!
  useEffect(() => {
    if (!mapInstanceRef.current || !scenario) return;

    import("leaflet").then((L) => {
      const is20122 = scenario.id.includes("20122");
      const is20883 = scenario.id.includes("20883");

      // Calibrated Seismological Parameters:
      // In TSMIP accelerograms, t=0 starts at the pre-event recording buffer.
      // Rupture origin time in recording t0:
      const t0 = is20122 ? 2.825 : is20883 ? 2.822 : 3.5;
      const vp = is20122 ? 5860 : is20883 ? 5000 : 5800; // m/s (P-wave crustal velocity)
      const vs = is20122 ? 3380 : is20883 ? 2900 : 3350; // m/s (S-wave crustal velocity)
      const depthM = (scenario.depth_km || (is20122 ? 12.0 : 10.22)) * 1000;

      // Surface breakout times (when wave breaks through surface at epicenter above focal depth):
      const tSurfBreakP = t0 + depthM / vp; // ~4.87s for EQ 20122
      const tSurfBreakS = t0 + depthM / vs; // ~6.37s for EQ 20122

      // 1. Calculate P-Wave horizontal surface radius:
      let pRadiusMeters = 0;
      if (simTimeSec >= tSurfBreakP) {
        const hypoDistP = vp * (simTimeSec - t0);
        pRadiusMeters = Math.sqrt(Math.max(0, hypoDistP * hypoDistP - depthM * depthM));
      }

      // 2. Calculate S-Wave horizontal surface radius:
      let sRadiusMeters = 0;
      if (simTimeSec >= tSurfBreakS) {
        const hypoDistS = vs * (simTimeSec - t0);
        sRadiusMeters = Math.sqrt(Math.max(0, hypoDistS * hypoDistS - depthM * depthM));
      }

      if (pWaveCircleRef.current) {
        pWaveCircleRef.current.setRadius(Math.max(1, pRadiusMeters));
        pWaveCircleRef.current.setStyle({
          opacity: pRadiusMeters > 10 ? 0.85 : 0,
          fillOpacity: pRadiusMeters > 10 ? 0.08 : 0,
        });
      }

      if (sWaveCircleRef.current) {
        sWaveCircleRef.current.setRadius(Math.max(1, sRadiusMeters));
        sWaveCircleRef.current.setStyle({
          opacity: sRadiusMeters > 10 ? 0.95 : 0,
          fillOpacity: sRadiusMeters > 10 ? 0.12 : 0,
        });
      }

      // 3. Update each station marker dynamically at its exact p_pick_sec
      Object.values(stationMarkersRef.current).forEach((item) => {
        const { marker, station, lastTriggered } = item;
        const isTriggered = simTimeSec >= station.pPickSec;
        const isNewlyDetected = isTriggered && simTimeSec - station.pPickSec <= 2.2;

        if (isTriggered !== lastTriggered || isNewlyDetected) {
          item.lastTriggered = isTriggered;
          const newHtml = createStationIconHtml(station, isTriggered, isNewlyDetected);
          const icon = L.divIcon({
            className: `sta-marker-${station.code}`,
            html: newHtml,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
          marker.setIcon(icon);
        }
      });
    });
  }, [simTimeSec, scenario]);

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

  const flyToNCU = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([24.9688, 121.1918], 15, { duration: 1.2 });
  };

  const flyToAllTaiwan = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([24.1, 121.0], 7.8, { duration: 1.2 });
  };

  const fitAllStationsBounds = () => {
    if (!mapInstanceRef.current || !scenario) return;
    const map = mapInstanceRef.current;
    import("leaflet").then((L) => {
      const stations = getActiveStations();
      const points: [number, number][] = [
        [scenario.epicenter.lat, scenario.epicenter.lon],
        [24.9688, 121.1918],
      ];
      stations.forEach((s) => points.push([s.lat, s.lon]));
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate_obsidian-900 rounded-xl relative">
      {/* Dedicated Card Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate_obsidian-card px-3 py-2 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <MapIcon className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            NCU Campus & Wavefront GIS
          </h3>
          <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300 border border-cyan-500/25">
            {activeStations.length} Stations
          </span>
        </div>

        {/* Quick Navigation Controls */}
        <div className="flex items-center space-x-1">
          {scenario && (
            <button
              onClick={fitAllStationsBounds}
              className="flex items-center space-x-1 rounded bg-amber-500/15 hover:bg-amber-500/25 px-2 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30 transition shadow-sm"
              title="Fit View to All Recording Stations"
            >
              <Maximize2 className="h-3 w-3 text-amber-400" />
              <span>Fit All Stations</span>
            </button>
          )}

          <button
            onClick={flyToNCU}
            className="flex items-center space-x-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 px-2 py-1 text-[10px] font-bold text-cyan-300 border border-cyan-500/30 transition shadow-sm"
            title="Focus Camera on NCU Campus"
          >
            <Crosshair className="h-3 w-3 text-cyan-400" />
            <span>NCU</span>
          </button>

          <button
            onClick={flyToAllTaiwan}
            className="flex items-center space-x-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-300 border border-slate-700 transition"
            title="View Entire Island Faults"
          >
            <Globe className="h-3 w-3 text-slate-400" />
            <span className="hidden md:inline">Taiwan</span>
          </button>

          {onSwitchTo3D && (
            <button
              onClick={onSwitchTo3D}
              className="flex items-center space-x-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 text-[10px] font-bold border border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)] transition ml-1"
              title="Open NCU 3D Campus Digital Twin"
            >
              <Box className="h-3 w-3" />
              <span>3D Twin</span>
            </button>
          )}

          {/* Basemap Switcher */}
          <div className="flex items-center space-x-0.5 rounded-lg border border-slate-800 bg-slate-900/80 p-0.5 ml-1">
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
              onClick={() => handleSwitchBasemap("carto_dark")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                activeBasemap === "carto_dark"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Carto
            </button>
            <button
              onClick={() => handleSwitchBasemap("satellite")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                activeBasemap === "satellite"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sat
            </button>
          </div>
        </div>
      </div>

      {/* Map DOM Mount Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Floating CWA Intensity Scale Colorbar on Map */}
        {showColorbar && (
          <div className="absolute top-3 left-3 z-[1000] pointer-events-auto max-w-[280px] sm:max-w-[320px]">
            <CwaIntensityColorbar compact={true} />
          </div>
        )}

        {/* Real-time Propagation Phase Indicator */}
        <div className="absolute top-3 right-3 z-[1000] pointer-events-none">
          <div className="rounded-md border border-slate-800 bg-slate-950/90 px-2.5 py-1 text-[10px] font-mono backdrop-blur-md text-slate-300 flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                simTimeSec < 4.87
                  ? "bg-amber-400 animate-ping"
                  : simTimeSec < 6.85
                  ? "bg-cyan-400 animate-pulse"
                  : "bg-emerald-400"
              }`}
            />
            <span>
              {simTimeSec < 4.87
                ? "Focal Nucleation (12 km depth)"
                : simTimeSec < 6.85
                ? "P-Wave Surface Expanding"
                : "P-Wave Reached Campus"}
            </span>
          </div>
        </div>

        {/* Floating Collapsible Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto rounded-lg border border-slate-800 bg-slate_obsidian-card/95 p-2 text-[11px] backdrop-blur-md shadow-xl text-slate-300 max-w-[280px]">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
          >
            <div className="font-bold text-slate-100 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
              <Info className="h-3 w-3 text-cyan-400" />
              <span>Map & Wavefront Legend</span>
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
                <span className="text-cyan-300 font-medium">NCU Facilities (Monitored)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400 font-bold">▲</span>
                <span className="text-slate-200">TSMIP Strong-Motion Station ({activeStations.length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-cyan-400 rounded"></span>
                <span className="text-cyan-300">P-Wavefront (Spherical Projection)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-1 w-4 bg-amber-500 rounded"></span>
                <span className="text-amber-300">S-Wavefront (Damaging Shear)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
