"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ControlHeader } from "@/components/mission-control/control-header";
import { AlertBanner } from "@/components/mission-control/alert-banner";
import { DigitalTwins } from "@/components/mission-control/digital-twins";
import { ScadaPanel } from "@/components/mission-control/scada-panel";
import { GmpeCurve } from "@/components/mission-control/gmpe-curve";
import { GraphPreview } from "@/components/mission-control/graph-preview";
import { CopilotDrawer } from "@/components/mission-control/copilot-drawer";
import { Scenario, FaultTrace } from "@/types/triage";

// Dynamic import for Leaflet GIS Map with SSR turned off
const GisMap = dynamic(
  () =>
    import("@/components/mission-control/gis-map").then((mod) => mod.GisMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-black-500 text-prussian_blue-800 text-xs">
        Initializing Taiwan Fault GIS Basemap...
      </div>
    ),
  }
);

export default function MissionControlPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [faults, setFaults] = useState<FaultTrace[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Load scenarios from FastAPI
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/triage/scenarios")
      .then((res) => res.json())
      .then((data) => {
        if (data.scenarios && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
          setSelectedScenario(data.scenarios[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch scenarios, using defaults", err);
        const fallback: Scenario[] = [
          {
            id: "SCENARIO_SHUANGLIENPO_HUKOU",
            title: "Shuanglienpo - Hukou Multi-Fault Rupture",
            fault_name: "Shuanglienpo Fault (#2) + Hukou (#3)",
            magnitude: 6.91,
            depth_km: 10.0,
            epicenter: { lat: 24.96, lon: 121.18 },
            target_facility: "NCU Science Building 4",
            distance_to_target_km: 2.8,
            predicted_pgv_cm_s: 72.4,
            estimated_cwa_intensity: "6-Strong",
            s_wave_countdown_sec: 7.2,
            track_a_actuators: [
              {
                target: "ELEVATORS_ALL_CAMPUS",
                action: "HALT_AT_NEAREST_FLOOR_DOORS_OPEN",
                urgency: "INSTANT_SUB_5MS",
              },
              {
                target: "MAIN_NATURAL_GAS_VALVE",
                action: "PNEUMATIC_EMERGENCY_SHUTOFF",
                urgency: "INSTANT_SUB_5MS",
              },
              {
                target: "CLEANROOM_TOXIC_VENTILATION",
                action: "HALT_CORROSIVE_GAS_DAMPER_CLOSED",
                urgency: "INSTANT_SUB_5MS",
              },
            ],
            gmpe_validation: {
              status: "CONSISTENT_WITH_PHYSICS",
              theoretical_median_pgv: 68.2,
              z_score: 0.42,
              within_confidence_bounds: true,
            },
          },
          {
            id: "SCENARIO_MEISHAN_M72",
            title: "Meishan Fault Strike-Slip Rupture",
            fault_name: "Meishan Active Fault (#16)",
            magnitude: 7.15,
            depth_km: 12.5,
            epicenter: { lat: 23.57, lon: 120.55 },
            target_facility: "Chia-Yi SciPark Cluster",
            distance_to_target_km: 8.4,
            predicted_pgv_cm_s: 58.1,
            estimated_cwa_intensity: "6-Weak",
            s_wave_countdown_sec: 14.8,
            track_a_actuators: [
              {
                target: "HIGH_SPEED_RAIL_GRID",
                action: "FEEDER_CIRCUIT_BREAKER_TRIP",
                urgency: "INSTANT_SUB_5MS",
              },
            ],
            gmpe_validation: {
              status: "CONSISTENT_WITH_PHYSICS",
              theoretical_median_pgv: 52.4,
              z_score: 0.61,
              within_confidence_bounds: true,
            },
          },
        ];
        setScenarios(fallback);
        setSelectedScenario(fallback[0]);
      });
  }, []);

  // Load 38 Fault Traces
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/triage/faults")
      .then((res) => res.json())
      .then((data) => {
        if (data.faults) {
          setFaults(data.faults);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch faults, using demo coordinates", err);
        const demoFaults: FaultTrace[] = [
          {
            fault_id: 2,
            name: "Shuanglienpo Fault",
            fault_type: "Reverse",
            mw_max: 6.5,
            slip_rate_mm_yr: 1.5,
            dip_deg: 45,
            coordinates: [
              [24.95, 121.15],
              [24.97, 121.20],
              [24.99, 121.25],
            ],
          },
          {
            fault_id: 3,
            name: "Hukou Fault",
            fault_type: "Thrust / Reverse",
            mw_max: 6.8,
            slip_rate_mm_yr: 2.1,
            dip_deg: 40,
            coordinates: [
              [24.88, 121.05],
              [24.92, 121.12],
              [24.96, 121.18],
            ],
          },
          {
            fault_id: 1,
            name: "Shanchiao Fault",
            fault_type: "Normal",
            mw_max: 7.1,
            slip_rate_mm_yr: 3.2,
            dip_deg: 60,
            coordinates: [
              [25.02, 121.45],
              [25.08, 121.50],
              [25.15, 121.55],
            ],
          },
        ];
        setFaults(demoFaults);
      });
  }, []);

  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 12000);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black-500 text-alabaster_grey-500 antialiased font-sans">
      {/* 1. Sticky Control Header (z-[1200]) */}
      <ControlHeader
        scenarios={scenarios}
        selectedScenario={selectedScenario}
        onSelectScenario={(s) => setSelectedScenario(s)}
        onTriggerSimulation={handleTriggerSimulation}
        isSimulating={isSimulating}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        isCopilotOpen={isCopilotOpen}
        onOpenDocs={() => alert("TEM PSHA2025 Physical Hazard Reference: Lin & Lee (2008) Logic Trees.")}
      />

      {/* 2. Alert Banner with S-Wave Countdown Clock (z-[1100]) */}
      <AlertBanner scenario={selectedScenario} isSimulating={isSimulating} />

      {/* 3. Main Mission Control Operational Dashboard */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-black-500">
        {/* Top Split: Left = GIS Leaflet Map, Right = Physics GMPE & GeoGraph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* GIS Map Panel (Cleanly separated header, zero menu overlap) */}
          <div className="lg:col-span-7 h-[440px] rounded-xl border border-prussian_blue-600/40 overflow-hidden shadow-2xl bg-black-500 relative isolate z-0">
            <GisMap
              faults={faults}
              scenario={selectedScenario}
              selectedFaultId={2}
              onSelectFault={(f) => alert(`Selected Fault: #${f.fault_id} ${f.name}`)}
            />
          </div>

          {/* Right Column: GMPE Curve & Cascading GeoGraph */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <GmpeCurve
              magnitude={selectedScenario?.magnitude || 6.91}
              observedPgv={selectedScenario?.predicted_pgv_cm_s || 72.4}
              observedDistanceKm={selectedScenario?.distance_to_target_km || 2.8}
            />
            <GraphPreview
              primaryFaultName={selectedScenario?.fault_name || "Shuanglienpo Fault (#2)"}
            />
          </div>
        </div>

        {/* Middle Section: Track A Reflex Automated SCADA Interlocks */}
        <ScadaPanel
          actuators={selectedScenario?.track_a_actuators}
          triggerStatus="HALTED_SUB_5MS_VERIFIED"
          latencyMs={1.84}
        />

        {/* Bottom Section: Campus Digital Twins & Structural Drift Gauges */}
        <DigitalTwins facilities={[]} />
      </main>

      {/* Slide-over Copilot Drawer (z-[1300]) */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />
    </div>
  );
}
