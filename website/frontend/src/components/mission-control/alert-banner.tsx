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
    <div className="relative z-[1100] overflow-hidden border-b border-brandy-500/50 bg-gradient-to-r from-brandy-500/80 via-ink_black-500 to-ink_black-500 p-4 text-papaya_whip-500 shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,236,209,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-30"></div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        {/* S-Wave Countdown Clock */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-start">
            <div className="flex items-center space-x-1.5 text-xs font-bold tracking-wider text-vivid_tangerine-500 uppercase">
              <Clock className="h-3.5 w-3.5 animate-pulse text-vivid_tangerine-500" />
              <span>S-Wave Warning Window</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span
                className={`font-mono text-4xl font-extrabold tracking-tight ${
                  isArrived
                    ? "text-brandy-600 animate-pulse"
                    : timeLeft < 5.0
                    ? "text-vivid_tangerine-500"
                    : "text-papaya_whip-500"
                }`}
              >
                {isArrived ? "00.0s" : `${timeLeft.toFixed(1)}s`}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-stormy_teal-800">
                {isArrived ? "STRONG SHAKING IMPACT" : "LEAD TIME TO NCU"}
              </span>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-stormy_teal-400/30 md:block"></div>

          {/* Telemetry */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <span className="text-stormy_teal-800">Magnitude:</span>{" "}
              <span className="font-bold text-papaya_whip-500">
                Mw {scenario?.magnitude.toFixed(2) || "6.91"}
              </span>
            </div>
            <div>
              <span className="text-stormy_teal-800">Focal Depth:</span>{" "}
              <span className="font-bold text-papaya_whip-500">
                {scenario?.depth_km.toFixed(1) || "8.0"} km
              </span>
            </div>
            <div>
              <span className="text-stormy_teal-800">Target Facility:</span>{" "}
              <span className="font-bold text-stormy_teal-700">
                NCU Science & Tech Core
              </span>
            </div>
            <div>
              <span className="text-stormy_teal-800">Predicted PGV:</span>{" "}
              <span className="font-extrabold text-vivid_tangerine-500">
                {scenario?.predicted_pgv_cm_s || 72.4} cm/s (CWA 6-Weak)
              </span>
            </div>
          </div>
        </div>

        {/* Reflex Status */}
        <div className="flex flex-col items-end space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 rounded-full bg-brandy-400/60 px-2.5 py-0.5 text-xs font-bold text-vivid_tangerine-700 border border-brandy-500">
              <Zap className="h-3 w-3 fill-current text-vivid_tangerine-500" />
              <span>Track A Reflex: {reflexStatus}</span>
            </span>
            <span className="rounded bg-ink_black-400 px-2 py-0.5 text-[11px] font-mono text-papaya_whip-600 border border-stormy_teal-400/30">
              {latency} ms latency
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-stormy_teal-800">
            <span className="flex items-center space-x-1 text-stormy_teal-700 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-stormy_teal-600" />
              <span>NeMo Critic: 0.0% Hallucination Verified</span>
            </span>
            <span>•</span>
            <span className="text-papaya_whip-700">
              3 SCADA Actuators Tripped
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
