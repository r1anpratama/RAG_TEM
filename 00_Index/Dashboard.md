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
- **Phase**: Decoupled RAG Architecture Implemented — Backend (FastAPI + SSE + Ingestion) & Frontend (Next.js App Router + Tailwind + XSS Sanitization)
- **Backend Service**: `cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
- **Frontend Service**: `cd frontend && npm run dev` (Runs on `http://localhost:3000`)
- **Key Capabilities**: SSE token-by-token streaming, rate limiting, PDF/TXT upload validation (10 MB limit), XSS-sanitized markdown with `react-markdown` + `rehype-sanitize`, client-side Zod validation, zero exposed AI keys on frontend.
- **Test Suite**: 26/26 tests passing (20 core tests + 6 backend API tests).
- **Status**: Live on GitHub (`main` branch tracking `origin/main`)
- **Target Repository**: [r1anpratama/RAG_TEM](https://github.com/r1anpratama/RAG_TEM.git)

