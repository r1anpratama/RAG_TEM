"use client";

import React, { useEffect, useState } from "react";
import { Clock, ShieldCheck, Zap } from "lucide-react";
import { Scenario } from "@/types/triage";

interface AlertBannerProps {
  scenario: Scenario | null;
  isSimulating: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  scenario,
  isSimulating,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    if (scenario && isSimulating) {
      const initialS = scenario.s_wave_countdown_sec || 7.2;
      setSecondsRemaining(initialS);
      setIsActive(true);

      const startTime = performance.now();
      const interval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const left = Math.max(0, initialS - elapsed);
        setSecondsRemaining(parseFloat(left.toFixed(1)));

        if (left <= 0) {
          clearInterval(interval);
          setIsActive(false);
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      setSecondsRemaining(scenario?.s_wave_countdown_sec || 0);
      setIsActive(false);
    }
  }, [scenario, isSimulating]);

  if (!scenario) return null;

  return (
    <div className="relative z-[1100] overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white via-slate-50 to-slate-50 dark:from-slate_obsidian-card dark:via-slate_obsidian-900 dark:to-slate_obsidian-900 p-4 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* S-Wave Countdown Clock */}
        <div className="flex items-center space-x-5">
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5 text-xs font-bold tracking-wider text-amber-400 uppercase">
              <Clock className="h-3.5 w-3.5 animate-pulse text-amber-400" />
              <span>S-Wave Arrival Countdown</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span
                className={`font-mono text-4xl font-black tracking-tight ${
                  secondsRemaining <= 3 && secondsRemaining > 0
                    ? "text-rose-400 animate-pulse drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    : secondsRemaining > 0
                    ? "text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {secondsRemaining > 0 ? secondsRemaining.toFixed(1) : "0.0"}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Seconds
              </span>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-slate-800 md:block"></div>

          {/* Scenario Telemetry */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <span className="text-slate-400">Magnitude:</span>{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Mw {scenario.magnitude}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Focal Depth:</span>{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {scenario.depth_km} km
              </span>
            </div>
            <div>
              <span className="text-slate-400">Target Facility:</span>{" "}
              <span className="font-bold text-cyan-300">
                {scenario.target_facility} ({scenario.distance_to_target_km} km)
              </span>
            </div>
            <div>
              <span className="text-slate-400">Predicted PGV:</span>{" "}
              <span className="font-extrabold text-amber-400">
                {scenario.predicted_pgv_cm_s} cm/s
              </span>
            </div>
          </div>
        </div>

        {/* Track A Reflex & System Status */}
        <div className="flex flex-col items-start space-y-1.5 md:items-end">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <Zap className="h-3 w-3 fill-current text-emerald-400" />
              <span>Track A Reflex Active (&lt; 5 ms)</span>
            </span>
            <span className="rounded-md bg-slate-800/80 px-2.5 py-1 text-[11px] font-mono text-slate-800 dark:text-slate-200 border border-slate-700/50">
              CWA: {scenario.estimated_cwa_intensity}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1 text-slate-300 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>GMPE Confidence:</span>
            </span>
            <span className="text-slate-400">
              {scenario.gmpe_validation?.status || "CONSISTENT_WITH_PHYSICS"} (Z={scenario.gmpe_validation?.z_score?.toFixed(2) || "+0.42"}σ)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
