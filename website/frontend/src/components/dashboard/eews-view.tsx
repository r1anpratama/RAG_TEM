"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AlertBanner } from "@/components/mission-control/alert-banner";
import { DigitalTwins } from "@/components/mission-control/digital-twins";
import { ScadaPanel } from "@/components/mission-control/scada-panel";
import { Scenario, FaultTrace } from "@/types/triage";
import { Map as MapIcon, Box } from "lucide-react";

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

const NCU3DCampus = dynamic(
  () =>
    import("@/components/mission-control/ncu-3d-campus").then(
      (mod) => mod.NCU3DCampus
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-cyan-400 text-xs font-mono">
        Loading NCU Real Campus 3D WebGL Digital Twin...
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
  const [activeCampusView, setActiveCampusView] = useState<"gis" | "3d_campus">("gis");

  return (
    <div className="flex flex-col space-y-4">
      {/* Real-time S-wave countdown clock alert banner */}
      <AlertBanner scenario={scenario} isSimulating={isSimulating} />

      {/* Main split: Left = GIS Wavefront Map / 3D Campus Twin, Right = SCADA Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 flex flex-col space-y-2">
          {/* Top Switcher: GIS Aerial Satellite Map vs 3D Real Campus Twin */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/90 p-1 backdrop-blur-md shadow-sm">
              <button
                onClick={() => setActiveCampusView("gis")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  activeCampusView === "gis"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>GIS Aerial Satellite Map</span>
              </button>
              <button
                onClick={() => setActiveCampusView("3d_campus")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  activeCampusView === "3d_campus"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Box className="h-3.5 w-3.5 text-indigo-400" />
                <span>NCU 3D Real Campus Twin</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <span>Target:</span>
              <span className="font-bold text-cyan-300">NCU Taoyuan Campus Core</span>
            </div>
          </div>

          {/* Interactive Viewer Container */}
          <div className="h-[440px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-slate-100 dark:bg-slate_obsidian-900 relative isolate">
            {activeCampusView === "gis" ? (
              <GisMap
                faults={faults}
                scenario={scenario}
                selectedFaultId={2}
                isSimulating={isSimulating}
              />
            ) : (
              <NCU3DCampus
                scenario={scenario}
                isSimulating={isSimulating}
              />
            )}
          </div>
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

      {/* Campus Digital Twins - Neutral standby in idle, evaluated in simulation */}
      <DigitalTwins facilities={[]} isSimulating={isSimulating} />
    </div>
  );
};
