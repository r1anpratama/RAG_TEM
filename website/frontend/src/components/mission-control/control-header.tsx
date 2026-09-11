"use client";

import React from "react";
import { Activity, Play, Bot, FileText, Compass } from "lucide-react";
import { Scenario } from "@/types/triage";

interface ControlHeaderProps {
  scenarios: Scenario[];
  selectedScenario: Scenario | null;
  onSelectScenario: (scenario: Scenario) => void;
  onTriggerSimulation: () => void;
  isSimulating: boolean;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
  onOpenDocs: () => void;
}

export const ControlHeader: React.FC<ControlHeaderProps> = ({
  scenarios,
  selectedScenario,
  onSelectScenario,
  onTriggerSimulation,
  isSimulating,
  onToggleCopilot,
  isCopilotOpen,
  onOpenDocs,
}) => {
  return (
    <header className="sticky top-0 z-[1200] flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate_obsidian-900/90 px-4 backdrop-blur-xl shadow-xl">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-500/10">
          <Activity className="h-5 w-5 animate-pulse text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              Prototype
            </h1>
            <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30 tracking-wide">
              MISSION CONTROL v2.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            NCU Geophysics / E-DREaM Lab × NVIDIA AI Technology Center
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Scenario Selection Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg p-1 relative z-20">
          <span className="text-xs text-slate-400 pl-2 font-medium flex items-center space-x-1">
            <Compass className="h-3 w-3 text-cyan-400" />
            <span>Scenario:</span>
          </span>
          <select
            value={selectedScenario?.id || ""}
            onChange={(e) => {
              const sc = scenarios.find((s) => s.id === e.target.value);
              if (sc) onSelectScenario(sc);
            }}
            className="bg-slate_obsidian-card text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id} className="bg-slate-900 text-slate-200 py-1">
                {sc.title} (Mw {sc.magnitude})
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Simulation Button */}
        <button
          onClick={onTriggerSimulation}
          disabled={isSimulating}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 border border-amber-400/40 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{isSimulating ? "Simulating Waves..." : "Trigger Simulation"}</span>
        </button>

        {/* Docs Trigger */}
        <button
          onClick={onOpenDocs}
          className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
        >
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span>Docs</span>
        </button>

        {/* Copilot Drawer Toggle */}
        <button
          onClick={onToggleCopilot}
          className={`flex items-center space-x-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
            isCopilotOpen
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10"
              : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-cyan-400" />
          <span>AI Copilot</span>
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};
