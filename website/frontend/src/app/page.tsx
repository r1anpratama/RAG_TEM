"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KpiMetrics } from "@/components/dashboard/kpi-metrics";
import { RagArchitectureView } from "@/components/dashboard/rag-architecture-view";
import { EEWSView } from "@/components/dashboard/eews-view";
import { PSHAView } from "@/components/dashboard/psha-view";
import { CopilotView } from "@/components/dashboard/copilot-view";
import { Scenario, FaultTrace } from "@/types/triage";

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "rag_arch" | "eews" | "psha" | "copilot") || "rag_arch";

  const [activeTab, setActiveTab] = useState<"rag_arch" | "eews" | "psha" | "copilot">(initialTab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [faults, setFaults] = useState<FaultTrace[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<boolean>(true);

  // Sync with URL query parameter changes
  useEffect(() => {
    const tab = searchParams.get("tab") as "rag_arch" | "eews" | "psha" | "copilot";
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Load scenarios from FastAPI backend
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/triage/scenarios")
      .then((res) => res.json())
      .then((data) => {
        if (data.scenarios && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
          setSelectedScenario(data.scenarios[0]);
          setBackendHealth(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load scenarios from FastAPI backend", err);
        setBackendHealth(false);
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
        if (data.faults) setFaults(data.faults);
      })
      .catch(() => {
        setFaults([
          {
            fault_id: 2,
            name: "Shuanglienpo Fault",
            fault_type: "Reverse",
            mw_max: 6.5,
            slip_rate_mm_yr: 1.5,
            dip_deg: 45,
            coordinates: [[24.95, 121.15], [24.97, 121.20], [24.99, 121.25]],
          },
          {
            fault_id: 3,
            name: "Hukou Fault",
            fault_type: "Thrust / Reverse",
            mw_max: 6.8,
            slip_rate_mm_yr: 2.1,
            dip_deg: 40,
            coordinates: [[24.88, 121.05], [24.92, 121.12], [24.96, 121.18]],
          },
        ]);
      });
  }, []);

  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 12000);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "rag_arch":
        return "1. RAG Architecture Blueprint";
      case "eews":
        return "2. Real-Time EEWS & Wavefronts";
      case "psha":
        return "3. TEM PSHA Hazard Evaluation";
      case "copilot":
        return "4. AI Geotechnical Copilot";
      default:
        return "RAG Dashboard";
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* TailwindAdmin Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        selectedScenario={selectedScenario}
      />

      {/* Main Content Shell */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        {/* Sticky Header Bar */}
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeTabLabel={getTabTitle()}
          scenarios={scenarios}
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
          onTriggerSimulation={handleTriggerSimulation}
          isSimulating={isSimulating}
          backendHealth={backendHealth}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* Top 4 KPI Summary Metric Cards */}
          <KpiMetrics scenario={selectedScenario} />

          {/* Active Visualization Tab View */}
          {activeTab === "rag_arch" && <RagArchitectureView />}
          {activeTab === "eews" && (
            <EEWSView
              scenario={selectedScenario}
              faults={faults}
              isSimulating={isSimulating}
            />
          )}
          {activeTab === "psha" && (
            <PSHAView
              scenario={selectedScenario}
              faults={faults}
            />
          )}
          {activeTab === "copilot" && <CopilotView />}
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#0b0f19] text-cyan-600 dark:text-cyan-400 text-xs font-mono">
          Loading SeismoAgent-TW TailwindAdmin...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
