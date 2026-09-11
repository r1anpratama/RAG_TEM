"use client";

import React from "react";
import { Building2, AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { FacilityTriage } from "@/types/triage";

interface DigitalTwinsProps {
  facilities: FacilityTriage[];
  isLoading?: boolean;
  isSimulating?: boolean;
}

export const DigitalTwins: React.FC<DigitalTwinsProps> = ({ facilities, isSimulating = false }) => {
  const defaultFacilities: FacilityTriage[] = [
    {
      facility_id: "FAC_NCU_SCIENCE_B4",
      facility_name: "NCU Science Building 4",
      building_era: "PRE_1999_SOFT_STOREY",
      triage_tag: "RED_CRITICAL",
      drift_ratio_pct: 2.14,
      collapse_probability: "48.2%",
      cwa_intensity: "6-Weak",
      action_recommendation: "IMMEDIATE EVACUATION: High risk of 1st floor shear collapse.",
      connected_lifelines: ["POWER_SUBSTATION_B", "GAS_RISER_04"],
      priority_rank: 1,
    },
    {
      facility_id: "FAC_NCU_ENG_B5",
      facility_name: "NCU Engineering Building 5",
      building_era: "POST_1999_RC_FRAME",
      triage_tag: "YELLOW_INSPECT",
      drift_ratio_pct: 1.05,
      collapse_probability: "8.5%",
      cwa_intensity: "5-Strong",
      action_recommendation: "SECONDARY INSPECTION: Non-structural partition cracking.",
      connected_lifelines: ["FIBER_BACKBONE_NCU", "CHILLED_WATER_LOOP"],
      priority_rank: 2,
    },
    {
      facility_id: "FAC_NCU_LIBRARY",
      facility_name: "NCU Main Library Core",
      building_era: "POST_1999_SEISMIC_RETROFIT",
      triage_tag: "GREEN_SAFE",
      drift_ratio_pct: 0.42,
      collapse_probability: "0.8%",
      cwa_intensity: "5-Weak",
      action_recommendation: "SHELTER IN PLACE: Structural integrity verified undamaged.",
      connected_lifelines: ["CAMPUS_MICROGRID_SOLAR"],
      priority_rank: 3,
    },
    {
      facility_id: "FAC_HSP_TSMC_FAB",
      facility_name: "Hsinchu SciPark Fab Cleanroom",
      building_era: "BASE_ISOLATED_CLEANROOM",
      triage_tag: "GREEN_SAFE",
      drift_ratio_pct: 0.18,
      collapse_probability: "0.1%",
      cwa_intensity: "4",
      action_recommendation: "HOLD PRODUCTION: Lead-rubber bearings absorbed 82% seismic energy.",
      connected_lifelines: ["TSMC_ULTRA_PURE_WATER", "HIGH_VOLTAGE_161KV"],
      priority_rank: 4,
    },
  ];

  const items = facilities && facilities.length > 0 ? facilities : defaultFacilities;

  const getTagBadge = (tag: string) => {
    // NEUTRAL IN STANDBY - Only display impact color when simulated
    if (!isSimulating) {
      return (
        <span className="flex items-center space-x-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
          <ShieldCheck className="h-3 w-3 text-cyan-400" />
          <span>STANDBY MONITORED</span>
        </span>
      );
    }

    switch (tag) {
      case "RED_CRITICAL":
        return (
          <span className="flex items-center space-x-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/40 animate-pulse">
            <ShieldAlert className="h-3 w-3 text-rose-400" />
            <span>RED CRITICAL</span>
          </span>
        );
      case "YELLOW_INSPECT":
        return (
          <span className="flex items-center space-x-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/40">
            <AlertTriangle className="h-3 w-3" />
            <span>YELLOW INSPECT</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span>GREEN SAFE</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            NCU Campus Digital Twins & Structural Triage (ASCE 41-17 / TEM)
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {isSimulating ? "Seismic Impact Simulated" : "Standby Monitoring Active"}
          </span>
          <span className={`h-2 w-2 rounded-full ${isSimulating ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`}></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((fac) => {
          const drift = isSimulating ? fac.drift_ratio_pct : 0.05;
          const isDanger = isSimulating && drift >= 2.0;
          const isWarning = isSimulating && drift >= 1.0 && drift < 2.0;

          return (
            <div
              key={fac.facility_id}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 backdrop-blur-sm ${
                isDanger
                  ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60 shadow-lg shadow-rose-950/20"
                  : isWarning
                  ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 shadow-lg shadow-amber-950/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {fac.facility_name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {fac.building_era}
                    </p>
                  </div>
                  {getTagBadge(fac.triage_tag)}
                </div>

                <div className="mt-3.5 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Inter-Story Drift:</span>
                    <span
                      className={`font-mono font-bold ${
                        !isSimulating
                          ? "text-slate-400"
                          : isDanger
                          ? "text-rose-400"
                          : isWarning
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {isSimulating ? `${fac.drift_ratio_pct.toFixed(2)}%` : "0.00% (Normal)"}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        !isSimulating
                          ? "bg-slate-700"
                          : isDanger
                          ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                          : isWarning
                          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                          : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      }`}
                      style={{ width: `${isSimulating ? Math.min(100, (fac.drift_ratio_pct / 2.5) * 100) : 2}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-0.5">
                    <span>Safe &lt;0.5%</span>
                    <span>Yield 1.5%</span>
                    <span>Collapse &gt;2.0%</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-800 pt-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Collapse Risk:</span>{" "}
                    <span
                      className={`font-semibold ${
                        isDanger ? "text-rose-400" : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {isSimulating ? fac.collapse_probability : "&lt; 0.1%"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">CWA Intensity:</span>{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {isSimulating ? fac.cwa_intensity : "Normal"}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 leading-tight bg-slate-900/60 p-2 rounded border border-slate-800/80">
                  <span className="text-cyan-400 font-bold block mb-0.5">Triage Recommendation:</span>
                  {isSimulating ? fac.action_recommendation : "Structural baseline verified intact. Standby for seismic trigger."}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Priority #{fac.priority_rank}</span>
                <span className="font-mono text-cyan-400">{fac.connected_lifelines.length} Lifelines Interlocked</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
