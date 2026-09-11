"use client";

import React from "react";
import { 
  Cpu, 
  Activity, 
  Map, 
  Bot, 
  ChevronLeft, 
  ChevronRight,
  Zap
} from "lucide-react";
import { Scenario } from "@/types/triage";

interface SidebarProps {
  activeTab: "rag_arch" | "eews" | "psha" | "copilot";
  onSelectTab: (tab: "rag_arch" | "eews" | "psha" | "copilot") => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedScenario: Scenario | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  selectedScenario,
}) => {
  const menuItems = [
    {
      id: "rag_arch",
      label: "RAG Architecture",
      icon: Cpu,
      badge: "0.009ms",
      desc: "Dual-track reflex and deliberative pipeline",
    },
    {
      id: "eews",
      label: "Real-Time EEWS",
      icon: Activity,
      badge: "Live",
      desc: "S-wave countdown and SCADA interlocks",
    },
    {
      id: "psha",
      label: "TEM PSHA Hazard",
      icon: Map,
      badge: "38 Faults",
      desc: "38 fault GIS and GMPE attenuation",
    },
    {
      id: "copilot",
      label: "AI Geotech Copilot",
      icon: Bot,
      badge: "SSE RAG",
      desc: "Domain geotechnical copilot with citations",
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] flex flex-col justify-between ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white font-black text-sm shadow-md shadow-cyan-500/20 font-mono">
              NCU
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase truncate">
                  Prototype
                </span>
                <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 truncate">
                  E-DREaM Lab x NVAITC
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="px-3 py-4 space-y-6">
          <div>
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-2 font-mono">
                RAG Visualization Menu
              </span>
            )}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id as any)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? "text-cyan-600 dark:text-cyan-400"
                            : "text-slate-400 dark:text-slate-400"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Scenario Card in Sidebar */}
          {!isCollapsed && selectedScenario && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  Active Simulation
                </span>
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {selectedScenario.fault_name}
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                <span>Magnitude:</span>
                <span className="font-bold text-cyan-700 dark:text-cyan-400">
                  Mw {selectedScenario.magnitude}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                <span>Predicted PGV:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {selectedScenario.predicted_pgv_cm_s} cm/s
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Speed Telemetry */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {!isCollapsed ? (
          <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-2.5 flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center space-x-2">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">Reflex:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">0.009 ms</span>
            </div>
            <span className="rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 border border-emerald-500/20 font-bold">
              OPTIMAL
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title="Reflex: 0.009ms">
            <Zap className="h-4 w-4 text-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
};
