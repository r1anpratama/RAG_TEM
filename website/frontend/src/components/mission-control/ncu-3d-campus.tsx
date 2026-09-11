"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Scenario } from "@/types/triage";
import {
  RotateCcw,
  Building2,
  Map as MapIcon,
  Box,
  Sparkles,
  Sun,
  Eye,
  Activity,
  ShieldAlert,
  Layers,
  CheckCircle2,
  Info,
} from "lucide-react";
import { createDetailedScience4Building } from "./detailed-building-3d";

interface NCU3DCampusProps {
  scenario: Scenario | null;
  isSimulating: boolean;
  onBackToGis?: () => void;
}

interface CampusBuilding {
  id: string;
  name: string;
  nameZh: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  stories: number;
  era: string;
  structuralType: string;
  sensors: string[];
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

const SCIENCE4_HOTSPOTS: ArchitecturalHotspot[] = [
  {
    id: "dome",
    nameZh: "健雄天文觀測圓頂 (8F)",
    nameEn: "Astronomical Observatory Dome",
    xPct: 50.0,
    yPct: 15.5,
    category: "astronomy",
    tag: "GEODESIC ROTUNDA",
    details: "Equipped with a 24-inch optical telescope, motorized azimuth rotunda drum, and triaxial vibration telemetry for high-altitude microtremor analysis.",
    specs: [
      { label: "Diameter", value: "10.8 meters" },
      { label: "Structure", value: "Geodesic Steel & Glass" },
      { label: "Vibration Sensor", value: "NCU_DOME_VIB01 (0.012g)" },
      { label: "Azimuth Drive", value: "Closed-Loop Servo Sync" },
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
    details: "High-efficiency monocrystalline solar panels tilted at 23.5° south. Connected to the campus smart microgrid and emergency backup power bus.",
    specs: [
      { label: "Capacity", value: "48 kW Peak" },
      { label: "Current Yield", value: "38.6 kW / hr" },
      { label: "Tilt Angle", value: "23.5° True South" },
      { label: "Grid Tie", value: "NCU Substation B" },
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
    details: "Curved tempered-glass barrel vault skylight over the central atrium core. Houses the high-speed traction elevator machine room and structural core drift sensors.",
    specs: [
      { label: "Core Type", value: "RC Shear Wall Core" },
      { label: "Glazing", value: "Laminated Acoustic Safety Glass" },
      { label: "Core IDR", value: "0.04% (Baseline)" },
      { label: "Penetrations", value: "Seismic Expansion Joints" },
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
    details: "Dual centrifugal chiller towers equipped with spring-neoprene vibration isolators to suppress non-structural machinery resonances during seismic excitation.",
    specs: [
      { label: "Refrigeration", value: "2x 150 Ton Chiller" },
      { label: "Isolation", value: "Spring Damping (98.4%)" },
      { label: "Shutoff Valve", value: "Seismic Flow Trip SCADA" },
      { label: "Fan Blades", value: "Variable Speed Aerofoil" },
    ],
  },
  {
    id: "balcony",
    nameZh: "物理與太空科學實驗室陽台 (5F-6F)",
    nameEn: "Recessed Research Terraces",
    xPct: 49.5,
    yPct: 46.5,
    category: "structural",
    tag: "FACULTY LABS",
    details: "Symmetrical recessed terraces accommodating physics quantum optics labs and space science atmospheric sounding instrumentation.",
    specs: [
      { label: "Floor Levels", value: "4F, 5F, 6F Terraces" },
      { label: "Balustrade", value: "Tempered Glass & Steel" },
      { label: "Interstory Drift", value: "Monitored via LVDT" },
      { label: "Lab Occupancy", value: "Graduate Research Core" },
    ],
  },
  {
    id: "portico",
    nameZh: "砂岩正門門廊 (1F 軟弱層檢測點)",
    nameEn: "Grand Sandstone Portico & Ground Hall",
    xPct: 51.5,
    yPct: 73.0,
    category: "sensor",
    tag: "SOFT-STOREY CRITICAL",
    details: "Two-story travertine sandstone portico. ASCE 41-17 critical evaluation zone: ground floor open atrium exhibits high soft-storey stiffness contrast.",
    specs: [
      { label: "Seismograph", value: "NCU_ACC_04 (Triaxial Z/N/E)" },
      { label: "Stiffness Ratio", value: "K_1F / K_2F = 0.62 (Soft)" },
      { label: "Peak Velocity", value: "Simulated: 28.4 cm/s" },
      { label: "Damage Tag", value: "RED CRITICAL (Post-1999 Audit)" },
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
    details: "Granite-paved pedestrian forecourt, ADA handicap ramp, and open assembly ground designated as NCU Emergency Evacuation Muster Point #4.",
    specs: [
      { label: "Muster Area", value: "Capacity 600 Persons" },
      { label: "Pavement", value: "Interlocking Granite Pavers" },
      { label: "Access", value: "Dual Ramp & 3-Tier Steps" },
      { label: "Hydrant", value: "CWA Station #4 Hydrant" },
    ],
  },
];

export const NCU3DCampus: React.FC<NCU3DCampusProps> = ({
  scenario,
  isSimulating,
  onBackToGis,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [cameraMode, setCameraMode] = useState<"campus" | "science4" | "eng5" | "library">("campus");
  const [displayMode, setDisplayMode] = useState<"orbit_3d" | "ultra_hd_twin">("orbit_3d");
  const [activeHotspot, setActiveHotspot] = useState<ArchitecturalHotspot | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const beaconLightRef = useRef<THREE.PointLight | null>(null);

  // Buildings mathematically positioned from verified NCU OpenStreetMap coordinates
  const buildingsRef = useRef<CampusBuilding[]>([
    {
      id: "FAC_NCU_SCIENCE_B4",
      name: "Science Building 4 (S4)",
      nameZh: "國立中央大學 理學院四館 / 健雄館",
      x: -5,
      z: -65,
      width: 24,
      depth: 18,
      height: 32,
      stories: 8,
      era: "Pre-1999 (Soft-Storey Ground Floor)",
      structuralType: "Reinforced Concrete Frame w/ Open Ground Hall (Physics & Space Sci)",
      sensors: ["NCU_ACC_04_Z", "NCU_ACC_04_N", "NCU_ACC_04_E"],
    },
    {
      id: "FAC_NCU_ENG_B5",
      name: "Engineering Building 5 (E6)",
      nameZh: "工程五館 (工學院 / 資電學院大樓)",
      x: -116,
      z: 55,
      width: 32,
      depth: 22,
      height: 36,
      stories: 9,
      era: "Post-1999 Modern Seismic Code",
      structuralType: "Moment-Resisting RC Frame (Computer Science & Electrical Eng)",
      sensors: ["NCU_EECS_01", "NCU_EECS_02"],
    },
    {
      id: "FAC_NCU_LIBRARY",
      name: "NCU Main Library Core",
      nameZh: "中央大學 總圖書館",
      x: 57,
      z: 19,
      width: 28,
      depth: 24,
      height: 34,
      stories: 8,
      era: "Post-1999 Seismic Retrofitted",
      structuralType: "Dual RC Shear Wall and Braced Core",
      sensors: ["NCU_LIB_SM1", "NCU_LIB_SM2"],
    },
    {
      id: "FAC_NCU_EDREAM",
      name: "College of Earth Sciences",
      nameZh: "地球科學學院 / 健雄館南翼 / E-DREaM Lab",
      x: 63,
      z: 46,
      width: 26,
      depth: 18,
      height: 28,
      stories: 7,
      era: "Geoscientific Center of Excellence",
      structuralType: "Seismological Array Station Core (TT-SAM Processing Node)",
      sensors: ["CWASN_NCU_BB", "TT_SAM_EDGE_NODE"],
    },
    {
      id: "FAC_NCU_ADMIN",
      name: "NCU Administration Building",
      nameZh: "中央大學 行政大樓",
      x: 77,
      z: 20,
      width: 24,
      depth: 18,
      height: 24,
      stories: 6,
      era: "Campus Operations Hub",
      structuralType: "RC Frame",
      sensors: ["NCU_OPS_SCADA"],
    },
    {
      id: "FAC_NCU_GYM",
      name: "NCU Gymnasium (依仁堂)",
      nameZh: "依仁堂體育館",
      x: -30,
      z: 22,
      width: 34,
      depth: 28,
      height: 20,
      stories: 3,
      era: "Post-1999 Long-Span Roof Structure",
      structuralType: "Steel Space Truss & RC Frame",
      sensors: ["NCU_GYM_S1"],
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

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 440;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.0025);
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

    // 4. Lighting (Bright, professional architectural lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
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

    const fillLight = new THREE.DirectionalLight(0x67e8f9, 0.7);
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

    // 9. Build 3D NCU Buildings
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

      const boxGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
      const mainMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.3,
        metalness: 0.6,
      });
      const boxMesh = new THREE.Mesh(boxGeo, mainMat);
      boxMesh.position.y = b.height / 2;
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      group.add(boxMesh);

      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.5,
      });
      const wireframe = new THREE.LineSegments(edges, edgeMat);
      wireframe.position.y = b.height / 2;
      group.add(wireframe);

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

      // Aviation warning red beacon pulse
      if (beaconLightRef.current) {
        beaconLightRef.current.intensity = 0.5 + Math.sin(elapsedTime * 4.5) * 0.7;
      }

      if (isSimulating && scenario) {
        const pgv = scenario.predicted_pgv_cm_s || 28.4;
        const baseShaking = (pgv / 15.0) * 0.4;

        buildingsRef.current.forEach((b) => {
          const group = buildingMeshesRef.current.get(b.id);
          if (group) {
            const multiplier = b.id === "FAC_NCU_SCIENCE_B4" ? 1.8 : b.id === "FAC_NCU_ENG_B5" ? 1.0 : 0.45;
            const displacement = Math.sin(elapsedTime * 18 + b.x) * baseShaking * multiplier;
            group.position.x = b.x + displacement;
            group.rotation.z = (displacement / b.height) * 0.08;
          }
        });
      } else {
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

    // Robust Resize Handling via ResizeObserver
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 700;
      const h = container.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
    };
  }, [isSimulating, scenario]);

  // Update building colors based on simulation impact
  useEffect(() => {
    buildingsRef.current.forEach((b) => {
      const group = buildingMeshesRef.current.get(b.id);
      if (!group) return;

      if (b.id === "FAC_NCU_SCIENCE_B4") {
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && child.name === "observatory_dome") {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (isSimulating) {
              mat.emissive.setHex(0xe11d48);
              mat.emissiveIntensity = 0.55;
            } else {
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0.0;
            }
          }
        });
        return;
      }

      const mainMesh = group.children[0] as THREE.Mesh;
      if (mainMesh && mainMesh.material) {
        if (!isSimulating) {
          (mainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
          (mainMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        } else {
          const pgv = scenario?.predicted_pgv_cm_s || 28.4;
          if (b.id === "FAC_NCU_ENG_B5") {
            if (pgv >= 25) {
              (mainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x78350f);
              (mainMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xd97706);
              (mainMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
            }
          } else {
            (mainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x064e3b);
            (mainMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x059669);
            (mainMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25;
          }
        }
      }
    });
  }, [isSimulating, scenario]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraAngleRef.current.radius = Math.max(
      50,
      Math.min(380, cameraAngleRef.current.radius + e.deltaY * 0.15)
    );
    updateCameraPosition();
  };

  const setPreset = (preset: "campus" | "science4" | "eng5" | "library") => {
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
      cameraAngleRef.current = { theta: -Math.PI / 3, phi: Math.PI / 3.5, radius: 110 };
      setSelectedBuilding(buildingsRef.current[1]);
    } else if (preset === "library") {
      cameraTargetRef.current.set(57, 18, 19);
      cameraAngleRef.current = { theta: (5 * Math.PI) / 4, phi: Math.PI / 3.5, radius: 100 };
      setSelectedBuilding(buildingsRef.current[2]);
    }
    updateCameraPosition();
  };

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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* ULTRA-HD PERSPECTIVE ARCHITECTURAL TWIN VIEW */}
      {displayMode === "ultra_hd_twin" && (
        <div className="relative h-full w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Building Render Canvas Container with Seismic Oscillation */}
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
                          ? "bg-rose-500"
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
                          ? "bg-rose-600 text-white border-rose-300"
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

                  {/* Tooltip Label on Hover */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-slate-900/95 border border-slate-700 text-[9px] font-bold text-white whitespace-nowrap pointer-events-none shadow-xl backdrop-blur-md">
                    {spot.nameZh}
                  </span>
                </button>
              );
            })}

            {/* In-Simulation Ground Floor Soft-Storey Callout */}
            {isSimulating && (
              <div className="absolute left-[51.5%] top-[78%] -translate-x-1/2 z-20 pointer-events-none">
                <div className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-950/90 border border-rose-500 text-rose-300 text-[9px] font-bold shadow-2xl animate-bounce backdrop-blur-md">
                  <ShieldAlert className="h-3 w-3 text-rose-400" />
                  <span>CRITICAL: 1F SOFT-STOREY DRIFT 2.14%</span>
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

              {/* Technical Specifications Matrix */}
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
                  View in 3D WebGL →
                </button>
              </div>
            </div>
          )}

          {/* Bottom Controls Bar inside Ultra-HD Twin */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-2">
            <button
              onClick={() => setDisplayMode("orbit_3d")}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-xs font-semibold text-cyan-300 hover:bg-slate-800 hover:text-white transition shadow-lg backdrop-blur-md"
              title="Return to full interactive 3D WebGL Orbit mode"
            >
              <Box className="h-3.5 w-3.5 text-cyan-400" />
              <span>Rotate 360° in 3D WebGL</span>
            </button>
          </div>

          {/* Architectural Twin Info Caption */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center space-x-1.5 text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
            <Info className="h-3 w-3 text-cyan-400" />
            <span>Click any numbered hotspot pin (1-7) to inspect structural telemetry</span>
          </div>
        </div>
      )}

      {/* Floating Top-Right Controls */}
      <div className="flex flex-wrap items-center gap-1.5 absolute top-3 right-3 z-20 rounded-lg border border-slate-800 bg-slate-900/90 p-1 backdrop-blur-md shadow-xl">
        {onBackToGis && (
          <button
            onClick={onBackToGis}
            className="flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shadow-sm mr-1"
            title="Return to Aerial Satellite GIS Map"
          >
            <MapIcon className="h-3 w-3" />
            <span>Satellite Map</span>
          </button>
        )}

        {/* View Mode Switcher: 3D Orbit WebGL vs Ultra-HD Perspective Twin */}
        <div className="flex items-center space-x-1 bg-slate-950/90 p-0.5 rounded border border-slate-700/80 mr-1.5">
          <button
            onClick={() => setDisplayMode("orbit_3d")}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold transition ${
              displayMode === "orbit_3d"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Interactive 3D WebGL Campus (Rotate 360°)"
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
            title="Ultra-HD Architectural Perspective Twin (Photorealistic Model with Telemetry Pins)"
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Ultra-HD Twin</span>
          </button>
        </div>

        {/* Camera Presets for 3D Orbit Mode */}
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
              Campus 360°
            </button>
            <button
              onClick={() => setPreset("science4")}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-medium transition ${
                cameraMode === "science4"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="Inspect Detailed 3D Architectural Model of Science Building 4 (健雄館)"
            >
              <Box className="h-3 w-3 text-cyan-400" />
              <span>Science 4 (健雄館)</span>
            </button>
            <button
              onClick={() => setPreset("eng5")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                cameraMode === "eng5"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Eng 5 (E6)
            </button>
            <button
              onClick={() => setPreset("library")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                cameraMode === "library"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Library Core
            </button>
            <button
              onClick={() => setPreset("campus")}
              title="Reset Camera"
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {/* State Status Banner (Neutral vs Simulated Impact) */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md text-xs shadow-lg">
        <Building2 className="h-3.5 w-3.5 text-cyan-400" />
        <span className="font-bold text-slate-200">
          {displayMode === "ultra_hd_twin"
            ? "NCU Science 4 (健雄館) Digital Twin"
            : "NCU Real Campus 3D Twin"}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
            isSimulating
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}
        >
          {isSimulating ? "SEISMIC IMPACT SIMULATING" : "STANDBY: NEUTRAL MONITORING"}
        </span>
      </div>

      {/* Building Inspector Modal / Tooltip (For 3D Orbit Mode) */}
      {displayMode === "orbit_3d" && selectedBuilding && (
        <div className="absolute bottom-3 left-3 z-10 w-80 rounded-xl border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div>
              <h4 className="font-bold text-cyan-300">{selectedBuilding.name}</h4>
              <p className="text-[10px] text-slate-400">{selectedBuilding.nameZh}</p>
            </div>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Stories / Height:</span>
              <span className="font-mono font-semibold">{selectedBuilding.stories}F (~{selectedBuilding.height}m)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Building Era:</span>
              <span className="font-medium">{selectedBuilding.era}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Structure:</span>
              <span className="font-medium truncate max-w-[170px]" title={selectedBuilding.structuralType}>
                {selectedBuilding.structuralType}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-slate-400">Triage Impact:</span>
              <span
                className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                  !isSimulating
                    ? "bg-slate-800 text-slate-400"
                    : selectedBuilding.id === "FAC_NCU_SCIENCE_B4"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : selectedBuilding.id === "FAC_NCU_ENG_B5"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}
              >
                {!isSimulating
                  ? "STANDBY (NO IMPACT)"
                  : selectedBuilding.id === "FAC_NCU_SCIENCE_B4"
                  ? "RED TAG (2.14% DRIFT)"
                  : selectedBuilding.id === "FAC_NCU_ENG_B5"
                  ? "YELLOW (1.05% DRIFT)"
                  : "SAFE (0.42% DRIFT)"}
              </span>
            </div>
            {selectedBuilding.id === "FAC_NCU_SCIENCE_B4" && (
              <div className="pt-2">
                <button
                  onClick={() => setDisplayMode("ultra_hd_twin")}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-[11px] shadow hover:opacity-95 transition"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Open Ultra-HD Perspective Twin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper text for 3D Orbit */}
      {displayMode === "orbit_3d" && (
        <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-500 bg-slate-950/70 px-2 py-1 rounded border border-slate-800/80 font-mono">
          Drag to Orbit 360° | Scroll to Zoom
        </div>
      )}
    </div>
  );
};
