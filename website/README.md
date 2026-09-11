# SeismoAgent-TW Web Platform (`website/`)

This directory contains the production web interfaces and web services for the **SeismoAgent-TW** earthquake modeling, multi-agent triage, and RAG platform.

The architecture is fully decoupled into a **Next.js 15 App Router frontend** and a **FastAPI backend**.

---

## 📁 Directory Structure

```text
website/
├── frontend/                       # Next.js 15 + React 19 TailwindAdmin Direct Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # TailwindAdmin direct RAG dashboard
│   │   │   ├── dashboard/page.tsx  # Direct alias/forward to `/`
│   │   │   ├── layout.tsx          # Root shell layout with hydration-safe theme
│   │   │   └── globals.css         # Light & Dark mode theme variables & styles
│   │   ├── components/
│   │   │   ├── layout/             # TailwindAdmin enterprise shell
│   │   │   │   ├── sidebar.tsx     # Collapsible left navigation drawer
│   │   │   │   └── header.tsx      # Top bar with breadcrumb, controls & theme toggle
│   │   │   ├── dashboard/          # 4 Dedicated RAG visualization views & KPIs
│   │   │   │   ├── kpi-metrics.tsx # 4 Top summary KPI metric cards
│   │   │   │   ├── rag-architecture-view.tsx # Reflex & Deliberative pipeline graph
│   │   │   │   ├── eews-view.tsx             # S-wave countdown clock & GIS wavefronts
│   │   │   │   ├── psha-view.tsx             # 38 faults, cascading graph & GMPE curve
│   │   │   │   └── copilot-view.tsx          # Geotechnical AI copilot with SSE streaming
│   │   │   ├── theme-toggle.tsx    # Native Tailwind Light/Dark mode switcher (☀️/🌙)
│   │   │   └── mission-control/    # Interactive GIS, GMPE & digital twins primitives
│   │   ├── hooks/                  # useRagStream hook (SSE streaming reader)
│   │   ├── lib/                    # Zod validation & API client helpers
│   │   └── types/                  # TypeScript interfaces for triage, faults & twins
│   ├── .env.example                # NEXT_PUBLIC_API_URL=http://localhost:8000
│   ├── tailwind.config.ts          # Tailwind CSS configuration with darkMode: ["class"]
│   └── package.json                # Next.js 15, React 19, Lucide, Leaflet, Tailwind
│
└── backend/                        # FastAPI Application Server (SSE Streaming + Multi-Agent Triage)
    ├── app/
    │   ├── api/routers/
    │   │   ├── triage.py           # Multi-scenario trigger & simulation endpoints
    │   │   ├── chat.py             # Server-Sent Events (SSE) RAG streaming endpoint
    │   │   ├── upload.py           # Drag-and-drop document ingestion endpoint
    │   │   └── health.py           # Healthcheck endpoint with indexed chunk counts
    │   ├── core/                   # Server configuration loaded from .env
    │   ├── rag/                    # In-memory vector store and RAG token streaming engine
    │   └── schemas/                # Pydantic v2 validation schemas
    ├── tests/                      # Pytest suite for API endpoints (8/8 passing)
    ├── .env.example                # Server configuration & optional LLM keys
    └── requirements.txt            # Minimal FastAPI dependencies
```

---

## 🚀 How to Run

### 1. Start the Backend (FastAPI)

```bash
cd website/backend
pip install -r requirements.txt
cp .env.example .env

# Run FastAPI with Uvicorn
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Interactive API Documentation (Swagger)**: `http://127.0.0.1:8000/docs`
- **System Health Endpoint**: `http://127.0.0.1:8000/api/health`
- **Scenarios List Endpoint**: `http://127.0.0.1:8000/api/triage/scenarios`

### 2. Start the Frontend (Next.js 15)

```bash
cd website/frontend
npm install
cp .env.example .env.local

# Run development server
npm run dev
# Or run production build
# npm run build && npm run start -p 3000
```

- **Interactive Mission Control UI**: `http://localhost:3000`

---

## 🎨 Geotechnical Color Palette (Cyber Slate & Modern Mission Control)

The interface is styled using a modern ergonomic dark-mode palette engineered for extended monitoring comfort:

- `slate_obsidian`: `#0b0f19` (Foundation background) & `#111c2e` (Elevated telemetry cards)
- `cyber_cyan`: `#06b6d4` (Telemetry readouts, normal fault mechanics, AI Copilot aura)
- `cyber_amber`: `#f59e0b` (Real-time S-wave countdown timer, active triggers)
- `cyber_emerald`: `#10b981` (Safe building triage & verified SCADA interlocks)
- `cyber_rose`: `#f43f5e` (Critical collapse risks & emergency alarms)
- `ice_white`: `#f8fafc` (Headers) & `#94a3b8` (Muted labels for zero eye strain)

---

## 🧪 Testing

```bash
# Run backend test suite
pytest website/backend/tests/
```
