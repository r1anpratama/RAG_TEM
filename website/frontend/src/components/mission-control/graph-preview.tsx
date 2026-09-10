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
    <div className="flex flex-col space-y-2 rounded-xl border border-slate-800 bg-slate_obsidian-card p-3 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center space-x-2">
          <GitFork className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Geo-GraphRAG Cascading Ruptures (TEM Table 2)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          Spatial Traversal Active
        </span>
      </div>

      <div className="space-y-2">
        {items.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-xs hover:border-slate-700 transition"
          >
            <div className="space-y-0.5">
              <div className="font-bold text-slate-200">
                {c.pairing_label || `${primaryFaultName} ↔ Fault #${c.target_fault_id}`}
              </div>
              <div className="text-[10px] text-slate-400">
                Mechanism: <span className="text-slate-300">{c.rupture_interaction_type || "COSEISMIC_TRANSFER"}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-extrabold text-amber-400">
                Mw {c.combined_mw || c.joint_magnitude_mw || 7.15}
              </span>
              <div className="text-[9px] text-slate-500 font-mono">
                {c.recurrence_interval_yr ? `${c.recurrence_interval_yr} yr return` : "Cascading risk"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1 font-mono">
        <span>Knowledge Graph: 38 Fault Nodes</span>
        <span className="text-cyan-400 font-medium">Multi-Hop Traversal</span>
      </div>
    </div>
  );
};
