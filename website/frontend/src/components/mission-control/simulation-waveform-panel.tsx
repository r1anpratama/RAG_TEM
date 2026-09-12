"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Zap,
  Radio,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import meinongSimulationData from "@/data/meinong-simulation-data.json";
import eq20883SimulationData from "@/data/eq_20883_simulation.json";
import eq20122SimulationData from "@/data/eq_20122_simulation.json";
import { CwaIntensityColorbar } from "@/components/mission-control/cwa-intensity-colorbar";
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

  // Local playback state if external props are not fully bound
  const [localPlaying, setLocalPlaying] = useState<boolean>(false);
  const [localTimeSec, setLocalTimeSec] = useState<number>(0);
  const [localSpeed, setLocalSpeed] = useState<number>(1);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // View Mode: 'all_z' (All stations vertical Z-component array) vs 'single_detail' (Triaxial Z, NS, EW)
  const [viewMode, setViewMode] = useState<"all_z" | "single_detail">("all_z");
  const [selectedStation, setSelectedStation] = useState<string>("TCU011");
  const [signalType, setSignalType] = useState<"acc" | "vel">("acc");

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
  const stationKeys = (currentDataset.key_stations as string[]) || Object.keys(previews);

  // Sync with activeScenarioId prop
  useEffect(() => {
    if (activeScenarioId?.includes("meinong")) {
      setActiveEvent("meinong");
      setSelectedStation("KAU068");
      if (onReset) onReset();
      else setLocalTimeSec(0);
    } else if (activeScenarioId?.includes("20883")) {
      setActiveEvent("eq20883");
      setSelectedStation("TCU083");
      if (onReset) onReset();
      else setLocalTimeSec(0);
    } else if (activeScenarioId?.includes("20122")) {
      setActiveEvent("eq20122");
      setSelectedStation("TCU011");
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

  // Local animation loop if controlling internally
  useEffect(() => {
    if (externalSimTime !== undefined) return; // Controlled externally by EEWSView

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

  // Sort all stations by epicentral distance (or arrival time) for record section view
  const sortedStations = useMemo(() => {
    return Object.values(previews).sort((a, b) => {
      // Primary sort by p_pick_sec, secondary by distance
      return (a.p_pick_sec || 0) - (b.p_pick_sec || 0) || a.distance_km - b.distance_km;
    });
  }, [previews]);

  // Overall event detection status
  const detectionStats = useMemo(() => {
    const triggered = sortedStations.filter((s) => currentTimeSec >= s.p_pick_sec);
    const ncuStation = sortedStations.find((s) => s.station_name === "TCU083");
    const ncuTriggered = ncuStation ? currentTimeSec >= ncuStation.p_pick_sec : false;

    return {
      total: sortedStations.length,
      triggeredCount: triggered.length,
      ncuTriggered,
      percent: Math.round((triggered.length / sortedStations.length) * 100),
    };
  }, [sortedStations, currentTimeSec]);

  // Helper to render an individual Z-component station row in the multi-station array
  const renderZComponentRow = (station: WaveformPreviewStation) => {
    const durationSec = station.duration_sec || 30.0;
    const pPickSec = station.p_pick_sec;
    const data = signalType === "acc" ? station.acc.z : station.vel.z;
    if (!data || data.length === 0) return null;

    const width = 480;
    const height = 48;
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
            {/* Station Code with CWA Intensity Pill */}
            <span className="font-bold text-slate-100 flex items-center space-x-1">
              <span className="text-cyan-400">▲</span>
              <span>{station.station_name}</span>
            </span>

            {/* CWA Intensity badge (Active only if wave has arrived) */}
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

          {/* Real-time P-Arrival Notification & Amplitude */}
          <div className="flex items-center space-x-2">
            {isNewlyDetected ? (
              <span className="text-[10px] font-bold text-amber-300 animate-pulse flex items-center space-x-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>P-PICK DETECTED ({pPickSec}s)</span>
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
        <div className="relative w-full h-[46px] bg-slate-950 rounded border border-slate-900/90 overflow-hidden">
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

  const currentStationData =
    previews[selectedStation] || sortedStations[0] || Object.values(previews)[0];

  return (
    <div className="flex flex-col h-[440px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate_obsidian-card shadow-xl overflow-hidden">
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
                  {sortedStations.length} Stations Active
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {activeEvent === "eq20122"
                  ? "EQ 20122 (19.76 km to NCU) • Real-Time P-Pick & CWA Intensity Triggering"
                  : activeEvent === "eq20883"
                  ? "EQ 20883 (23.90 km to NCU) • On-Campus TCU083 Array Stream"
                  : "2016 Meinong Earthquake • Regional Strong-Motion Stream"}
              </p>
            </div>
          </div>

          {/* Event Switcher & View Selector */}
          <div className="flex items-center space-x-2">
            {/* Event Switcher */}
            <div className="flex items-center space-x-1 border border-slate-700 bg-slate-950/90 rounded-md p-0.5 text-[10px] font-mono">
              <button
                onClick={() => {
                  setActiveEvent("eq20122");
                  setSelectedStation("TCU011");
                  handleReset();
                }}
                className={`px-2 py-1 rounded font-bold transition flex items-center space-x-1 ${
                  activeEvent === "eq20122"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Radio className="h-3 w-3" />
                <span>EQ 20122 (19.8 km)</span>
              </button>
              <button
                onClick={() => {
                  setActiveEvent("eq20883");
                  setSelectedStation("TCU083");
                  handleReset();
                }}
                className={`px-2 py-1 rounded font-bold transition flex items-center space-x-1 ${
                  activeEvent === "eq20883"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>EQ 20883 (23.9 km)</span>
              </button>
              <button
                onClick={() => {
                  setActiveEvent("meinong");
                  setSelectedStation("KAU068");
                  handleReset();
                }}
                className={`px-2 py-1 rounded font-bold transition ${
                  activeEvent === "meinong"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Meinong</span>
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

        {/* Real-time Triggering Summary Strip */}
        <div className="flex items-center justify-between text-[10px] font-mono px-2 py-1 bg-slate-950/60 rounded border border-slate-800 text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>
              Triggered Stations:{" "}
              <b className="text-cyan-300 font-bold">
                {detectionStats.triggeredCount} / {detectionStats.total}
              </b>{" "}
              ({detectionStats.percent}%)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">P-Wave to NCU:</span>
            <span className="text-amber-300 font-bold">
              {activeEvent === "eq20122" ? "6.85s (In transit)" : "8.16s"}
            </span>
            <span className="text-slate-400 ml-1">Warning Lead Time:</span>
            <span className="text-emerald-400 font-bold">
              {activeEvent === "eq20122" ? "+5.60s" : "+6.69s"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Waveforms Scrollable Container */}
      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto scrollbar-thin">
        {/* Render All Stations Vertical Z-Component Traces */}
        {sortedStations.map((sta) => renderZComponentRow(sta))}
      </div>

      {/* Bottom CWA Intensity Colorbar Legend */}
      <div className="px-2.5 py-1.5 bg-slate-950 border-t border-slate-800/90">
        <CwaIntensityColorbar compact={true} />
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
