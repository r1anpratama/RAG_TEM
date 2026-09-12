"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Scenario } from "@/types/triage";
import {
  RotateCcw,
  Building2,
  Map as MapIcon,
  Box,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Zap,
  Activity,
  AlertTriangle,
  Layers,
  ChevronRight,
  X,
} from "lucide-react";
import { createDetailedScience4Building } from "./detailed-building-3d";

interface NCU3DCampusProps {
  scenario: Scenario | null;
  isSimulating: boolean;
  simTimeSec?: number;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  onReset?: () => void;
  onBackToGis?: () => void;
}

export function getCampusArrivalTimes(scenario: Scenario | null, regime: SeismicWaveRegime) {
  const id = scenario?.id?.toLowerCase() || "";
  if (id.includes("20883")) {
    return {
      tP: 8.16,
      tS: 14.85,
      distKm: 23.90,
      station: "TCU083 (0.11 km from S4)",
      eventName: "2012 Daxi-Taoyuan (EQ 20883)",
      leadTime: 6.69,
    };
  } else if (id.includes("20122")) {
    return {
      tP: 6.85,
      tS: 12.45,
      distKm: 19.76,
      station: "MND020 (12.18 km)",
      eventName: "2011 Daxi (EQ 20122)",
      leadTime: 5.60,
    };
  } else if (id.includes("shuanglienpo") || id.includes("hukou")) {
    return {
      tP: 1.80,
      tS: 3.80,
      distKm: 2.80,
      station: "NCU Bedrock Core",
      eventName: "Shuanglienpo Near-Fault (M6.91)",
      leadTime: 2.00,
    };
  } else if (id.includes("meinong")) {
    return {
      tP: 14.20,
      tS: 24.50,
      distKm: 245.0,
      station: "NCU / CHY Regional",
      eventName: "2016 Meinong Regional M6.6",
      leadTime: 10.30,
    };
  } else {
    if (regime === "near_fault_pulse") {
      return {
        tP: 1.80,
        tS: 3.80,
        distKm: 2.80,
        station: "NCU Bedrock Core",
        eventName: "Near-Fault Rupture",
        leadTime: 2.00,
      };
    } else if (regime === "long_period") {
      return {
        tP: 12.00,
        tS: 22.00,
        distKm: 110.0,
        station: "NCU Core",
        eventName: "Long-Period Subduction",
        leadTime: 10.00,
      };
    }
    return {
      tP: 8.16,
      tS: 14.85,
      distKm: 23.90,
      station: "TCU083 (0.11 km from S4)",
      eventName: "2012 Daxi-Taoyuan (EQ 20883)",
      leadTime: 6.69,
    };
  }
}

export type SeismicWaveRegime = "short_period" | "long_period" | "near_fault_pulse";

export interface CampusBuilding {
  id: string;
  name: string;
  nameZh: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  stories: number;
  floors: number;
  era: string;
  structuralType: string;
  fundamentalPeriodSec: number;
  sensors: string[];
  softStorey?: boolean;
  shortPeriodImpact: {
    resonance: string;
    badgeText: string;
    level: "critical" | "warning" | "safe";
    explanation: string;
    driftEstPct: number;
  };
  longPeriodImpact: {
    resonance: string;
    badgeText: string;
    level: "critical" | "warning" | "safe";
    explanation: string;
    driftEstPct: number;
  };
}

interface ArchitecturalHotspot {
  id: string;
  nameZh: string;
  nameEn: string;
  xPct: number;
  yPct: number;
  category: "astronomy" | "energy" | "structural" | "mechanical" | "sensor";
  tag: string;
  details: string;
  specs: { label: string; value: string }[];
}

export const CWA_INTENSITY_PALETTE: Record<
  string,
  { hex: number; css: string; labelEn: string; pga: string; pgv: string; textDark?: boolean }
> = {
  "0": { hex: 0x94a3b8, css: "#94a3b8", labelEn: "Intensity 0 (Micro / Unfelt)", pga: "< 0.8 Gal", pgv: "< 0.2 cm/s" },
  "1": { hex: 0x60a5fa, css: "#60a5fa", labelEn: "Intensity 1 (Very Light)", pga: "0.8 - 2.5 Gal", pgv: "0.2 - 0.7 cm/s" },
  "2": { hex: 0x4ade80, css: "#4ade80", labelEn: "Intensity 2 (Minor / Light)", pga: "2.5 - 8.0 Gal", pgv: "0.7 - 1.9 cm/s" },
  "3": { hex: 0xfacc15, css: "#facc15", labelEn: "Intensity 3 (Moderate / Light)", pga: "8.0 - 25 Gal", pgv: "1.03 cm/s (2012 Daxi)", textDark: true },
  "4": { hex: 0xfb923c, css: "#fb923c", labelEn: "Intensity 4 (Moderate-Strong)", pga: "25 - 80 Gal", pgv: "1.9 - 5.7 cm/s" },
  "5-": { hex: 0xf87171, css: "#f87171", labelEn: "Intensity 5- (Strong)", pga: "80 - 140 Gal", pgv: "5.7 - 15 cm/s" },
  "5+": { hex: 0xef4444, css: "#ef4444", labelEn: "Intensity 5+ (Very Strong)", pga: "140 - 250 Gal", pgv: "15 - 30 cm/s" },
  "6-": { hex: 0xdc2626, css: "#dc2626", labelEn: "Intensity 6- (Severe / Near-Fault)", pga: "250 - 440 Gal", pgv: "30 - 50 cm/s" },
  "6+": { hex: 0x991b1b, css: "#991b1b", labelEn: "Intensity 6+ (Extreme)", pga: "440 - 800 Gal", pgv: "50 - 80 cm/s" },
  "7": { hex: 0x7f1d1d, css: "#7f1d1d", labelEn: "Intensity 7 (Violent / Catastrophic)", pga: "> 800 Gal", pgv: "> 80 cm/s" },
};

const EDREAM_CENTRE_HOTSPOTS: ArchitecturalHotspot[] = [
  {
    id: "dome",
    nameZh: "健雄天文觀測圓頂 (8F)",
    nameEn: "Astronomical Observatory Dome (8F)",
    xPct: 50.0,
    yPct: 15.5,
    category: "astronomy",
    tag: "GEODESIC ROTUNDA",
    details: "Equipped with a 24-inch optical telescope, motorized azimuth rotunda drum, and triaxial microtremor telemetry for roof-level (8F) vibration diagnostics.",
    specs: [
      { label: "Diameter", value: "10.8 meters" },
      { label: "Storey Level", value: "Level 8 (Roof Crown)" },
      { label: "Structure", value: "Geodesic Steel & Glass" },
      { label: "Vibration Sensor", value: "NCU_DOME_VIB01 (0.012g)" },
    ],
  },
  {
    id: "solar",
    nameZh: "太陽能光電研究陣列 (南翼屋頂)",
    nameEn: "Photovoltaic Solar Array",
    xPct: 67.5,
    yPct: 24.5,
    category: "energy",
    tag: "CLEAN ENERGY MICROGRID",
    details: "High-efficiency monocrystalline solar array tilted 23.5° south atop the Edream Centre south wing roof deck.",
    specs: [
      { label: "Capacity", value: "48 kW Peak" },
      { label: "Elevation", value: "8F Roof (+32m)" },
      { label: "Tilt Angle", value: "23.5° South" },
      { label: "Microgrid Tie", value: "NCU Substation B" },
    ],
  },
  {
    id: "skylight",
    nameZh: "中央天井與電梯機房 (拱型天窗)",
    nameEn: "Elevator Penthouse & Barrel Skylight",
    xPct: 35.5,
    yPct: 21.0,
    category: "structural",
    tag: "CORE SHEAR ZONE",
    details: "Curved tempered-glass barrel vault skylight over the central atrium core. Houses high-speed traction elevator machinery and core drift telemetry.",
    specs: [
      { label: "Core Type", value: "RC Shear Wall Core" },
      { label: "Upper Storey", value: "Level 8 Penthouse" },
      { label: "Baseline IDR", value: "0.04% (Nominal)" },
      { label: "Seismic Expansion", value: "Full Perimeter Expansion Joint" },
    ],
  },
  {
    id: "hvac",
    nameZh: "雙迴路工業冷卻水塔 (機械機房)",
    nameEn: "Dual HVAC Chiller Turbines",
    xPct: 78.5,
    yPct: 28.5,
    category: "mechanical",
    tag: "CENTRAL HVAC PLANT",
    details: "Dual centrifugal chiller towers equipped with spring-neoprene vibration isolators to damp non-structural mechanical resonances during ground shaking.",
    specs: [
      { label: "Capacity", value: "2x 150 Ton Chillers" },
      { label: "Isolation Damping", value: "Spring Damping (98.4%)" },
      { label: "Auto Shutoff", value: "Seismic Flow Trip SCADA" },
      { label: "Location", value: "8F Mechanical Roof Deck" },
    ],
  },
  {
    id: "balcony",
    nameZh: "物理與太空科學實驗室陽台 (5F-6F)",
    nameEn: "Recessed Research Terraces (5F-6F)",
    xPct: 49.5,
    yPct: 46.5,
    category: "structural",
    tag: "FACULTY LABS",
    details: "Symmetrical recessed research terraces accommodating photonics, physics labs, and space science atmospheric sounding instrumentation.",
    specs: [
      { label: "Floor Levels", value: "Levels 4F, 5F, 6F" },
      { label: "Balustrade", value: "Tempered Safety Glass & Steel" },
      { label: "Drift Telemetry", value: "Real-Time LVDT Gauges" },
      { label: "Occupancy", value: "Graduate Research Labs" },
    ],
  },
  {
    id: "portico",
    nameZh: "砂岩正門門廊 (1F 軟弱層檢測點)",
    nameEn: "Grand Sandstone Portico & Ground Hall (1F Soft-Storey)",
    xPct: 51.5,
    yPct: 73.0,
    category: "sensor",
    tag: "SOFT-STOREY CRITICAL",
    details: "Two-story travertine sandstone entrance portico. ASCE 41-17 critical zone: 1F ground hall features open column stiffness contrast susceptible to shear concentration during near-fault shallow earthquakes.",
    specs: [
      { label: "Seismograph", value: "NCU_ACC_04 (Triaxial Z/N/E)" },
      { label: "Stiffness Ratio", value: "K_1F / K_2F = 0.62 (Soft-Storey)" },
      { label: "Storey Level", value: "Level 1 Ground Hall" },
      { label: "Audit Rating", value: "Post-1999 Audit: Critical Shear Zone" },
    ],
  },
  {
    id: "plaza",
    nameZh: "前庭花園廣場與無障礙走道",
    nameEn: "Entrance Plaza & Evacuation Muster Zone",
    xPct: 29.0,
    yPct: 86.5,
    category: "structural",
    tag: "EVACUATION POINT",
    details: "Interlocking granite pedestrian forecourt, ADA handicap ramp, and open assembly ground designated as NCU Emergency Evacuation Muster Point #4.",
    specs: [
      { label: "Capacity", value: "600 Persons" },
      { label: "Pavement", value: "Interlocking Granite Pavers" },
      { label: "Access", value: "Dual Ramp & 3-Tier Steps" },
      { label: "Hydrant", value: "CWA Station #4 Hydrant" },
    ],
  },
];

export const NCU3DCampus: React.FC<NCU3DCampusProps> = ({
  scenario,
  isSimulating: propIsSimulating,
  simTimeSec: propSimTimeSec,
  isPlaying: propIsPlaying,
  onPlayToggle,
  onReset,
  onBackToGis,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [cameraMode, setCameraMode] = useState<"campus" | "edream" | "library" | "eng5" | "admin" | "gym">("campus");
  const [displayMode, setDisplayMode] = useState<"orbit_3d" | "ultra_hd_twin">("orbit_3d");
  const [activeHotspot, setActiveHotspot] = useState<ArchitecturalHotspot | null>(null);
  const [localSimTime, setLocalSimTime] = useState<number>(0);
  const [localIsPlaying, setLocalIsPlaying] = useState<boolean>(false);
  const [waveRegime, setWaveRegime] = useState<SeismicWaveRegime>("short_period");
  const [buildingScreenCoords, setBuildingScreenCoords] = useState<
    Record<string, { x: number; y: number; visible: boolean }>
  >({});

  const effectiveSimTime = propSimTimeSec !== undefined ? propSimTimeSec : localSimTime;
  const isPlaying = propIsPlaying !== undefined ? propIsPlaying : localIsPlaying;
  const isSimulating = Boolean(propIsSimulating || isPlaying || (effectiveSimTime > 0 && effectiveSimTime < 30));

  const arrival = useMemo(() => {
    return getCampusArrivalTimes(scenario, waveRegime);
  }, [scenario, waveRegime]);
  const { tP, tS } = arrival;

  const currentPhase: "idle" | "pre_arrival" | "p_wave" | "s_wave" = useMemo(() => {
    if (!isSimulating && effectiveSimTime === 0) return "idle";
    if (effectiveSimTime < tP) return "pre_arrival";
    if (effectiveSimTime < tS) return "p_wave";
    return "s_wave";
  }, [isSimulating, effectiveSimTime, tP, tS]);

  // Local clock loop for standalone testing if parent propSimTimeSec not provided
  useEffect(() => {
    if (propSimTimeSec !== undefined) return;
    if (!localIsPlaying) return;

    let lastT = performance.now();
    let rafId: number;
    const loop = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;
      setLocalSimTime((prev) => {
        const next = prev + dt;
        if (next >= 30.0) {
          setLocalIsPlaying(false);
          return 30.0;
        }
        return next;
      });
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [localIsPlaying, propSimTimeSec]);

  // Play/Pause toggle
  const handleTriggerSim = () => {
    if (onPlayToggle) {
      onPlayToggle();
    } else {
      if (localSimTime >= 30) setLocalSimTime(0);
      setLocalIsPlaying(!localIsPlaying);
    }
  };

  useEffect(() => {
    if (!scenario) return;
    const id = scenario.id.toLowerCase();
    if (id.includes("20883") || id.includes("20122") || id.includes("daxi")) {
      setWaveRegime("short_period");
    } else if (id.includes("hualien")) {
      setWaveRegime("long_period");
    } else if (id.includes("shuanglienpo") || id.includes("hukou") || id.includes("meinong")) {
      setWaveRegime("near_fault_pulse");
    }
  }, [scenario]);

  const isDaxiScenario = useMemo(() => {
    return (
      waveRegime === "short_period" ||
      Boolean(scenario?.id?.toLowerCase().includes("20883")) ||
      Boolean(scenario?.id?.toLowerCase().includes("20122")) ||
      Boolean(scenario?.id?.toLowerCase().includes("daxi"))
    );
  }, [waveRegime, scenario]);

  // Height-dependent intensity helper:
  // For Daxi: <= 3 storeys -> Intensity 3 (Yellow #facc15), > 3 storeys -> Intensity 2 (Green #4ade80)
  const getBuildingFeltIntensity = (b: CampusBuilding): string => {
    if (isDaxiScenario) {
      return b.stories <= 3 ? "3" : "2";
    } else if (waveRegime === "long_period") {
      return b.stories > 3 ? "4" : "2";
    } else {
      return "6-";
    }
  };

  const animationFrameRef = useRef<number | null>(null);
  const beaconLightRef = useRef<THREE.PointLight | null>(null);
  const pointerDownPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const buildingsRef = useRef<CampusBuilding[]>([
    {
      id: "FAC_NCU_SCIENCE_B4",
      name: "Edream Centre (健雄館 / S4)",
      nameZh: "國立中央大學 E-DREaM 跨領域中心 / 健雄館",
      x: -5,
      z: -65,
      width: 24,
      depth: 18,
      height: 32,
      stories: 8,
      floors: 8,
      era: "Pre-1999 (Ground Floor Soft-Storey)",
      structuralType: "RC Frame w/ Open Ground Hall (1F Stiffness Discontinuity)",
      fundamentalPeriodSec: 0.65,
      sensors: ["NCU_ACC_04_Z", "NCU_ACC_04_N", "NCU_ACC_04_E"],
      softStorey: true,
      shortPeriodImpact: {
        resonance: "CWA Intensity 2 (Attenuated at Upper Floors) / 1F Soft-Storey Alert",
        badgeText: "CWA Int 2 • 8 Storeys (1F Soft-Storey Alert)",
        level: "critical",
        explanation:
          "In the 2012 Daxi earthquake, multi-storey buildings (> 3 storeys) have longer fundamental periods (Tn = 0.65s) that dynamically filter out high frequencies, attenuating upper mass shaking to Intensity 2 (Green). However, the ground floor features an open column atrium with K_1F / K_2F = 0.62, concentrating high-frequency shear force at the ground-level columns!",
        driftEstPct: 0.42,
      },
      longPeriodImpact: {
        resonance: "Critical Harmonic Resonance (8F High-Rise)",
        badgeText: "CWA Int 4 • Resonant Sway (8F)",
        level: "critical",
        explanation:
          "As an 8-storey structure (32m), the Edream Centre is susceptible to long-period subduction waves (> 1.0s). The rooftop observatory dome experiences large lateral periodic sway.",
        driftEstPct: 1.25,
      },
    },
    {
      id: "FAC_NCU_LIBRARY",
      name: "NCU Main Library Core (總圖書館)",
      nameZh: "中央大學 總圖書館",
      x: 57,
      z: 19,
      width: 28,
      depth: 24,
      height: 34,
      stories: 8,
      floors: 8,
      era: "Post-1999 Seismic Retrofitted Core",
      structuralType: "Dual RC Shear Wall & Braced Core (Heavy Bookstack Mass)",
      fundamentalPeriodSec: 0.72,
      sensors: ["NCU_LIB_SM1", "NCU_LIB_SM2"],
      softStorey: false,
      shortPeriodImpact: {
        resonance: "CWA Intensity 2 (Attenuated / Low-Pass Dynamic Filter)",
        badgeText: "CWA Int 2 • 8 Storeys (Safe / Filtered)",
        level: "safe",
        explanation:
          "With 8 storeys (> 3 storeys) and massive inertia (Tn = 0.72s), the library acts as a low-pass filter against high-frequency Daxi earthquake waves. Ground motion is felt as Intensity 2 (Green) with shear walls well within elastic safety limits.",
        driftEstPct: 0.20,
      },
      longPeriodImpact: {
        resonance: "Critical Harmonic Resonance (8F High-Rise)",
        badgeText: "CWA Int 4 • Maximum Resonance (8F)",
        level: "critical",
        explanation:
          "Fundamental period Tn = 0.72s matches the long-period shear wave spectrum of offshore subduction events. Massive dynamic amplification occurs on upper floors (6F-8F), with risks of tall bookstacks overturning and elevator cables twisting.",
        driftEstPct: 1.42,
      },
    },
    {
      id: "FAC_NCU_ENG_B5",
      name: "Engineering Building 5 (工程五館 / E6)",
      nameZh: "工程五館 (工學院 / 資電學院大樓)",
      x: -116,
      z: 55,
      width: 32,
      depth: 22,
      height: 28,
      stories: 7,
      floors: 7,
      era: "Post-1999 Modern Ductile Seismic Code",
      structuralType: "Moment-Resisting RC Frame (Computer Science & EECS Labs)",
      fundamentalPeriodSec: 0.60,
      sensors: ["NCU_EECS_01", "NCU_EECS_02"],
      softStorey: false,
      shortPeriodImpact: {
        resonance: "CWA Intensity 2 (Attenuated / Ductile Safe)",
        badgeText: "CWA Int 2 • 7 Storeys (Safe)",
        level: "safe",
        explanation:
          "As a 7-storey building (> 3 storeys), it filters out high-frequency Daxi waves, feeling attenuated Intensity 2 (Green). Modern ductile detailing dissipates vibration energy safely without structural distress.",
        driftEstPct: 0.24,
      },
      longPeriodImpact: {
        resonance: "High Resonant Upper-Floor Sway",
        badgeText: "CWA Int 4 • Upper-Floor Sway (7F)",
        level: "warning",
        explanation:
          "Responds to long-period subduction waves with visible flexural swaying that is pronounced on levels 5 to 7 (Computer Science server and research facilities).",
        driftEstPct: 1.05,
      },
    },
    {
      id: "FAC_NCU_ADMIN",
      name: "NCU Administration Building (行政大樓)",
      nameZh: "中央大學 行政大樓",
      x: 77,
      z: 20,
      width: 24,
      depth: 18,
      height: 20,
      stories: 5,
      floors: 5,
      era: "Campus Operations Center",
      structuralType: "Reinforced Concrete Frame (Mid-Rise)",
      fundamentalPeriodSec: 0.45,
      sensors: ["NCU_OPS_SCADA"],
      softStorey: false,
      shortPeriodImpact: {
        resonance: "CWA Intensity 2 (Attenuated Mid-Rise)",
        badgeText: "CWA Int 2 • 5 Storeys",
        level: "safe",
        explanation:
          "Having 5 storeys (> 3 storeys), the building motion is attenuated to Intensity 2 during the Daxi earthquake, keeping base shear within design capacity.",
        driftEstPct: 0.30,
      },
      longPeriodImpact: {
        resonance: "Moderate (Sufficient Stiffness)",
        badgeText: "CWA Int 2 • Moderate Sway",
        level: "safe",
        explanation:
          "The structural stiffness of the 5-storey frame is sufficient to suppress severe resonant amplification during slow subduction waves.",
        driftEstPct: 0.45,
      },
    },
    {
      id: "FAC_NCU_EDREAM",
      name: "College of Earth Sciences (地球科學學院大樓)",
      nameZh: "國立中央大學 地球科學學院大樓",
      x: 63,
      z: 46,
      width: 26,
      depth: 18,
      height: 16,
      stories: 4,
      floors: 4,
      era: "Geoscientific Center of Excellence",
      structuralType: "Stiff Low-Rise RC Frame w/ Seismograph Bedrock Core",
      fundamentalPeriodSec: 0.35,
      sensors: ["CWASN_NCU_BB", "TT_SAM_EDGE_NODE"],
      softStorey: false,
      shortPeriodImpact: {
        resonance: "CWA Intensity 2 (Low-Rise Attenuated / 4 Storeys)",
        badgeText: "CWA Int 2 • 4 Storeys (Safe)",
        level: "safe",
        explanation:
          "At 4 storeys (> 3 storeys), the building motion is rated Intensity 2. While its period (Tn ≈ 0.35s) responds to high-frequency motion, low drift keeps the bedrock seismograph vault secure.",
        driftEstPct: 0.28,
      },
      longPeriodImpact: {
        resonance: "Low (Safe Rigid Body Motion)",
        badgeText: "CWA Int 2 • Rigid Safe",
        level: "safe",
        explanation:
          "The 4-storey stiff structure does not resonate with slow long-period waves, moving in unison with the bedrock without dynamic drift.",
        driftEstPct: 0.16,
      },
    },
    {
      id: "FAC_NCU_GYM",
      name: "NCU Gymnasium (依仁堂體育館)",
      nameZh: "依仁堂體育館",
      x: -30,
      z: 22,
      width: 34,
      depth: 28,
      height: 16,
      stories: 2,
      floors: 2,
      era: "Post-1999 Long-Span Roof Structure",
      structuralType: "High-Bay Steel Space Truss on RC Columns (Long-Span)",
      fundamentalPeriodSec: 0.28,
      sensors: ["NCU_GYM_S1"],
      softStorey: false,
      shortPeriodImpact: {
        resonance: "CWA Intensity 3 (High-Frequency Resonance in Low-Rise ≤ 3F)",
        badgeText: "CWA Int 3 (Yellow) • 2 Storeys High-Bay",
        level: "warning",
        explanation:
          "Being a low-rise building (≤ 3 storeys), the Gymnasium directly experiences CWA Intensity 3 (Yellow) during the Daxi earthquake! Its short natural period (Tn ≈ 0.28s) resonates with the shallow crustal high frequencies, exciting the long-span roof truss joints.",
        driftEstPct: 0.38,
      },
      longPeriodImpact: {
        resonance: "Low (Safe from Long-Period Sway)",
        badgeText: "CWA Int 2 • Low-Rise Safe",
        level: "safe",
        explanation:
          "The 2-storey low-rise building does not undergo resonant amplification during long-period ground motion, maintaining low drift.",
        driftEstPct: 0.12,
      },
    },
  ]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  const isDraggingRef = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.2,
    radius: 250,
  });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 10, 0));

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.0022);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1400);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight.position.set(120, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -180;
    dirLight.shadow.camera.right = 180;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -180;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x67e8f9, 0.75);
    fillLight.position.set(-120, 100, -80);
    scene.add(fillLight);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(380, 340, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e,
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(360, 36, 0x1e293b, 0x0f172a);
    grid.position.y = 0.1;
    scene.add(grid);

    // Zhongda Lake
    const lakeGeo = new THREE.CircleGeometry(24, 32);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8,
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-11, 0.2, -37);
    scene.add(lake);

    const pavilionGeo = new THREE.CylinderGeometry(2.5, 2.5, 5, 8);
    const pavilionMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const pavilion = new THREE.Mesh(pavilionGeo, pavilionMat);
    pavilion.position.set(-11, 2.5, -37);
    scene.add(pavilion);

    // Track
    const trackCurveGeo = new THREE.RingGeometry(24, 34, 32);
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0xc2410c,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const track = new THREE.Mesh(trackCurveGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(-70, 0.15, 10);
    scene.add(track);

    // Lawn
    const lawnGeo = new THREE.CircleGeometry(28, 32);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
    });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, 0.15, -8);
    scene.add(lawn);

    // Build 3D NCU Buildings
    buildingMeshesRef.current.clear();
    buildingsRef.current.forEach((b) => {
      if (b.id === "FAC_NCU_SCIENCE_B4") {
        const detailed = createDetailedScience4Building();
        detailed.group.position.set(b.x, 0, b.z);
        scene.add(detailed.group);
        buildingMeshesRef.current.set(b.id, detailed.group);
        beaconLightRef.current = detailed.beaconLight;
        return;
      }

      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);
      group.userData = { buildingId: b.id };

      const boxGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
      const mainMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.35,
        metalness: 0.55,
      });
      const boxMesh = new THREE.Mesh(boxGeo, mainMat);
      boxMesh.position.y = b.height / 2;
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      boxMesh.userData = { buildingId: b.id };
      group.add(boxMesh);

      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
      });
      const wireframe = new THREE.LineSegments(edges, edgeMat);
      wireframe.position.y = b.height / 2;
      group.add(wireframe);

      // Floor demarcation rings
      const floorLinesGroup = new THREE.Group();
      floorLinesGroup.name = "floor_lines";
      const floorHeight = b.height / b.stories;
      for (let k = 1; k < b.stories; k++) {
        const floorY = k * floorHeight;
        const floorEdgeGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-b.width / 2 - 0.08, floorY, -b.depth / 2 - 0.08),
          new THREE.Vector3(b.width / 2 + 0.08, floorY, -b.depth / 2 - 0.08),
          new THREE.Vector3(b.width / 2 + 0.08, floorY, b.depth / 2 + 0.08),
          new THREE.Vector3(-b.width / 2 - 0.08, floorY, b.depth / 2 + 0.08),
          new THREE.Vector3(-b.width / 2 - 0.08, floorY, -b.depth / 2 - 0.08),
        ]);
        const floorLineMat = new THREE.LineBasicMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: 0.55,
        });
        const floorLine = new THREE.Line(floorEdgeGeo, floorLineMat);
        floorLinesGroup.add(floorLine);
      }
      group.add(floorLinesGroup);

      const roofPadGeo = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
      const roofPad = new THREE.Mesh(roofPadGeo, roofMat);
      roofPad.position.y = b.height + 0.75;
      group.add(roofPad);

      scene.add(group);
      buildingMeshesRef.current.set(b.id, group);
    });

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (beaconLightRef.current) {
        beaconLightRef.current.intensity = 0.5 + Math.sin(elapsedTime * 4.5) * 0.7;
      }

      // Project 3D building coordinates to screen coordinates
      if (cameraRef.current && containerRef.current) {
        const curWidth = containerRef.current.clientWidth || 700;
        const curHeight = containerRef.current.clientHeight || 640;
        const newCoords: Record<string, { x: number; y: number; visible: boolean }> = {};

        buildingsRef.current.forEach((b) => {
          const v = new THREE.Vector3(b.x, b.height + 4.5, b.z);
          v.project(cameraRef.current!);
          const isVisible = v.z < 1.0;
          const sx = (v.x * 0.5 + 0.5) * curWidth;
          const sy = (-(v.y * 0.5) + 0.5) * curHeight;
          newCoords[b.id] = { x: sx, y: sy, visible: isVisible };
        });
        setBuildingScreenCoords(newCoords);
      }

      const curT = simTimeRef.current;
      const active = isSimulatingRef.current || isPlayingRef.current || curT > 0;
      const arr = getCampusArrivalTimes(scenarioRef.current, waveRegimeRef.current);
      const phase = !active && curT === 0 ? "idle" : curT < arr.tP ? "pre_arrival" : curT < arr.tS ? "p_wave" : "s_wave";

      if (phase === "idle" || phase === "pre_arrival") {
        buildingsRef.current.forEach((b) => {
          const group = buildingMeshesRef.current.get(b.id);
          if (group) {
            group.position.x = b.x;
            group.position.y = 0;
            group.rotation.z = 0;
          }
        });
      } else if (phase === "p_wave") {
        // High-frequency compressional preliminary microtremor (Subtle vertical & horizontal)
        const tauP = curT - arr.tP;
        buildingsRef.current.forEach((b) => {
          const group = buildingMeshesRef.current.get(b.id);
          if (!group) return;
          const pTremor = Math.sin(tauP * 36 + b.x * 0.2) * 0.08;
          const pVertical = Math.sin(tauP * 50 + b.z * 0.2) * 0.05;
          group.position.x = b.x + pTremor;
          group.position.y = pVertical;
          group.rotation.z = (pTremor / b.height) * 0.012;
        });
      } else if (phase === "s_wave") {
        // Destructive shear wave & structural resonance
        const tauS = curT - arr.tS;
        const rise = Math.min(1.0, tauS / 1.2);
        const decay = Math.exp(-0.07 * Math.max(0, tauS - 4.0));
        const envelope = Math.max(0.12, rise * decay);

        buildingsRef.current.forEach((b) => {
          const group = buildingMeshesRef.current.get(b.id);
          if (!group) return;

          if (isDaxiScenarioRef.current) {
            if (b.stories <= 3) {
              // Gymnasium (2F <= 3F): Resonates strongly with shallow crustal short period (CWA Intensity 3)
              const amp = 0.85 * envelope;
              const displacement = Math.sin(tauS * 24 + b.x * 0.1) * amp;
              group.position.x = b.x + displacement;
              group.position.y = 0;
              group.rotation.z = (displacement / b.height) * 0.065;
            } else {
              // Multi-storey (> 3F: Edream Centre, Library, Eng 5, Admin, Earth Sci): Attenuated to CWA Intensity 2
              const softStoreyMultiplier = b.softStorey ? 1.45 : 1.0;
              const amp = 0.32 * softStoreyMultiplier * envelope;
              const displacement = Math.sin(tauS * 16 + b.x * 0.1) * amp;
              group.position.x = b.x + displacement;
              group.position.y = 0;
              group.rotation.z = (displacement / b.height) * 0.028;
            }
          } else if (waveRegimeRef.current === "long_period") {
            const heightAmplification = Math.pow(b.stories / 8, 2.2);
            const swayDisplacement = Math.sin(tauS * 3.4 + b.z * 0.05) * 2.2 * heightAmplification * envelope;
            group.position.x = b.x + swayDisplacement;
            group.position.y = 0;
            group.rotation.z = (swayDisplacement / b.height) * 0.15;
          } else {
            const pulse = Math.sin(tauS * 14) * Math.exp(-0.25 * tauS) * 2.4 * envelope;
            group.position.x = b.x + pulse;
            group.position.y = 0;
            group.rotation.z = (pulse / b.height) * 0.09;
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 700;
      const h = container.clientHeight || 640;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
    };
  }, [isSimulating, isDaxiScenario, waveRegime]);

  // Update Building Colors dynamically per-building synchronized with wave arrival phase
  useEffect(() => {
    buildingsRef.current.forEach((b) => {
      const group = buildingMeshesRef.current.get(b.id);
      if (!group) return;

      const feltInt = getBuildingFeltIntensity(b);
      const palette = CWA_INTENSITY_PALETTE[feltInt] || CWA_INTENSITY_PALETTE["2"];
      const intensityHex = palette.hex;

      const isResonant =
        isDaxiScenario
          ? b.stories <= 3 || b.softStorey
          : waveRegime === "long_period"
          ? b.stories >= 7
          : true;

      if (b.id === "FAC_NCU_SCIENCE_B4") {
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
              if (currentPhase === "s_wave") {
                mat.emissive.setHex(intensityHex);
                mat.emissiveIntensity = isResonant ? 0.55 : 0.25;
              } else if (currentPhase === "p_wave") {
                mat.emissive.setHex(0xfbbf24);
                mat.emissiveIntensity = 0.25;
              } else {
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0.0;
              }
            }
          }
        });
        return;
      }

      const boxMesh = group.children[0] as THREE.Mesh;
      const wireframe = group.children[1] as THREE.LineSegments;
      const floorLinesGroup = group.children[2] as THREE.Group;

      if (boxMesh && boxMesh.material) {
        const mat = boxMesh.material as THREE.MeshStandardMaterial;
        if (currentPhase === "s_wave") {
          mat.color.setHex(intensityHex);
          mat.emissive.setHex(intensityHex);
          mat.emissiveIntensity = isResonant ? 0.45 : 0.15;
        } else if (currentPhase === "p_wave") {
          mat.color.setHex(0x1e293b);
          mat.emissive.setHex(0xfbbf24);
          mat.emissiveIntensity = 0.2;
        } else {
          mat.color.setHex(0x1e293b);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }

      if (wireframe && wireframe.material) {
        const lineMat = wireframe.material as THREE.LineBasicMaterial;
        if (currentPhase === "s_wave") {
          lineMat.color.setHex(intensityHex);
          lineMat.opacity = isResonant ? 0.95 : 0.4;
        } else if (currentPhase === "p_wave") {
          lineMat.color.setHex(0xfbbf24);
          lineMat.opacity = 0.7;
        } else {
          lineMat.color.setHex(0x38bdf8);
          lineMat.opacity = 0.55;
        }
      }

      if (floorLinesGroup) {
        floorLinesGroup.children.forEach((child) => {
          const line = child as THREE.Line;
          if (line.material) {
            const lMat = line.material as THREE.LineBasicMaterial;
            if (currentPhase === "s_wave") {
              lMat.color.setHex(intensityHex);
              lMat.opacity = isResonant ? 0.85 : 0.35;
            } else if (currentPhase === "p_wave") {
              lMat.color.setHex(0xfbbf24);
              lMat.opacity = 0.6;
            } else {
              lMat.color.setHex(0x0284c7);
              lMat.opacity = 0.45;
            }
          }
        });
      }
    });
  }, [currentPhase, isDaxiScenario, waveRegime]);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const target = cameraTargetRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    cameraAngleRef.current.theta -= deltaX * 0.008;
    cameraAngleRef.current.phi = Math.max(
      0.2,
      Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - deltaY * 0.008)
    );

    updateCameraPosition();
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const dist = Math.hypot(
      e.clientX - pointerDownPos.current.x,
      e.clientY - pointerDownPos.current.y
    );
    isDraggingRef.current = false;

    if (dist < 6 && containerRef.current && cameraRef.current && sceneRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const targets: THREE.Object3D[] = [];
      buildingMeshesRef.current.forEach((grp) => targets.push(grp));
      const intersects = raycaster.intersectObjects(targets, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        let matched: CampusBuilding | undefined;
        while (hitObj && hitObj !== sceneRef.current) {
          for (const b of buildingsRef.current) {
            const grp = buildingMeshesRef.current.get(b.id);
            if (grp === hitObj) {
              matched = b;
              break;
            }
          }
          if (matched) break;
          hitObj = hitObj.parent;
        }
        if (matched) {
          setSelectedBuilding(matched);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraAngleRef.current.radius = Math.max(
      50,
      Math.min(380, cameraAngleRef.current.radius + e.deltaY * 0.15)
    );
    updateCameraPosition();
  };

  const setPreset = (preset: "campus" | "edream" | "library" | "eng5" | "admin" | "gym") => {
    setCameraMode(preset);
    if (preset === "campus") {
      cameraTargetRef.current.set(0, 10, 0);
      cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 250 };
      setSelectedBuilding(null);
    } else if (preset === "edream") {
      cameraTargetRef.current.set(-5, 18, -65);
      cameraAngleRef.current = { theta: Math.PI / 1.7, phi: Math.PI / 3.4, radius: 75 };
      setSelectedBuilding(buildingsRef.current[0]);
    } else if (preset === "library") {
      cameraTargetRef.current.set(57, 18, 19);
      cameraAngleRef.current = { theta: (5 * Math.PI) / 4, phi: Math.PI / 3.5, radius: 95 };
      setSelectedBuilding(buildingsRef.current[1]);
    } else if (preset === "eng5") {
      cameraTargetRef.current.set(-116, 18, 55);
      cameraAngleRef.current = { theta: -Math.PI / 3, phi: Math.PI / 3.5, radius: 100 };
      setSelectedBuilding(buildingsRef.current[2]);
    } else if (preset === "admin") {
      cameraTargetRef.current.set(77, 14, 20);
      cameraAngleRef.current = { theta: Math.PI, phi: Math.PI / 3.2, radius: 85 };
      setSelectedBuilding(buildingsRef.current[3]);
    } else if (preset === "gym") {
      cameraTargetRef.current.set(-30, 10, 22);
      cameraAngleRef.current = { theta: Math.PI / 2.5, phi: Math.PI / 3.2, radius: 85 };
      setSelectedBuilding(buildingsRef.current[5]);
    }
    updateCameraPosition();
  };

  const simTimeRef = useRef<number>(effectiveSimTime);
  const isSimulatingRef = useRef<boolean>(isSimulating);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const waveRegimeRef = useRef<SeismicWaveRegime>(waveRegime);
  const isDaxiScenarioRef = useRef<boolean>(isDaxiScenario);
  const scenarioRef = useRef<Scenario | null>(scenario);

  useEffect(() => {
    simTimeRef.current = effectiveSimTime;
  }, [effectiveSimTime]);

  useEffect(() => {
    isSimulatingRef.current = isSimulating;
    isPlayingRef.current = isPlaying;
    waveRegimeRef.current = waveRegime;
    isDaxiScenarioRef.current = isDaxiScenario;
    scenarioRef.current = scenario;
  }, [isSimulating, isPlaying, waveRegime, isDaxiScenario, scenario]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 select-none font-sans">
      <style>{`
        @keyframes seismicTremor {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          20% { transform: translate(-3px, 1.5px) rotate(-0.25deg); }
          40% { transform: translate(2.5px, -2px) rotate(0.2deg); }
          60% { transform: translate(-2.5px, -1px) rotate(-0.15deg); }
          80% { transform: translate(3px, 1px) rotate(0.15deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
      `}</style>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className={`h-full w-full ${
          displayMode === "orbit_3d" ? "cursor-grab active:cursor-grabbing block" : "hidden"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* TOP UNIFIED MISSION CONTROL BAR (Clean, non-overlapping) */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/90 px-3 py-2 flex items-center justify-between gap-2 shadow-lg">
        {/* Left: Building Title & Daxi Intensity Rule Badge */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-slate-100 text-xs tracking-wide">
              {displayMode === "ultra_hd_twin" ? "NCU Edream Centre Digital Twin" : "NCU Real Campus 3D Twin"}
            </span>
          </div>

          <span
            className={`rounded px-2 py-0.5 text-[9px] font-mono font-bold ${
              currentPhase === "s_wave"
                ? "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                : currentPhase === "p_wave"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                : currentPhase === "pre_arrival"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {currentPhase === "s_wave"
              ? `S-WAVE ACTIVE (${effectiveSimTime.toFixed(1)}s)`
              : currentPhase === "p_wave"
              ? `P-WAVE TREMOR (S in ${Math.max(0, tS - effectiveSimTime).toFixed(1)}s)`
              : currentPhase === "pre_arrival"
              ? `TRANSIT (P in ${Math.max(0, tP - effectiveSimTime).toFixed(1)}s)`
              : "STANDBY (0.0s)"}
          </span>

          {/* Daxi Ground Motion Distribution Indicator */}
          {isDaxiScenario && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] font-mono">
              <span className="text-slate-400">Daxi Rule:</span>
              <span className="inline-flex items-center space-x-1 font-bold text-yellow-400">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                <span>≤3F: Int 3</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="inline-flex items-center space-x-1 font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>&gt;3F: Int 2</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: View Mode Toggle, Presets, and Satellite Map Return */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {/* View Mode Switcher */}
          <div className="flex items-center space-x-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setDisplayMode("orbit_3d")}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold transition ${
                displayMode === "orbit_3d"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Box className="h-3 w-3" />
              <span>3D Orbit</span>
            </button>
            <button
              onClick={() => {
                setDisplayMode("ultra_hd_twin");
                setPreset("edream");
              }}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition ${
                displayMode === "ultra_hd_twin"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-sm"
                  : "text-cyan-300 hover:text-white"
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span>Ultra-HD Twin</span>
            </button>
          </div>

          {/* Camera Presets */}
          {displayMode === "orbit_3d" && (
            <div className="hidden md:flex items-center space-x-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setPreset("campus")}
                className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                  cameraMode === "campus"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Campus
              </button>
              <button
                onClick={() => setPreset("edream")}
                className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                  cameraMode === "edream"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Edream (8F)
              </button>
              <button
                onClick={() => setPreset("library")}
                className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                  cameraMode === "library"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Library (8F)
              </button>
              <button
                onClick={() => setPreset("eng5")}
                className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                  cameraMode === "eng5"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Eng 5 (7F)
              </button>
              <button
                onClick={() => setPreset("admin")}
                className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                  cameraMode === "admin"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Admin (5F)
              </button>
              <button
                onClick={() => setPreset("gym")}
                className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                  cameraMode === "gym"
                    ? "bg-yellow-400 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Gym (2F)
              </button>
              <button
                onClick={() => setPreset("campus")}
                title="Reset Camera"
                className="p-1 text-slate-400 hover:text-cyan-400 rounded transition"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}

          {onBackToGis && (
            <button
              onClick={onBackToGis}
              className="flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shadow-sm ml-1"
            >
              <MapIcon className="h-3 w-3" />
              <span>Satellite Map</span>
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC WAVEFRONT ARRIVAL TELEMETRY HUD */}
      {displayMode === "orbit_3d" && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl text-[10px] font-mono pointer-events-none">
          {currentPhase === "pre_arrival" && (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-cyan-300 font-bold">WAVEFRONT IN TRANSIT:</span>
              <span className="text-slate-300">P-Wave in <b className="text-cyan-400 font-black">{Math.max(0, tP - effectiveSimTime).toFixed(1)}s</b></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">S-Wave in <b className="text-amber-400 font-black">{Math.max(0, tS - effectiveSimTime).toFixed(1)}s</b></span>
              <span className="text-slate-400 text-[9px]">(Campus Static / Standby)</span>
            </>
          )}
          {currentPhase === "p_wave" && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-amber-300 font-bold">P-WAVE ARRIVED (t={effectiveSimTime.toFixed(1)}s):</span>
              <span className="text-slate-300">Compressional Tremor</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-bold">S-Wave Warning: +{Math.max(0, tS - effectiveSimTime).toFixed(1)}s Lead Time</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">TRACK-A REFLEX ACTIVE</span>
            </>
          )}
          {currentPhase === "s_wave" && (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-red-400 font-bold">S-WAVE ACTIVE SHAKING (t={effectiveSimTime.toFixed(1)}s):</span>
              <span className="text-slate-300">Resonant Sway Active</span>
              <span className="text-slate-600">|</span>
              <span className="text-yellow-400 font-bold">≤3F: Int 3 (Yellow)</span>
              <span className="text-emerald-400 font-bold">&gt;3F: Int 2 (Green)</span>
            </>
          )}
          {currentPhase === "idle" && (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span className="text-slate-400">NCU Real Campus 3D Twin • Standby for Real-Time Wavefront Arrival</span>
            </>
          )}
        </div>
      )}

      {/* 3D FLOATING LABELS (Hidden for currently inspected building to eliminate roof clutter) */}
      {displayMode === "orbit_3d" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {buildingsRef.current.map((b) => {
            const coord = buildingScreenCoords[b.id];
            if (!coord || !coord.visible) return null;

            // Hide the floating tag if the building is currently selected and inspected!
            if (selectedBuilding?.id === b.id) return null;

            const feltInt = getBuildingFeltIntensity(b);
            const palette = CWA_INTENSITY_PALETTE[feltInt] || CWA_INTENSITY_PALETTE["2"];

            return (
              <div
                key={b.id}
                className="absolute transform -translate-x-1/2 -translate-y-full transition-transform pointer-events-auto cursor-pointer"
                style={{
                  left: `${coord.x}px`,
                  top: `${coord.y - 12}px`,
                }}
                onClick={() => setSelectedBuilding(b)}
              >
                <div
                  className="flex flex-col items-center rounded-lg px-2 py-0.5 shadow-2xl backdrop-blur-md border bg-slate-900/85 hover:border-cyan-400 transition-all"
                  style={{
                    borderColor: isSimulating ? palette.css : undefined,
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span className="text-[9px] font-mono font-bold text-cyan-300">
                      {b.floors}F
                    </span>
                    <span className="text-[10px] font-bold text-white whitespace-nowrap truncate max-w-[120px]">
                      {b.name.split("(")[0]}
                    </span>
                  </div>

                  {currentPhase === "pre_arrival" && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[8px] font-mono font-medium text-cyan-300 px-1 rounded bg-cyan-950/60 border border-cyan-800/60">
                        P-Wave in {Math.max(0, tP - effectiveSimTime).toFixed(1)}s
                      </span>
                    </div>
                  )}

                  {currentPhase === "p_wave" && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-[8px] font-mono font-bold text-amber-300 px-1 rounded bg-amber-950/60 border border-amber-700/60">
                        P-Wave • S in {Math.max(0, tS - effectiveSimTime).toFixed(1)}s
                      </span>
                    </div>
                  )}

                  {currentPhase === "s_wave" && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full animate-ping"
                        style={{ backgroundColor: palette.css }}
                      />
                      <span
                        className="text-[8px] font-mono font-bold px-1 rounded truncate max-w-[120px]"
                        style={{
                          backgroundColor: palette.css,
                          color: palette.textDark ? "#0f172a" : "#ffffff",
                        }}
                      >
                        Int {feltInt} ({feltInt === "3" ? "≤3F Yellow" : ">3F Green"})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ULTRA-HD PERSPECTIVE ARCHITECTURAL TWIN VIEW */}
      {displayMode === "ultra_hd_twin" && (
        <div className="relative h-full w-full bg-slate-950 flex items-center justify-center overflow-hidden pt-10">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          <div className="relative max-h-full max-w-full aspect-[4/3] flex items-center justify-center">
            <img
              src="/assets/buildings/science4_isometric.jpg"
              alt="NCU Edream Centre Ultra-HD Perspective Twin"
              className="max-h-[520px] w-auto object-contain rounded-lg shadow-2xl border border-slate-800/80 select-none"
              draggable={false}
            />

            {EDREAM_CENTRE_HOTSPOTS.map((spot, idx) => {
              const isSelected = activeHotspot?.id === spot.id;
              return (
                <button
                  key={spot.id}
                  onClick={() => setActiveHotspot(isSelected ? null : spot)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 focus:outline-none"
                  style={{ left: `${spot.xPct}%`, top: `${spot.yPct}%` }}
                  title={`${spot.nameZh} - ${spot.nameEn}`}
                >
                  <span className="relative flex h-6 w-6 items-center justify-center">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isSimulating
                          ? "bg-emerald-400"
                          : spot.category === "astronomy"
                          ? "bg-cyan-400"
                          : spot.category === "energy"
                          ? "bg-amber-400"
                          : spot.category === "sensor"
                          ? "bg-rose-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-5 w-5 border-2 text-[10px] font-black items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                        isSelected
                          ? "bg-white text-slate-950 border-cyan-400 scale-125 ring-2 ring-cyan-400/50"
                          : isSimulating
                          ? "bg-emerald-500 text-slate-950 border-white"
                          : spot.category === "astronomy"
                          ? "bg-cyan-500 text-slate-950 border-white"
                          : spot.category === "energy"
                          ? "bg-amber-500 text-slate-950 border-white"
                          : "bg-slate-900 text-cyan-300 border-cyan-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </span>

                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-slate-900/95 border border-slate-700 text-[9px] font-bold text-white whitespace-nowrap pointer-events-none shadow-xl backdrop-blur-md">
                    {spot.nameEn}
                  </span>
                </button>
              );
            })}

            {isSimulating && (
              <div className="absolute left-[51.5%] top-[78%] -translate-x-1/2 z-20 pointer-events-none">
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded border border-emerald-400/80 bg-slate-950/95 text-emerald-300 text-[9px] font-bold shadow-2xl animate-bounce backdrop-blur-md">
                  <ShieldAlert className="h-3 w-3 text-emerald-400" />
                  <span>EDREAM CENTRE (8F): FELT INTENSITY 2 • 1F SOFT-STOREY SHEAR ALERT</span>
                </div>
              </div>
            )}
          </div>

          {activeHotspot && (
            <div className="absolute top-14 right-3 z-30 w-80 rounded-xl border border-cyan-500/40 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-2">
                <div>
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                      {activeHotspot.tag}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize font-medium">
                      {activeHotspot.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-[13px]">{activeHotspot.nameEn}</h4>
                  <p className="text-[10px] text-cyan-400 font-medium">{activeHotspot.nameZh}</p>
                </div>
                <button
                  onClick={() => setActiveHotspot(null)}
                  className="text-slate-400 hover:text-white text-sm px-1.5 py-0.5 rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                {activeHotspot.details}
              </p>

              <div className="grid grid-cols-2 gap-1.5 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 mb-2.5">
                {activeHotspot.specs.map((spec, sIdx) => (
                  <div key={sIdx} className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-mono">{spec.label}</span>
                    <span className="text-[11px] font-semibold text-slate-200 truncate" title={spec.value}>
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800 text-slate-400">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Telemetry Live Stream</span>
                </span>
                <button
                  onClick={() => setDisplayMode("orbit_3d")}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  View in 3D Orbit →
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-2">
            <button
              onClick={() => setDisplayMode("orbit_3d")}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-xs font-semibold text-cyan-300 hover:bg-slate-800 hover:text-white transition shadow-lg backdrop-blur-md"
            >
              <Box className="h-3.5 w-3.5 text-cyan-400" />
              <span>Rotate 360° in 3D WebGL</span>
            </button>
          </div>
        </div>
      )}

      {/* BUILDING INSPECTION MODAL (Upper Left Card - Clean, dismissable, fits spacious 640px height) */}
      {displayMode === "orbit_3d" && selectedBuilding && (
        <div className="absolute top-14 left-3 z-20 w-80 max-h-[500px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-2">
            <div>
              <div className="flex items-center space-x-1.5 mb-1">
                <span className="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  {selectedBuilding.floors} Storeys ({selectedBuilding.stories}F)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Height: ~{selectedBuilding.height}m
                </span>
              </div>
              <h4 className="font-bold text-white text-[13px] leading-tight">{selectedBuilding.name}</h4>
              <p className="text-[10px] text-cyan-400 font-medium">{selectedBuilding.nameZh}</p>
            </div>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-slate-800"
              title="Close Panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-[11px] text-slate-300">
            {/* Parameters Matrix */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-[9px] text-slate-400 block font-mono uppercase">Floor Count</span>
                <span className="font-bold text-white text-[11px]">
                  {selectedBuilding.floors} Storeys
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-mono uppercase">Period (Tn)</span>
                <span className="font-bold text-cyan-300 text-[11px] font-mono">
                  ~{selectedBuilding.fundamentalPeriodSec} sec
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800/80">
                <span className="text-[9px] text-slate-400 block font-mono uppercase">Structural Frame</span>
                <span className="text-[10px] text-slate-300 font-medium truncate block" title={selectedBuilding.structuralType}>
                  {selectedBuilding.structuralType}
                </span>
              </div>
            </div>

            {/* Felt Intensity and Response Card */}
            {(() => {
              const feltInt = getBuildingFeltIntensity(selectedBuilding);
              const palette = CWA_INTENSITY_PALETTE[feltInt] || CWA_INTENSITY_PALETTE["2"];

              return (
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Felt Intensity:
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                      style={{
                        backgroundColor: palette.css,
                        color: palette.textDark ? "#0f172a" : "#ffffff",
                      }}
                    >
                      CWA Int {feltInt} ({feltInt === "3" ? "≤3F Yellow" : ">3F Green"})
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    {isDaxiScenario
                      ? selectedBuilding.shortPeriodImpact.explanation
                      : waveRegime === "long_period"
                      ? selectedBuilding.longPeriodImpact.explanation
                      : "Near-fault high-velocity fling pulse excites the building dynamically."}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                    <span className="text-slate-400">Drift (IDR):</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: palette.css }}
                    >
                      {isDaxiScenario
                        ? `${selectedBuilding.shortPeriodImpact.driftEstPct}% (Safe / Attenuated)`
                        : `${selectedBuilding.longPeriodImpact.driftEstPct}% (Roof Lateral Sway)`}
                    </span>
                  </div>
                </div>
              );
            })()}

            {selectedBuilding.id === "FAC_NCU_SCIENCE_B4" && (
              <button
                onClick={() => setDisplayMode("ultra_hd_twin")}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-[11px] shadow hover:opacity-95 transition mt-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Open Ultra-HD Perspective Twin</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM-CENTER: SEISMIC CONTROLS DOCK (Spacious, unified, non-colliding) */}
      {displayMode === "orbit_3d" && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-2xl text-xs max-w-[95%]">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-semibold font-mono mr-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Wave Spectrum:</span>
          </div>

          <button
            onClick={() => setWaveRegime("short_period")}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition ${
              waveRegime === "short_period"
                ? "bg-yellow-400 text-slate-950 shadow-md ring-1 ring-yellow-400/50"
                : "text-slate-400 hover:text-white"
            }`}
            title="2012 Daxi Earthquake - High-frequency shallow motion (≤3F Int 3 / >3F Int 2)"
          >
            <Zap className="h-3 w-3" />
            <span>Short-Period (2012 Daxi: ≤3F Int 3 / &gt;3F Int 2)</span>
          </button>

          <button
            onClick={() => setWaveRegime("long_period")}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition ${
              waveRegime === "long_period"
                ? "bg-orange-500 text-slate-950 shadow-md ring-1 ring-orange-400/50"
                : "text-slate-400 hover:text-white"
            }`}
            title="Distant Subduction (Hualien Offshore) - Long-period harmonic sway in 8F buildings"
          >
            <Layers className="h-3 w-3" />
            <span>Long-Period (Subduction - Int 4)</span>
          </button>

          <button
            onClick={() => setWaveRegime("near_fault_pulse")}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition ${
              waveRegime === "near_fault_pulse"
                ? "bg-red-600 text-white shadow-md ring-1 ring-red-400/50"
                : "text-slate-400 hover:text-white"
            }`}
            title="Near-Fault Multi-Segment Rupture (M6.91)"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Near-Fault (M6.9 - Int 6-)</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={handleTriggerSim}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition shadow border ${
              isSimulating
                ? "bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 animate-pulse"
                : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950"
            }`}
          >
            <Activity className="h-3 w-3" />
            <span>
              {isSimulating
                ? `Simulating (${effectiveSimTime.toFixed(1)}s)`
                : "Run Simulation"}
            </span>
          </button>
        </div>
      )}

      {/* Subtle bottom-right caption */}
      {displayMode === "orbit_3d" && (
        <div className="hidden lg:block absolute bottom-3 right-3 z-10 text-[9px] text-slate-500 bg-slate-950/70 px-2 py-1 rounded border border-slate-800/80 font-mono">
          Click building to inspect • Drag to rotate
        </div>
      )}
    </div>
  );
};
