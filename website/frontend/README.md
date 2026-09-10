# SeismoAgent-TW Frontend (Next.js 15 App Router)

Modern, mission-critical seismic emergency triage dashboard built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, **Lucide Icons**, and **Zod**.

---

## 🌟 Key Capabilities

1. **100% Free GIS Basemaps (Zero API Keys Required)**:
   - High-contrast, dark-mode geospatial visualization powered by public Esri Dark Gray Canvas, Carto Dark Matter, Carto Voyager, and OpenStreetMap tiles.
   - Interactive fault mechanism layers (Reverse/Thrust, Normal, Strike-Slip).
   - Dynamic P-wave (fast) and S-wave (shear/damaging) expanding wavefront animations.
2. **Real-Time S-Wave Countdown Clock**:
   - Live telemetry countdown ticking tenths of seconds until shear wave impact.
   - Status indicators for Track A SCADA reflexes and epicentral distance.
3. **Facility Digital Twins**:
   - Real-time structural drift gauges, collapse probabilities, and safety triage badges for NCU Science Building 4, NCU Engineering Building 5, NCU Main Library, and HSP TSMC Advanced Fab.
4. **Track A Automated SCADA Interlocks**:
   - Visual audit trail of automated safety interlocks executed in under 5 ms:
     - Elevator seismic stop at nearest floor.
     - Natural gas main automatic cutoff.
     - Cleanroom toxic gas exhaust isolation.
     - HVAC fire & smoke damper lockdown.
5. **Physics-Informed Attenuation Curve (GMPE)**:
   - Dynamic Lin & Lee (2008) PGV decay chart comparing observed values against theoretical $\pm 2.5\sigma$ confidence bounds.
6. **Geo-GraphRAG Cascading Rupture Visualizer**:
   - Topological network graph showing multi-fault rupture propagation and infrastructure dependencies.
7. **Grounded Geotechnical Copilot**:
   - Slide-over chat drawer powered by Server-Sent Events (SSE) streaming token-by-token with direct citations to the TEM PSHA 2025 report.
   - Client-side Zod parameter validation and XSS-sanitized markdown output.

---

## 📁 Component Hierarchy

```text
src/
├── app/
│   ├── page.tsx                     # Mission Control layout & orchestration state
│   ├── layout.tsx                   # Root HTML shell & metadata
│   └── globals.css                  # Custom palette variables & Leaflet styling
├── components/mission-control/
│   ├── control-header.tsx           # Scenario picker, simulation trigger & copilot toggle
│   ├── alert-banner.tsx             # S-wave countdown clock & critical telemetry
│   ├── gis-map.tsx                  # Free GIS basemaps with fault mechanics & wavefronts
│   ├── digital-twins.tsx            # Facility structural drift & damage status cards
│   ├── scada-panel.tsx              # Track A microsecond machine interlocks
│   ├── gmpe-curve.tsx               # Lin & Lee (2008) attenuation chart
│   ├── graph-preview.tsx            # Geo-GraphRAG multi-fault rupture visualizer
│   ├── copilot-drawer.tsx           # Slide-over SSE-streamed RAG copilot
│   └── docs-modal.tsx               # Architecture & system reference modal
├── hooks/
│   └── use-rag-stream.ts            # Robust SSE streaming reader hook
├── lib/
│   └── api.ts                       # Backend API client with Zod validation
└── types/
    └── index.ts                     # TypeScript interfaces for scenarios, twins & map
```

---

## 🚀 Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Ensure `NEXT_PUBLIC_API_URL` points to your running FastAPI backend (default: `http://localhost:8000`).

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start -p 3000
```
