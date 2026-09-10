# SeismoAgent-TW Web Platform (`website/`)

This directory contains all web-facing interfaces and web services for the **SeismoAgent-TW** earthquake modeling and RAG platform.

---

## 📁 Directory Structure

```
website/
├── frontend/               # Next.js 14 App Router, Tailwind CSS & Shadcn UI
│   ├── src/
│   │   ├── app/            # App Router (page.tsx, layout.tsx, globals.css)
│   │   ├── components/     # Chat, Sidebar, and Upload components
│   │   ├── hooks/          # useRagStream hook (SSE streaming reader)
│   │   ├── lib/            # Zod validation & API helpers
│   │   └── types/          # Strong TypeScript interfaces
│   ├── .env.example        # NEXT_PUBLIC_API_URL=http://localhost:8000
│   └── package.json
│
├── backend/                # FastAPI Application Server (SSE Streaming + RAG)
│   ├── app/
│   │   ├── api/routers/    # /api/chat (SSE stream), /api/upload, /api/health
│   │   ├── core/           # Configuration loaded from .env
│   │   ├── rag/            # Vector store and RAG async token engine
│   │   └── schemas/        # Pydantic v2 schemas
│   ├── tests/              # Pytest suite for endpoints and rate limiting
│   ├── .env.example        # Server and LLM configurations
│   └── requirements.txt
│
└── classic/                # Geospatial & Network Graph Dashboard
    ├── css/                # Stylesheets (Tailwind & Leaflet styles)
    ├── js/                 # Map & Geo-Graph rendering scripts
    ├── index.html          # Interactive single-page dashboard
    └── run.py              # Lightweight static HTTP server runner
```

---

## 🚀 How to Run

### 1. Decoupled Architecture (Recommended)

#### A. Start the Backend (FastAPI)
```bash
cd website/backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs (Swagger): `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

#### B. Start the Frontend (Next.js)
```bash
cd website/frontend
npm install
cp .env.example .env.local
npm run dev
```
- Web Application: `http://localhost:3000`

---

### 2. Classic GIS & Geo-Graph Dashboard
If you wish to view the spatial Leaflet map with active fault lines and Vis.js graph topology:
```bash
cd website/classic
python run.py
```
- Classic Dashboard: `http://localhost:8080`
