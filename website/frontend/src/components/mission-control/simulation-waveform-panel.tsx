"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Radio,
  CheckCircle2,
  Search,
  ArrowUpDown,
} from "lucide-react";
import meinongSimulationData from "@/data/meinong-simulation-data.json";
import eq20883SimulationData from "@/data/eq_20883_simulation.json";
import eq20122SimulationData from "@/data/eq_20122_simulation.json";
import { getCwaLevelInfo } from "@/lib/cwa-intensity";

interface WaveformPreviewStation {
  role: string;
  label: string;
  station_name: string;
  distance_km: number;
  dist_to_ncu_km?: number;
  latitude?: number;
  longitude?: number;
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
  activeScenarioId?: string;
  simTimeSec?: number;
  onTimeChange?: (time: number) => void;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  onReset?: () => void;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
}

export const SimulationWaveformPanel: React.FC<SimulationWaveformPanelProps> = ({
  isSimulating = false,
  activeScenarioId,
  simTimeSec: externalSimTime,
  onTimeChange,
  isPlaying: externalIsPlaying,
  onPlayToggle,
  onReset,
  playbackSpeed: externalSpeed,
  onSpeedChange,
}) => {
  const [activeEvent, setActiveEvent] = useState<"eq20122" | "eq20883" | "meinong">("eq20122");

  // Local playback fallback
  const [localPlaying, setLocalPlaying] = useState<boolean>(false);
  const [localTimeSec, setLocalTimeSec] = useState<number>(0);
  const [localSpeed, setLocalSpeed] = useState<number>(1);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const [signalType, setSignalType] = useState<"acc" | "vel">("acc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"time" | "dist" | "pga">("time");

  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : localPlaying;
  const currentTimeSec = externalSimTime !== undefined ? externalSimTime : localTimeSec;
  const playbackSpeed = externalSpeed !== undefined ? externalSpeed : localSpeed;

  const currentDataset: any =
    activeEvent === "eq20122"
      ? eq20122SimulationData
      : activeEvent === "eq20883"
      ? eq20883SimulationData
      : meinongSimulationData;

  const previews = currentDataset.waveform_previews as Record<string, WaveformPreviewStation>;

  // Sync with activeScenarioId prop
  useEffect(() => {
    if (activeScenarioId?.includes("meinong")) {
      setActiveEvent("meinong");
      if (onReset) onReset();
      else setLocalTimeSec(0);
    } else if (activeScenarioId?.includes("20883")) {
      setActiveEvent("eq20883");
      if (onReset) onReset();
      else setLocalTimeSec(0);
    } else if (activeScenarioId?.includes("20122")) {
      setActiveEvent("eq20122");
      if (onReset) onReset();
      else setLocalTimeSec(0);
    }
  }, [activeScenarioId]);

  // Sync with isSimulating prop
  useEffect(() => {
    if (isSimulating && externalIsPlaying === undefined) {
      setLocalPlaying(true);
    }
  }, [isSimulating, externalIsPlaying]);

  // Local timer fallback loop
  useEffect(() => {
    if (externalSimTime !== undefined) return;

    if (localPlaying) {
      const step = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        setLocalTimeSec((prev) => {
          const next = prev + delta * localSpeed;
          if (next >= 30.0) {
            setLocalPlaying(false);
            return 30.0;
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(step);
      };

      animFrameRef.current = requestAnimationFrame(step);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [localPlaying, localSpeed, externalSimTime]);

  const handlePlayToggle = () => {
    if (onPlayToggle) {
      onPlayToggle();
    } else {
      if (localTimeSec >= 30.0) setLocalTimeSec(0);
      setLocalPlaying(!localPlaying);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      setLocalPlaying(false);
      setLocalTimeSec(0);
    }
  };

  const handleScrub = (val: number) => {
    if (onTimeChange) {
      onTimeChange(val);
    } else {
      setLocalPlaying(false);
      setLocalTimeSec(val);
    }
  };

  const handleSpeedChange = (spd: number) => {
    if (onSpeedChange) {
      onSpeedChange(spd);
    } else {
      setLocalSpeed(spd);
    }
  };

  // Sort and filter all stations
  const displayedStations = useMemo(() => {
    const list = Object.values(previews || {});

    // Filter by search query
    const filtered = searchQuery.trim()
      ? list.filter(
          (s) =>
            s.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.label?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : list;

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === "dist") {
        return a.distance_km - b.distance_km;
      } else if (sortBy === "pga") {
        return b.max_abs_acc_gal - a.max_abs_acc_gal;
      }
      // Default: arrival time
      return (a.p_pick_sec || 0) - (b.p_pick_sec || 0) || a.distance_km - b.distance_km;
    });
  }, [previews, searchQuery, sortBy]);

  // Overall event detection status
  const detectionStats = useMemo(() => {
    const all = Object.values(previews || {});
    const triggered = all.filter((s) => currentTimeSec >= s.p_pick_sec);

    return {
      total: all.length,
      triggeredCount: triggered.length,
      percent: all.length > 0 ? Math.round((triggered.length / all.length) * 100) : 0,
    };
  }, [previews, currentTimeSec]);

  // Helper to render an individual Z-component station row
  const renderZComponentRow = (station: WaveformPreviewStation) => {
    const durationSec = station.duration_sec || 30.0;
    const pPickSec = station.p_pick_sec;
    const data = signalType === "acc" ? station.acc?.z : station.vel?.z;
    if (!data || data.length === 0) return null;

    const width = 480;
    const height = 44;
    const maxVal = Math.max(...data.map(Math.abs), 0.001);
    const totalPoints = data.length;

    // Current fraction and index based on simulation time
    const currentFraction = Math.min(1, Math.max(0, currentTimeSec / durationSec));
    const currentIndex = Math.floor(currentFraction * totalPoints);
    const currentVal = data[currentIndex] || 0;

    // Real-time detection state
    const hasPArrived = currentTimeSec >= pPickSec;
    const isNewlyDetected = hasPArrived && currentTimeSec - pPickSec <= 2.2;

    // Visible streaming polyline
    const visibleData = data.slice(0, Math.max(1, currentIndex));
    const pointsString = visibleData
      .map((val, idx) => {
        const x = (idx / (totalPoints - 1)) * width;
        const y = height / 2 - (val / maxVal) * (height / 2) * 0.82;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    // Ghost path for entire 30s record
    const ghostPointsString = data
      .map((val, idx) => {
        const x = (idx / (totalPoints - 1)) * width;
        const y = height / 2 - (val / maxVal) * (height / 2) * 0.82;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const pPickX = (pPickSec / durationSec) * width;
    const playheadX = currentFraction * width;
    const cwaInfo = getCwaLevelInfo(station.cwa_intensity);

    return (
      <div
        key={station.station_name}
        className={`flex flex-col rounded-lg p-2 transition border ${
          isNewlyDetected
            ? "bg-amber-950/40 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            : hasPArrived
            ? "bg-slate-950/80 border-slate-800"
            : "bg-slate-950/40 border-slate-900 opacity-75"
        }`}
      >
        {/* Station Subheader */}
        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-100 flex items-center space-x-1">
              <span className="text-cyan-400">▲</span>
              <span>{station.station_name}</span>
            </span>

            {/* CWA Intensity badge */}
            {hasPArrived ? (
              <span
                style={{
                  backgroundColor: cwaInfo.color,
                  color: cwaInfo.textColor,
                  boxShadow: `0 0 8px ${cwaInfo.glowColor}`,
                }}
                className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono tracking-tight"
                title={`CWA Intensity ${cwaInfo.level} (${cwaInfo.nameZh})`}
              >
                Int {cwaInfo.level} ({cwaInfo.nameZh})
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-500 font-mono">
                STANDBY
              </span>
            )}

            {station.station_name === "TCU083" && (
              <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                NCU CAMPUS
              </span>
            )}

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Epi: {station.distance_km} km
              {station.dist_to_ncu_km !== undefined && ` • NCU: ${station.dist_to_ncu_km} km`}
            </span>
          </div>

          {/* Real-time P-Arrival & Live Amp */}
          <div className="flex items-center space-x-2">
            {isNewlyDetected ? (
              <span className="text-[10px] font-bold text-amber-300 animate-pulse flex items-center space-x-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>P-PICK @ {pPickSec}s</span>
              </span>
            ) : hasPArrived ? (
              <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>P @ {pPickSec}s</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 italic">
                In transit (est. {pPickSec}s)
              </span>
            )}

            <span className="text-[10px] text-slate-400">
              Z:{" "}
              <b className={hasPArrived ? "text-cyan-300" : "text-slate-500"}>
                {Math.abs(currentVal) < 0.1
                  ? Math.abs(currentVal).toFixed(3)
                  : Math.abs(currentVal).toFixed(2)}
              </b>{" "}
              <span className="text-[9px]">
                {signalType === "acc" ? "Gal" : "cm/s"}
              </span>
            </span>
          </div>
        </div>

        {/* SVG Oscilloscope Display for Z component */}
        <div className="relative w-full h-[42px] bg-slate-950 rounded border border-slate-900/90 overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Center Zero Line */}
            <line
              x1="0"
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke="#1e293b"
              strokeDasharray="2,4"
              strokeWidth="0.8"
            />

            {/* Time Grid Lines every 5s */}
            {[5, 10, 15, 20, 25].map((t) => (
              <line
                key={t}
                x1={(t / durationSec) * width}
                y1="0"
                x2={(t / durationSec) * width}
                y2={height}
                stroke="#0f172a"
                strokeWidth="0.8"
              />
            ))}

            {/* Faint ghost trace of full record */}
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeOpacity="0.15"
              strokeWidth="0.9"
              points={ghostPointsString}
            />

            {/* Active streaming trace */}
            <polyline
              fill="none"
              stroke={hasPArrived ? (isNewlyDetected ? "#f59e0b" : "#22d3ee") : "#64748b"}
              strokeWidth={hasPArrived ? "1.5" : "1.0"}
              points={pointsString}
            />

            {/* REAL-TIME P-WAVE PICKING MARKER: ONLY RENDERED ONCE t >= pPickSec! */}
            {hasPArrived && pPickX > 0 && pPickX <= width && (
              <g>
                <line
                  x1={pPickX}
                  y1="0"
                  x2={pPickX}
                  y2={height}
                  stroke="#ef4444"
                  strokeWidth="1.4"
                  strokeDasharray="3,2"
                />
                <rect
                  x={Math.min(width - 55, pPickX + 2)}
                  y="2"
                  width="50"
                  height="11"
                  fill="#7f1d1d"
                  rx="2"
                  fillOpacity="0.85"
                />
                <text
                  x={Math.min(width - 55, pPickX + 2) + 4}
                  y="10"
                  fill="#fca5a5"
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  P: {pPickSec}s
                </text>
              </g>
            )}

            {/* Streaming Playhead Line */}
            <line
              x1={playheadX}
              y1="0"
              x2={playheadX}
              y2={height}
              stroke="#ffffff"
              strokeWidth="1.3"
              strokeOpacity="0.9"
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[640px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card shadow-xl overflow-hidden">
      {/* Top Header Toolbar */}
      <div className="flex flex-col border-b border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-slate_obsidian-900/90 p-2.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>Multi-Station Waveform Array (Z-Component)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-normal">
                  All {detectionStats.total} Stations Loaded
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {activeEvent === "eq20122"
                  ? "EQ 20122 (19.76 km to NCU) • All 8 Recording Stations"
                  : activeEvent === "eq20883"
                  ? "EQ 20883 (23.90 km to NCU) • All 55 Regional Stations Recorded"
                  : "2016 Meinong Earthquake (Mw 6.4) • All 373 Stations Across Taiwan"}
              </p>
            </div>
          </div>

          {/* Event Switcher & Signal Type */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 border border-slate-700 bg-slate-950/90 rounded-md p-0.5 text-[10px] font-mono">
              <button
                onClick={() => {
                  setActiveEvent("eq20122");
                  handleReset();
                }}
                className={`px-2 py-1 rounded font-bold transition flex items-center space-x-1 ${
                  activeEvent === "eq20122"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Radio className="h-3 w-3" />
                <span>EQ 20122 (8 Sta)</span>
              </button>
              <button
                onClick={() => {
                  setActiveEvent("eq20883");
                  handleReset();
                }}
                className={`px-2 py-1 rounded font-bold transition flex items-center space-x-1 ${
                  activeEvent === "eq20883"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>EQ 20883 (55 Sta)</span>
              </button>
              <button
                onClick={() => {
                  setActiveEvent("meinong");
                  handleReset();
                }}
                className={`px-2 py-1 rounded font-bold transition ${
                  activeEvent === "meinong"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Meinong (373 Sta)</span>
              </button>
            </div>

            {/* Signal Type: Acc vs Vel */}
            <div className="flex items-center space-x-1 border border-slate-700 bg-slate-950/80 rounded-md p-0.5 text-[10px] font-mono">
              <button
                onClick={() => setSignalType("acc")}
                className={`px-1.5 py-0.5 rounded font-bold transition ${
                  signalType === "acc"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ACC
              </button>
              <button
                onClick={() => setSignalType("vel")}
                className={`px-1.5 py-0.5 rounded font-bold transition ${
                  signalType === "vel"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                VEL
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Summary Strip & Station Search/Sort */}
        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono px-2 py-1 bg-slate-950/60 rounded border border-slate-800 text-slate-300 gap-1.5">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>
              Triggered:{" "}
              <b className="text-cyan-300 font-bold">
                {detectionStats.triggeredCount} / {detectionStats.total}
              </b>{" "}
              ({detectionStats.percent}%)
            </span>
          </div>

          {/* Quick Search & Sort Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center">
              <Search className="h-3 w-3 text-slate-500 absolute left-1.5" />
              <input
                type="text"
                placeholder="Search station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded pl-5 pr-1.5 py-0.5 text-[9px] font-mono text-slate-200 placeholder-slate-500 w-24 focus:w-32 transition-all focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center space-x-0.5 bg-slate-900 rounded p-0.5 border border-slate-800 text-[9px]">
              <button
                onClick={() => setSortBy("time")}
                className={`px-1 rounded ${
                  sortBy === "time" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400"
                }`}
                title="Sort by Arrival Time"
              >
                Time
              </button>
              <button
                onClick={() => setSortBy("dist")}
                className={`px-1 rounded ${
                  sortBy === "dist" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400"
                }`}
                title="Sort by Epicentral Distance"
              >
                Dist
              </button>
              <button
                onClick={() => setSortBy("pga")}
                className={`px-1 rounded ${
                  sortBy === "pga" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400"
                }`}
                title="Sort by Peak Acceleration (PGA)"
              >
                PGA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Waveforms Scrollable Container - Expanded without duplicate CWA Colorbar */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto scrollbar-thin">
        {displayedStations.map((sta) => renderZComponentRow(sta))}
      </div>

      {/* Bottom Playback & Scrubber Controls */}
      <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 bg-slate-900/90 p-2.5 space-y-1.5">
        {/* Scrubber slider */}
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max={30.0}
            step="0.05"
            value={currentTimeSec}
            onChange={(e) => handleScrub(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Playback Controls & Time readout */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayToggle}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-sm"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Simulate Real-Time</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset Simulation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Speed selector */}
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 ml-2">
              {[0.5, 1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-1.5 py-0.5 rounded ${
                    playbackSpeed === s
                      ? "bg-slate-700 text-cyan-300 font-bold border border-cyan-500/40"
                      : "hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-300">
            <span className="text-slate-400 text-[10px]">Playback Time:</span>
            <span className="font-bold text-cyan-300 text-xs">
              t = {currentTimeSec.toFixed(2)}s
            </span>
            <span className="text-slate-400 text-[10px]">/ 30.00s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
