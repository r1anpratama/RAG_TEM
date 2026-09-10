"use client";

import React from "react";
import { Zap, Radio } from "lucide-react";
import { SCADAActuator } from "@/types/triage";

interface ScadaPanelProps {
  actuators?: SCADAActuator[];
  triggerStatus?: string;
  latencyMs?: number;
}

export const ScadaPanel: React.FC<ScadaPanelProps> = ({
  actuators,
  triggerStatus = "ACTIVATED_CRITICAL_CUTOFF",
  latencyMs = 1.84,
}) => {
  const defaultActuators: SCADAActuator[] = [
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
  ];

  const items = actuators && actuators.length > 0 ? actuators : defaultActuators;

  return (
    <div className="flex flex-col space-y-3 rounded-xl border border-slate-800 bg-slate_obsidian-card p-3.5 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Track A Reflex SCADA Interlocks (&lt; 5 ms)
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-700/50">
            <Radio className="h-2.5 w-2.5 animate-pulse text-cyan-400" />
            <span>{latencyMs.toFixed(2)} ms Execution</span>
          </span>
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
            {triggerStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {items.map((act, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 hover:border-slate-700 transition"
          >
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                <span className="text-[11px] font-bold text-slate-200">
                  {act.target}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                {act.action}
              </p>
            </div>
            <span className="rounded bg-slate-800/60 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 border border-slate-700/40">
              {act.urgency}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
