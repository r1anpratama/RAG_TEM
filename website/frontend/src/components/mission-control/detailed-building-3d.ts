import * as THREE from "three";

/**
 * Procedural High-Fidelity 3D Architectural Model for NCU Science Building 4 (健雄館 / S4)
 * Faithfully constructed according to the architectural isometric drawing:
 * - 8-story high-rise massing with symmetrical stepped wings and recessed central atrium
 * - 2-story travertine/sandstone entrance portico with Chinese calligraphy plaque and glass lobby
 * - Rooftop Astronomical Observatory Dome with geodesic framing, telescope slit, and red beacon
 * - Rooftop curved barrel-vault glass skylight / elevator penthouse
 * - Rooftop tilted photovoltaic solar panel array with photorealistic cell textures
 * - Rooftop dual HVAC industrial chillers with turbine fan shrouds and AC heat pump bank
 * - Landscaped entrance plaza with paving grid, multi-tiered trees, park benches, and access ramp
 */

// ==========================================
// PROCEDURAL CANVAS TEXTURE GENERATORS
// ==========================================

function createFacadeCanvasTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Base architectural warm off-white / light concrete
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(0, 0, 512, 512);

  // Concrete precast panel division joints
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 3;
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // Subtle concrete aggregate grain
  ctx.fillStyle = "rgba(0, 0, 0, 0.025)";
  for (let i = 0; i < 1500; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillRect(rx, ry, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}

function createSolarCanvasTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Deep anti-reflective photovoltaic silicon blue
  ctx.fillStyle = "#0c2340";
  ctx.fillRect(0, 0, 512, 512);

  const cols = 6;
  const rows = 10;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // Cell background
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);

      // Metallic grid lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 1;
      for (let g = 1; g < 4; g++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW + 2, r * cellH + (g * cellH) / 4);
        ctx.lineTo(c * cellW + cellW - 2, r * cellH + (g * cellH) / 4);
        ctx.stroke();
      }

      // Main silver busbars
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillRect(c * cellW + cellW * 0.3, r * cellH + 2, 2, cellH - 4);
      ctx.fillRect(c * cellW + cellW * 0.7, r * cellH + 2, 2, cellH - 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createWindowCanvasTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Deep tinted architectural glass gradient
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "#090d16");
  grad.addColorStop(0.5, "#172554");
  grad.addColorStop(1, "#0369a1");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Outer mullion frame
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 244);

  // Horizontal and vertical division bars (transom & mullion)
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(0, 100);
  ctx.lineTo(256, 100);
  ctx.stroke();

  // Glass reflection highlight streak
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(80, 0);
  ctx.lineTo(20, 256);
  ctx.lineTo(0, 256);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createPlazaCanvasTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Granite paver stone background
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, 0, 256, 256);

  // Interlocking paving grid
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  const step = 32;
  for (let x = 0; x <= 256; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

function createSignPlaqueTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Bronze / dark wood sign backing
  ctx.fillStyle = "#2d2013";
  ctx.fillRect(0, 0, 512, 128);

  // Gold border
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  // Gold embossed inscription
  ctx.fillStyle = "#fef08a";
  ctx.font = "bold 36px 'Microsoft JhengHei', 'PingFang TC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("國立中央大學 E-DREaM 中心", 256, 48);

  ctx.fillStyle = "#93c5fd";
  ctx.font = "bold 20px 'Segoe UI', sans-serif";
  ctx.fillText("EDREAM CENTRE (健雄館)", 256, 92);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createDetailedScience4Building(): {
  group: THREE.Group;
  mainMeshes: THREE.Mesh[];
  domeMesh: THREE.Mesh;
  windowMeshes: THREE.Mesh[];
  beaconLight: THREE.PointLight;
} {
  const buildingGroup = new THREE.Group();
  buildingGroup.name = "FAC_NCU_SCIENCE_B4_DETAILED";

  const mainMeshes: THREE.Mesh[] = [];
  const windowMeshes: THREE.Mesh[] = [];

  // Generate textures
  const facadeTexture = createFacadeCanvasTexture();
  const solarTexture = createSolarCanvasTexture();
  const windowTexture = createWindowCanvasTexture();
  const plazaTexture = createPlazaCanvasTexture();
  const signTexture = createSignPlaqueTexture();

  // ==========================================
  // 1. PALETTE & PBR MATERIALS
  // ==========================================
  // Main Facade Concrete Panels (Clean architectural beige/gray with panel seams)
  const facadeMat = new THREE.MeshStandardMaterial({
    color: 0xdedede,
    roughness: 0.45,
    metalness: 0.15,
    map: facadeTexture || undefined,
  });

  // Darker accent concrete / structural columns
  const concreteAccentMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Entrance Portico Sandstone / Travertine (Warm earth tone)
  const sandstoneMat = new THREE.MeshStandardMaterial({
    color: 0xbf9b7a,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Deep Tinted Window Glass with Mullion Grid Map
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.85,
    map: windowTexture || undefined,
  });

  // Simple pure glass for balustrades
  const pureGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.4,
    transparent: true,
    opacity: 0.55,
  });

  // Observatory Geodesic Glass Dome (Cyan translucent glass with high specular)
  const domeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.15,
    metalness: 0.35,
    transparent: true,
    opacity: 0.75,
  });

  // Steel Dome Ribs & Pergola Frames
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.85,
  });

  // Solar Photovoltaic Panels (Rich iridescent blue with PV cell map)
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.8,
    map: solarTexture || undefined,
  });

  // Rooftop Membrane
  const roofDeckMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Plaza Pavers / Ground Slab
  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.05,
    map: plazaTexture || undefined,
  });

  // Asphalt road in front
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Wireframe / Crisp Architectural Outline material
  const edgeLineMat = new THREE.LineBasicMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.35,
  });

  const addEdges = (mesh: THREE.Mesh, parent: THREE.Group = buildingGroup) => {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(edges, edgeLineMat);
    line.position.copy(mesh.position);
    line.rotation.copy(mesh.rotation);
    line.scale.copy(mesh.scale);
    parent.add(line);
  };

  // ==========================================
  // 2. PLINTH & GROUND ENVIRONMENT
  // ==========================================
  // Plaza slab
  const plazaGeo = new THREE.BoxGeometry(32, 1.0, 28);
  const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
  plazaMesh.position.set(0, 0.5, 2);
  plazaMesh.receiveShadow = true;
  buildingGroup.add(plazaMesh);

  // Front roadway
  const roadGeo = new THREE.BoxGeometry(36, 0.3, 8);
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.position.set(0, 0.15, 17);
  roadMesh.receiveShadow = true;
  buildingGroup.add(roadMesh);

  // Roadway center divider stripes
  for (let sx = -14; sx <= 14; sx += 4) {
    const stripeGeo = new THREE.BoxGeometry(2.2, 0.05, 0.25);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(sx, 0.32, 17);
    buildingGroup.add(stripe);
  }

  // Entrance Steps (3-tiered)
  for (let i = 0; i < 3; i++) {
    const stepGeo = new THREE.BoxGeometry(10 - i * 0.8, 0.25, 1.2);
    const stepMesh = new THREE.Mesh(stepGeo, sandstoneMat);
    stepMesh.position.set(0, 0.25 + i * 0.25, 11.8 - i * 0.6);
    stepMesh.receiveShadow = true;
    buildingGroup.add(stepMesh);
  }

  // Handicap access ramp (left of steps)
  const rampGeo = new THREE.BoxGeometry(2.4, 0.75, 4);
  const rampMesh = new THREE.Mesh(rampGeo, concreteAccentMat);
  rampMesh.position.set(-6.5, 0.45, 11.2);
  rampMesh.rotation.x = 0.12;
  buildingGroup.add(rampMesh);

  // Park Benches on Left Sidewalk
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.6 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  for (const bz of [9.5, 6.5]) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(-13.5, 1.0, bz);
    benchGroup.rotation.y = Math.PI / 2;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.6), woodMat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.1), woodMat);
    back.position.set(0, 0.3, -0.28);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.5), ironMat);
    leg1.position.set(-0.9, -0.2, 0);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.5), ironMat);
    leg2.position.set(0.9, -0.2, 0);

    benchGroup.add(seat, back, leg1, leg2);
    buildingGroup.add(benchGroup);
  }

  // Landscaping Trees (Multi-tiered pine & deciduous trees on perimeter)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
  const foliageMat3 = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 });

  const treeLocations = [
    { x: -13.5, z: 3.5, scale: 1.1, mat: foliageMat },
    { x: -14.0, z: -1.0, scale: 1.3, mat: foliageMat2 },
    { x: -13.0, z: -5.5, scale: 0.95, mat: foliageMat3 },
    { x: 13.5, z: 2.0, scale: 1.0, mat: foliageMat },
    { x: 14.0, z: -3.0, scale: 1.3, mat: foliageMat2 },
    { x: 13.0, z: -7.5, scale: 0.9, mat: foliageMat3 },
  ];

  treeLocations.forEach((tl) => {
    const tree = new THREE.Group();
    tree.position.set(tl.x, 1.0, tl.z);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.5, 8), trunkMat);
    trunk.position.y = 1.75;
    trunk.castShadow = true;
    tree.add(trunk);

    const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 * tl.scale), tl.mat);
    crown1.position.y = 4.2 * tl.scale;
    crown1.castShadow = true;
    tree.add(crown1);

    const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6 * tl.scale), tl.mat);
    crown2.position.set(0.4, 5.8 * tl.scale, -0.3);
    crown2.castShadow = true;
    tree.add(crown2);

    buildingGroup.add(tree);
  });

  // Entrance Plaza Lantern Light Poles
  for (const lx of [-9.5, 9.5]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.5, 8), steelMat);
    pole.position.set(lx, 3.25, 12.5);
    const luminaire = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    luminaire.position.set(lx, 5.5, 12.5);
    buildingGroup.add(pole, luminaire);
  }

  // ==========================================
  // 3. ENTRANCE PORTICO (2-Story Canopy)
  // ==========================================
  const porticoGroup = new THREE.Group();
  porticoGroup.position.set(0, 1.0, 9.2);

  // Left & Right Sandstone Pillars (Travertine with fluted profile)
  const leftCol = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.8, 4.2), sandstoneMat);
  leftCol.position.set(-4.5, 3.4, 0);
  leftCol.castShadow = true;
  leftCol.receiveShadow = true;
  porticoGroup.add(leftCol);
  mainMeshes.push(leftCol);
  addEdges(leftCol, porticoGroup);

  const rightCol = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.8, 4.2), sandstoneMat);
  rightCol.position.set(4.5, 3.4, 0);
  rightCol.castShadow = true;
  rightCol.receiveShadow = true;
  porticoGroup.add(rightCol);
  mainMeshes.push(rightCol);
  addEdges(rightCol, porticoGroup);

  // Entrance Arch Top Beam / Lintel
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(11.4, 2.0, 4.2), sandstoneMat);
  lintel.position.set(0, 5.8, 0);
  lintel.castShadow = true;
  porticoGroup.add(lintel);
  mainMeshes.push(lintel);
  addEdges(lintel, porticoGroup);

  // Chinese Inscription Sign Plaque: "國立中央大學 E-DREaM 中心"
  const plaqueMat = signTexture
    ? new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.3, metalness: 0.4 })
    : new THREE.MeshStandardMaterial({ color: 0x3b2d20, roughness: 0.4 });
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.3, 0.25), plaqueMat);
  plaque.position.set(0, 5.7, 2.2);
  porticoGroup.add(plaque);

  // 2nd Floor Portico Balustrade / Overhang Roof
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.8, 5.4), facadeMat);
  porticoRoof.position.set(0, 7.2, 0.2);
  porticoRoof.castShadow = true;
  porticoGroup.add(porticoRoof);
  mainMeshes.push(porticoRoof);
  addEdges(porticoRoof, porticoGroup);

  // Portico 2nd Floor Ribbon Windows
  const porticoWindows = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.8, 0.4), glassMat);
  porticoWindows.position.set(0, 8.4, 0);
  porticoGroup.add(porticoWindows);
  windowMeshes.push(porticoWindows);

  // Front Entrance Glass Lobby Sliding Doors (Recessed inside the archway)
  const mainDoor = new THREE.Mesh(new THREE.BoxGeometry(6.6, 4.5, 0.3), glassMat);
  mainDoor.position.set(0, 2.25, -1.2);
  porticoGroup.add(mainDoor);
  windowMeshes.push(mainDoor);

  buildingGroup.add(porticoGroup);

  // ==========================================
  // 4. MAIN TOWER BODY (8-STORY MASSING)
  // ==========================================
  const towerHeight = 32;
  const towerGroup = new THREE.Group();
  towerGroup.position.set(0, 1.0, 0);

  // Central Recessed Core
  const centerCore = new THREE.Mesh(new THREE.BoxGeometry(12, towerHeight, 18), facadeMat);
  centerCore.position.set(0, towerHeight / 2, 0);
  centerCore.castShadow = true;
  centerCore.receiveShadow = true;
  towerGroup.add(centerCore);
  mainMeshes.push(centerCore);
  addEdges(centerCore, towerGroup);

  // Left Forward Wing (Tower Pylon)
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(6.5, towerHeight + 0.8, 19.5), facadeMat);
  leftWing.position.set(-8.8, (towerHeight + 0.8) / 2, 0.5);
  leftWing.castShadow = true;
  leftWing.receiveShadow = true;
  towerGroup.add(leftWing);
  mainMeshes.push(leftWing);
  addEdges(leftWing, towerGroup);

  // Right Forward Wing (Tower Pylon)
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(6.5, towerHeight + 0.8, 19.5), facadeMat);
  rightWing.position.set(8.8, (towerHeight + 0.8) / 2, 0.5);
  rightWing.castShadow = true;
  rightWing.receiveShadow = true;
  towerGroup.add(rightWing);
  mainMeshes.push(rightWing);
  addEdges(rightWing, towerGroup);

  // Vertical Architectural Relief Fins on Stepped Wing Corners
  for (const wx of [-12.1, -5.5, 5.5, 12.1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4, towerHeight, 0.4), concreteAccentMat);
    fin.position.set(wx, towerHeight / 2, 10.3);
    towerGroup.add(fin);
  }

  // Decorative Top Pergolas / Trellises on Left & Right Wings
  for (const wx of [-8.8, 8.8]) {
    const corniceRoof = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.9, 8.0), concreteAccentMat);
    corniceRoof.position.set(wx, towerHeight + 1.2, 5.5);
    corniceRoof.castShadow = true;
    towerGroup.add(corniceRoof);

    // Open pergola grid slats
    const pergolaGeo = new THREE.BoxGeometry(7.0, 0.35, 7.2);
    const pergolaMesh = new THREE.Mesh(pergolaGeo, steelMat);
    pergolaMesh.position.set(wx, towerHeight + 1.8, 5.5);
    towerGroup.add(pergolaMesh);
    addEdges(pergolaMesh, towerGroup);
  }

  // Recessed Central Balcony Terraces & Atrium Cutout (Floors 4, 5, 6)
  const balconyHeights = [13.5, 17.5, 21.5];
  balconyHeights.forEach((by) => {
    // Balcony slab
    const balcSlab = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.4, 2.8), concreteAccentMat);
    balcSlab.position.set(0, by, 8.4);
    balcSlab.castShadow = true;
    towerGroup.add(balcSlab);

    // Balcony glass railing
    const balcRail = new THREE.Mesh(new THREE.BoxGeometry(10.8, 1.0, 0.15), pureGlassMat);
    balcRail.position.set(0, by + 0.6, 9.7);
    towerGroup.add(balcRail);

    // Recessed sliding glass behind balcony
    const backGlass = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.6, 0.2), glassMat);
    backGlass.position.set(0, by + 1.6, 7.1);
    towerGroup.add(backGlass);
    windowMeshes.push(backGlass);
  });

  // ==========================================
  // 5. WINDOW ARRAYS (Matrix of Recessed Windows)
  // ==========================================
  const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
  const floors = 8;
  const floorHeight = 3.6;

  // Function to create a framed window unit
  const createWindow = (w: number, h: number) => {
    const winGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), windowFrameMat);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, h - 0.2, 0.35), glassMat);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.18, 0.55), concreteAccentMat);
    sill.position.y = -h / 2;

    winGroup.add(frame, glass, sill);
    windowMeshes.push(glass);
    return winGroup;
  };

  // 5A. Front Windows on Left & Right Wings (8 vertical rows)
  for (let f = 1; f < floors; f++) {
    const wy = 4.2 + f * floorHeight;

    // Left Wing Front Windows
    const leftWin = createWindow(2.4, 1.9);
    leftWin.position.set(-8.8, wy, 10.3);
    towerGroup.add(leftWin);

    // Right Wing Front Windows
    const rightWin = createWindow(2.4, 1.9);
    rightWin.position.set(8.8, wy, 10.3);
    towerGroup.add(rightWin);
  }

  // 5B. Flank Windows (Right & Left Side Facades - 4 columns x 7 rows)
  const flankColsZ = [-5.5, -1.8, 1.8, 5.5];
  for (let f = 0; f < floors; f++) {
    const wy = 3.8 + f * floorHeight;
    flankColsZ.forEach((colZ) => {
      // Right Facade (+X)
      const rWin = createWindow(2.0, 1.9);
      rWin.position.set(12.1, wy, colZ);
      rWin.rotation.y = Math.PI / 2;
      towerGroup.add(rWin);

      // Left Facade (-X)
      const lWin = createWindow(2.0, 1.9);
      lWin.position.set(-12.1, wy, colZ);
      lWin.rotation.y = -Math.PI / 2;
      towerGroup.add(lWin);
    });
  }

  // 5C. Ground Floor Security Grille on Right Side
  const grilleGeo = new THREE.BoxGeometry(0.2, 1.6, 2.0);
  const grilleMesh = new THREE.Mesh(grilleGeo, steelMat);
  grilleMesh.position.set(12.15, 2.5, -5.5);
  towerGroup.add(grilleMesh);

  // Right Side Exit Door with Hood Canopy
  const sideDoor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 1.4), steelMat);
  sideDoor.position.set(12.15, 2.2, 7.5);
  const sideCanopy = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 1.8), concreteAccentMat);
  sideCanopy.position.set(12.4, 3.6, 7.5);
  towerGroup.add(sideDoor, sideCanopy);

  // ==========================================
  // 6. ROOF SURFACE & PARAPET
  // ==========================================
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(24.5, 0.6, 19.5), roofDeckMat);
  roofSlab.position.set(0, towerHeight + 0.3, 0);
  roofSlab.receiveShadow = true;
  towerGroup.add(roofSlab);

  // Perimeter Parapet Wall
  const parapetGeo = new THREE.BoxGeometry(24.6, 1.2, 19.6);
  const parapetMesh = new THREE.Mesh(parapetGeo, facadeMat);
  parapetMesh.position.set(0, towerHeight + 0.8, 0);
  addEdges(parapetMesh, towerGroup);

  // Perimeter Roof Safety Handrail
  const railMat = new THREE.LineBasicMaterial({ color: 0x94a3b8 });
  const railGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-12.2, towerHeight + 1.6, -9.6),
    new THREE.Vector3(12.2, towerHeight + 1.6, -9.6),
    new THREE.Vector3(12.2, towerHeight + 1.6, 9.6),
    new THREE.Vector3(-12.2, towerHeight + 1.6, 9.6),
    new THREE.Vector3(-12.2, towerHeight + 1.6, -9.6),
  ]);
  const railLine = new THREE.Line(railGeo, railMat);
  towerGroup.add(railLine);

  // ==========================================
  // 7. ROOFTOP OBSERVATORY ROTUNDA & GLASS DOME
  // ==========================================
  const observatoryGroup = new THREE.Group();
  observatoryGroup.position.set(0, towerHeight + 0.6, -1.0);

  // Cylindrical Drum Base
  const rotundaDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.6, 3.6, 32),
    concreteAccentMat
  );
  rotundaDrum.position.y = 1.8;
  rotundaDrum.castShadow = true;
  observatoryGroup.add(rotundaDrum);
  mainMeshes.push(rotundaDrum);
  addEdges(rotundaDrum, observatoryGroup);

  // Ribbon Windows on Rotunda Drum (Observation gallery)
  const drumRibbonWindows = new THREE.Mesh(
    new THREE.CylinderGeometry(5.45, 5.45, 1.0, 32, 1, true),
    glassMat
  );
  drumRibbonWindows.position.y = 1.1;
  observatoryGroup.add(drumRibbonWindows);
  windowMeshes.push(drumRibbonWindows);

  // 16 Vertical Architectural Columns / Pilasters Ringing the Drum
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const px = Math.cos(angle) * 5.35;
    const pz = Math.sin(angle) * 5.35;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.8, 8), steelMat);
    col.position.set(px, 2.5, pz);
    observatoryGroup.add(col);
  }

  // Dome Cornice Ring Beam
  const domeRing = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.3, 12, 32), steelMat);
  domeRing.rotation.x = Math.PI / 2;
  domeRing.position.y = 3.6;
  observatoryGroup.add(domeRing);

  // Geodesic Glass Half-Sphere Dome (Translucent Cyan)
  const domeGeo = new THREE.SphereGeometry(5.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMesh = new THREE.Mesh(domeGeo, domeGlassMat);
  domeMesh.name = "observatory_dome";
  domeMesh.position.y = 3.6;
  domeMesh.castShadow = true;
  observatoryGroup.add(domeMesh);

  // Steel Arch Meridian Ribs on the Glass Dome
  for (let i = 0; i < 8; i++) {
    const ribAngle = (i / 8) * Math.PI;
    const ribGeo = new THREE.TorusGeometry(5.32, 0.08, 6, 24, Math.PI);
    const rib = new THREE.Mesh(ribGeo, steelMat);
    rib.rotation.y = ribAngle;
    rib.rotation.x = Math.PI / 2;
    rib.position.y = 3.6;
    observatoryGroup.add(rib);
  }

  // Astronomy Telescope Viewing Shutter Slit (Vertical Guide Rails)
  const railGeoSlit = new THREE.BoxGeometry(0.2, 5.4, 0.2);
  const rail1 = new THREE.Mesh(railGeoSlit, steelMat);
  rail1.position.set(-0.8, 6.0, 4.2);
  rail1.rotation.x = -0.6;
  const rail2 = new THREE.Mesh(railGeoSlit, steelMat);
  rail2.position.set(0.8, 6.0, 4.2);
  rail2.rotation.x = -0.6;
  observatoryGroup.add(rail1, rail2);

  // Dome Peak Lantern Cap
  const peakCap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.4, 16), steelMat);
  peakCap.position.y = 8.9;
  observatoryGroup.add(peakCap);

  // Red Aviation Obstruction Warning Beacon atop Dome
  const beaconMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  beaconMesh.position.y = 9.3;
  observatoryGroup.add(beaconMesh);

  const beaconLight = new THREE.PointLight(0xef4444, 1.2, 15);
  beaconLight.position.y = 9.3;
  observatoryGroup.add(beaconLight);

  towerGroup.add(observatoryGroup);

  // ==========================================
  // 8. ROOFTOP MECHANICAL EQUIPMENT & SOLAR PANELS
  // ==========================================
  // 8A. Elevator Penthouse with Curved Glass Barrel-Vault Skylight
  const penthouseGroup = new THREE.Group();
  penthouseGroup.position.set(6.8, towerHeight + 0.6, -5.5);

  const penthouseBody = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.4, 4.4), concreteAccentMat);
  penthouseBody.position.y = 2.2;
  penthouseBody.castShadow = true;
  penthouseGroup.add(penthouseBody);
  addEdges(penthouseBody, penthouseGroup);

  // Barrel Vault Curved Glass Skylight
  const barrelGeo = new THREE.CylinderGeometry(2.3, 2.3, 4.4, 16, 1, false, 0, Math.PI);
  const barrelMesh = new THREE.Mesh(barrelGeo, domeGlassMat);
  barrelMesh.position.set(0, 4.4, 0);
  barrelMesh.rotation.z = Math.PI / 2;
  penthouseGroup.add(barrelMesh);

  towerGroup.add(penthouseGroup);

  // 8B. Tilted Photovoltaic Solar Panel Array (Front-Right Roof)
  const solarGroup = new THREE.Group();
  solarGroup.position.set(5.5, towerHeight + 0.8, 4.2);
  solarGroup.rotation.y = -0.2;
  solarGroup.rotation.x = 0.42; // Tilted toward the sun at 24°

  // Steel subframe truss
  const solarRack = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 3.4), steelMat);
  // Photovoltaic cell surface with realistic PV texture
  const solarCells = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 3.2), solarMat);
  solarGroup.add(solarRack, solarCells);

  // Solar frame mounting stanchions
  for (const px of [-2.0, 2.0]) {
    for (const pz of [-1.2, 1.2]) {
      const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6), steelMat);
      stanchion.position.set(px, -0.4, pz);
      solarGroup.add(stanchion);
    }
  }
  towerGroup.add(solarGroup);

  // 8C. Dual Industrial Rooftop Condenser Fans (HVAC Chillers)
  const chillerGroup = new THREE.Group();
  chillerGroup.position.set(8.2, towerHeight + 0.6, -1.0);

  const chillerPlinth = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.2, 3.2), steelMat);
  chillerPlinth.position.y = 0.6;
  chillerGroup.add(chillerPlinth);

  // Louvered enclosure screen
  const louverScreen = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 2.0, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, wireframe: true })
  );
  louverScreen.position.y = 1.8;
  chillerGroup.add(louverScreen);

  // Dual turbine fan shrouds
  for (const fz of [-0.8, 0.8]) {
    const fanShroud = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    fanShroud.position.set(0, 2.9, fz);

    const fanBlades = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.15, 8, 12),
      steelMat
    );
    fanBlades.rotation.x = Math.PI / 2;
    fanBlades.position.set(0, 2.95, fz);

    chillerGroup.add(fanShroud, fanBlades);
  }
  towerGroup.add(chillerGroup);

  // 8D. Bank of 4 AC Heat Pump Outdoor Units (Left Rear Roof)
  const acGroup = new THREE.Group();
  acGroup.position.set(-6.5, towerHeight + 0.6, -5.5);
  for (let i = 0; i < 4; i++) {
    const acUnit = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
    );
    acUnit.position.set(-1.8 + i * 1.3, 0.75, 0);
    acUnit.castShadow = true;
    acGroup.add(acUnit);
  }
  towerGroup.add(acGroup);

  buildingGroup.add(towerGroup);

  return {
    group: buildingGroup,
    mainMeshes,
    domeMesh,
    windowMeshes,
    beaconLight,
  };
}
