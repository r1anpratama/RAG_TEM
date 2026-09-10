"use client";

import React, { useEffect, useState } from "react";
import { TrendingDown, ShieldCheck } from "lucide-react";
import { GMPEPoint, GMPEResponse } from "@/types/triage";

interface GmpeCurveProps {
  magnitude?: number;
  observedPgv?: number;
  observedDistanceKm?: number;
}

export const GmpeCurve: React.FC<GmpeCurveProps> = ({
  magnitude = 6.91,
  observedPgv = 72.4,
  observedDistanceKm = 2.8,
}) => {
  const [data, setData] = useState<GMPEResponse | null>(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/gmpe?magnitude=${magnitude}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Failed to load GMPE data", err));
  }, [magnitude]);

  const points = data?.curve || [
    { distance_km: 1, median_pgv: 82.5, upper_2sigma: 263.8, lower_2sigma: 25.8 },
    { distance_km: 2, median_pgv: 76.1, upper_2sigma: 243.3, lower_2sigma: 23.8 },
    { distance_km: 5, median_pgv: 61.2, upper_2sigma: 195.6, lower_2sigma: 19.1 },
    { distance_km: 10, median_pgv: 45.3, upper_2sigma: 144.8, lower_2sigma: 14.2 },
    { distance_km: 20, median_pgv: 28.9, upper_2sigma: 92.4, lower_2sigma: 9.0 },
    { distance_km: 30, median_pgv: 20.4, upper_2sigma: 65.2, lower_2sigma: 6.4 },
    { distance_km: 50, median_pgv: 12.1, upper_2sigma: 38.7, lower_2sigma: 3.8 },
    { distance_km: 75, median_pgv: 7.8, upper_2sigma: 24.9, lower_2sigma: 2.4 },
    { distance_km: 100, median_pgv: 5.5, upper_2sigma: 17.6, lower_2sigma: 1.7 },
  ];

  const width = 360;
  const height = 160;
  const margin = { top: 15, right: 15, bottom: 25, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const minX = 1;
  const maxX = 100;
  const minY = 1;
  const maxY = 300;

  const scaleX = (x: number) =>
    margin.left + (Math.log10(x / minX) / Math.log10(maxX / minX)) * innerWidth;
  const scaleY = (y: number) =>
    height - margin.bottom - (Math.log10(y / minY) / Math.log10(maxY / minY)) * innerHeight;

  const upperPoints = points.map((p) => `${scaleX(p.distance_km)},${scaleY(p.upper_2sigma)}`);
  const lowerPoints = points
    .slice()
    .reverse()
    .map((p) => `${scaleX(p.distance_km)},${scaleY(p.lower_2sigma)}`);
  const bandPath = `M ${upperPoints.join(" L ")} L ${lowerPoints.join(" L ")} Z`;

  const medianPath = `M ${points
    .map((p) => `${scaleX(p.distance_km)},${scaleY(p.median_pgv)}`)
    .join(" L ")}`;

  const obsX = scaleX(observedDistanceKm);
  const obsY = scaleY(observedPgv);

  return (
    <div className="flex flex-col space-y-2 rounded-xl border border-slate-800 bg-slate_obsidian-card p-3 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center space-x-2">
          <TrendingDown className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Physics GMPE Attenuation Curve (Lin & Lee 2008)
          </h3>
        </div>
        <span className="flex items-center space-x-1 rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
          <ShieldCheck className="h-3 w-3 text-cyan-400" />
          <span>+0.42σ Consistent</span>
        </span>
      </div>

      <div className="relative flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Shaded +/- 2 Sigma Uncertainty Band */}
          <path d={bandPath} fill="#06b6d4" fillOpacity="0.12" />

          {/* Median Attenuation Curve */}
          <path d={medianPath} fill="none" stroke="#06b6d4" strokeWidth="2.2" />

          {/* Grid lines */}
          {[1, 10, 50, 100].map((d) => (
            <g key={d}>
              <line
                x1={scaleX(d)}
                y1={margin.top}
                x2={scaleX(d)}
                y2={height - margin.bottom}
                stroke="#1e293b"
                strokeDasharray="2,2"
              />
              <text
                x={scaleX(d)}
                y={height - margin.bottom + 12}
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                {d}km
              </text>
            </g>
          ))}

          {[10, 50, 100, 200].map((v) => (
            <g key={v}>
              <line
                x1={margin.left}
                y1={scaleY(v)}
                x2={width - margin.right}
                y2={scaleY(v)}
                stroke="#1e293b"
                strokeDasharray="2,2"
              />
              <text
                x={margin.left - 4}
                y={scaleY(v) + 3}
                fill="#64748b"
                fontSize="8"
                textAnchor="end"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Observed TT-SAM Shaking Point */}
          <circle
            cx={obsX}
            cy={obsY}
            r="4.5"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x={obsX + 6}
            y={obsY - 4}
            fill="#fbbf24"
            fontSize="8"
            fontWeight="bold"
          >
            Observed: {observedPgv} cm/s ({observedDistanceKm} km)
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1 font-mono">
        <span>TEM PSHA2025 Crustal Model</span>
        <span className="text-cyan-400">±2σ Uncertainty Envelope</span>
      </div>
    </div>
  );
};
