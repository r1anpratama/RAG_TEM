"use client";

import React, { useState } from "react";
import { CWA_INTENSITY_SCALE, CwaLevelInfo } from "@/lib/cwa-intensity";
import { Info } from "lucide-react";

interface CwaIntensityColorbarProps {
  compact?: boolean;
  className?: string;
  activeIntensity?: string;
  onSelectLevel?: (level: string) => void;
}

export const CwaIntensityColorbar: React.FC<CwaIntensityColorbarProps> = ({
  compact = false,
  className = "",
  activeIntensity,
  onSelectLevel,
}) => {
  const [hoveredLevel, setHoveredLevel] = useState<CwaLevelInfo | null>(null);
  const levels = Object.values(CWA_INTENSITY_SCALE);

  return (
    <div
      className={`flex flex-col bg-slate-950/90 rounded-lg border border-slate-800 backdrop-blur-md shadow-lg p-2 ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-1.5 px-0.5">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span className="font-bold text-slate-100 uppercase tracking-wider">
            CWA Intensity Scale
          </span>
          <span className="text-[9px] text-slate-400 font-sans">(中央氣象署震度)</span>
        </div>
        {hoveredLevel ? (
          <span className="text-[9px] text-amber-300 font-bold font-mono">
            {hoveredLevel.level} ({hoveredLevel.nameZh}): {hoveredLevel.pgaRange}
          </span>
        ) : (
          <span className="text-[9px] text-slate-400 font-mono">Unit: Gal (cm/s²)</span>
        )}
      </div>

      {/* The 10-step Gradient Segmented Bar */}
      <div className="grid grid-cols-10 gap-0.5 rounded overflow-hidden p-0.5 bg-slate-900 border border-slate-800">
        {levels.map((item) => {
          const isActive =
            activeIntensity &&
            activeIntensity.replace(/^Int\s*/i, "").trim() === item.level;

          return (
            <button
              key={item.level}
              onMouseEnter={() => setHoveredLevel(item)}
              onMouseLeave={() => setHoveredLevel(null)}
              onClick={() => onSelectLevel && onSelectLevel(item.level)}
              title={`${item.level} (${item.nameZh} / ${item.nameEn}): ${item.pgaRange}`}
              style={{ backgroundColor: item.color }}
              className={`h-5 flex items-center justify-center rounded-sm transition-transform relative group ${
                isActive ? "ring-2 ring-white scale-110 z-10" : "hover:scale-105"
              }`}
            >
              <span
                style={{ color: item.textColor }}
                className="text-[9px] font-bold font-mono leading-none drop-shadow-sm"
              >
                {item.level}
              </span>
            </button>
          );
        })}
      </div>

      {/* Threshold Labels Below Bar (in non-compact mode) */}
      {!compact && (
        <div className="grid grid-cols-10 gap-0.5 text-[8px] font-mono text-slate-400 mt-1 px-0.5 text-center">
          <span>&lt;0.8</span>
          <span>0.8</span>
          <span>2.5</span>
          <span>8.0</span>
          <span>25</span>
          <span>80</span>
          <span>140</span>
          <span>250</span>
          <span>440</span>
          <span>800+</span>
        </div>
      )}
    </div>
  );
};
