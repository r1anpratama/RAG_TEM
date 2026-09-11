"use client";

import React from "react";
import dynamic from "next/dynamic";
import { AlertBanner } from "@/components/mission-control/alert-banner";
import { DigitalTwins } from "@/components/mission-control/digital-twins";
import { ScadaPanel } from "@/components/mission-control/scada-panel";
import { Scenario, FaultTrace } from "@/types/triage";

const GisMap = dynamic(
  () =>
    import("@/components/mission-control/gis-map").then((mod) => mod.GisMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate_obsidian-900 text-slate-400 text-xs">
        Initializing Taiwan Wavefront GIS Basemap...
      </div>
    ),
  }
);

interface EEWSViewProps {
  scenario: Scenario | null;
  faults: FaultTrace[];
  isSimulating: boolean;
}

export const EEWSView: React.FC<EEWSViewProps> = ({
  scenario,
  faults,
  isSimulating,
}) => {
  return (
    <div className="flex flex-col space-y-4">
      {/* Real-time S-wave countdown clock alert banner */}
      <AlertBanner scenario={scenario} isSimulating={isSimulating} />

      {/* Main split: Left = GIS Wavefront Map, Right = SCADA Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 h-[420px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-slate-100 dark:bg-slate_obsidian-900 relative isolate">
          <GisMap
            faults={faults}
            scenario={scenario}
            selectedFaultId={2}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col space-y-4">
          <ScadaPanel
            actuators={scenario?.track_a_actuators}
            triggerStatus="ACTIVATED_SUB_5MS"
            latencyMs={1.84}
          />

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card p-4 space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Wavefront Propagation Telemetry
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
              <div className="rounded bg-slate-900/90 p-2 border border-slate-200 dark:border-slate-800">
                <span className="text-cyan-400 block font-bold">P-Wave Velocity:</span>
                ~ 6.0 km/s (Compressional)
              </div>
              <div className="rounded bg-slate-900/90 p-2 border border-slate-200 dark:border-slate-800">
                <span className="text-amber-400 block font-bold">S-Wave Velocity:</span>
                ~ 3.5 km/s (Shear Damaging)
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              Warning lead time is maximized by automated Track A reflex cutoffs occurring within the 0 to 7.2 second S-wave arrival window.
            </p>
          </div>
        </div>
      </div>

      {/* Campus Digital Twins */}
      <DigitalTwins facilities={[]} />
    </div>
  );
};
