"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layers, Sliders, TriangleAlert } from "lucide-react";

/**
 * TEM PSHA2025 hazard raster layers (Gao et al., 2026 - Fig. 13).
 *
 * Tiles are expected as an XYZ pyramid under the frontend's `public/tiles/` directory:
 *   /tiles/<layer_id>/{z}/{x}/{y}.png
 * Drop the exported rasters there; nothing else needs to change.
 */
export type HazardLayerId = "mean_475" | "median_475" | "mean_minus_median_475" | "median_2475";

export interface HazardLayer {
  id: HazardLayerId;
  label: string;
  short: string;
  returnPeriod: string;
  /** "seismic" = 0.0-1.6 g PGA; "diverging" = mean-minus-median anomaly in g. */
  scale: "seismic" | "diverging";
  unitTitle: string;
}

export const HAZARD_LAYERS: HazardLayer[] = [
  {
    id: "mean_475",
    label: "Mean Hazard Map",
    short: "Mean",
    returnPeriod: "RP = 475 yr",
    scale: "seismic",
    unitTitle: "PGA (g)",
  },
  {
    id: "median_475",
    label: "Median Hazard Map",
    short: "Median",
    returnPeriod: "RP = 475 yr",
    scale: "seismic",
    unitTitle: "PGA (g)",
  },
  {
    id: "mean_minus_median_475",
    label: "Mean Minus Median",
    short: "Mean − Median",
    returnPeriod: "RP = 475 yr",
    scale: "diverging",
    unitTitle: "PGA anomaly (g)",
  },
  {
    id: "median_2475",
    label: "Median Hazard Map",
    short: "Median",
    returnPeriod: "RP = 2475 yr",
    scale: "seismic",
    unitTitle: "PGA (g)",
  },
];

export const hazardLayerById = (id: HazardLayerId): HazardLayer =>
  HAZARD_LAYERS.find((l) => l.id === id) ?? HAZARD_LAYERS[0];

/** XYZ template for a hazard raster layer, served from the frontend's public directory. */
export const hazardTileUrl = (id: HazardLayerId) => `/tiles/${id}/{z}/{x}/{y}.png`;

/** Tile that covers the NCU / northern Taiwan area at zoom 7 - used to probe availability. */
export const HAZARD_PROBE_TILE = (id: HazardLayerId) => `/tiles/${id}/7/107/55.png`;

// Lowest to highest: 0.0 g (dark purple) -> 0.8 g (lime green) -> 1.6 g (dark red)
export const SEISMIC_GRADIENT = [
  "#3b0a5a", "#2c1e7a", "#253494", "#2a6fb0", "#2c9fb8", "#35b8a0", "#6cc98a",
  "#a8d874", "#d9e35c", "#f2e34c", "#f7c93f", "#f2a13c", "#eb7a3a", "#dd4f3a",
  "#c62f3a", "#a81e33", "#7f0f24",
];

// Lowest to highest: -0.5 g (blue) -> 0.0 g (white) -> +0.5 g (red)
export const DIVERGING_GRADIENT = [
  "#253494", "#4a7fbf", "#a8c4e0", "#eef2f7", "#ffffff", "#f7dede", "#f0a8a8",
  "#d95f5f", "#a81e33",
];

const verticalGradientCss = (scale: HazardLayer["scale"]) =>
  `linear-gradient(to top, ${(scale === "diverging" ? DIVERGING_GRADIENT : SEISMIC_GRADIENT).join(", ")})`;

const horizontalGradientCss = (scale: HazardLayer["scale"]) =>
  `linear-gradient(to right, ${(scale === "diverging" ? DIVERGING_GRADIENT : SEISMIC_GRADIENT).join(", ")})`;

const ticksFor = (scale: HazardLayer["scale"]): number[] =>
  scale === "diverging"
    ? [-0.5, -0.25, 0, 0.25, 0.5]
    : [0, 0.4, 0.8, 1.2, 1.6];

export const HazardColorbar: React.FC<{ layer: HazardLayerId }> = ({ layer }) => {
  const def = hazardLayerById(layer);
  const ticks = ticksFor(def.scale);

  return (
    <div className="pointer-events-auto rounded-lg border border-slate-200/80 bg-white/90 p-2 shadow-xl backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/85">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          {def.unitTitle}
        </span>
        <span className="font-mono text-[8px] text-cyan-600 dark:text-cyan-300">{def.returnPeriod}</span>
      </div>
      <div className="flex items-stretch gap-1.5">
        <div
          className="w-3 rounded-sm border border-black/20 dark:border-white/20 shadow-inner"
          style={{ height: 140, background: verticalGradientCss(def.scale) }}
        />
        <div className="flex flex-col justify-between" style={{ height: 140 }}>
          {ticks
            .slice()
            .reverse()
            .map((t) => (
              <span
                key={t}
                className="font-mono text-[8px] leading-none text-slate-600 dark:text-slate-300"
              >
                {t > 0 ? `+${t.toFixed(1)}` : t.toFixed(1)}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

interface HazardControlPanelProps {
  activeLayer: HazardLayerId;
  onSelectLayer: (id: HazardLayerId) => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  showStructures: boolean;
  onToggleStructures: () => void;
  showHillshade: boolean;
  onToggleHillshade: () => void;
  coverBasemap?: boolean;
  onToggleCoverBasemap?: () => void;
  /** null while probing, false when no tile answered. */
  tilesAvailable: boolean | null;
}

export const HazardControlPanel: React.FC<HazardControlPanelProps> = ({
  activeLayer,
  onSelectLayer,
  opacity,
  onOpacityChange,
  showStructures,
  onToggleStructures,
  showHillshade,
  onToggleHillshade,
  coverBasemap,
  onToggleCoverBasemap,
  tilesAvailable,
}) => {
  const [open, setOpen] = useState<boolean>(true);
  const activeDef = hazardLayerById(activeLayer);
  const ticks = ticksFor(activeDef.scale);

  return (
    <div className="pointer-events-auto w-[256px] overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/90">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
          <Layers className="h-3.5 w-3.5 text-cyan-500" />
          Hazard raster layers
        </span>
        <div className="flex items-center gap-1">
          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-cyan-600 dark:text-cyan-400">
            {activeDef.short}
          </span>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-slate-200/80 px-3 py-2.5 dark:border-slate-800">
          {/* Radio group: exactly one hazard raster at a time */}
          <fieldset className="space-y-1">
            <legend className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hazard map (one at a time)
            </legend>
            {HAZARD_LAYERS.map((layer) => (
              <label
                key={layer.id}
                className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition ${
                  activeLayer === layer.id
                    ? "bg-cyan-500/15 ring-1 ring-cyan-500/40"
                    : "hover:bg-slate-500/10"
                }`}
              >
                <input
                  type="radio"
                  name="hazard-layer"
                  checked={activeLayer === layer.id}
                  onChange={() => onSelectLayer(layer.id)}
                  className="mt-0.5 h-3 w-3 accent-cyan-500"
                />
                <span className="leading-tight">
                  <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                    {layer.label}
                  </span>
                  <span className="block font-mono text-[9px] text-slate-500 dark:text-slate-400">
                    {layer.returnPeriod} ·{" "}
                    {layer.scale === "diverging" ? "−0.5 to +0.5 g" : "0.0 to 1.6 g"}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {/* Integrated Color Scale for the active layer */}
          <div className="rounded-lg border border-slate-200/90 bg-slate-50/90 p-2 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-1 flex items-center justify-between text-[9px]">
              <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {activeDef.unitTitle}
              </span>
              <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                {activeDef.returnPeriod}
              </span>
            </div>
            <div
              className="h-2.5 w-full rounded-sm border border-black/15 shadow-inner dark:border-white/20"
              style={{ background: horizontalGradientCss(activeDef.scale) }}
            />
            <div className="mt-1 flex justify-between font-mono text-[8px] text-slate-500 dark:text-slate-400">
              {ticks.map((t) => (
                <span key={t}>{t > 0 ? `+${t.toFixed(1)}` : t.toFixed(1)}</span>
              ))}
            </div>
          </div>

          {/* Independent overlays */}
          <fieldset className="space-y-1 border-t border-slate-200/80 pt-2 dark:border-slate-800">
            <legend className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overlays
            </legend>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-slate-700 transition hover:bg-slate-500/10 dark:text-slate-200">
              <input
                type="checkbox"
                checked={showStructures}
                onChange={onToggleStructures}
                className="h-3 w-3 accent-cyan-500"
              />
              Fault traces / structures
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-slate-700 transition hover:bg-slate-500/10 dark:text-slate-200">
              <input
                type="checkbox"
                checked={showHillshade}
                onChange={onToggleHillshade}
                className="h-3 w-3 accent-cyan-500"
              />
              Hillshade topography
            </label>
            {onToggleCoverBasemap && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-slate-700 transition hover:bg-slate-500/10 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={coverBasemap ?? true}
                  onChange={onToggleCoverBasemap}
                  className="h-3 w-3 accent-cyan-500"
                />
                Cover Taiwan basemap
              </label>
            )}
          </fieldset>

          {/* Raster transparency */}
          <div className="border-t border-slate-200/80 pt-2 dark:border-slate-800">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Sliders className="h-3 w-3" />
                Raster opacity
              </span>
              <span className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-300">
                {opacity}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="h-1 w-full cursor-pointer accent-cyan-500"
              aria-label="Hazard raster opacity"
            />
          </div>

          {tilesAvailable === false && (
            <p className="flex items-start gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[9px] leading-snug text-amber-700 dark:text-amber-300">
              <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                No tiles answered at{" "}
                <code className="font-mono">/tiles/{activeLayer}/…</code>. Drop the XYZ pyramid in{" "}
                <code className="font-mono">public/tiles/</code>.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
