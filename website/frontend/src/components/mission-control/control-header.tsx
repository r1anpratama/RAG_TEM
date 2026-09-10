"use client";

import React from "react";
import { Activity, Play, Bot, FileText, RefreshCw } from "lucide-react";
import { Scenario } from "@/types/triage";

interface ControlHeaderProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onTriggerSimulation: () => void;
  isLoading: boolean;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
  onOpenUpload: () => void;
}

export const ControlHeader: React.FC<ControlHeaderProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onTriggerSimulation,
  isLoading,
  onToggleCopilot,
  isCopilotOpen,
  onOpenUpload,
}) => {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md z-30">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Activity className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">
              SeismoAgent-TW
            </h1>
            <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/40">
              MISSION CONTROL
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            NCU E-DREaM Lab • TEM PSHA2025 Multi-Agent Seismic Triage
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <span className="text-xs text-zinc-400 pl-2">Scenario:</span>
          <select
            value={selectedScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            disabled={isLoading}
            className="bg-zinc-800 text-xs text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-zinc-700"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title} (Mw {sc.magnitude})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onTriggerSimulation}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-lg shadow-red-950/40 border border-red-400/30 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          <span>{isLoading ? "CALCULATING..." : "SIMULATE DISPATCH"}</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          title="Upload Domain Document"
        >
          <FileText className="h-3.5 w-3.5 text-zinc-400" />
          <span>Docs</span>
        </button>

        <button
          onClick={onToggleCopilot}
          className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
            isCopilotOpen
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
              : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-emerald-400" />
          <span>AI Copilot</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
        </button>
      </div>
    </header>
  );
};
