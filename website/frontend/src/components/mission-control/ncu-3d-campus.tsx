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
  ShieldCheck,
  CheckCircle2,
  Info,
  Zap,
  Activity,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { createDetailedScience4Building } from "./detailed-building-3d";

interface NCU3DCampusProps {
  scenario: Scenario | null;
  isSimulating: boolean;
  onBackToGis?: () => void;
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
  { hex: number; css: string; labelId: string; pga: string; pgv: string; textDark?: boolean }
> = {
  "0": { hex: 0x94a3b8, css: "#94a3b8", labelId: "Intensitas 0 (Mikro / Tidak Dirasakan)", pga: "< 0.8 Gal", pgv: "< 0.2 cm/s" },
  "1": { hex: 0x60a5fa, css: "#60a5fa", labelId: "Intensitas 1 (Sangat Ringan)", pga: "0.8 - 2.5 Gal", pgv: "0.2 - 0.7 cm/s" },
  "2": { hex: 0x4ade80, css: "#4ade80", labelId: "Intensitas 2 (Ringan / Minor)", pga: "2.5 - 8.0 Gal", pgv: "0.7 - 1.9 cm/s" },
  "3": { hex: 0xfacc15, css: "#facc15", labelId: "Intensitas 3 (Sedang / Light)", pga: "8.0 - 25 Gal", pgv: "1.03 cm/s (2012 Daxi)", textDark: true },
  "4": { hex: 0xfb923c, css: "#fb923c", labelId: "Intensitas 4 (Kuat / Moderate)", pga: "25 - 80 Gal", pgv: "1.9 - 5.7 cm/s" },
  "5-": { hex: 0xf87171, css: "#f87171", labelId: "Intensitas 5- (Kuat Ringan / Strong)", pga: "80 - 140 Gal", pgv: "5.7 - 15 cm/s" },
  "5+": { hex: 0xef4444, css: "#ef4444", labelId: "Intensitas 5+ (Kuat Berat / Strong)", pga: "140 - 250 Gal", pgv: "15 - 30 cm/s" },
  "6-": { hex: 0xdc2626, css: "#dc2626", labelId: "Intensitas 6- (Sangat Kuat / Very Strong)", pga: "250 - 440 Gal", pgv: "30 - 50 cm/s" },
  "6+": { hex: 0x991b1b, css: "#991b1b", labelId: "Intensitas 6+ (Sangat Kuat / Extreme)", pga: "440 - 800 Gal", pgv: "50 - 80 cm/s" },
  "7": { hex: 0x7f1d1d, css: "#7f1d1d", labelId: "Intensitas 7 (Bencana Dahsyat / Severe)", pga: "> 800 Gal", pgv: "> 80 cm/s" },
};

const SCIENCE4_HOTSPOTS: ArchitecturalHotspot[] = [
  {
    id: "dome",
    nameZh: "健雄天文觀測圓頂 (8F)",
    nameEn: "Astronomical Observatory Dome (8F)",
    xPct: 50.0,
    yPct: 15.5,
    category: "astronomy",
    tag: "GEODESIC ROTUNDA",
    details: "Dilengkapi teleskop optik 24-inci, motor azimuth rotunda drum, dan telemetri mikrotremor triaksial untuk analisis dinamika lantai teratas (8F).",
    specs: [
      { label: "Diameter", value: "10.8 meter" },
      { label: "Lantai", value: "Lantai 8 (Atap Utama)" },
      { label: "Struktur", value: "Geodesic Steel & Glass" },
      { label: "Sensor Getaran", value: "NCU_DOME_VIB01 (0.012g)" },
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
    details: "Panel surya monokristalin efisiensi tinggi miring 23.5° ke selatan pada atap sayap selatan S4.",
    specs: [
      { label: "Kapasitas", value: "48 kW Peak" },
      { label: "Elevasi", value: "Lantai 8 (+32m)" },
      { label: "Kemiringan", value: "23.5° Selatan" },
      { label: "Koneksi", value: "NCU Substation B" },
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
    details: "Kubah kaca melengkung di atas atrium sentral. Memuat ruang mesin lift berkecepatan tinggi dan sensor drift inti geser beton.",
    specs: [
      { label: "Tipe Inti", value: "RC Shear Wall Core" },
      { label: "Lantai Teratas", value: "Lantai 8 Ruang Mesin" },
      { label: "Baseline IDR", value: "0.04% (Normal)" },
      { label: "Sambungan", value: "Seismic Expansion Joints" },
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
    details: "Menara pendingin ganda dengan peredam getaran spring-neoprene untuk meredam resonansi mesin non-struktural saat eksitasi gempa.",
    specs: [
      { label: "Kapasitas", value: "2x 150 Ton Chiller" },
      { label: "Isolasi Getar", value: "Spring Damping (98.4%)" },
      { label: "Katup Otomatis", value: "Seismic Flow Trip SCADA" },
      { label: "Elevasi", value: "Atap Mekanikal 8F" },
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
    details: "Teras laboratorium bertingkat simetris untuk lab optik kuantum fisika dan instrumentasi sounding atmosfer antariksa NCU.",
    specs: [
      { label: "Tingkat Lantai", value: "Lantai 4F, 5F, 6F" },
      { label: "Balustrade", value: "Tempered Glass & Baja" },
      { label: "Pemantauan Drift", value: "Sensor LVDT Real-Time" },
      { label: "Okupansi", value: "Lab Riset Pascasarjana" },
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
    details: "Portico batu travertine 2 lantai. Zona evaluasi kritis ASCE 41-17: aula terbuka lantai 1 menunjukkan kontras kekakuan lantai lunak (Soft-Storey) yang rentan terhadap geser gempa dangkal.",
    specs: [
      { label: "Seismograf", value: "NCU_ACC_04 (Triaksial Z/N/E)" },
      { label: "Rasio Kekakuan", value: "K_1F / K_2F = 0.62 (Soft-Storey)" },
      { label: "Tingkat", value: "Lantai 1 Dasar (Atrium Terbuka)" },
      { label: "Status Audit", value: "Audit Pasca-1999: Zona Kritis Geser" },
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
    details: "Plaza pejalan kaki batu granit, jalur landai difabel ADA, dan area terbuka aman yang ditetapkan sebagai Titik Evakuasi Darurat NCU #4.",
    specs: [
      { label: "Kapasitas", value: "600 Orang" },
      { label: "Material", value: "Granit Interlocking Pavers" },
      { label: "Akses", value: "Ramp Ganda & 3 Trap Tangga" },
      { label: "Hidran", value: "CWA Station #4 Hydrant" },
    ],
  },
];

export const NCU3DCampus: React.FC<NCU3DCampusProps> = ({
  scenario,
  isSimulating: propIsSimulating,
  onBackToGis,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [cameraMode, setCameraMode] = useState<"campus" | "science4" | "eng5" | "library" | "admin">("campus");
  const [displayMode, setDisplayMode] = useState<"orbit_3d" | "ultra_hd_twin">("orbit_3d");
  const [activeHotspot, setActiveHotspot] = useState<ArchitecturalHotspot | null>(null);
  const [localSimulating, setLocalSimulating] = useState<boolean>(false);
  const [waveRegime, setWaveRegime] = useState<SeismicWaveRegime>("short_period");
  const [buildingScreenCoords, setBuildingScreenCoords] = useState<
    Record<string, { x: number; y: number; visible: boolean }>
  >({});

  const isSimulating = propIsSimulating || localSimulating;

  // Sync wave regime with incoming scenario
  useEffect(() => {
    if (!scenario) return;
    const id = scenario.id.toLowerCase();
    if (id.includes("20883") || id.includes("20122")) {
      setWaveRegime("short_period");
    } else if (id.includes("hualien")) {
      setWaveRegime("long_period");
    } else if (id.includes("shuanglienpo") || id.includes("hukou") || id.includes("meinong")) {
      setWaveRegime("near_fault_pulse");
    }
  }, [scenario]);

  // Determine active felt CWA intensity at NCU
  const activeIntensity = useMemo(() => {
    if (waveRegime === "short_period") {
      // 2012 Daxi Taoyuan (EQ 20883) was recorded at on-campus TCU083 with Intensity 3!
      if (scenario?.id?.includes("20122")) return "2";
      return "3";
    } else if (waveRegime === "long_period") {
      // Hualien offshore felt Int 4 in northern basins
      return "4";
    } else {
      // Near fault rupture (Shuanglienpo M6.9)
      return "6-";
    }
  }, [scenario, waveRegime]);

  const animationFrameRef = useRef<number | null>(null);
  const beaconLightRef = useRef<THREE.PointLight | null>(null);
  const pointerDownPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Verified NCU Campus Buildings with Real Storeys, Structural Heights, and Period Analytics
  const buildingsRef = useRef<CampusBuilding[]>([
    {
      id: "FAC_NCU_SCIENCE_B4",
      name: "Science Building 4 (健雄館 / S4)",
      nameZh: "國立中央大學 理學院四館 / 健雄館",
      x: -5,
      z: -65,
      width: 24,
      depth: 18,
      height: 32,
      stories: 8,
      floors: 8,
      era: "Pre-1999 (Ground Floor Soft-Storey)",
      structuralType: "RC Frame w/ Open Ground Hall (Diskontinuitas Kekakuan 1F)",
      fundamentalPeriodSec: 0.65,
      sensors: ["NCU_ACC_04_Z", "NCU_ACC_04_N", "NCU_ACC_04_E"],
      softStorey: true,
      shortPeriodImpact: {
        resonance: "Tinggi (Konsentrasi Geser Lantai 1)",
        badgeText: "⚠️ 1F Soft-Storey Shear Alert",
        level: "critical",
        explanation:
          "Meskipun gedung memiliki 8 lantai, lantai 1 (Ground Hall) memiliki dinding terbuka dengan rasio kekakuan K_1F / K_2F = 0.62. Gelombang frekuensi tinggi dari gempa dangkal Daxi (2012) memicu percepatan inersia cepat yang terkonsentrasi pada kolom lantai dasar!",
        driftEstPct: 0.52,
      },
      longPeriodImpact: {
        resonance: "Kritis (Resonansi Harmonik 8F)",
        badgeText: "🏢 Resonansi Gedung Tinggi (8F)",
        level: "critical",
        explanation:
          "Sebagai gedung tinggi 8 lantai (32m), S4 sangat peka terhadap gelombang periode panjang (>1.0s) dari gempa subduksi. Kubah astronomi di lantai 8 mengalami translasi lateral besar bolak-balik dengan osilasi lambat.",
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
      structuralType: "Dual RC Shear Wall & Braced Core (Beban Rak Buku Masif)",
      fundamentalPeriodSec: 0.72,
      sensors: ["NCU_LIB_SM1", "NCU_LIB_SM2"],
      softStorey: false,
      shortPeriodImpact: {
        resonance: "Rendah (Teredam / Filter Dinamis)",
        badgeText: "🛡️ Teredam (Filter Gelombang Pendek)",
        level: "safe",
        explanation:
          "Struktur 8 lantai yang fleksibel dan bermassa besar (Tn = 0.72s) bertindak sebagai low-pass filter terhadap gelombang periode pendek gempa dangkal Daxi. Ayunan atap kecil dan dinding geser inti tetap berada dalam rentang elastis aman.",
        driftEstPct: 0.22,
      },
      longPeriodImpact: {
        resonance: "Kritis (Resonansi Harmonik Maksimal)",
        badgeText: "🏢 Resonansi Maksimal (Gedung Tinggi 8F)",
        level: "critical",
        explanation:
          "Periode fundamental 0.72s berimpit langsung dengan spektrum gelombang geser periode panjang subduksi/cekungan Taoyuan! Terjadi amplifikasi harmonik hebat pada lantai atas (6F-8F), risiko buku berjatuhan dari rak bertingkat dan kabel lift terpelintir.",
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
        resonance: "Moderat (Daktil Aman)",
        badgeText: "🛡️ Daktil Rendah Resiko",
        level: "safe",
        explanation:
          "Detail sengkang pengekang daktil pasca-1999 mendisipasi energi getaran frekuensi tinggi dengan efektif. Percepatan lantai moderat tanpa risiko struktural berarti.",
        driftEstPct: 0.26,
      },
      longPeriodImpact: {
        resonance: "Tinggi (Ayunan Resonan Lantai Atas)",
        badgeText: "🏢 Ayunan Resonansi 7F",
        level: "warning",
        explanation:
          "Sebagai gedung bertingkat 7 lantai, gedung ini merespon gelombang periode panjang dengan ayunan lateral bolak-balik yang terasa jelas di lantai 5 hingga 7 (Lab Komputer & Server EECS).",
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
        resonance: "Tinggi (Resonansi Spektrum Pendek)",
        badgeText: "⚡ Resonansi Periode Pendek (5F)",
        level: "warning",
        explanation:
          "Periode alami ~0.45s berdekatan dengan spektrum energi dominan gempa dangkal Daxi (~0.25-0.4s). Mengalami percepatan spektral dasar tertinggi di antara gedung bertingkat menengah.",
        driftEstPct: 0.38,
      },
      longPeriodImpact: {
        resonance: "Moderat (Kekakuan Memadai)",
        badgeText: "🛡️ Cukup Kaku (Resonansi Rendah)",
        level: "safe",
        explanation:
          "Kekakuan gedung 5 lantai cukup untuk mencegah resonansi dengan gelombang subduksi periode panjang (>1.2s).",
        driftEstPct: 0.45,
      },
    },
    {
      id: "FAC_NCU_EDREAM",
      name: "College of Earth Sciences (地球科學學院 / E-DREaM)",
      nameZh: "地球科學學院 / 健雄館南翼 / E-DREaM Lab",
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
        resonance: "Tinggi (Resonansi Frekuensi Tinggi)",
        badgeText: "⚡ Resonansi Frekuensi Tinggi (4F)",
        level: "warning",
        explanation:
          "Struktur kaku 4 lantai memiliki Tn ≈ 0.35s, hampir identik dengan periode dominan gelombang gempa dangkal Daxi (f ≈ 3 Hz). Mengalami percepatan lantai puncak, namun kekakuan struktur menjaga drift tetap aman.",
        driftEstPct: 0.32,
      },
      longPeriodImpact: {
        resonance: "Rendah (Aman Bebas Resonansi)",
        badgeText: "🛡️ Sangat Aman (Bebas Ayunan)",
        level: "safe",
        explanation:
          "Gedung kaku 4 lantai tidak memiliki fleksibilitas untuk berayun bersama gelombang periode panjang. Bergerak serempak bersama tanah tanpa amplifikasi dinamik.",
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
      structuralType: "High-Bay Steel Space Truss on RC Columns (Bentang Lebar)",
      fundamentalPeriodSec: 0.28,
      sensors: ["NCU_GYM_S1"],
      softStorey: false,
      shortPeriodImpact: {
        resonance: "Tinggi (Resonansi Rangka Atap Baja)",
        badgeText: "⚡ Resonansi Rangka Atap (2F High-Bay)",
        level: "warning",
        explanation:
          "Rangka atap baja bentang lebar sangat peka terhadap frekuensi tinggi dan komponen akselerasi vertikal gempa dangkal Daxi. Baut dan joint truss bergetar intensif.",
        driftEstPct: 0.28,
      },
      longPeriodImpact: {
        resonance: "Rendah (Aman Bebas Ayunan Panjang)",
        badgeText: "🛡️ Aman dari Ayunan Periode Panjang",
        level: "safe",
        explanation:
          "Gedung rendah 2 lantai ini tidak terpengaruh oleh ayunan periode panjang subduksi.",
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
    const height = container.clientHeight || 440;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.0022);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1400);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
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

    // 5. Ground / Campus Terrain Plane
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

    // 6. NCU Zhongda Lake (中大湖)
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

    // 7. NCU Athletic Running Track (田徑場)
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

    // 8. Campus Grand Lawn (中大大草坪)
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

    // 9. Build 3D NCU Buildings with Visible Storey / Floor Slabs
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

      // Main box massing
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

      // Building outer edges
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
      });
      const wireframe = new THREE.LineSegments(edges, edgeMat);
      wireframe.position.y = b.height / 2;
      group.add(wireframe);

      // Visual Floor Demarcation Rings (Showing each distinct floor level!)
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

      // Rooftop feature pad
      const roofPadGeo = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
      const roofPad = new THREE.Mesh(roofPadGeo, roofMat);
      roofPad.position.y = b.height + 0.75;
      group.add(roofPad);

      scene.add(group);
      buildingMeshesRef.current.set(b.id, group);
    });

    // 10. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Aviation warning beacon pulse
      if (beaconLightRef.current) {
        beaconLightRef.current.intensity = 0.5 + Math.sin(elapsedTime * 4.5) * 0.7;
      }

      // Project building 3D coordinates to 2D screen positions for floating labels
      if (cameraRef.current && containerRef.current) {
        const curWidth = containerRef.current.clientWidth || 700;
        const curHeight = containerRef.current.clientHeight || 440;
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

      // Dynamic frequency-dependent structural shaking physics
      if (isSimulating) {
        buildingsRef.current.forEach((b) => {
          const group = buildingMeshesRef.current.get(b.id);
          if (!group) return;

          if (waveRegime === "short_period") {
            // Gempa Dangkal Jarak Dekat / Periode Pendek (2012 Daxi Taoyuan ML 4.66)
            // Frekuensi tinggi (w ~ 24 rad/s), resonansi pada gedung rendah-menengah & 1F soft storey
            const Tn = b.fundamentalPeriodSec;
            const Teq = 0.28; // Periode dominan gempa dangkal Daxi
            const freqRatio = Teq / Tn;
            const daf = 1 / Math.sqrt(Math.pow(1 - freqRatio * freqRatio, 2) + Math.pow(2 * 0.05 * freqRatio, 2));

            const softStoreyMultiplier = b.softStorey ? 1.75 : 1.0;
            const amp = (0.2 + Math.min(2.5, daf) * 0.25) * softStoreyMultiplier;
            const displacement = Math.sin(elapsedTime * 24 + b.x * 0.1) * amp;

            group.position.x = b.x + displacement;
            group.rotation.z = (displacement / b.height) * 0.045;
          } else if (waveRegime === "long_period") {
            // Gempa Subduksi Jarak Jauh / Periode Panjang (Hualien Offshore Mw 7.2)
            // Frekuensi lambat (w ~ 3.6 rad/s), resonansi besar pada GEDUNG TINGGI (7-8 Lantai)
            const heightAmplification = Math.pow(b.stories / 8, 2.2);
            const swayDisplacement = Math.sin(elapsedTime * 3.6 + b.z * 0.05) * 1.85 * heightAmplification;

            group.position.x = b.x + swayDisplacement;
            // Visible harmonic drift sway proportional to height
            group.rotation.z = (swayDisplacement / b.height) * 0.14;
          } else {
            // Pulsa Patahan Dekat (Shuanglienpo-Hukou Mw 6.91)
            const pulse = Math.sin(elapsedTime * 14) * 2.4;
            group.position.x = b.x + pulse;
            group.rotation.z = (pulse / b.height) * 0.09;
          }
        });
      } else {
        // Reset positions
        buildingsRef.current.forEach((b) => {
          const group = buildingMeshesRef.current.get(b.id);
          if (group) {
            group.position.x = b.x;
            group.rotation.z = 0;
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Robust Resize Handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 700;
      const h = container.clientHeight || 440;
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
  }, [isSimulating, waveRegime]);

  // Update Building Colors Based on CWA Felt Intensity and Structural Resonance
  useEffect(() => {
    const palette = CWA_INTENSITY_PALETTE[activeIntensity] || CWA_INTENSITY_PALETTE["3"];
    const intensityHex = palette.hex;

    buildingsRef.current.forEach((b) => {
      const group = buildingMeshesRef.current.get(b.id);
      if (!group) return;

      // Resonant status calculation
      const isResonant =
        waveRegime === "short_period"
          ? b.stories <= 5 || b.softStorey
          : waveRegime === "long_period"
          ? b.stories >= 7
          : true;

      if (b.id === "FAC_NCU_SCIENCE_B4") {
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
              if (isSimulating) {
                // Apply CWA Intensity Color
                mat.emissive.setHex(intensityHex);
                mat.emissiveIntensity = isResonant ? 0.7 : 0.25;
              } else {
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0.0;
              }
            }
          }
        });
        return;
      }

      // Standard box buildings
      const boxMesh = group.children[0] as THREE.Mesh;
      const wireframe = group.children[1] as THREE.LineSegments;
      const floorLinesGroup = group.children[2] as THREE.Group;

      if (boxMesh && boxMesh.material) {
        const mat = boxMesh.material as THREE.MeshStandardMaterial;
        if (!isSimulating) {
          mat.color.setHex(0x1e293b);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        } else {
          mat.color.setHex(intensityHex);
          mat.emissive.setHex(intensityHex);
          mat.emissiveIntensity = isResonant ? 0.45 : 0.15;
        }
      }

      if (wireframe && wireframe.material) {
        const lineMat = wireframe.material as THREE.LineBasicMaterial;
        if (isSimulating) {
          lineMat.color.setHex(intensityHex);
          lineMat.opacity = isResonant ? 0.95 : 0.4;
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
            if (isSimulating) {
              lMat.color.setHex(intensityHex);
              lMat.opacity = isResonant ? 0.85 : 0.35;
            } else {
              lMat.color.setHex(0x0284c7);
              lMat.opacity = 0.45;
            }
          }
        });
      }
    });
  }, [isSimulating, activeIntensity, waveRegime]);

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

    // Raycast on single click (not dragging)
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

  const setPreset = (preset: "campus" | "science4" | "eng5" | "library" | "admin") => {
    setCameraMode(preset);
    if (preset === "campus") {
      cameraTargetRef.current.set(0, 10, 0);
      cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 250 };
      setSelectedBuilding(null);
    } else if (preset === "science4") {
      cameraTargetRef.current.set(-5, 18, -65);
      cameraAngleRef.current = { theta: Math.PI / 1.7, phi: Math.PI / 3.4, radius: 75 };
      setSelectedBuilding(buildingsRef.current[0]);
    } else if (preset === "eng5") {
      cameraTargetRef.current.set(-116, 18, 55);
      cameraAngleRef.current = { theta: -Math.PI / 3, phi: Math.PI / 3.5, radius: 100 };
      setSelectedBuilding(buildingsRef.current[2]);
    } else if (preset === "library") {
      cameraTargetRef.current.set(57, 18, 19);
      cameraAngleRef.current = { theta: (5 * Math.PI) / 4, phi: Math.PI / 3.5, radius: 95 };
      setSelectedBuilding(buildingsRef.current[1]);
    } else if (preset === "admin") {
      cameraTargetRef.current.set(77, 14, 20);
      cameraAngleRef.current = { theta: Math.PI, phi: Math.PI / 3.2, radius: 85 };
      setSelectedBuilding(buildingsRef.current[3]);
    }
    updateCameraPosition();
  };

  const triggerLocalSimulation = () => {
    setLocalSimulating(true);
    setTimeout(() => setLocalSimulating(false), 12000);
  };

  const intensityMeta = CWA_INTENSITY_PALETTE[activeIntensity] || CWA_INTENSITY_PALETTE["3"];

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 select-none">
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

      {/* 3D Floating Building Labels (Overlayed over 3D Canvas) */}
      {displayMode === "orbit_3d" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {buildingsRef.current.map((b) => {
            const coord = buildingScreenCoords[b.id];
            if (!coord || !coord.visible) return null;

            const isSelected = selectedBuilding?.id === b.id;
            const isResonant =
              waveRegime === "short_period"
                ? b.stories <= 5 || b.softStorey
                : waveRegime === "long_period"
                ? b.stories >= 7
                : true;

            const resonanceBadge =
              waveRegime === "short_period"
                ? b.shortPeriodImpact.badgeText
                : waveRegime === "long_period"
                ? b.longPeriodImpact.badgeText
                : "💥 Pulsa Patahan Dekat";

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
                  className={`flex flex-col items-center rounded-lg px-2 py-1 shadow-2xl backdrop-blur-md border transition-all ${
                    isSelected
                      ? "bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-400/50 scale-110"
                      : isSimulating && isResonant
                      ? "bg-slate-900/90 border-amber-400/90"
                      : "bg-slate-900/80 border-slate-700/80 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1 py-0.2 text-[9px] font-mono font-bold">
                      {b.floors} Lantai ({b.stories}F)
                    </span>
                    <span className="text-[10px] font-bold text-white whitespace-nowrap truncate max-w-[120px]">
                      {b.name.split("(")[0]}
                    </span>
                  </div>

                  {isSimulating && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full animate-ping"
                        style={{ backgroundColor: intensityMeta.css }}
                      />
                      <span
                        className={`text-[8px] font-mono font-bold px-1 rounded truncate max-w-[130px] ${
                          isResonant ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {resonanceBadge}
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
        <div className="relative h-full w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          <div
            className="relative max-h-full max-w-full aspect-[4/3] flex items-center justify-center transition-transform"
            style={{
              animation: isSimulating ? "seismicTremor 0.12s infinite alternate" : "none",
            }}
          >
            <img
              src="/assets/buildings/science4_isometric.jpg"
              alt="NCU Science Building 4 Ultra-HD Perspective Twin"
              className="max-h-[430px] w-auto object-contain rounded-lg shadow-2xl border border-slate-800/80 select-none"
              draggable={false}
            />

            {/* Interactive Telemetry Hotspot Pins */}
            {SCIENCE4_HOTSPOTS.map((spot, idx) => {
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
                          ? "bg-amber-400"
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
                          ? "bg-amber-500 text-slate-950 border-white"
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
                    {spot.nameZh}
                  </span>
                </button>
              );
            })}

            {/* In-Simulation Ground Floor Soft-Storey Callout */}
            {isSimulating && (
              <div className="absolute left-[51.5%] top-[78%] -translate-x-1/2 z-20 pointer-events-none">
                <div
                  className="flex items-center space-x-1 px-2 py-1 rounded border text-[9px] font-bold shadow-2xl animate-bounce backdrop-blur-md"
                  style={{
                    backgroundColor: "rgba(120, 53, 15, 0.95)",
                    borderColor: intensityMeta.css,
                    color: intensityMeta.css,
                  }}
                >
                  <ShieldAlert className="h-3 w-3" />
                  <span>
                    {waveRegime === "short_period"
                      ? "CRITICAL: 1F SOFT-STOREY GESER TERKONSENTRASI (INT 3)"
                      : "CRITICAL: AYUNAN RESONANSI 8F LANTAI ATAS"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Active Hotspot Telemetry Flyout Modal */}
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
                  <h4 className="font-bold text-white text-[13px]">{activeHotspot.nameZh}</h4>
                  <p className="text-[10px] text-cyan-400 font-medium">{activeHotspot.nameEn}</p>
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
                  Lihat di 3D WebGL →
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
              <span>Rotasi 360° 3D WebGL</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP-LEFT STATUS & CWA INTENSITY BADGE */}
      <div className="absolute top-3 left-3 z-20 flex flex-col space-y-1.5 max-w-sm">
        <div className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md text-xs shadow-lg">
          <Building2 className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200">
            {displayMode === "ultra_hd_twin" ? "NCU S4 (健雄館) Twin" : "NCU Real Campus 3D Twin"}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
              isSimulating
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {isSimulating ? "SIMULASI SEISMIK AKTIF" : "STANDBY MONITORING"}
          </span>
        </div>

        {/* CWA Intensity Scale Color Indicator */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md text-xs shadow-lg">
          <div className="flex items-center space-x-2">
            <span
              className="inline-block w-3.5 h-3.5 rounded shadow-sm font-bold text-[9px] text-center leading-3.5"
              style={{
                backgroundColor: intensityMeta.css,
                color: intensityMeta.textDark ? "#0f172a" : "#ffffff",
              }}
            >
              {activeIntensity}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Intensitas Dirasakan di NCU:</span>
              <span className="font-bold text-[11px] text-white" style={{ color: intensityMeta.css }}>
                {intensityMeta.labelId}
              </span>
            </div>
          </div>
          <div className="text-right pl-2 border-l border-slate-800 text-[9px] font-mono text-slate-400">
            <div>PGA: {scenario?.id?.includes("20883") ? "12.26 Gal" : intensityMeta.pga}</div>
            <div>PGV: {scenario?.id?.includes("20883") ? "1.03 cm/s" : intensityMeta.pgv}</div>
          </div>
        </div>
      </div>

      {/* TOP-CENTER: WAVE SPECTRUM / REGIME SWITCHER */}
      <div className="hidden md:flex items-center space-x-1 absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-lg border border-slate-800 bg-slate-900/90 p-1 backdrop-blur-md shadow-xl text-xs">
        <span className="text-[10px] text-slate-400 font-semibold px-2 flex items-center space-x-1">
          <Activity className="h-3 w-3 text-cyan-400" />
          <span>Spektrum Gelombang:</span>
        </span>
        <button
          onClick={() => setWaveRegime("short_period")}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition ${
            waveRegime === "short_period"
              ? "bg-yellow-400 text-slate-950 shadow-md ring-1 ring-yellow-400/50"
              : "text-slate-400 hover:text-white"
          }`}
          title="Gempa Dangkal 2012 Daxi (EQ 20883) - Gelombang frekuensi tinggi meresonansi gedung rendah/menengah & soft-storey"
        >
          <Zap className="h-3 w-3" />
          <span>Periode Pendek (2012 Daxi - Int 3 Kuning)</span>
        </button>
        <button
          onClick={() => setWaveRegime("long_period")}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition ${
            waveRegime === "long_period"
              ? "bg-orange-500 text-slate-950 shadow-md ring-1 ring-orange-400/50"
              : "text-slate-400 hover:text-white"
          }`}
          title="Gempa Subduksi Jarak Jauh (Hualien Offshore) - Gelombang periode panjang meresonansi gedung bertingkat tinggi (8F)"
        >
          <Layers className="h-3 w-3" />
          <span>Periode Panjang (Subduksi - Int 4 Oranye)</span>
        </button>
        <button
          onClick={() => setWaveRegime("near_fault_pulse")}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition ${
            waveRegime === "near_fault_pulse"
              ? "bg-red-600 text-white shadow-md ring-1 ring-red-400/50"
              : "text-slate-400 hover:text-white"
          }`}
          title="Pulsa Patahan Dekat (Shuanglienpo Mw 6.9) - Hantaman fling-step ekstrem di semua lantai"
        >
          <AlertTriangle className="h-3 w-3" />
          <span>Pulsa Patahan (M6.9 - Int 6- Merah)</span>
        </button>
      </div>

      {/* TOP-RIGHT CONTROLS */}
      <div className="flex flex-wrap items-center gap-1.5 absolute top-3 right-3 z-20 rounded-lg border border-slate-800 bg-slate-900/90 p-1 backdrop-blur-md shadow-xl">
        {onBackToGis && (
          <button
            onClick={onBackToGis}
            className="flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shadow-sm mr-1"
            title="Kembali ke Peta Satelit GIS Gelombang Gempa"
          >
            <MapIcon className="h-3 w-3" />
            <span>Peta Satelit</span>
          </button>
        )}

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-950/90 p-0.5 rounded border border-slate-700/80 mr-1.5">
          <button
            onClick={() => setDisplayMode("orbit_3d")}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold transition ${
              displayMode === "orbit_3d"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="3D WebGL Orbit Interaktif"
          >
            <Box className="h-3 w-3" />
            <span>3D WebGL</span>
          </button>
          <button
            onClick={() => {
              setDisplayMode("ultra_hd_twin");
              setPreset("science4");
            }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition ${
              displayMode === "ultra_hd_twin"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-sm"
                : "text-cyan-300 hover:text-white hover:bg-slate-800"
            }`}
            title="Ultra-HD Perspective Twin Science 4 (Foto Realistik dengan Hotspot Telemetri)"
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Ultra-HD Twin</span>
          </button>
        </div>

        {/* Camera Presets */}
        {displayMode === "orbit_3d" && (
          <>
            <button
              onClick={() => setPreset("campus")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                cameraMode === "campus"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Kampus 360°
            </button>
            <button
              onClick={() => setPreset("science4")}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-medium transition ${
                cameraMode === "science4"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>S4 (8 Lantai)</span>
            </button>
            <button
              onClick={() => setPreset("library")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                cameraMode === "library"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Perpus (8 Lantai)
            </button>
            <button
              onClick={() => setPreset("eng5")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                cameraMode === "eng5"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              E6 (7 Lantai)
            </button>
            <button
              onClick={() => setPreset("admin")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                cameraMode === "admin"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Admin (5 Lantai)
            </button>
            <button
              onClick={() => setPreset("campus")}
              title="Reset Kamera"
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {/* BUILDING INSPECTION MODAL (FOR SELECTED BUILDING) */}
      {displayMode === "orbit_3d" && selectedBuilding && (
        <div className="absolute bottom-3 left-3 z-20 w-96 rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2.5 mb-2.5">
            <div>
              <div className="flex items-center space-x-1.5 mb-1">
                <span className="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono font-bold">
                  {selectedBuilding.floors} Lantai ({selectedBuilding.stories}F)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Tinggi: ~{selectedBuilding.height}m
                </span>
              </div>
              <h4 className="font-bold text-white text-[13px]">{selectedBuilding.name}</h4>
              <p className="text-[10px] text-cyan-400 font-medium">{selectedBuilding.nameZh}</p>
            </div>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5 text-[11px] text-slate-300">
            {/* Structural Parameters */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-[9px] text-slate-400 block font-mono">JUMLAH LANTAI</span>
                <span className="font-bold text-white text-[12px]">
                  {selectedBuilding.floors} Tingkat
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-mono">PERIODE ALAMI (Tn)</span>
                <span className="font-bold text-cyan-300 text-[12px] font-mono">
                  ~{selectedBuilding.fundamentalPeriodSec} detik
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800/80">
                <span className="text-[9px] text-slate-400 block font-mono">TIPE STRUKTUR</span>
                <span className="text-[10px] text-slate-300 font-medium truncate block" title={selectedBuilding.structuralType}>
                  {selectedBuilding.structuralType}
                </span>
              </div>
            </div>

            {/* Earthquake Impact Under Current Wave Regime */}
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Dampak Gelombang Gempa:
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-bold font-mono"
                  style={{
                    backgroundColor:
                      (waveRegime === "short_period"
                        ? selectedBuilding.shortPeriodImpact.level
                        : selectedBuilding.longPeriodImpact.level) === "critical"
                        ? "rgba(239, 68, 68, 0.2)"
                        : (waveRegime === "short_period"
                            ? selectedBuilding.shortPeriodImpact.level
                            : selectedBuilding.longPeriodImpact.level) === "warning"
                        ? "rgba(245, 158, 11, 0.2)"
                        : "rgba(16, 185, 129, 0.2)",
                    color:
                      (waveRegime === "short_period"
                        ? selectedBuilding.shortPeriodImpact.level
                        : selectedBuilding.longPeriodImpact.level) === "critical"
                        ? "#f87171"
                        : (waveRegime === "short_period"
                            ? selectedBuilding.shortPeriodImpact.level
                            : selectedBuilding.longPeriodImpact.level) === "warning"
                        ? "#fbbf24"
                        : "#34d399",
                    border: `1px solid ${
                      (waveRegime === "short_period"
                        ? selectedBuilding.shortPeriodImpact.level
                        : selectedBuilding.longPeriodImpact.level) === "critical"
                        ? "rgba(239, 68, 68, 0.4)"
                        : (waveRegime === "short_period"
                            ? selectedBuilding.shortPeriodImpact.level
                            : selectedBuilding.longPeriodImpact.level) === "warning"
                        ? "rgba(245, 158, 11, 0.4)"
                        : "rgba(16, 185, 129, 0.4)"
                    }`,
                  }}
                >
                  {waveRegime === "short_period"
                    ? selectedBuilding.shortPeriodImpact.badgeText
                    : selectedBuilding.longPeriodImpact.badgeText}
                </span>
              </div>

              {/* Scientific Structural Explanation */}
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {waveRegime === "short_period"
                  ? selectedBuilding.shortPeriodImpact.explanation
                  : selectedBuilding.longPeriodImpact.explanation}
              </p>

              {/* Estimated Inter-Storey Drift (IDR) */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                <span className="text-slate-400">Estimasi Drift (IDR):</span>
                <span className="font-mono font-bold text-amber-300">
                  {waveRegime === "short_period"
                    ? `${selectedBuilding.shortPeriodImpact.driftEstPct}% (Aman / Pemeriksaan Ringan)`
                    : `${selectedBuilding.longPeriodImpact.driftEstPct}% (Ayunan Lateral Atap)`}
                </span>
              </div>
            </div>

            {/* Special Action for Science 4 */}
            {selectedBuilding.id === "FAC_NCU_SCIENCE_B4" && (
              <button
                onClick={() => setDisplayMode("ultra_hd_twin")}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-[11px] shadow hover:opacity-95 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Buka Ultra-HD Perspective Twin S4 (Hotspot Telemetri)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM-RIGHT: INTERACTIVE SIMULATION TRIGGER & NAVIGATION GUIDE */}
      {displayMode === "orbit_3d" && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-2">
          <button
            onClick={triggerLocalSimulation}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg backdrop-blur-md border ${
              isSimulating
                ? "bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 animate-pulse"
                : "bg-slate-900/90 text-cyan-300 border-slate-700 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{isSimulating ? "Simulasi Sedang Berjalan..." : "Mulai Simulasi Seismik 3D"}</span>
          </button>
          <div className="hidden sm:block text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 font-mono">
            Klik Bangunan untuk Inspeksi Lantai & Resonansi
          </div>
        </div>
      )}
    </div>
  );
};
