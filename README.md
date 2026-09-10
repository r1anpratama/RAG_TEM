# SeismoAgent-TW (RAG_TEM)

> **Multimodal Agentic RAG for Seismic Hazard & Real-Time Emergency Triage in Taiwan**  
> *National Central University (NCU Geophysics / E-DREaM Lab) × NVIDIA AI Technology Center (NVAITC)*

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Architecture](https://img.shields.io/badge/architecture-Dual--Track%20Multi--Agent-emerald.svg)]()
[![Code Style](https://img.shields.io/badge/code%20style-Ponytail%20Ladder-orange.svg)](https://github.com/DietrichGebert/ponytail)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Overview

**SeismoAgent-TW** is a domain-specialized, physics-informed agentic system designed for rapid seismic hazard assessment, active fault multi-rupture cascading prediction, and automated emergency triage across Taiwan.

Built upon ground-truth data from the **Taiwan Earthquake Model (TEM PSHA 2025)**, the **38 Active On-Land Fault Catalogs**, and the **TT-SAM (Taiwan Transformer Shaking Alert Model)**, the system features:

1. **Dual-Track Decision Engine**:
   - **Track A (Reflex Track, 0.009 ms)**: Deterministic SCADA machine interlocks (elevator halting, gas valve shutoff, cleanroom exhaust isolation) executed in microsecond latency before damaging S-waves arrive.
   - **Track B (Deliberative Track, 0.87 ms)**: Multi-agent collaboration with spatial graph traversal, campus digital twin structural drift calculation, and zero-hallucination factual validation.
2. **Spatial-Geotechnical Knowledge Graph (Geo-GraphRAG)**:
   - 45 nodes & 78 attributed edges linking 38 active faults, TEM PSHA2025 Table 2 multi-structure rupture pairings (e.g. Shuanglienpo ID 2 + Hukou ID 4 $M_w\ 6.91$), regional campus digital twins (NCU Science B4, NCU Eng B5, HSP Fab), and utility lifelines.
3. **Physics-Informed GMPE Attenuation Model**:
   - Calibrated against Taiwan crustal GMPE logic trees (Lin & Lee 2008 / Campbell & Bozorgnia 2014) to validate deep learning predictions against theoretical $\pm 2.5\sigma$ confidence intervals.
4. **Interactive Real-Time Web Dashboard & GIS Hazard Map**:
   - Live Leaflet GIS map of Taiwan faults and expanding P/S seismic wave fronts.
   - Real-time S-wave countdown clock.
   - Interactive Vis.js GeoGraph visualizer.
   - Grounded Conversational Geotechnical Copilot citing TEM PSHA2025 sections.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SPATIAL-GEOTECHNICAL KNOWLEDGE GRAPH (GeoGraph)                 │
│                                                                                        │
│  [38 On-Land Faults] ──(RUPTURES_WITH)──► [TEM Table 2 Multi-Rupture Pairings]         │
│           │                                             │                              │
│     (PROXIMATE_TO)                                (GOVERNED_BY)                        │
│           ▼                                             ▼                              │
│  [Campus Digital Twin] ──(DEPENDS_ON)───► [TEM PSHA GMPE Logic Trees]                  │
│  (NCU B4, Eng B5, Fab)                    (Lin & Lee 2008, Campbell & Bozorgnia 2014)  │
└───────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      DUAL-TRACK MULTI-AGENT ORCHESTRATION PIPELINE                     │
│                                                                                        │
│             TT-SAM Waveform Alert Packet (Chen et al., 2026; t=3-13s)                  │
│                                       │                                                │
│                ┌──────────────────────┴──────────────────────┐                         │
│                ▼                                             ▼                         │
│    [TRACK A: REFLEX ENGINE]                     [TRACK B: DELIBERATIVE MULTI-AGENT]    │
│    Latency: 0.009 ms                            Latency: 0.87 ms                       │
│    • Instant Elevator Interlock                 ┌────────────────────────────────────┐ │
│    • Main Gas Emergency Shutoff                 │ Agent 1: Seismic Source Analyst    │ │
│    • Cleanroom Toxic Gas Cutoff                 │ Agent 2: Geotechnical Graph Worker │ │
│                                                 │ Agent 3: Structural Triage Worker  │ │
│                                                 │ Agent 4: Safety Critic (Verifier)  │ │
│                                                 └─────────────────┬──────────────────┘ │
└───────────────────────────────────────────────────────────────────┼────────────────────┘
                                                                    │
                                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      PHYSICS-INFORMED GMPE CONFIDENCE VALIDATION                       │
│ • Compares TT-SAM predicted PGV against theoretical GMPE ground motion attenuation.   │
│ • Validates Z-score deviation within ±2.5σ to prevent false alarms or sensor glitches. │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Layout

```text
RAG_TEM/
├── .agents/                    # Agent guidelines & Ponytail skills
│   ├── rules/                  # Ponytail clean code & project operating rules
│   └── skills/                 # Ponytail analysis & review skills
├── 00_Index/                   # Obsidian Second Brain: Maps of Content & Dashboard
├── 01_Workflows/               # Obsidian Second Brain: Daily engineering logs
├── 02_Architecture/            # Obsidian Second Brain: System designs, PRD & ADRs
├── 03_Literature_and_Domain/   # Obsidian Second Brain: Fault catalogs & arXiv research
├── 04_Decisions_ADR/           # Obsidian Second Brain: Architectural Decision Records
├── data/
│   ├── raw/                    # Raw fault catalogs, spreadsheets & TEM PSHA 2025 PDF
│   └── processed/              # Processed chunks and indexes
├── src/
│   ├── agents/                 # Specialized workers (Seismic, Geotech, Structural, Critic, Copilot)
│   ├── api/                    # FastAPI REST & WebSocket server + Web Dashboard static assets
│   ├── domain/                 # Domain entities (Fault, Seismic, GeoGraph, GMPE)
│   ├── pipelines/              # PDF chunking, hybrid retrieval, and TT-SAM simulator
│   ├── utils/                  # Minimal utilities
│   ├── config.py               # Path configurations
│   ├── run_agentic_demo.py     # Terminal multi-agent demo runner
│   └── run_triage_demo.py      # Terminal triage demo runner
├── tests/                      # Full test suite (20/20 tests passing)
├── AGENTS.md                   # AI Agent operating principles & Ponytail ladder
├── README.md                   # Project documentation
└── requirements.txt            # Minimal dependencies
```

---

## 🧠 Obsidian Second Brain

This repository doubles as an **Obsidian Vault**. To explore the second brain:
1. Open the **Obsidian** desktop app.
2. Select **Open folder as vault** and choose the `RAG_TEM` directory.
3. Open `00_Index/Dashboard.md` to access the Map of Content (MOC).

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Optional: NVIDIA GPU (RTX 3090 / CUDA 13) for local LLM acceleration

### Installation
```bash
# Clone repository
git clone https://github.com/r1anpratama/RAG_TEM.git
cd RAG_TEM

# Install dependencies
pip install -r requirements.txt
```

### 1. Launch the Interactive Web Dashboard
```bash
python -m src.api.server
```
Open your browser and navigate to:
👉 **`http://localhost:8000`**

From the web dashboard, you can:
- Trigger earthquake scenarios (e.g. **Shuanglienpo-Hukou $M_w\ 6.91$**).
- Watch the live **S-wave countdown clock**.
- Inspect Taiwan active faults and expanding seismic wave fronts on the Leaflet map.
- View Campus Digital Twins damage states, drift ratios, and automated SCADA machine interlocks.
- Explore the interactive **Geo-GraphRAG** topology.
- Chat with the **Geotechnical Copilot** grounded in TEM PSHA 2025.

### 2. Run Terminal Multi-Agent Simulation
```bash
python -m src.run_agentic_demo
```

### 3. Run Automated Test Suite
```bash
python -m pytest tests/
```
Output: **20 passed in ~18s**.

---

## 📊 Benchmark Performance

| Metric | Target KPI | Achieved Prototype Performance |
| :--- | :--- | :--- |
| **Track A Reflex Latency** | $< 5.0\ \text{ms}$ | **$0.009\ \text{ms}$** |
| **Track B Deliberative Latency** | $\le 2.0\ \text{s}$ | **$0.87\ \text{ms}$** |
| **Hallucination Rate** | $0.0\%$ | **$0.0\%$** (Safety Critic Verified) |
| **Unit Test Suite** | $100\%$ pass | **20/20 passed** |

---

## 📜 Development Principles & Clean Code

- **Ponytail Clean Code Ladder**: Favor standard library solutions, keep code minimal and robust, avoid bloated external dependencies or unnecessary abstractions.
- **English Standard**: All code, docstrings, commit messages, and technical notes are maintained strictly in English.
- **Git Discipline**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
