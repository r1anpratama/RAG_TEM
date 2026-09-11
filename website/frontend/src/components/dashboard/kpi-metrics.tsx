"use client";

import React from "react";
import { Activity, Cpu, Building2, AlertTriangle } from "lucide-react";
import { Scenario } from "@/types/triage";

interface KpiMetricsProps {
  scenario: Scenario | null;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ scenario }) => {
  const intensity = scenario?.estimated_cwa_intensity || "5-Strong";
  const pgv = scenario?.predicted_pgv_cm_s ? scenario.predicted_pgv_cm_s.toFixed(1) : "28.4";
  const isCritical = intensity.includes("6") || intensity.includes("7") || Number(pgv) >= 30;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: AI Model Used */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 sm:p-5 shadow-sm dark:shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            AI Early Warning Model
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            TT-SAM
          </span>
          <span className="flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Transformer
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Chen et al. (2026) | NCU E-DREaM Deep Learning Framework
        </p>
      </div>

      {/* Card 2: Compute Engine */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 sm:p-5 shadow-sm dark:shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Inference Compute Engine
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            RTX 3090
          </span>
          <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
            9.43 ms Latency
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          NVIDIA 24GB VRAM | Sub-second edge inference per rolling update
        </p>
      </div>

      {/* Card 3: Target Predicted Site */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 sm:p-5 shadow-sm dark:shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Target Predicted Site
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-1">
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white truncate" title="National Central University">
            National Central University
          </span>
          <span className="shrink-0 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            NCU
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {scenario?.distance_to_target_km ? `${scenario.distance_to_target_km} km from Epicenter` : "Taoyuan Campus"} | Building Digital Twins
        </p>
      </div>

      {/* Card 4: Estimated Felt Intensity */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 sm:p-5 shadow-sm dark:shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Estimated Felt Intensity
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              isCritical
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            {intensity}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border ${
              isCritical
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
            }`}
          >
            {pgv} cm/s PGV
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Taiwan CWA Intensity Scale | Direct structural damage proxy
        </p>
      </div>
    </div>
  );
};

