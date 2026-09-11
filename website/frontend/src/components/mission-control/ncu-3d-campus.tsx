"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Scenario } from "@/types/triage";
import { RotateCcw, Building2 } from "lucide-react";

interface NCU3DCampusProps {
  scenario: Scenario | null;
  isSimulating: boolean;
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

export const NCU3DCampus: React.FC<NCU3DCampusProps> = ({ scenario, isSimulating }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [cameraMode, setCameraMode] = useState<"campus" | "science4" | "library">("campus");
  const animationFrameRef = useRef<number | null>(null);

  // Buildings data based on real NCU campus layout
  const buildingsRef = useRef<CampusBuilding[]>([
    {
      id: "FAC_NCU_SCIENCE_B4",
      name: "NCU Science Building 4",
      nameZh: "國立中央大學 理學院四館",
      x: -30,
      z: -25,
      width: 22,
      depth: 18,
      height: 32,
      stories: 8,
      era: "Pre-1999 (Soft-Storey Ground Floor)",
      structuralType: "Reinforced Concrete Frame w/ Open Ground Hall",
      sensors: ["NCU_ACC_04_Z", "NCU_ACC_04_N", "NCU_ACC_04_E"],
    },
    {
      id: "FAC_NCU_ENG_B5",
      name: "NCU Engineering Building 5",
      nameZh: "工程五館 (資工/電機大樓)",
      x: -35,
      z: 30,
      width: 28,
      depth: 20,
      height: 36,
      stories: 9,
      era: "Post-1999 Modern Seismic Code",
      structuralType: "Moment-Resisting RC Frame",
      sensors: ["NCU_EECS_01", "NCU_EECS_02"],
    },
    {
      id: "FAC_NCU_LIBRARY",
      name: "NCU Main Library Core",
      nameZh: "中央大學 總圖書館",
      x: 35,
      z: 20,
      width: 30,
      depth: 26,
      height: 34,
      stories: 8,
      era: "Post-1999 Seismic Retrofitted",
      structuralType: "Dual RC Shear Wall and Braced Core",
      sensors: ["NCU_LIB_SM1", "NCU_LIB_SM2"],
    },
    {
      id: "FAC_NCU_EDREAM",
      name: "E-DREaM Center / Earth Sciences",
      nameZh: "地球科學學院 / 健雄館",
      x: -5,
      z: -40,
      width: 24,
      depth: 16,
      height: 28,
      stories: 7,
      era: "Modern Geoscientific Facility",
      structuralType: "Seismological Array Station Core",
      sensors: ["CWASN_NCU_BB", "TT_SAM_EDGE_NODE"],
    },
    {
      id: "FAC_NCU_ADMIN",
      name: "NCU Administration Building",
      nameZh: "中央大學 行政大樓",
      x: 20,
      z: -20,
      width: 24,
      depth: 18,
      height: 24,
      stories: 6,
      era: "Campus Operations Hub",
      structuralType: "RC Frame",
      sensors: ["NCU_OPS_SCADA"],
    },
  ]);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  // Drag rotation state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.2,
    radius: 180,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
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
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(100, 150, 80);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    dirLight.shadow.camera.top = 120;
    dirLight.shadow.camera.bottom = -120;
    scene.add(dirLight);

    const secondaryLight = new THREE.DirectionalLight(0x06b6d4, 0.6);
    secondaryLight.position.set(-80, 70, -60);
    scene.add(secondaryLight);

    // 5. Ground / Campus Terrain Plane
    const groundGeo = new THREE.PlaneGeometry(280, 280, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e,
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle Ground Grid
    const grid = new THREE.GridHelper(260, 26, 0x1e293b, 0x0f172a);
    grid.position.y = 0.1;
    scene.add(grid);

    // 6. NCU Zhongda Lake (中大湖)
    const lakeGeo = new THREE.CircleGeometry(26, 32);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(45, 0.2, -45);
    scene.add(lake);

    // 7. NCU Athletic Running Track (田徑場)
    const trackCurveGeo = new THREE.RingGeometry(22, 30, 32);
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0xc2410c,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const track = new THREE.Mesh(trackCurveGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(-75, 0.15, -45);
    scene.add(track);

    // 8. Campus Roads (環校道路 & Walkways)
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const ringRoadGeo = new THREE.RingGeometry(85, 95, 48);
    const ringRoad = new THREE.Mesh(ringRoadGeo, roadMat);
    ringRoad.rotation.x = -Math.PI / 2;
    ringRoad.position.y = 0.05;
    scene.add(ringRoad);

    // 9. Build 3D NCU Buildings (Neutral architectural style initially)
    buildingMeshesRef.current.clear();
    buildingsRef.current.forEach((b) => {
      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);

      // Main building volume
      const boxGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
      
      // NEUTRAL architectural material - NO hardcoded warning colors!
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

      // Edge wireframe / window lines
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
      });
      const wireframe = new THREE.LineSegments(edges, edgeMat);
      wireframe.position.y = b.height / 2;
      group.add(wireframe);

      // Roof sensor pad
      const roofPadGeo = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
      const roofPad = new THREE.Mesh(roofPadGeo, roofMat);
      roofPad.position.y = b.height + 0.75;
      group.add(roofPad);

      // Special feature: Science B4 soft storey ground columns
      if (b.id === "FAC_NCU_SCIENCE_B4") {
        const colGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        for (let cx of [-b.width / 2 + 2, b.width / 2 - 2]) {
          for (let cz of [-b.depth / 2 + 2, b.depth / 2 - 2]) {
            const col = new THREE.Mesh(colGeo, colMat);
            col.position.set(cx, 3, cz);
            group.add(col);
          }
        }
      }

      scene.add(group);
      buildingMeshesRef.current.set(b.id, group);
    });

    // 10. Animation & Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Dynamic Shaking during Earthquake Simulation
      if (isSimulating && scenario) {
        const pgv = scenario.predicted_pgv_cm_s || 28.4;
        const baseShaking = (pgv / 15.0) * 0.4;

        buildingsRef.current.forEach((b) => {
          const group = buildingMeshesRef.current.get(b.id);
          if (group) {
            // Soft storey Science B4 has higher structural drift resonance
            const multiplier = b.id === "FAC_NCU_SCIENCE_B4" ? 1.8 : b.id === "FAC_NCU_ENG_B5" ? 1.0 : 0.45;
            const displacement = Math.sin(elapsedTime * 18 + b.x) * baseShaking * multiplier;
            group.position.x = b.x + displacement;
            group.rotation.z = (displacement / b.height) * 0.08;
          }
        });
      } else {
        // Return to neutral equilibrium
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

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
    };
  }, [isSimulating, scenario]);

  // Update dynamic building colors ONLY when simulation status is active
  useEffect(() => {
    buildingsRef.current.forEach((b) => {
      const group = buildingMeshesRef.current.get(b.id);
      if (!group) return;

      const mainMesh = group.children[0] as THREE.Mesh;
      if (mainMesh && mainMesh.material) {
        if (!isSimulating) {
          // NEUTRAL STANDBY: Clean titanium dark slate
          (mainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
          (mainMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        } else {
          // IMPACT DYNAMIC: Evaluated based on scenario PGV & structural system!
          const pgv = scenario?.predicted_pgv_cm_s || 28.4;
          if (b.id === "FAC_NCU_SCIENCE_B4") {
            // Soft-story vulnerable to shear collapse if PGV > 20
            if (pgv >= 20) {
              (mainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x881337);
              (mainMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xe11d48);
              (mainMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.45;
            }
          } else if (b.id === "FAC_NCU_ENG_B5") {
            if (pgv >= 25) {
              (mainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x78350f);
              (mainMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xd97706);
              (mainMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
            }
          } else {
            // Library retrofit core holds safe
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
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 10, 0);
  };

  // Mouse drag orbit controls
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
      70,
      Math.min(320, cameraAngleRef.current.radius + e.deltaY * 0.15)
    );
    updateCameraPosition();
  };

  // Quick camera presets
  const setPreset = (preset: "campus" | "science4" | "library") => {
    setCameraMode(preset);
    if (preset === "campus") {
      cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 180 };
    } else if (preset === "science4") {
      cameraAngleRef.current = { theta: Math.PI / 6, phi: Math.PI / 3.8, radius: 110 };
      setSelectedBuilding(buildingsRef.current[0]);
    } else if (preset === "library") {
      cameraAngleRef.current = { theta: (5 * Math.PI) / 4, phi: Math.PI / 3.5, radius: 110 };
      setSelectedBuilding(buildingsRef.current[2]);
    }
    updateCameraPosition();
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 select-none">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating 3D Navigation Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/90 p-1 backdrop-blur-md">
        <button
          onClick={() => setPreset("campus")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
            cameraMode === "campus"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Campus 360°
        </button>
        <button
          onClick={() => setPreset("science4")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
            cameraMode === "science4"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Science B4
        </button>
        <button
          onClick={() => setPreset("library")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
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
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* State Status Banner (Neutral vs Simulated Impact) */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md text-xs">
        <Building2 className="h-3.5 w-3.5 text-cyan-400" />
        <span className="font-bold text-slate-200">NCU Real Campus 3D Twin</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
            isSimulating
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}
        >
          {isSimulating ? "SEISMIC IMPACT SIMULATING" : "STANDBY: NEUTRAL MONITORING"}
        </span>
      </div>

      {/* Building Inspector Modal / Tooltip */}
      {selectedBuilding && (
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
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-500 bg-slate-950/70 px-2 py-1 rounded border border-slate-800/80 font-mono">
        Drag to Orbit 360° | Scroll to Zoom
      </div>
    </div>
  );
};
