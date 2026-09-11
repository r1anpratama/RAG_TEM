"use client";

import React from "react";
import { 
  Menu, 
  Play, 
  Bell
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Scenario } from "@/types/triage";

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTabLabel: string;
  scenarios: Scenario[];
  selectedScenario: Scenario | null;
  onSelectScenario: (scenario: Scenario) => void;
  onTriggerSimulation: () => void;
  isSimulating: boolean;
  backendHealth: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeTabLabel,
  scenarios,
  selectedScenario,
  onSelectScenario,
  onTriggerSimulation,
  isSimulating,
  backendHealth,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0b0f19]/90 px-4 sm:px-6 backdrop-blur-xl transition-colors duration-200">
      {/* Left: Sidebar Hamburger Toggle + Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-medium text-slate-400 dark:text-slate-400">Dashboard</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {activeTabLabel}
          </span>
        </div>
      </div>

      {/* Right: Controls, Theme Switcher and User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Scenario Selector Dropdown */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
          <span className="text-[11px] text-slate-600 dark:text-slate-400 pl-2 font-medium">
            Scenario:
          </span>
          <select
            value={selectedScenario?.id || ""}
            onChange={(e) => {
              const sc = scenarios.find((s) => s.id === e.target.value);
              if (sc) onSelectScenario(sc);
            }}
            className="bg-white dark:bg-[#111c2e] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-sm"
          >
            {scenarios.map((sc) => (
              <option
                key={sc.id}
                value={sc.id}
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                {sc.title} (Mw {sc.magnitude})
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Wave Action Button */}
        <button
          onClick={onTriggerSimulation}
          disabled={isSimulating}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-md shadow-amber-500/20 border border-amber-400/40 disabled:opacity-50"
        >
          <Play className="h-3 w-3 fill-current" />
          <span className="hidden sm:inline">
            {isSimulating ? "Simulating..." : "Trigger Wave"}
          </span>
        </button>

        {/* FastAPI Status Pill */}
        <div className="flex items-center space-x-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 shadow-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              backendHealth ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          ></span>
          <span className="hidden md:inline">
            {backendHealth ? "FastAPI Online" : "Offline"}
          </span>
        </div>

        {/* Notification Alert Bell */}
        <div className="relative">
          <button
            aria-label="System Notifications"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Bell className="h-4 w-4" />
          </button>
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        </div>

        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* Institution Profile Emblem */}
        <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-black text-xs font-mono">
            NCU
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
              E-DREaM Lab
            </span>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
              Admin Console
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
