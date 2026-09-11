"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Cpu, 
  Activity, 
  Map, 
  Bot, 
  Play
} from "lucide-react";
import { RagArchitectureView } from "@/components/dashboard/rag-architecture-view";
import { EEWSView } from "@/components/dashboard/eews-view";
import { PSHAView } from "@/components/dashboard/psha-view";
import { CopilotView } from "@/components/dashboard/copilot-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { Scenario, FaultTrace } from "@/types/triage";

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "rag_arch" | "eews" | "psha" | "copilot") || "rag_arch";

  const [activeTab, setActiveTab] = useState<"rag_arch" | "eews" | "psha" | "copilot">(initialTab);
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

  const tabs = [
    { id: "rag_arch", label: "1. RAG Architecture", icon: Cpu },
    { id: "eews", label: "2. Real-Time EEWS", icon: Activity },
    { id: "psha", label: "3. TEM PSHA Hazard", icon: Map },
    { id: "copilot", label: "4. AI Copilot", icon: Bot },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate_obsidian-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate_obsidian-900/90 px-4 sm:px-6 backdrop-blur-xl transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-black text-xs font-mono">
            NCU
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-black tracking-wide text-slate-900 dark:text-white uppercase">
                SeismoAgent-TW
              </h1>
              <span className="hidden sm:inline-block rounded bg-cyan-500/10 dark:bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 font-mono">
                RAG Dashboard
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              E-DREaM Lab (NCU Geophysics) × NVAITC
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Scenario Selector */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 pl-2 font-medium">Scenario:</span>
            <select
              value={selectedScenario?.id || ""}
              onChange={(e) => {
                const sc = scenarios.find((s) => s.id === e.target.value);
                if (sc) setSelectedScenario(sc);
              }}
              className="bg-white dark:bg-slate_obsidian-card text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-sm"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {sc.title} (Mw {sc.magnitude})
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Simulation Button */}
          <button
            onClick={handleTriggerSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-md shadow-amber-500/20 border border-amber-400/40 disabled:opacity-50"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{isSimulating ? "Simulating..." : "Trigger Wave"}</span>
          </button>

          {/* Backend Status Indicator */}
          <div className="flex items-center space-x-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 shadow-sm">
            <span className={`h-2 w-2 rounded-full ${backendHealth ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
            <span className="hidden md:inline">{backendHealth ? "FastAPI Online" : "Offline"}</span>
          </div>

          {/* Light / Dark Mode Toggle Button */}
          <ThemeToggle />
        </div>
      </header>

      {/* Segmented Navigation Tab Bar */}
      <div className="sticky top-16 z-40 flex w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate_obsidian-card/95 px-4 sm:px-6 backdrop-blur-md overflow-x-auto transition-colors duration-200">
        <div className="flex space-x-1 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? "bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-500/40 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
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
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate_obsidian-900 text-cyan-600 dark:text-cyan-400 text-xs font-mono">Loading SeismoAgent-TW Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
