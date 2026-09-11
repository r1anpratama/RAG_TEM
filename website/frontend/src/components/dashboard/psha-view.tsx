"use client";

import React from "react";
import dynamic from "next/dynamic";
import { GmpeCurve } from "@/components/mission-control/gmpe-curve";
import { GraphPreview } from "@/components/mission-control/graph-preview";
import { Scenario, FaultTrace } from "@/types/triage";

const GisMap = dynamic(
  () =>
    import("@/components/mission-control/gis-map").then((mod) => mod.GisMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate_obsidian-900 text-slate-400 text-xs">
        Loading 38 Seismogenic Faults GIS...
      </div>
    ),
  }
);

interface PSHAViewProps {
  scenario: Scenario | null;
  faults: FaultTrace[];
}

export const PSHAView: React.FC<PSHAViewProps> = ({ scenario, faults }) => {
  return (
    <div className="flex flex-col space-y-4">
      {/* Overview Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
            Probabilistic Seismic Hazard Analysis
          </span>
          <h2 className="text-base font-bold text-white">
            Taiwan Earthquake Model (TEM PSHA 2025) Hazard Evaluation
          </h2>
          <p className="text-xs text-slate-400">
            Evaluating 38 on-land seismogenic structures, Table 2 cascading rupture probabilities, and crustal ground motion prediction equations.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="rounded bg-slate-900 px-2.5 py-1 text-slate-300 border border-slate-200 dark:border-slate-800">
            38 Fault Traces
          </span>
          <span className="rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 font-bold">
            Lin &amp; Lee (2008) Logic Tree
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 38 Fault GIS Map */}
        <div className="lg:col-span-7 h-[500px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-slate-100 dark:bg-slate_obsidian-900 relative isolate">
          <GisMap
            faults={faults}
            scenario={scenario}
            selectedFaultId={2}
          />
        </div>

        {/* Right: GMPE Curve & Graph */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <GmpeCurve
            magnitude={scenario?.magnitude || 6.91}
            observedPgv={scenario?.predicted_pgv_cm_s || 72.4}
            observedDistanceKm={scenario?.distance_to_target_km || 2.8}
          />

          <GraphPreview
            primaryFaultName={scenario?.fault_name || "Shuanglienpo Fault (#2)"}
          />
        </div>
      </div>
    </div>
  );
};
