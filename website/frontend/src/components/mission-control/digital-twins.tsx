"use client";

import React from "react";
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Radio,
  Sliders,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { FacilityTriage, Scenario, SCADAActuator } from "@/types/triage";

interface DigitalTwinsProps {
  scenario?: Scenario | null;
  facilities?: FacilityTriage[];
  isLoading?: boolean;
  isSimulating?: boolean;
  simTimeSec?: number;
  isPlaying?: boolean;
}

export function getScadaTriggerSpecs(scenario?: Scenario | null) {
  const id = scenario?.id?.toLowerCase() || "";
  if (id.includes("20883")) {
    // 2012 Daxi (EQ 20883):
    // 1st: MTN153 (5.0s), 2nd: MTN138 (5.37s), 3rd: TCU021 (5.60s)
    return {
      t3rdStationSec: 5.60,
      triggerDelaySec: 7.0,
      scadaTriggerSec: 12.60,
      first3Stations: ["MTN153 (5.0s)", "MTN138 (5.4s)", "TCU021 (5.6s)"],
      eventName: "2012 Daxi-Taoyuan (EQ 20883)",
    };
  } else if (id.includes("20122")) {
    // 2011 Daxi (EQ 20122):
    // 1st: MTN143 (5.0s), 2nd: TCU021 (5.05s), 3rd: MND020 (5.50s)
    return {
      t3rdStationSec: 5.50,
      triggerDelaySec: 7.0,
      scadaTriggerSec: 12.50,
      first3Stations: ["MTN143 (5.0s)", "TCU021 (5.0s)", "MND020 (5.5s)"],
      eventName: "2011 Daxi (EQ 20122)",
    };
  } else if (id.includes("meinong")) {
    // 2016 Meinong:
    // 1st: KAU068 (5.0s), 2nd: KAU028 (5.5s), 3rd: KAU069 (5.52s)
    return {
      t3rdStationSec: 5.52,
      triggerDelaySec: 7.0,
      scadaTriggerSec: 12.52,
      first3Stations: ["KAU068 (5.0s)", "KAU028 (5.5s)", "KAU069 (5.5s)"],
      eventName: "2016 Meinong M6.6",
    };
  } else {
    return {
      t3rdStationSec: 5.60,
      triggerDelaySec: 7.0,
      scadaTriggerSec: 12.60,
      first3Stations: ["Station #1 (5.0s)", "Station #2 (5.3s)", "Station #3 (5.6s)"],
      eventName: "Regional Seismic Event",
    };
  }
}

export const DigitalTwins: React.FC<DigitalTwinsProps> = ({
  scenario,
  facilities,
  isSimulating: propIsSimulating = false,
  simTimeSec = 0,
  isPlaying = false,
}) => {
  const currentT = simTimeSec;
  const isSimulating = propIsSimulating || isPlaying || currentT > 0;
  const specs = getScadaTriggerSpecs(scenario);
  const isDaxi = Boolean(
    scenario?.id?.toLowerCase().includes("20883") ||
    scenario?.id?.toLowerCase().includes("20122") ||
    scenario?.id?.toLowerCase().includes("daxi")
  );

  // Trigger Condition: EXACTLY 7 SECONDS AFTER THE FIRST 3 SENSORS RECORD!
  // Before 12.60s (for EQ 20883), numbers stay in Standby (0.00% Normal)
  const is3rdStationDetected = isSimulating && currentT >= specs.t3rdStationSec;
  const isScadaTriggered = isSimulating && currentT >= specs.scadaTriggerSec;

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

  const actuators =
    scenario?.track_a_actuators && scenario.track_a_actuators.length > 0
      ? scenario.track_a_actuators
      : defaultActuators;

  // Structural Building Data
  // If Daxi: multi-storey (>3F) has CWA Intensity 2 (Green) with 1F soft storey warning on Edream Centre!
  const buildingItems = [
    {
      facility_id: "FAC_NCU_SCIENCE_B4",
      facility_name: "NCU Edream Centre (健雄館 / S4)",
      building_era: "PRE_1999_SOFT_STOREY",
      stories: 8,
      triage_tag: isDaxi ? "YELLOW_INSPECT" : "RED_CRITICAL",
      drift_ratio_pct: isDaxi ? 0.42 : 2.14,
      collapse_probability: isDaxi ? "< 0.5%" : "48.2%",
      cwa_intensity: isDaxi ? "2" : "6-Weak",
      action_recommendation: isDaxi
        ? "SOFT-STOREY WARNING: 1F open column atrium concentrated shear force (IDR: 0.42%). Gas riser isolated, elevators homed to 1F."
        : "IMMEDIATE EVACUATION: High risk of 1st floor shear collapse.",
      connected_lifelines: ["POWER_SUBSTATION_B", "GAS_RISER_04"],
      priority_rank: 1,
    },
    {
      facility_id: "FAC_NCU_ENG_B5",
      facility_name: "NCU Engineering Building 5",
      building_era: "POST_1999_RC_FRAME",
      stories: 7,
      triage_tag: isDaxi ? "GREEN_SAFE" : "YELLOW_INSPECT",
      drift_ratio_pct: isDaxi ? 0.24 : 1.05,
      collapse_probability: isDaxi ? "< 0.1%" : "8.5%",
      cwa_intensity: isDaxi ? "2" : "5-Strong",
      action_recommendation: isDaxi
        ? "ATTENUATED SAFE: Ductile frame dissipated seismic energy within elastic range. Server backup online."
        : "SECONDARY INSPECTION: Non-structural partition cracking.",
      connected_lifelines: ["FIBER_BACKBONE_NCU", "CHILLED_WATER_LOOP"],
      priority_rank: 2,
    },
    {
      facility_id: "FAC_NCU_LIBRARY",
      facility_name: "NCU Main Library Core",
      building_era: "POST_1999_SEISMIC_RETROFIT",
      stories: 8,
      triage_tag: "GREEN_SAFE",
      drift_ratio_pct: isDaxi ? 0.20 : 0.42,
      collapse_probability: isDaxi ? "< 0.1%" : "0.8%",
      cwa_intensity: isDaxi ? "2" : "5-Weak",
      action_recommendation: isDaxi
        ? "ATTENUATED SAFE: Low-pass filtering mitigated roof drift. Dual shear core verified undamaged."
        : "SHELTER IN PLACE: Structural integrity verified undamaged.",
      connected_lifelines: ["CAMPUS_MICROGRID_SOLAR"],
      priority_rank: 3,
    },
    {
      facility_id: "FAC_HSP_TSMC_FAB",
      facility_name: "Hsinchu SciPark Fab Cleanroom",
      building_era: "BASE_ISOLATED_CLEANROOM",
      stories: 4,
      triage_tag: "GREEN_SAFE",
      drift_ratio_pct: 0.18,
      collapse_probability: "0.1%",
      cwa_intensity: isDaxi ? "2" : "4",
      action_recommendation: isDaxi
        ? "ISOLATED SAFE: Lead-rubber bearings absorbed 85% seismic motion. Wafer fab dampers secured."
        : "HOLD PRODUCTION: Lead-rubber bearings absorbed 82% seismic energy.",
      connected_lifelines: ["TSMC_ULTRA_PURE_WATER", "HIGH_VOLTAGE_161KV"],
      priority_rank: 4,
    },
  ];

  const getTagBadge = (tag: string) => {
    // Only display active triage color once SCADA is triggered (7s after 3rd station)!
    if (!isScadaTriggered) {
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
    <div className="flex flex-col space-y-3.5">
      {/* 1. SCADA AUTOMATED REFLEX INTERLOCKS PANEL (< 5 ms execution) */}
      <div className="flex flex-col space-y-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card p-3.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Track A Reflex SCADA Automated Interlocks (&lt; 5 ms)
            </h3>
            <span className="hidden sm:inline-flex items-center space-x-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-700">
              <Clock className="h-2.5 w-2.5 text-cyan-400" />
              <span>Trigger Rule: 7s After 3rd Pick ({specs.scadaTriggerSec.toFixed(2)}s)</span>
            </span>
          </div>

          {/* Trigger Telemetry Status */}
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            {isScadaTriggered ? (
              <span className="flex items-center space-x-1.5 rounded bg-emerald-500/15 px-2.5 py-1 text-emerald-400 border border-emerald-500/40 font-bold animate-pulse">
                <Radio className="h-3 w-3 text-emerald-400" />
                <span>SCADA EXECUTED (1.84 ms) • ALL CUTOFFS LOCKED</span>
              </span>
            ) : is3rdStationDetected ? (
              <span className="flex items-center space-x-1.5 rounded bg-amber-500/15 px-2.5 py-1 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                <Radio className="h-3 w-3 text-amber-400" />
                <span>
                  3 SENSORS RECORDED • SCADA IN T-MINUS{" "}
                  {Math.max(0, specs.scadaTriggerSec - currentT).toFixed(1)}s
                </span>
              </span>
            ) : isSimulating ? (
              <span className="flex items-center space-x-1.5 rounded bg-cyan-500/15 px-2.5 py-1 text-cyan-300 border border-cyan-500/40">
                <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span>AWAITING 3-STATION CONVERGENCE (Wavefront in Transit)</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 rounded bg-slate-800 px-2.5 py-1 text-slate-400 border border-slate-700">
                <Radio className="h-3 w-3 text-slate-500" />
                <span>SCADA ARMED • STANDBY MONITORED</span>
              </span>
            )}
          </div>
        </div>

        {/* 3 Main Actuator Cutoff Chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {actuators.map((act, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-lg border p-2.5 transition ${
                isScadaTriggered
                  ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm shadow-emerald-950/20"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`flex h-2 w-2 rounded-full ${
                      isScadaTriggered
                        ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                        : is3rdStationDetected
                        ? "bg-amber-400 animate-ping"
                        : "bg-cyan-400"
                    }`}
                  />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {act.target}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  {isScadaTriggered
                    ? act.action
                    : is3rdStationDetected
                    ? "Executing in 7s window..."
                    : "Interlock Armed • Standby"}
                </p>
              </div>

              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold border ${
                  isScadaTriggered
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800/60 text-slate-400 border-slate-700/40"
                }`}
              >
                {isScadaTriggered ? "EXECUTED (<5ms)" : act.urgency}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CAMPUS DIGITAL TWINS & STRUCTURAL SCADA TELEMETRY CARDS */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Campus Digital Twins & Structural Drift Triage (ASCE 41-17)
            </h4>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <span>Network Convergence:</span>
            <span className="text-cyan-300 font-bold">
              {isScadaTriggered
                ? "3-Station + 7s Inverted"
                : is3rdStationDetected
                ? "3-Station Pick Recorded"
                : "Standby"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {buildingItems.map((fac) => {
            // NUMBERS ONLY APPEAR 7 SECONDS AFTER THE FIRST 3 SENSORS RECORD!
            const drift = isScadaTriggered ? fac.drift_ratio_pct : 0.0;
            const isDanger = isScadaTriggered && drift >= 2.0;
            const isWarning = isScadaTriggered && drift >= 0.4 && drift < 2.0;

            return (
              <div
                key={fac.facility_id}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-300 backdrop-blur-sm ${
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

                  {/* Inter-Story Drift Gauge (Appears at t >= scadaTriggerSec) */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Inter-Story Drift:</span>
                      <span
                        className={`font-mono font-bold transition-colors duration-300 ${
                          !isScadaTriggered
                            ? "text-slate-400"
                            : isDanger
                            ? "text-rose-400"
                            : isWarning
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {isScadaTriggered
                          ? `${fac.drift_ratio_pct.toFixed(2)}%`
                          : "0.00% (Normal)"}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          !isScadaTriggered
                            ? "bg-slate-700"
                            : isDanger
                            ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                            : isWarning
                            ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        }`}
                        style={{
                          width: `${
                            isScadaTriggered
                              ? Math.min(100, Math.max(4, (fac.drift_ratio_pct / 2.5) * 100))
                              : 2
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-0.5">
                      <span>Safe &lt;0.5%</span>
                      <span>Yield 1.5%</span>
                      <span>Collapse &gt;2.0%</span>
                    </div>
                  </div>

                  {/* Collapse Risk & CWA Intensity (Appear at t >= scadaTriggerSec) */}
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-800 pt-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Collapse Risk:</span>{" "}
                      <span
                        className={`font-semibold font-mono ${
                          !isScadaTriggered
                            ? "text-slate-400"
                            : isDanger
                            ? "text-rose-400 font-bold"
                            : "text-slate-200"
                        }`}
                      >
                        {isScadaTriggered ? fac.collapse_probability : "< 0.1%"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">CWA Intensity:</span>{" "}
                      <span
                        className={`font-semibold font-mono ${
                          !isScadaTriggered
                            ? "text-slate-400"
                            : isDaxi
                            ? "text-emerald-400 font-bold"
                            : "text-slate-200"
                        }`}
                      >
                        {isScadaTriggered ? fac.cwa_intensity : "Normal"}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation / SCADA Interlock */}
                  <div className="mt-2 text-[10px] text-slate-400 leading-tight bg-slate-900/60 p-2 rounded border border-slate-800/80 min-h-[50px] flex flex-col justify-center">
                    <span className="text-cyan-400 font-bold block mb-0.5">
                      {isScadaTriggered ? "SCADA Interlock Action:" : "Triage Status:"}
                    </span>
                    <span className="text-slate-300">
                      {isScadaTriggered
                        ? fac.action_recommendation
                        : is3rdStationDetected
                        ? `3-station trigger achieved at ${specs.t3rdStationSec.toFixed(1)}s. SCADA interlock inversion in ${Math.max(0, specs.scadaTriggerSec - currentT).toFixed(1)}s.`
                        : "Structural baseline verified intact. Standby for seismic trigger."}
                    </span>
                  </div>
                </div>

                {/* Priority & Lifelines */}
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Priority #{fac.priority_rank}</span>
                  <span
                    className={`font-mono ${
                      isScadaTriggered ? "text-emerald-400 font-bold" : "text-cyan-400"
                    }`}
                  >
                    {fac.connected_lifelines.length} Lifelines{" "}
                    {isScadaTriggered ? "Cutoff Executed" : "Interlocked"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
