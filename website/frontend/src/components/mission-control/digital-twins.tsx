"use client";

import React from "react";
import { Building2, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { FacilityTriage } from "@/types/triage";

interface DigitalTwinsProps {
  facilities: FacilityTriage[];
  isLoading?: boolean;
}

export const DigitalTwins: React.FC<DigitalTwinsProps> = ({ facilities }) => {
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
    switch (tag) {
      case "RED_CRITICAL":
        return (
          <span className="flex items-center space-x-1 rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-500 border border-orange-500/60">
            <ShieldAlert className="h-3 w-3 text-orange-500" />
            <span>RED CRITICAL</span>
          </span>
        );
      case "YELLOW_INSPECT":
        return (
          <span className="flex items-center space-x-1 rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-500/40">
            <AlertTriangle className="h-3 w-3" />
            <span>YELLOW INSPECT</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 rounded bg-prussian_blue-600/30 px-2 py-0.5 text-[10px] font-bold text-prussian_blue-800 border border-prussian_blue-600/50">
            <CheckCircle className="h-3 w-3 text-prussian_blue-800" />
            <span>GREEN SAFE</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between border-b border-prussian_blue-600/40 pb-2">
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-orange-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white-500">
            Campus Digital Twins & Structural Triage (ASCE 41-17 / TEM)
          </h3>
        </div>
        <span className="text-[11px] text-prussian_blue-800 font-mono">
          4 Facilities Monitored
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((fac) => {
          const drift = fac.drift_ratio_pct;
          const isDanger = drift >= 2.0;
          const isWarning = drift >= 1.0 && drift < 2.0;

          return (
            <div
              key={fac.facility_id}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition backdrop-blur-sm ${
                isDanger
                  ? "border-orange-500/80 bg-orange-500/10 hover:border-orange-500"
                  : isWarning
                  ? "border-orange-500/40 bg-orange-500/5 hover:border-orange-500/60"
                  : "border-prussian_blue-600/40 bg-prussian_blue-500/30 hover:border-prussian_blue-600"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white-500">
                      {fac.facility_name}
                    </h4>
                    <p className="text-[10px] font-mono text-prussian_blue-800 mt-0.5">
                      {fac.building_era}
                    </p>
                  </div>
                  {getTagBadge(fac.triage_tag)}
                </div>

                <div className="mt-3.5 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-prussian_blue-800">Inter-Story Drift:</span>
                    <span
                      className={`font-mono font-bold ${
                        isDanger
                          ? "text-orange-500"
                          : isWarning
                          ? "text-orange-600"
                          : "text-prussian_blue-800"
                      }`}
                    >
                      {drift.toFixed(2)}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-black-600">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isDanger
                          ? "bg-orange-500"
                          : isWarning
                          ? "bg-orange-600"
                          : "bg-prussian_blue-700"
                      }`}
                      style={{ width: `${Math.min(100, (drift / 2.5) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-prussian_blue-800 font-mono pt-0.5">
                    <span>Safe &lt;0.5%</span>
                    <span>Yield 1.5%</span>
                    <span>Collapse &gt;2.0%</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-prussian_blue-600/40 pt-2 text-[11px]">
                  <div>
                    <span className="text-prussian_blue-800">Collapse Risk:</span>{" "}
                    <span
                      className={`font-semibold ${
                        isDanger ? "text-orange-500" : "text-alabaster_grey-500"
                      }`}
                    >
                      {fac.collapse_probability}
                    </span>
                  </div>
                  <div>
                    <span className="text-prussian_blue-800">Intensity:</span>{" "}
                    <span className="font-semibold text-alabaster_grey-500">
                      {fac.cwa_intensity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded bg-black-500/80 p-2 text-[10px] text-alabaster_grey-500 border border-prussian_blue-600/40">
                <span className="font-bold text-orange-500 block mb-0.5">
                  Triage Protocol:
                </span>
                {fac.action_recommendation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
