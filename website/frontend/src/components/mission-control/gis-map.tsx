"use client";

import React, { useEffect, useRef } from "react";
import { FaultTrace, Scenario } from "@/types/triage";

interface GisMapProps {
  faults: FaultTrace[];
  scenario: Scenario | null;
  selectedFaultId?: number | null;
  onSelectFault?: (fault: FaultTrace) => void;
}

export const GisMap: React.FC<GisMapProps> = ({
  faults,
  scenario,
  selectedFaultId,
  onSelectFault,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{
    faultsLayer?: any;
    markersLayer?: any;
    wavefrontsLayer?: any;
  }>({});

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

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        layersRef.current.faultsLayer = L.layerGroup().addTo(map);
        layersRef.current.markersLayer = L.layerGroup().addTo(map);
        layersRef.current.wavefrontsLayer = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const { faultsLayer, markersLayer, wavefrontsLayer } = layersRef.current;

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
            ? "#ef4444"
            : isNormal
            ? "#f59e0b"
            : "#a855f7";

          const polyline = L.polyline(f.coordinates, {
            color,
            weight: isSelected ? 4 : 2.5,
            opacity: isSelected ? 1.0 : 0.8,
            dashArray: isNormal ? "5, 5" : undefined,
          });

          polyline.bindTooltip(
            `<strong>#${f.fault_id} ${f.name}</strong><br/>Type: ${f.fault_type} | Mw Max: ${f.mw_max}<br/>Slip Rate: ${f.slip_rate_mm_yr} mm/yr | Dip: ${f.dip_deg}°`,
            { sticky: true, className: "bg-zinc-900 text-zinc-100 text-xs border border-zinc-700 rounded p-1" }
          );

          polyline.on("click", () => {
            if (onSelectFault) onSelectFault(f);
          });

          polyline.addTo(faultsLayer);
        });
      }

      if (markersLayer) {
        markersLayer.clearLayers();

        const ncuLat = 24.968;
        const ncuLon = 121.194;

        const ncuIcon = L.divIcon({
          className: "custom-ncu-marker",
          html: `<div style="position:relative;display:flex;align-items:center;justify-content:center"><div style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(16,185,129,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div><div style="height:16px;width:16px;border-radius:9999px;background:#10b981;border:2px solid #09090b"></div><div style="position:absolute;left:20px;top:0;white-space:nowrap;border-radius:4px;background:rgba(24,24,27,0.9);padding:2px 6px;font-size:10px;font-weight:bold;color:#34d399;border:1px solid rgba(16,185,129,0.4)">NCU Campus Core</div></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([ncuLat, ncuLon], { icon: ncuIcon })
          .bindPopup(
            `<div class="p-1 text-xs text-zinc-900"><strong class="text-emerald-700">NCU Campus & E-DREaM Lab</strong><br/>Target Monitoring Facility (Taoyuan)<br/>Lat: ${ncuLat}, Lon: ${ncuLon}</div>`
          )
          .addTo(markersLayer);

        if (scenario) {
          const epiLat = scenario.epicenter.lat;
          const epiLon = scenario.epicenter.lon;

          const epiIcon = L.divIcon({
            className: "custom-epi-marker",
            html: `<div style="position:relative;display:flex;align-items:center;justify-content:center"><div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(239,68,68,0.4);animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite"></div><div style="height:20px;width:20px;border-radius:9999px;background:#dc2626;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold">★</div><div style="position:absolute;left:24px;top:-4px;white-space:nowrap;border-radius:4px;background:rgba(69,10,10,0.9);padding:2px 8px;font-size:10px;font-weight:bold;color:#fca5a5;border:1px solid rgba(239,68,68,0.5)">Epicenter Mw ${scenario.magnitude}</div></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          L.marker([epiLat, epiLon], { icon: epiIcon })
            .bindPopup(
              `<div class="p-1 text-xs text-zinc-900"><strong class="text-red-700">Hypocenter: ${scenario.title}</strong><br/>Magnitude: Mw ${scenario.magnitude} | Depth: ${scenario.depth_km} km<br/>Target NCU PGV: ${scenario.predicted_pgv_cm_s} cm/s</div>`
            )
            .addTo(markersLayer);

          if (wavefrontsLayer) {
            wavefrontsLayer.clearLayers();

            L.circle([epiLat, epiLon], {
              radius: 45000,
              color: "#38bdf8",
              weight: 1.5,
              opacity: 0.7,
              fillColor: "#38bdf8",
              fillOpacity: 0.05,
              dashArray: "4, 4",
            }).addTo(wavefrontsLayer);

            L.circle([epiLat, epiLon], {
              radius: 25000,
              color: "#ef4444",
              weight: 2,
              opacity: 0.85,
              fillColor: "#ef4444",
              fillOpacity: 0.1,
            }).addTo(wavefrontsLayer);
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [faults, scenario, selectedFaultId]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      <div ref={mapContainerRef} className="h-full w-full" />

      <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-zinc-800 bg-zinc-950/85 p-3 text-[11px] backdrop-blur-md shadow-xl">
        <div className="font-semibold text-zinc-200 mb-1.5 uppercase tracking-wider">
          Taiwan Seismogenic Structures (38)
        </div>
        <div className="space-y-1 text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className="h-0.5 w-4 bg-red-500 rounded"></span>
            <span>Reverse / Thrust Faults (e.g. Chelungpu)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-0.5 w-4 bg-amber-500 rounded border-b border-dashed border-amber-500"></span>
            <span>Normal Faults (e.g. Shanchiao)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-0.5 w-4 bg-purple-500 rounded"></span>
            <span>Strike-Slip Faults (e.g. Meishan)</span>
          </div>
          <div className="flex items-center space-x-2 pt-1 border-t border-zinc-800/80">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span>NCU Digital Twin Campus Target</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>
            <span>Active Scenario Epicenter & P/S Waves</span>
          </div>
        </div>
      </div>
    </div>
  );
};
