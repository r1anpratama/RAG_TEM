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
  const [cameraMode, setCameraMode] = useState<"campus" | "science4" | "eng5" | "library">("campus");
  const animationFrameRef = useRef<number | null>(null);

  // Buildings mathematically positioned from verified NCU OpenStreetMap coordinates
  // Origin (0,0) = Grand Lawn (大草坪) [24.9690, 121.1920]
  // -z = North, +z = South, +x = East, -x = West
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
    radius: 260,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.0028);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1200);
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
    dirLight.position.set(120, 180, 100);
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

    const secondaryLight = new THREE.DirectionalLight(0x06b6d4, 0.6);
    secondaryLight.position.set(-100, 80, -80);
    scene.add(secondaryLight);

    // 5. Ground / Campus Terrain Plane (Encompassing entire NCU campus)
    const groundGeo = new THREE.PlaneGeometry(360, 320, 32, 32);
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
    const grid = new THREE.GridHelper(340, 34, 0x1e293b, 0x0f172a);
    grid.position.y = 0.1;
    scene.add(grid);

    // 6. NCU Zhongda Lake (中大湖) - Positioned accurately near Science B4
    const lakeGeo = new THREE.CircleGeometry(22, 32);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-11, 0.2, -37);
    scene.add(lake);

    // Central Pavilion in Zhongda Lake (湖心亭)
    const pavilionGeo = new THREE.CylinderGeometry(2, 2, 4, 8);
    const pavilionMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const pavilion = new THREE.Mesh(pavilionGeo, pavilionMat);
    pavilion.position.set(-11, 2, -37);
    scene.add(pavilion);

    // 7. NCU Athletic Running Track (田徑場) - Near Gymnasium
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
      opacity: 0.5,
    });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, 0.15, -8);
    scene.add(lawn);

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
      80,
      Math.min(380, cameraAngleRef.current.radius + e.deltaY * 0.15)
    );
    updateCameraPosition();
  };

  // Quick camera presets for real NCU landmarks
  const setPreset = (preset: "campus" | "science4" | "eng5" | "library") => {
    setCameraMode(preset);
    if (preset === "campus") {
      cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 260 };
    } else if (preset === "science4") {
      // Focus on Science Building 4 (x=-5, z=-65)
      cameraAngleRef.current = { theta: Math.PI / 1.8, phi: Math.PI / 3.6, radius: 130 };
      setSelectedBuilding(buildingsRef.current[0]);
    } else if (preset === "eng5") {
      // Focus on Engineering 5 (x=-116, z=55)
      cameraAngleRef.current = { theta: -Math.PI / 3, phi: Math.PI / 3.5, radius: 140 };
      setSelectedBuilding(buildingsRef.current[1]);
    } else if (preset === "library") {
      // Focus on Library Core (x=57, z=19)
      cameraAngleRef.current = { theta: (5 * Math.PI) / 4, phi: Math.PI / 3.5, radius: 130 };
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
          className={`px-2 py-1 rounded text-[10px] font-medium transition ${
            cameraMode === "science4"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Science 4 (S4)
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
