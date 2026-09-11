"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Zap,
  Info,
  ChevronDown,
  Layers,
  Radio
} from "lucide-react";
import simulationData from "@/data/meinong-simulation-data.json";

interface WaveformPreviewStation {
  role: string;
  label: string;
  station_name: string;
  distance_km: number;
  cwa_intensity: string;
  warning_lead_time_sec: number;
  sampling_rate_hz: number;
  original_sampling_rate_hz: number;
  duration_sec: number;
  p_pick_sample: number;
  p_pick_sec: number;
  units: {
    acc: string;
    vel: string;
  };
  max_abs_acc_gal: number;
  max_abs_vel_cm_s: number;
  acc: {
    z: number[];
    ns: number[];
    ew: number[];
  };
  vel: {
    z: number[];
    ns: number[];
    ew: number[];
  };
}

interface SimulationWaveformPanelProps {
  isSimulating?: boolean;
}

export const SimulationWaveformPanel: React.FC<SimulationWaveformPanelProps> = ({
  isSimulating = false,
}) => {
  const previews = simulationData.waveform_previews as Record<string, WaveformPreviewStation>;
  const stationKeys = Object.keys(previews);

  // Active station
  const [selectedStation, setSelectedStation] = useState<string>("KAU068");
  // Signal type: acc (Gal) or vel (cm/s)
  const [signalType, setSignalType] = useState<"acc" | "vel">("acc");
  // Component view: all 3 or single
  const [activeComponent, setActiveComponent] = useState<"all" | "z" | "ns" | "ew">("all");

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const currentStationData = previews[selectedStation] || previews["KAU068"];

  // Sync with isSimulating prop if provided
  useEffect(() => {
    if (isSimulating) {
      setIsPlaying(true);
    }
  }, [isSimulating]);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const step = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        setCurrentTimeSec((prev) => {
          const next = prev + delta * playbackSpeed;
          if (next >= currentStationData.duration_sec) {
            setIsPlaying(false);
            return currentStationData.duration_sec;
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(step);
      };

      animFrameRef.current = requestAnimationFrame(step);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentStationData.duration_sec]);

  // Reset or scrub
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTimeSec(0);
  };

  const handlePlayToggle = () => {
    if (currentTimeSec >= currentStationData.duration_sec) {
      setCurrentTimeSec(0);
    }
    setIsPlaying(!isPlaying);
  };

  // TT-SAM State logic based on current elapsed time and p_pick
  const ttState = useMemo(() => {
    const pPick = currentStationData.p_pick_sec;
    if (currentTimeSec < pPick) {
      return {
        label: "STANDBY / PRE-EVENT NOISE",
        color: "bg-slate-800 text-slate-400 border-slate-700",
        description: "Sensor monitoring baseline ambient vibrations.",
      };
    } else if (currentTimeSec < pPick + 3.0) {
      return {
        label: "P-WAVE ARRIVAL • MODEL TRIGGER",
        color: "bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse",
        description: "TT-SAM extracting 3-sec initial temporal features (Pd, Tau_c).",
      };
    } else if (currentTimeSec < pPick + 13.0) {
      return {
        label: "EARLY ALERT ACTIVE • ROLLING UPDATE",
        color: "bg-red-950/80 text-red-300 border-red-500 shadow-md shadow-red-500/20",
        description: "TT-SAM initial warning issued; updating intensity with rolling window.",
      };
    } else {
      return {
        label: "FORECAST CONVERGED • MAXIMUM SHAKING",
        color: "bg-emerald-950/80 text-emerald-300 border-emerald-500",
        description: "Full waveform converged; peak ground motion recorded.",
      };
    }
  }, [currentTimeSec, currentStationData.p_pick_sec]);

  // Helper to render SVG trace
  const renderTrace = (
    channelName: string,
    channelLabel: string,
    color: string,
    data: number[],
    pPickSec: number,
    durationSec: number,
    height: number = 80
  ) => {
    if (!data || data.length === 0) return null;

    const width = 500;
    const maxVal = Math.max(...data.map(Math.abs), 0.001);
    const totalPoints = data.length;

    // Current index in data
    const currentFraction = Math.min(1, Math.max(0, currentTimeSec / durationSec));
    const currentIndex = Math.floor(currentFraction * totalPoints);

    // Build visible path up to currentIndex
    const visibleData = data.slice(0, Math.max(1, currentIndex));
    const pointsString = visibleData
      .map((val, idx) => {
        const x = (idx / (totalPoints - 1)) * width;
        const y = height / 2 - (val / maxVal) * (height / 2) * 0.85;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    // Full faint ghost path for context
    const ghostPointsString = data
      .map((val, idx) => {
        const x = (idx / (totalPoints - 1)) * width;
        const y = height / 2 - (val / maxVal) * (height / 2) * 0.85;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    // P-pick X coordinate
    const pPickX = (pPickSec / durationSec) * width;
    const playheadX = currentFraction * width;

    // TT-SAM Window [P, P+3s] and [P, P+13s]
    const pPlus3X = Math.min(width, ((pPickSec + 3) / durationSec) * width);
    const pPlus13X = Math.min(width, ((pPickSec + 13) / durationSec) * width);

    return (
      <div className="flex flex-col bg-slate-950/70 rounded-lg p-2 border border-slate-800/80 relative overflow-hidden">
        {/* Channel header */}
        <div className="flex items-center justify-between text-[11px] mb-1 px-1">
          <div className="flex items-center space-x-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="font-bold font-mono text-slate-200">{channelLabel}</span>
            <span className="text-[10px] text-slate-400 font-mono">({channelName})</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Peak:{" "}
            <span className="text-slate-200 font-bold">
              {maxVal < 0.1 ? maxVal.toFixed(4) : maxVal.toFixed(2)}{" "}
              {signalType === "acc" ? "Gal" : "cm/s"}
            </span>
          </div>
        </div>

        {/* SVG Oscilloscope Display */}
        <div className="relative w-full h-[75px] bg-slate-950 border border-slate-900 rounded overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full preserve-3d"
            preserveAspectRatio="none"
          >
            {/* Background Grid Lines */}
            <line
              x1="0"
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke="#334155"
              strokeDasharray="2,4"
              strokeWidth="0.8"
            />
            <line
              x1="0"
              y1={height * 0.15}
              x2={width}
              y2={height * 0.15}
              stroke="#1e293b"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1={height * 0.85}
              x2={width}
              y2={height * 0.85}
              stroke="#1e293b"
              strokeWidth="0.5"
            />

            {/* Time division grid lines every 5s */}
            {[5, 10, 15, 20, 25].map((t) => {
              const x = (t / durationSec) * width;
              return (
                <line
                  key={t}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={height}
                  stroke="#1e293b"
                  strokeWidth="0.5"
                />
              );
            })}

            {/* TT-SAM Shaded Decision Windows (if within range) */}
            {pPickX < width && (
              <>
                {/* 3s alert window */}
                <rect
                  x={pPickX}
                  y="0"
                  width={Math.max(0, pPlus3X - pPickX)}
                  height={height}
                  fill="#f59e0b"
                  fillOpacity="0.08"
                />
                {/* 13s convergence window */}
                <rect
                  x={pPlus3X}
                  y="0"
                  width={Math.max(0, pPlus13X - pPlus3X)}
                  height={height}
                  fill="#10b981"
                  fillOpacity="0.05"
                />
              </>
            )}

            {/* Faint ghost trace of the entire 30s record */}
            <polyline
              fill="none"
              stroke={color}
              strokeOpacity="0.2"
              strokeWidth="1"
              points={ghostPointsString}
            />

            {/* Active streaming trace */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.6"
              points={pointsString}
            />

            {/* P-wave Arrival Vertical Marker */}
            {pPickX > 0 && pPickX <= width && (
              <g>
                <line
                  x1={pPickX}
                  y1="0"
                  x2={pPickX}
                  y2={height}
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeDasharray="3,2"
                />
                <text
                  x={pPickX + 3}
                  y="12"
                  fill="#ef4444"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  P-Pick ({pPickSec}s)
                </text>
              </g>
            )}

            {/* Streaming Playhead line */}
            <line
              x1={playheadX}
              y1="0"
              x2={playheadX}
              y2={height}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[440px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card shadow-xl overflow-hidden">
      {/* Top Header & Station Picker */}
      <div className="flex flex-col border-b border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-slate_obsidian-900/90 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>Real-Time Waveform Monitor</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-normal">
                  200 Hz Stream
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                2016 ML 6.6 Meinong Benchmark • TT-SAM Model Input
              </p>
            </div>
          </div>

          {/* Signal Type Toggle: Acc vs Vel */}
          <div className="flex items-center space-x-1 border border-slate-700 bg-slate-950/80 rounded-md p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setSignalType("acc")}
              className={`px-2 py-1 rounded font-bold transition ${
                signalType === "acc"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ACC (Gal)
            </button>
            <button
              onClick={() => setSignalType("vel")}
              className={`px-2 py-1 rounded font-bold transition ${
                signalType === "vel"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              VEL (cm/s)
            </button>
          </div>
        </div>

        {/* Station Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-thin">
          {stationKeys.map((sname) => {
            const sta = previews[sname];
            const isSel = selectedStation === sname;
            return (
              <button
                key={sname}
                onClick={() => setSelectedStation(sname)}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition ${
                  isSel
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <span>{sname}</span>
                <span
                  className={`text-[9px] px-1 rounded ${
                    sta.cwa_intensity.includes("6") || sta.cwa_intensity.includes("5")
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  Int {sta.cwa_intensity}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Station Telemetry & TT-SAM Status Strip */}
      <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 text-[11px] font-mono">
        <div>
          <span className="text-slate-400 text-[10px] block">Distance:</span>
          <span className="text-white font-bold">{currentStationData.distance_km} km</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Max Shaking:</span>
          <span className="text-amber-400 font-bold">
            {currentStationData.max_abs_acc_gal.toFixed(1)} Gal
          </span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">P-Arrival:</span>
          <span className="text-cyan-400 font-bold">{currentStationData.p_pick_sec}s</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Lead Time:</span>
          <span className="text-emerald-400 font-bold">
            +{currentStationData.warning_lead_time_sec}s
          </span>
        </div>
      </div>

      {/* Model State Banner */}
      <div
        className={`px-3 py-1.5 border-b text-[10px] font-mono flex items-center justify-between ${ttState.color}`}
      >
        <div className="flex items-center space-x-2">
          <Zap className="h-3 w-3 flex-shrink-0" />
          <span className="font-bold">{ttState.label}</span>
        </div>
        <span className="text-[9px] opacity-80">{ttState.description}</span>
      </div>

      {/* Waveforms Scrollable Area */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin">
        {/* Component Selector Header */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
          <span>Waveform Channels (3-Component Triaxial)</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveComponent("all")}
              className={`px-1.5 py-0.5 rounded ${
                activeComponent === "all" ? "bg-slate-700 text-white font-bold" : "text-slate-400"
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActiveComponent("z")}
              className={`px-1.5 py-0.5 rounded ${
                activeComponent === "z" ? "bg-cyan-600 text-white font-bold" : "text-slate-400"
              }`}
            >
              Z
            </button>
            <button
              onClick={() => setActiveComponent("ns")}
              className={`px-1.5 py-0.5 rounded ${
                activeComponent === "ns" ? "bg-emerald-600 text-white font-bold" : "text-slate-400"
              }`}
            >
              NS
            </button>
            <button
              onClick={() => setActiveComponent("ew")}
              className={`px-1.5 py-0.5 rounded ${
                activeComponent === "ew" ? "bg-amber-600 text-white font-bold" : "text-slate-400"
              }`}
            >
              EW
            </button>
          </div>
        </div>

        {/* Z Component (Vertical) */}
        {(activeComponent === "all" || activeComponent === "z") &&
          renderTrace(
            "Vertical",
            "Z Component",
            "#06b6d4",
            currentStationData[signalType].z,
            currentStationData.p_pick_sec,
            currentStationData.duration_sec
          )}

        {/* NS Component (North-South Horizontal) */}
        {(activeComponent === "all" || activeComponent === "ns") &&
          renderTrace(
            "North-South",
            "NS Component",
            "#10b981",
            currentStationData[signalType].ns,
            currentStationData.p_pick_sec,
            currentStationData.duration_sec
          )}

        {/* EW Component (East-West Horizontal) */}
        {(activeComponent === "all" || activeComponent === "ew") &&
          renderTrace(
            "East-West",
            "EW Component",
            "#f59e0b",
            currentStationData[signalType].ew,
            currentStationData.p_pick_sec,
            currentStationData.duration_sec
          )}
      </div>

      {/* Bottom Playback & Scrubber Controls */}
      <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 bg-slate-900/90 p-2.5 space-y-1.5">
        {/* Scrubber slider */}
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max={currentStationData.duration_sec}
            step="0.1"
            value={currentTimeSec}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTimeSec(parseFloat(e.target.value));
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Playback Controls & Time readout */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayToggle}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-sm"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Simulate</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </button>

            {/* Speed selector */}
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 ml-2">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-1 rounded ${
                    playbackSpeed === s
                      ? "bg-slate-700 text-cyan-300 font-bold"
                      : "hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-300">
            <span className="text-slate-400 text-[10px]">Elapsed:</span>
            <span className="font-bold text-cyan-300">
              t = {currentTimeSec.toFixed(1)}s
            </span>
            <span className="text-slate-400 text-[10px]">/ 30.0s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
