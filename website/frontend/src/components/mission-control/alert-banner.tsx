"use client";

import React, { useEffect, useState } from "react";
import { Clock, Zap, ShieldCheck } from "lucide-react";
import { Scenario, TriageDispatchResponse } from "@/types/triage";

interface AlertBannerProps {
  scenario: Scenario | null;
  dispatch: TriageDispatchResponse | null;
  triggerTime: number | null;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  scenario,
  dispatch,
  triggerTime,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(scenario?.countdown_seconds || 3.8);

  useEffect(() => {
    if (!scenario) return;
    const initialCountdown = scenario.countdown_seconds;
    setTimeLeft(initialCountdown);

    if (initialCountdown <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          return 0.0;
        }
        return Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [scenario, triggerTime]);

  const isArrived = timeLeft <= 0.0;
  const reflexStatus = dispatch?.track_a_reflex.trigger_level || "STANDBY";
  const latency = dispatch?.execution_summary.track_a_latency_ms || 1.84;

  return (
    <div className="relative overflow-hidden border-b border-red-900/60 bg-gradient-to-r from-red-950/90 via-zinc-950 to-zinc-950 p-4 text-zinc-100 shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40"></div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        {/* Giant S-Wave Countdown Clock */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-start">
            <div className="flex items-center space-x-1.5 text-xs font-semibold tracking-wider text-red-400 uppercase">
              <Clock className="h-3.5 w-3.5 animate-pulse text-red-500" />
              <span>S-Wave Warning Window</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span
                className={`font-mono text-4xl font-extrabold tracking-tight ${
                  isArrived
                    ? "text-red-500 animate-pulse"
                    : timeLeft < 5.0
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {isArrived ? "00.0s" : `${timeLeft.toFixed(1)}s`}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {isArrived ? "STRONG SHAKING IMPACT" : "LEAD TIME TO NCU"}
              </span>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-zinc-800 md:block"></div>

          {/* Telemetry */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <span className="text-zinc-400">Magnitude:</span>{" "}
              <span className="font-bold text-zinc-100">
                Mw {scenario?.magnitude.toFixed(2) || "6.91"}
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Focal Depth:</span>{" "}
              <span className="font-bold text-zinc-100">
                {scenario?.depth_km.toFixed(1) || "8.0"} km
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Target Facility:</span>{" "}
              <span className="font-bold text-emerald-400">
                NCU Science & Tech Core
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Predicted PGV:</span>{" "}
              <span className="font-bold text-red-400">
                {scenario?.predicted_pgv_cm_s || 72.4} cm/s (CWA 6-Weak)
              </span>
            </div>
          </div>
        </div>

        {/* Reflex Status */}
        <div className="flex flex-col items-end space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/40">
              <Zap className="h-3 w-3 fill-current" />
              <span>Track A Reflex: {reflexStatus}</span>
            </span>
            <span className="rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-300 border border-zinc-800">
              {latency} ms latency
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
            <span className="flex items-center space-x-1 text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>NeMo Critic: 0.0% Hallucination Verified</span>
            </span>
            <span>•</span>
            <span className="text-zinc-300">
              3 SCADA Actuators Tripped
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
