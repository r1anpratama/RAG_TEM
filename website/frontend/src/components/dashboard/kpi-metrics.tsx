"use client";

import React from "react";
import { Zap, Cpu, MapPin, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Scenario } from "@/types/triage";

interface KpiMetricsProps {
  scenario: Scenario | null;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ scenario }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Track A Reflex */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 sm:p-5 shadow-sm dark:shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Track A Reflex Latency
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            0.009 ms
          </span>
          <span className="flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            <ArrowUpRight className="h-3 w-3" />
            99.8% optimal
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Target &lt; 5.0 ms | Sub-millisecond SCADA interlocks
        </p>
      </div>

      {/* Metric 2: Track B Deliberation */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 sm:p-5 shadow-sm dark:shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Track B Deliberative
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            0.87 ms
          </span>
          <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">
            4-Agent Swarm
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Parallel spatial graph reasoning &amp; safety validation
        </p>
      </div>

      {/* Metric 3: Active Seismogenic Faults */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 sm:p-5 shadow-sm dark:shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Seismogenic Structures
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <MapPin className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            38 Faults
          </span>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
            TEM PSHA 2025
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Table 2 cascading ruptures &amp; Lin &amp; Lee GMPE logic trees
        </p>
      </div>

      {/* Metric 4: Monitored Facility Health */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 sm:p-5 shadow-sm dark:shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Facility Triage Status
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            2.14% Drift
          </span>
          <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30">
            RED TAG
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          NCU Science B4 (Pre-1999 Soft Storey) | 3 Safe
        </p>
      </div>
    </div>
  );
};
