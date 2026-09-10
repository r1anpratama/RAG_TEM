# SeismoAgent-TW Web Platform (`website/`)

This directory contains the production web interfaces and web services for the **SeismoAgent-TW** earthquake modeling, multi-agent triage, and RAG platform.

The architecture is fully decoupled into a **Next.js 15 App Router frontend** and a **FastAPI backend**.

---

## 📁 Directory Structure

```text
website/
├── frontend/                       # Next.js 15 + React 19 Mission Control Interface
│   ├── src/
│   │   ├── app/                    # App Router (page.tsx, layout.tsx, globals.css)
│   │   ├── components/mission-control/
│   │   │   ├── control-header.tsx  # Scenario trigger, simulation status & triggers
│   │   │   ├── alert-banner.tsx    # S-wave countdown clock & telemetry banner
│   │   │   ├── gis-map.tsx         # Free Leaflet GIS basemaps with fault lines & wave fronts
│   │   │   ├── digital-twins.tsx   # Facility structural drift & damage status cards
│   │   │   ├── scada-panel.tsx     # Track A sub-millisecond machine interlocks
│   │   │   ├── gmpe-curve.tsx      # Lin & Lee (2008) PGV attenuation chart
│   │   │   ├── graph-preview.tsx   # Geo-GraphRAG multi-fault cascading ruptures
│   │   │   └── copilot-drawer.tsx  # Slide-over SSE-streamed RAG copilot with citations
│   │   ├── hooks/                  # useRagStream hook (SSE streaming reader)
│   │   ├── lib/                    # Zod validation & API client helpers
│   │   └── types/                  # TypeScript interfaces for triage, faults & twins
│   ├── .env.example                # NEXT_PUBLIC_API_URL=http://localhost:8000
│   ├── tailwind.config.ts          # Geotechnical palette tokens (ink_black, stormy_teal, etc.)
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

## 🎨 Geotechnical Color Palette

The interface is styled using a precision high-contrast geotechnical theme defined in `tailwind.config.ts`:

- `black`: `#000000` (Deepest foundation background & ultra-dark card surfaces)
- `prussian_blue`: `#14213d` (Structural panels, telemetry borders & data cards)
- `orange`: `#fca311` (High-alert indicators, S-wave wavefronts & countdown clock)
- `alabaster_grey`: `#e5e5e5` (High-readability light typography & technical readouts)
- `white`: `#ffffff` (Pure white highlights, focal headers & numeric emphasis)

---

## 🧪 Testing

```bash
# Run backend test suite
pytest website/backend/tests/
```
