---
title: Second Brain Dashboard
created: 2026-09-09
type: moc
tags:
  - index
  - dashboard
  - second-brain
---

# RAG_TEM — Second Brain Dashboard

Welcome to the central intelligence hub for the **RAG_TEM** project (Retrieval-Augmented Generation for the Taiwan Earthquake Model & Seismic Hazard Assessment).

---

## 🗺️ Maps of Content (MOC)

### 1. [[Principles_and_Rules|00. Principles & Operating Rules]]
- Core user rules, Ponytail clean code methodology, and code hygiene principles.

### 2. [[2026-09-09_Project_Kickoff|01. Workflows & Daily Logs]]
- **[[2026-09-14_Frontend_Typecheck_and_Build_Verification|2026-09-14: Frontend Typecheck, Dependencies, and Build Verification]]**
- **[[2026-09-14_TEM_PSHA_Hazard_Console|2026-09-14: TEM PSHA2025 Hazard Console — Interactive Source Map + Docked Grounded Assistant]]**
- **[[2026-09-14_Stack_Launch_Verification|2026-09-14: Stack Launch Verification — Backend, Classic API & Next.js Frontend]]**
- **[[2026-09-14_Local_First_Migration|2026-09-14: Local-First Migration — Repository Moves Off Google Drive]]**
- **[[2026-09-14_Frontend_Next16_Local_Dev_Harness|2026-09-14: Frontend Repaired on Next.js 16 with a Local Dev Harness]]** *(superseded)*
- **[[2026-09-10_Decoupled_FastAPI_Nextjs_Architecture|2026-09-10: Decoupled RAG Architecture (FastAPI + Next.js App Router)]]**
- **[[2026-09-10_Interactive_Web_Dashboard_and_Streaming_API|2026-09-10: Interactive Web Dashboard, Streaming WebSocket API & Copilot]]**
- **[[2026-09-10_Literature_Search_and_Agentic_Upgrade|2026-09-10: Literature Survey on arXiv & Agentic RAG Upgrades]]**
- **[[2026-09-09_Project_Kickoff|2026-09-09: Project Kickoff & Foundation Setup]]**
- Standard operating procedures for data ingestion and index generation.

### 3. [[System_Design|02. System Architecture]] & [[PRD_SeismoAgent_TW|Product Requirements Document (PRD)]]
- **[[Decoupled_FastAPI_Nextjs_RAG|Decoupled Architecture: FastAPI Backend + Next.js App Router]]**: Production-ready decoupled webapp with SSE token streaming, rate limiting, PDF/TXT upload, and sanitized markdown.
- **[[Web_Dashboard_and_Streaming_API|Web Dashboard & Real-Time Streaming Server]]**: Interactive UI, Leaflet GIS mapping, Vis.js GeoGraph visualizer, and WebSocket streaming.
- **[[Geo_GraphRAG_and_MultiAgent|Spatial-Graph-Agentic Architecture & Dual-Track Engine]]**: Complete design of GeoGraph (TEM Table 2 pairings), physics GMPE validation, and multi-agent workers.
- **[[PRD_SeismoAgent_TW|SeismoAgent-TW PRD v1.0.0]]**: Detailed specifications for Multimodal Agentic RAG and real-time emergency triage with NVIDIA stack.
- High-level design of the RAG pipeline, chunking strategies, vector index, and retriever.
- Component breakdown: Domain, Ingestion, Retrieval, Generation.

### 4. [[Domain_Context|03. Literature & Domain Knowledge]] & [[Fault_Catalog_38|Active Fault Catalog]]
- **[[ArXiv_Agentic_RAG_Synthesis|Literature Review & Synthesis: Maximizing SeismoAgent-TW with Graph-Agentic RAG]]**: State-of-the-art survey of recent arXiv literature.
- **[[Fault_Catalog_38|Taiwan Active Fault Catalog (38 Seismogenic Structures)]]**: Definitive parameters and alignments database.
- Notes on Taiwan Earthquake Model (TEM PSHA 2025).
- Relevant research papers (Chen et al., 2026 TT-SAM, TEM PSHA 2025).

### 5. [[ADR_001_Clean_Architecture_and_Second_Brain|04. Architectural Decision Records (ADRs)]]
- **[[ADR_002_Spatial_Graph_Agentic_RAG|ADR 002: Spatial-Graph-Agentic Architecture & Dual-Track Decision Engine]]**
- **[[ADR_001_Clean_Architecture_and_Second_Brain|ADR 001: Clean Architecture and Second Brain Framework]]**

---

## 🎯 Current Project Status
- **Working Copy**: `D:\AGENT\RAG_TEM` (local NTFS). The repository no longer runs from Google Drive. See [[2026-09-14_Local_First_Migration]].
- **Phase**: Decoupled RAG Architecture Implemented — Backend (`website/backend/`), Frontend (`website/frontend/`), & Classic GIS (`website/classic/`)
- **Backend Service**: `python -m uvicorn website.backend.app.main:app --host 127.0.0.1 --port 8000 --reload` (runs on `http://127.0.0.1:8000`)
- **Frontend Service**: `cd website/frontend && npm run dev` — Next.js **16.3.5** on Turbopack at `http://localhost:3000`
- **Classic Map**: `python -m uvicorn src.api.server:app --host 127.0.0.1 --port 8080` (runs on `http://127.0.0.1:8080`)
- **Obsidian Mirror**: `pwsh -File D:\AGENT\rag-tem-drive-mirror.ps1` mirrors the vault one-way to Google Drive, excluding `.git`, `node_modules`, `.next`, and caches. Run on demand.
- **Key Capabilities**: SSE token-by-token streaming, rate limiting, PDF/TXT upload validation (10 MB limit), XSS-sanitized markdown with `react-markdown` + `rehype-sanitize`, client-side Zod validation, zero exposed AI keys on frontend.
- **Test Suite**: 28/28 tests passing — `$env:PYTHONPATH=".;website/backend"; pytest`
- **Status**: Live on GitHub (`main` branch tracking `origin/main`, HEAD `2012cd3`)
- **Target Repository**: [r1anpratama/RAG_TEM](https://github.com/r1anpratama/RAG_TEM.git)

