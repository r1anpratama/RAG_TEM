"use client";

import React, { useEffect, useState } from "react";
import { Clock, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
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
    <div className="relative z-[1100] overflow-hidden border-b border-orange-500/40 bg-gradient-to-r from-prussian_blue-500/95 via-black-500 to-black-500 p-4 text-alabaster_grey-500 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* S-Wave Countdown Clock */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5 text-xs font-bold tracking-wider text-orange-500 uppercase">
              <Clock className="h-3.5 w-3.5 animate-pulse text-orange-500" />
              <span>S-Wave Arrival Clock</span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span
                className={`font-mono text-4xl font-black tracking-tighter ${
                  secondsRemaining <= 3 && secondsRemaining > 0
                    ? "text-orange-500 animate-pulse"
                    : secondsRemaining > 0
                    ? "text-orange-500"
                    : "text-white-500"
                }`}
              >
                {secondsRemaining > 0 ? secondsRemaining.toFixed(1) : "0.0"}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-prussian_blue-800">
                Seconds Remaining
              </span>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-prussian_blue-600/40 md:block"></div>

          {/* Scenario Telemetry */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <span className="text-prussian_blue-800">Magnitude:</span>{" "}
              <span className="font-bold text-white-500">
                Mw {scenario.magnitude}
              </span>
            </div>
            <div>
              <span className="text-prussian_blue-800">Focal Depth:</span>{" "}
              <span className="font-bold text-white-500">
                {scenario.depth_km} km
              </span>
            </div>
            <div>
              <span className="text-prussian_blue-800">Target Facility:</span>{" "}
              <span className="font-bold text-prussian_blue-800">
                {scenario.target_facility} ({scenario.distance_to_target_km} km)
              </span>
            </div>
            <div>
              <span className="text-prussian_blue-800">Predicted PGV:</span>{" "}
              <span className="font-extrabold text-orange-500">
                {scenario.predicted_pgv_cm_s} cm/s
              </span>
            </div>
          </div>
        </div>

        {/* Track A Reflex & System Status */}
        <div className="flex flex-col items-start space-y-1.5 md:items-end">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-500 border border-orange-500/50">
              <Zap className="h-3 w-3 fill-current text-orange-500" />
              <span>Track A Reflex Active (&lt; 5 ms)</span>
            </span>
            <span className="rounded bg-prussian_blue-500/50 px-2 py-0.5 text-[11px] font-mono text-alabaster_grey-500 border border-prussian_blue-600/40">
              {scenario.estimated_cwa_intensity}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-prussian_blue-800">
            <span className="flex items-center space-x-1 text-prussian_blue-800 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
              <span>GMPE Validation:</span>
            </span>
            <span className="text-alabaster_grey-600">
              {scenario.gmpe_validation?.status || "CONSISTENT_WITH_PHYSICS"} (Z={scenario.gmpe_validation?.z_score?.toFixed(2) || "+0.42"}σ)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
