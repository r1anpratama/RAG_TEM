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
    <div className="flex flex-col space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Track A Reflex SCADA Interlocks (&lt; 5 ms)
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-800/40">
            <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
            <span>{latencyMs.toFixed(2)} ms Execution</span>
          </span>
          <span className="rounded bg-red-950/80 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-800/60">
            {triggerStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {items.map((act, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-2.5"
          >
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                <span className="text-[11px] font-bold text-zinc-200">
                  {act.target}
                </span>
              </div>
              <p className="text-[10px] font-mono text-emerald-400">
                {act.action}
              </p>
            </div>
            <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 border border-zinc-800">
              {act.urgency}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
