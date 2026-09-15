---
title: Real-Time Web Dashboard, WebSocket Streaming API & Geotechnical Copilot
created: 2026-09-10
type: architecture
tags:
  - architecture
  - fast-api
  - websocket
  - web-ui
  - copilot
  - gis-map
---

# Real-Time Web Dashboard, WebSocket Streaming API & Geotechnical Copilot

This document outlines the real-time serving infrastructure and interactive visualization suite of **SeismoAgent-TW**.

---

## 1. Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          SEISMOAGENT-TW CLIENT LAYER (Browser UI)                      │
│                                                                                        │
│  [Emergency Alert Banner]      [Taiwan GIS Leaflet Map]     [Campus Digital Twins]    │
│  (S-Wave Live Countdown)       (38 Faults + Epicenter)      (Drift IDR % + Tags)       │
│               │                            │                           │               │
│  [Interactive GeoGraph]        [Physics GMPE Curve]         [Geotechnical Copilot]     │
│  (Vis.js Network Visualizer)   (Lin & Lee ±2.5σ Band)       (TEM PSHA2025 Citations)   │
└───────────────────────────┬────────────────────────────────────────────┬───────────────┘
                            │ WebSocket (/ws/alert-stream)               │ REST HTTP
                            ▼                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI APPLICATION SERVER (src/api/server.py)                │
│                                                                                        │
│  • GET  /                       -> Single-Page Dashboard (Tailwind + Leaflet + Vis.js) │
│  • GET  /api/v1/health          -> Service Health, Fault & Graph Node Metrics          │
│  • GET  /api/v1/faults          -> 38 On-Land Fault Parameters & Nearest Spatial Query │
│  • GET  /api/v1/graph           -> Geo-GraphRAG Topology (Nodes, Edges, Properties)    │
│  • GET  /api/v1/scenarios       -> Realistic Benchmark Scenarios (Shuanglienpo, etc.) │
│  • POST /api/v1/triage          -> Dual-Track Multi-Agent Dispatch (Reflex + Delib.)  │
│  • POST /api/v1/chat            -> Conversational Copilot Query Execution              │
│  • WS   /ws/alert-stream        -> Real-Time TT-SAM Waveform Simulation (t=3s to 13s)  │
└───────────────────────────┬────────────────────────────────────────────┬───────────────┘
                            │                                            │
                            ▼                                            ▼
┌──────────────────────────────────────────────────┐ ┌───────────────────────────────────┐
│     DUAL-TRACK MULTI-AGENT ENGINE                │ │ GEOTECHNICAL COPILOT ENGINE       │
│  • Track A: Reflex Machine Interlocks (< 5 ms)   │ │ • HybridRetriever (123 Chunks)    │
│  • Track B: Deliberative Multi-Agent (0.87 ms)   │ │ • GeoGraph (38 Faults + Pairings) │
│    - Seismic Source Analyst                      │ │ • Physics GMPE Attenuation Model  │
│    - Geotechnical Graph Worker                   │ │ • Local LLM Acceleration (RTX)    │
│    - Structural Triage Worker                    │ │ • Zero-Hallucination Fallback     │
│    - Safety Critic Worker                        │ └───────────────────────────────────┘
└──────────────────────────────────────────────────┘
```

---

## 2. API Endpoints Reference

### 2.1 REST API
- `GET /api/v1/health`: Returns system status, fault counts, and node/edge totals in the knowledge graph.
- `GET /api/v1/faults?lat={lat}&lon={lon}`: Lists all 38 on-land active faults with slip rates, maximum magnitudes ($M_w$), and cascading rupture pairings (TEM PSHA2025 Table 2). When `lat` and `lon` are specified, calculates the closest fault and Haversine distance in km.
- `GET /api/v1/graph`: Serializes the entire spatial graph for interactive network visualizers (Vis.js / Cytoscape) with color-coded node categories (Faults, Multi-Rupture Pairs, Facilities, Lifelines).
- `GET /api/v1/scenarios`: Pre-configured benchmark scenarios for immediate evaluation:
  1. *Shuanglienpo-Hukou Cascading Rupture* ($M_w\ 6.91$, $2.8\text{ km}$ to NCU).
  2. *Hualien Offshore Deep Subduction* ($M_w\ 7.20$, depth $35.0\text{ km}$).
  3. *1999 Chi-Chi Rupture Analog* ($M_w\ 7.65$).
- `POST /api/v1/triage`: Accepts real-time earthquake parameters and dispatches both Track A reflex actions and Track B multi-agent structural assessments.
- `POST /api/v1/chat`: Accepts natural language inquiries and returns synthesized answers with TEM PSHA2025 page citations and graph evidence.

### 2.2 WebSocket Streaming (`/ws/alert-stream`)
Streams rolling TT-SAM alert updates second-by-second ($t=3\text{ s}$ to $13\text{ s}$), replicating the evolving waveform inferences from deep neural transformers:
- Broadcasts real-time S-wave countdown remaining until impact.
- Triggers instant Track A machine interlocks (elevator halting, gas line cutoff, toxic exhaust isolation).
- Delivers final multi-agent structural damage triage across regional facilities.

---

## 3. Geotechnical Copilot Architecture (`src/agents/copilot.py`)

1. **Entity Extraction**: Matches active faults, rupture combinations, and digital twin facilities from query tokens.
2. **Hybrid Semantic Retrieval**: Retrieves top-$k$ relevant text segments from 123 structure-aware chunks of `TEM PSHA2025-draft.pdf`.
3. **Physics GMPE Computation**: If magnitude and distance are detected, computes median PGV and $\pm 2.5\sigma$ confidence bands using Taiwan crustal attenuation equations.
4. **Local LLM & Deterministic Fallback**: Connects to an OpenAI-compatible local LLM endpoint (Ollama / vLLM on RTX 3090) when available; seamlessly falls back to a deterministic scientific synthesis engine with 0.0% hallucination rate.

---

## 4. Web Dashboard Interface (`src/api/static/index.html`)

- **Design System**: Geospatial dark-theme using Tailwind CSS, Leaflet.js, Vis.js, and Chart.js.
- **Emergency Alert Banner**: Dynamic countdown timer with auditory/visual alarm states based on estimated S-wave arrival at NCU.
- **Taiwan Hazard GIS Map**: Leaflet map visualizing 38 active faults, epicenter coordinates, and expanding P/S seismic wave fronts.
- **Campus Facility Digital Twins Grid**: Real-time triage tags (`RED_CRITICAL`, `YELLOW_INSPECT`, `GREEN_SAFE`), drift ratios (IDR %), collapse probabilities, and automated SCADA cutoff indicators.
- **Knowledge Graph Visualizer**: Interactive network graph showing cascading rupture pairings from TEM PSHA2025 Table 2.
- **Physics GMPE Curve**: Attenuation plot verifying TT-SAM predicted shaking against theoretical physics boundaries.
