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
    <header className="flex h-16 w-full items-center justify-between border-b border-stormy_teal-400/30 bg-ink_black-500 px-4 backdrop-blur-md z-30">
      {/* Brand & Lab Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stormy_teal-500/20 border border-stormy_teal-500/40 text-stormy_teal-700 shadow-sm">
          <Activity className="h-5 w-5 animate-pulse text-stormy_teal-700" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-wider text-papaya_whip-500 uppercase">
              SeismoAgent-TW
            </h1>
            <span className="rounded bg-stormy_teal-500/30 px-1.5 py-0.5 text-[10px] font-bold text-stormy_teal-800 border border-stormy_teal-500/50">
              MISSION CONTROL
            </span>
          </div>
          <p className="text-[11px] text-stormy_teal-800">
            NCU E-DREaM Lab • TEM PSHA2025 Multi-Agent Seismic Triage
          </p>
        </div>
      </div>

      {/* Scenario Selection & Simulation Trigger */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-ink_black-400 border border-stormy_teal-400/30 rounded-lg p-1">
          <span className="text-xs text-stormy_teal-800 pl-2 font-medium">Scenario:</span>
          <select
            value={selectedScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            disabled={isLoading}
            className="bg-ink_black-300 text-xs text-papaya_whip-500 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-vivid_tangerine-500 border border-stormy_teal-400/40"
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
          className="flex items-center space-x-2 bg-vivid_tangerine-500 hover:bg-vivid_tangerine-600 active:bg-vivid_tangerine-700 text-ink_black-100 text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-md shadow-vivid_tangerine-500/30 border border-vivid_tangerine-400 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          <span>{isLoading ? "CALCULATING..." : "SIMULATE DISPATCH"}</span>
        </button>
      </div>

      {/* Utility Actions (Copilot, Knowledge Base) */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 rounded-lg border border-stormy_teal-400/30 bg-ink_black-400 px-3 py-1.5 text-xs text-papaya_whip-600 hover:bg-stormy_teal-500/20 hover:text-papaya_whip-500 transition"
          title="Upload Domain Document"
        >
          <FileText className="h-3.5 w-3.5 text-stormy_teal-700" />
          <span>Docs</span>
        </button>

        <button
          onClick={onToggleCopilot}
          className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
            isCopilotOpen
              ? "bg-stormy_teal-500/30 text-papaya_whip-500 border-stormy_teal-500 shadow-sm"
              : "bg-ink_black-400 text-papaya_whip-600 border-stormy_teal-400/30 hover:bg-stormy_teal-500/20 hover:text-papaya_whip-500"
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-stormy_teal-700" />
          <span>AI Copilot</span>
          <span className="flex h-2 w-2 rounded-full bg-vivid_tangerine-500 animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};
