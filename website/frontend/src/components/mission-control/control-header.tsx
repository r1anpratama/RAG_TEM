"use client";

import React from "react";
import { Activity, Play, Bot, FileText } from "lucide-react";
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
    <header className="sticky top-0 z-[1200] flex h-16 w-full items-center justify-between border-b border-prussian_blue-600/40 bg-black-500 px-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-prussian_blue-500/40 border border-prussian_blue-600 text-prussian_blue-800 shadow-sm">
          <Activity className="h-5 w-5 animate-pulse text-orange-500" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-wider text-white-500 uppercase">
              SeismoAgent-TW
            </h1>
            <span className="rounded bg-prussian_blue-600/40 px-1.5 py-0.5 text-[10px] font-bold text-prussian_blue-800 border border-prussian_blue-600/60">
              MISSION CONTROL v2.0
            </span>
          </div>
          <p className="text-[11px] text-prussian_blue-800">
            NCU Geophysics / E-DREaM Lab × NVIDIA AI Technology Center
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Scenario Selection Dropdown */}
        <div className="flex items-center space-x-2 bg-prussian_blue-400/40 border border-prussian_blue-600/40 rounded-lg p-1 relative z-20">
          <span className="text-xs text-prussian_blue-800 pl-2 font-medium">Scenario:</span>
          <select
            value={selectedScenario?.id || ""}
            onChange={(e) => {
              const sc = scenarios.find((s) => s.id === e.target.value);
              if (sc) onSelectScenario(sc);
            }}
            className="bg-black-500 text-xs text-alabaster_grey-500 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 border border-prussian_blue-600/50 cursor-pointer"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id} className="bg-black-500 text-alabaster_grey-500 py-1">
                {sc.title} (Mw {sc.magnitude})
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Simulation Button */}
        <button
          onClick={onTriggerSimulation}
          disabled={isSimulating}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-black-500 text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-md shadow-orange-500/30 border border-orange-400 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{isSimulating ? "Simulating..." : "Trigger Simulation"}</span>
        </button>

        {/* Docs Trigger */}
        <button
          onClick={onOpenDocs}
          className="flex items-center space-x-1.5 rounded-lg border border-prussian_blue-600/40 bg-prussian_blue-500/30 px-3 py-1.5 text-xs text-alabaster_grey-500 hover:bg-prussian_blue-600/40 hover:text-white-500 transition"
        >
          <FileText className="h-3.5 w-3.5 text-prussian_blue-800" />
          <span>Docs</span>
        </button>

        {/* Copilot Drawer Toggle */}
        <button
          onClick={onToggleCopilot}
          className={`flex items-center space-x-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
            isCopilotOpen
              ? "bg-prussian_blue-600/50 text-white-500 border-orange-500 shadow-sm"
              : "bg-prussian_blue-500/30 text-alabaster_grey-500 border-prussian_blue-600/40 hover:bg-prussian_blue-600/40 hover:text-white-500"
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-orange-500" />
          <span>AI Copilot</span>
          <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};
