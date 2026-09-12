"use client";

import React from "react";
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Zap,
  Radio,
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

  // ALL 6 NCU CAMPUS BUILDINGS FROM 3D TWIN WITH MATCHED IMPACTS:
  // Daxi Ground Motion Rule:
  // <= 3 storeys: CWA Intensity 3 (Yellow #facc15)
  // > 3 storeys: CWA Intensity 2 (Green #4ade80)
  const campusBuildings = [
    {
      facility_id: "FAC_NCU_GYM",
      facility_name: "NCU Gymnasium (依仁堂體育館)",
      building_era: "Post-1999 High-Bay Space Truss",
      structural_type: "Steel Space Truss on RC Columns",
      stories: 2,
      is_low_rise: true,
      fundamental_period_sec: 0.28,
      cwa_intensity: isDaxi ? "3" : "2",
      drift_ratio_pct: isDaxi ? 0.58 : 0.12,
      collapse_probability: isDaxi ? "1.2%" : "< 0.1%",
      action_recommendation: isDaxi
        ? "CWA INTENSITY 3 (YELLOW RESONANCE): Low-rise (2F <= 3F) resonates with Daxi shallow crustal high frequencies (Tn ≈ 0.28s). High roof truss vibration; emergency lighting engaged."
        : "LOW-RISE SAFE: Rigid body motion without resonant drift during slow waves.",
      connected_lifelines: ["GYM_ROOF_TRUSS_SENSORS", "EMERGENCY_EXIT_DOORS"],
      priority_rank: 1,
    },
    {
      facility_id: "FAC_NCU_SCIENCE_B4",
      facility_name: "Edream Centre (健雄館 / S4)",
      building_era: "Pre-1999 Ground Floor Soft-Storey",
      structural_type: "RC Frame w/ Open Column Ground Atrium",
      stories: 8,
      is_low_rise: false,
      fundamental_period_sec: 0.65,
      cwa_intensity: isDaxi ? "2" : "6-Weak",
      drift_ratio_pct: isDaxi ? 0.42 : 2.14,
      collapse_probability: isDaxi ? "< 0.5%" : "48.2%",
      action_recommendation: isDaxi
        ? "CWA INTENSITY 2 (1F SOFT-STOREY ALERT): Multi-storey mass (>3F) filters high frequencies to Int 2, but 1F open column atrium concentrates shear force (IDR: 0.42%). Gas isolated, elevators homed to 1F."
        : "IMMEDIATE EVACUATION: High risk of 1st floor shear collapse.",
      connected_lifelines: ["GAS_RISER_04", "ELEVATOR_BANK_01", "OBSERVATORY_DOME_POWER"],
      priority_rank: 2,
    },
    {
      facility_id: "FAC_NCU_ENG_B5",
      facility_name: "Engineering Building 5 (工程五館 / E6)",
      building_era: "Post-1999 Modern Ductile Code",
      structural_type: "Moment-Resisting RC Frame",
      stories: 7,
      is_low_rise: false,
      fundamental_period_sec: 0.60,
      cwa_intensity: isDaxi ? "2" : "5-Strong",
      drift_ratio_pct: isDaxi ? 0.24 : 1.05,
      collapse_probability: isDaxi ? "< 0.1%" : "8.5%",
      action_recommendation: isDaxi
        ? "CWA INTENSITY 2 (ATTENUATED SAFE): 7-storey frame (>3F) acts as low-pass filter, safe within elastic design limit. Chilled water valves secured, CS/EECS server backup online."
        : "SECONDARY INSPECTION: Non-structural partition cracking.",
      connected_lifelines: ["EECS_SERVER_BACKUP", "CHILLED_WATER_LOOP"],
      priority_rank: 3,
    },
    {
      facility_id: "FAC_NCU_LIBRARY",
      facility_name: "NCU Main Library Core (總圖書館)",
      building_era: "Post-1999 Retrofitted Heavy Core",
      structural_type: "Dual RC Shear Wall & Braced Core",
      stories: 8,
      is_low_rise: false,
      fundamental_period_sec: 0.72,
      cwa_intensity: isDaxi ? "2" : "5-Weak",
      drift_ratio_pct: isDaxi ? 0.20 : 0.42,
      collapse_probability: isDaxi ? "< 0.1%" : "0.8%",
      action_recommendation: isDaxi
        ? "CWA INTENSITY 2 (ATTENUATED SAFE): Heavy bookstack mass and dual RC shear core act as low-pass filter against Daxi waves. Elevators halted at nearest floor, emergency exits verified."
        : "SHELTER IN PLACE: Structural integrity verified undamaged.",
      connected_lifelines: ["CAMPUS_MICROGRID_SOLAR", "ELEVATORS_MAIN_LIBRARY"],
      priority_rank: 4,
    },
    {
      facility_id: "FAC_NCU_ADMIN",
      facility_name: "NCU Administration Building (行政大樓)",
      building_era: "Campus Operations Center",
      structural_type: "Reinforced Concrete Frame (Mid-Rise)",
      stories: 5,
      is_low_rise: false,
      fundamental_period_sec: 0.45,
      cwa_intensity: isDaxi ? "2" : "4",
      drift_ratio_pct: isDaxi ? 0.28 : 0.45,
      collapse_probability: isDaxi ? "< 0.1%" : "0.3%",
      action_recommendation: isDaxi
        ? "CWA INTENSITY 2 (ATTENUATED MID-RISE): 5-storey RC frame (>3F) kept base shear well within design capacity. Campus emergency operations network active."
        : "OPERATIONS NOMINAL: Primary campus administration backbone secure.",
      connected_lifelines: ["CAMPUS_OPS_NETWORK", "CENTRAL_PA_SYSTEM"],
      priority_rank: 5,
    },
    {
      facility_id: "FAC_NCU_EDREAM",
      facility_name: "College of Earth Sciences (地球科學學院大樓)",
      building_era: "Geoscientific Center of Excellence",
      structural_type: "Stiff Low-Rise RC Frame w/ Bedrock Vault",
      stories: 4,
      is_low_rise: false,
      fundamental_period_sec: 0.35,
      cwa_intensity: isDaxi ? "2" : "4",
      drift_ratio_pct: isDaxi ? 0.22 : 0.38,
      collapse_probability: isDaxi ? "< 0.1%" : "0.2%",
      action_recommendation: isDaxi
        ? "CWA INTENSITY 2 (BEDROCK CORE SAFE): 4-storey frame (>3F) maintained low drift. CWASN_NCU_BB broadband seismograph bedrock vault undamaged."
        : "SEISMOGRAPH VAULT STABLE: Bedrock sensors recording continuous telemetry.",
      connected_lifelines: ["CWASN_BEDROCK_VAULT", "TT_SAM_EDGE_NODE"],
      priority_rank: 6,
    },
  ];

  const getTagBadge = (b: typeof campusBuildings[0]) => {
    // Only display active triage color once SCADA is triggered (7s after 3rd station)!
    if (!isScadaTriggered) {
      return (
        <span className="flex items-center space-x-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
          <ShieldCheck className="h-3 w-3 text-cyan-400" />
          <span>STANDBY MONITORED</span>
        </span>
      );
    }

    if (b.cwa_intensity === "3") {
      return (
        <span className="flex items-center space-x-1 rounded-md bg-yellow-400/15 px-2 py-0.5 text-[10px] font-bold text-yellow-400 border border-yellow-400/50 animate-pulse">
          <AlertTriangle className="h-3 w-3 text-yellow-400" />
          <span>CWA INT 3 • RESONANCE (≤3F)</span>
        </span>
      );
    }

    if (b.facility_id === "FAC_NCU_SCIENCE_B4" && isDaxi) {
      return (
        <span className="flex items-center space-x-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/50">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span>CWA INT 2 • 1F SOFT-STOREY</span>
        </span>
      );
    }

    return (
      <span className="flex items-center space-x-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
        <CheckCircle className="h-3 w-3 text-emerald-400" />
        <span>CWA INT 2 • SAFE (&gt;3F)</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col space-y-3.5">
      {/* 1. SCADA AUTOMATED REFLEX INTERLOCKS PANEL (< 5 ms execution) */}
      <div className="flex flex-col space-y-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card p-3.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <Zap className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Track A Reflex SCADA Automated Interlocks (&lt; 5 ms)
            </h3>
            <span className="hidden sm:inline-flex items-center space-x-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-700">
              <Clock className="h-2.5 w-2.5 text-cyan-400" />
              <span>Trigger Rule: 7s After 3rd Station ({specs.scadaTriggerSec.toFixed(2)}s)</span>
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

      {/* 2. CAMPUS DIGITAL TWINS & STRUCTURAL SCADA TELEMETRY CARDS (ALL 6 3D TWIN BUILDINGS) */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              NCU Campus 3D Twin Structural SCADA Interlocks (Matched with 3D Map)
            </h4>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <span>Daxi Impact Rule:</span>
            <span className="text-yellow-400 font-bold">≤3F: Int 3 (Yellow)</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">&gt;3F: Int 2 (Green)</span>
          </div>
        </div>

        {/* 6 Campus Building Cards matching 3D Twin */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {campusBuildings.map((b) => {
            // NUMBERS ONLY APPEAR 7 SECONDS AFTER THE FIRST 3 SENSORS RECORD!
            const drift = isScadaTriggered ? b.drift_ratio_pct : 0.0;
            const isGymResonant = isScadaTriggered && b.cwa_intensity === "3";
            const isSoftStorey = isScadaTriggered && b.facility_id === "FAC_NCU_SCIENCE_B4";

            return (
              <div
                key={b.facility_id}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-300 backdrop-blur-sm ${
                  isGymResonant
                    ? "border-yellow-400/50 bg-yellow-400/5 shadow-lg shadow-yellow-950/20"
                    : isSoftStorey
                    ? "border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-950/20"
                    : isScadaTriggered
                    ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {b.facility_name}
                      </h4>
                      <p className="text-[10px] font-mono text-cyan-400 font-semibold mt-0.5">
                        {b.stories} Storeys ({b.stories <= 3 ? "≤ 3F Low-Rise" : "> 3F Multi-Storey"}) • Tn ~{b.fundamental_period_sec}s
                      </p>
                    </div>
                    {getTagBadge(b)}
                  </div>

                  {/* Inter-Story Drift Gauge (Appears at t >= scadaTriggerSec) */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Inter-Story Drift:</span>
                      <span
                        className={`font-mono font-bold transition-colors duration-300 ${
                          !isScadaTriggered
                            ? "text-slate-400"
                            : isGymResonant
                            ? "text-yellow-400 font-black"
                            : isSoftStorey
                            ? "text-amber-400 font-black"
                            : "text-emerald-400 font-bold"
                        }`}
                      >
                        {isScadaTriggered
                          ? `${b.drift_ratio_pct.toFixed(2)}%`
                          : "0.00% (Normal)"}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          !isScadaTriggered
                            ? "bg-slate-700"
                            : isGymResonant
                            ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                            : isSoftStorey
                            ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        }`}
                        style={{
                          width: `${
                            isScadaTriggered
                              ? Math.min(100, Math.max(4, (b.drift_ratio_pct / 1.5) * 100))
                              : 2
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-0.5">
                      <span>Safe &lt;0.5%</span>
                      <span>Yield 1.0%</span>
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
                            : isGymResonant
                            ? "text-yellow-400 font-bold"
                            : "text-slate-200"
                        }`}
                      >
                        {isScadaTriggered ? b.collapse_probability : "< 0.1%"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">CWA Intensity:</span>{" "}
                      <span
                        className={`font-semibold font-mono ${
                          !isScadaTriggered
                            ? "text-slate-400"
                            : isGymResonant
                            ? "text-yellow-400 font-bold"
                            : "text-emerald-400 font-bold"
                        }`}
                      >
                        {isScadaTriggered
                          ? b.cwa_intensity === "3"
                            ? "Int 3 (≤3F Yellow)"
                            : "Int 2 (>3F Green)"
                          : "Normal"}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation / SCADA Interlock */}
                  <div className="mt-2 text-[10px] text-slate-400 leading-tight bg-slate-900/60 p-2 rounded border border-slate-800/80 min-h-[52px] flex flex-col justify-center">
                    <span className="text-cyan-400 font-bold block mb-0.5">
                      {isScadaTriggered ? "SCADA Interlock Action:" : "Triage Status:"}
                    </span>
                    <span className="text-slate-300">
                      {isScadaTriggered
                        ? b.action_recommendation
                        : is3rdStationDetected
                        ? `3-station trigger achieved at ${specs.t3rdStationSec.toFixed(1)}s. SCADA interlock inversion in ${Math.max(0, specs.scadaTriggerSec - currentT).toFixed(1)}s.`
                        : "Structural baseline verified intact. Standby for seismic trigger."}
                    </span>
                  </div>
                </div>

                {/* Priority & Lifelines */}
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">Priority #{b.priority_rank}</span>
                  <span
                    className={`font-mono ${
                      isScadaTriggered
                        ? isGymResonant
                          ? "text-yellow-400 font-bold"
                          : "text-emerald-400 font-bold"
                        : "text-cyan-400"
                    }`}
                  >
                    {b.connected_lifelines.length} Lifelines{" "}
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
