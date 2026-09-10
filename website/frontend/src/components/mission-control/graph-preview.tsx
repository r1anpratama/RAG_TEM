"use client";

import React from "react";
import { GitFork } from "lucide-react";

interface CascadingRupture {
  target_fault_id?: number;
  target_fault_name?: string;
  joint_magnitude_mw?: number;
  rupture_interaction_type?: string;
  combined_mw?: number;
  recurrence_interval_yr?: number;
  pairing_label?: string;
}

interface GraphPreviewProps {
  cascades?: CascadingRupture[];
  primaryFaultName?: string;
}

export const GraphPreview: React.FC<GraphPreviewProps> = ({
  cascades,
  primaryFaultName = "Shuanglienpo Fault (#2)",
}) => {
  const defaultCascades: CascadingRupture[] = [
    {
      pairing_label: "Shuanglienpo Fault (#2) ↔ Hukou Fault (#3)",
      combined_mw: 7.15,
      recurrence_interval_yr: 350,
      rupture_interaction_type: "COSEISMIC_STRESS_TRIGGERING",
    },
    {
      pairing_label: "Shuanglienpo Fault (#2) ↔ Shanchiao Fault (#1)",
      combined_mw: 7.28,
      recurrence_interval_yr: 620,
      rupture_interaction_type: "SEGMENT_CASCADE",
    },
  ];

  const items = cascades && cascades.length > 0 ? cascades : defaultCascades;

  return (
    <div className="flex flex-col space-y-2 rounded-xl border border-prussian_blue-600/40 bg-prussian_blue-500/25 p-3 backdrop-blur-sm shadow-md">
      <div className="flex items-center justify-between border-b border-prussian_blue-600/40 pb-1.5">
        <div className="flex items-center space-x-2">
          <GitFork className="h-4 w-4 text-orange-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white-500">
            Geo-GraphRAG Cascading Ruptures (TEM Table 2)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-prussian_blue-800 bg-prussian_blue-600/30 px-2 py-0.5 rounded border border-prussian_blue-600/50">
          Spatial Traversal Active
        </span>
      </div>

      <div className="space-y-2">
        {items.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-prussian_blue-600/40 bg-black-500/90 p-2 text-xs"
          >
            <div className="space-y-0.5">
              <div className="font-bold text-white-500">
                {c.pairing_label || `${primaryFaultName} ↔ Fault #${c.target_fault_id}`}
              </div>
              <div className="text-[10px] text-prussian_blue-800">
                Mechanism: <span className="text-alabaster_grey-500">{c.rupture_interaction_type || "COSEISMIC_TRANSFER"}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-extrabold text-orange-500">
                Mw {c.combined_mw || c.joint_magnitude_mw || 7.15}
              </span>
              <div className="text-[9px] text-prussian_blue-800 font-mono">
                {c.recurrence_interval_yr ? `${c.recurrence_interval_yr} yr return` : "Cascading risk"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-prussian_blue-800 border-t border-prussian_blue-600/40 pt-1 font-mono">
        <span>Knowledge Graph: 38 Fault Nodes</span>
        <span className="text-orange-500 font-medium">Multi-Hop Traversal</span>
      </div>
    </div>
  );
};
