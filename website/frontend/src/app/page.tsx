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
import { UploadModal } from "@/components/upload/upload-modal";
import { Scenario, FaultTrace, TriageDispatchResponse } from "@/types/triage";

const GisMap = dynamic(
  () =>
    import("@/components/mission-control/gis-map").then((mod) => mod.GisMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-ink_black-500 text-stormy_teal-800 text-xs">
        Loading 100% Free GIS Spatial Fault Traces...
      </div>
    ),
  }
);

export default function MissionControlPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("shuanglienpo_hukou_mw69");
  const [faults, setFaults] = useState<FaultTrace[]>([]);
  const [selectedFaultId, setSelectedFaultId] = useState<number | null>(null);
  const [dispatch, setDispatch] = useState<TriageDispatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [triggerTime, setTriggerTime] = useState<number | null>(Date.now());
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/scenarios")
      .then((res) => res.json())
      .then((data) => {
        setScenarios(data);
        if (data.length > 0 && !selectedScenarioId) {
          setSelectedScenarioId(data[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load scenarios:", err);
        setScenarios([
          {
            id: "shuanglienpo_hukou_mw69",
            title: "Shuanglienpo-Hukou Multi-Fault (Mw 6.91)",
            description: "Near-source shallow crustal rupture 2.8 km from NCU campus.",
            magnitude: 6.91,
            depth_km: 8.0,
            epicenter: { lat: 24.945, lon: 121.185 },
            predicted_pgv_cm_s: 72.4,
            target_facility: "NCU Campus & Taoyuan Corridor",
            countdown_seconds: 3.8,
          },
        ]);
      });
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/faults")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.faults) {
          setFaults(data.faults);
        }
      })
      .catch((err) => console.error("Failed to load faults:", err));
  }, []);

  const currentScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0] || null;

  const handleTriggerSimulation = async () => {
    if (!currentScenario) return;
    setIsLoading(true);

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: `SIM-${Date.now()}`,
          elapsed_seconds: 8.0,
          magnitude: currentScenario.magnitude,
          depth_km: currentScenario.depth_km,
          epicenter_lat: currentScenario.epicenter.lat,
          epicenter_lon: currentScenario.epicenter.lon,
          predicted_pgv_nc_cm_s: currentScenario.predicted_pgv_cm_s,
          is_preliminary: true,
        }),
      });

      if (resp.ok) {
        const data: TriageDispatchResponse = await resp.json();
        setDispatch(data);
        setTriggerTime(Date.now());
      }
    } catch (err) {
      console.error("Simulation dispatch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scenarios.length > 0 && !dispatch) {
      handleTriggerSimulation();
    }
  }, [scenarios]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink_black-500 text-papaya_whip-500 antialiased font-sans">
      {/* 1. Header Bar */}
      <ControlHeader
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={(id) => {
          setSelectedScenarioId(id);
          setTriggerTime(Date.now());
        }}
        onTriggerSimulation={handleTriggerSimulation}
        isLoading={isLoading}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        isCopilotOpen={isCopilotOpen}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* 2. Real-Time Emergency S-Wave Alert Banner */}
      <AlertBanner
        scenario={currentScenario}
        dispatch={dispatch}
        triggerTime={triggerTime}
      />

      {/* 3. Main Mission Control Operational Dashboard */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-ink_black-500">
        {/* Top Operational Section: GIS Map (Left 60%) + SCADA & GMPE/Graph (Right 40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Interactive Leaflet GIS Map with Free Basemap Switcher */}
          <div className="lg:col-span-7 h-[380px] rounded-xl border border-stormy_teal-400/40 overflow-hidden shadow-2xl bg-ink_black-500">
            <GisMap
              faults={faults}
              scenario={currentScenario}
              selectedFaultId={selectedFaultId}
              onSelectFault={(f) => setSelectedFaultId(f.fault_id)}
            />
          </div>

          {/* Right Operational Telemetry: SCADA + GMPE + GeoGraph */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <ScadaPanel
              actuators={dispatch?.track_a_reflex.actuators}
              triggerStatus={dispatch?.track_a_reflex.trigger_level}
              latencyMs={dispatch?.execution_summary.track_a_latency_ms}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <GmpeCurve
                magnitude={currentScenario?.magnitude}
                observedPgv={currentScenario?.predicted_pgv_cm_s}
                observedDistanceKm={2.8}
              />
              <GraphPreview
                cascades={dispatch?.track_b_deliberative.geotech.cascading_ruptures}
                primaryFaultName={dispatch?.track_b_deliberative.geotech.primary_fault_name}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: Campus Digital Twins & Structural Triage */}
        <DigitalTwins
          facilities={dispatch?.track_b_deliberative.facility_triage || []}
          isLoading={isLoading}
        />
      </main>

      {/* 4. Docked / Slide-over RAG Copilot Chatbot */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* 5. Knowledge Base Document Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
