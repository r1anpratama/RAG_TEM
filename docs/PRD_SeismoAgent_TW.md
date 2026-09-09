# Product Requirements Document (PRD)
## SeismoAgent-TW: Multimodal Agentic RAG for Seismic Hazard & Real-Time Emergency Triage

- **Document Version:** 1.0.0
- **Status:** Approved for Development / Proposal Baseline
- **Target Platform:** NVIDIA AI Enterprise Stack (NeMo, cuVS, Nemotron, TensorRT-LLM)
- **Collaborators:** National Central University (NCU Geophysics / E-DREaM Lab & AI Collaborators) × NVIDIA AI Technology Center (NVAITC)

---

## 1. Executive Summary & Problem Statement

### 1.1 Background
Taiwan is located within an active tectonic collision zone between the Philippine Sea Plate and the Eurasian Plate, experiencing severe and frequent earthquake threats. The Earthquake-Disaster & Risk Evaluation and Management (E-DREaM) Center and Department of Earth Sciences at National Central University (NCU) maintain two flagship scientific assets:
1. **TT-SAM (Taiwan Transformer Shaking Alert Model, Chen et al., 2026):** A deep-learning real-time earthquake early warning (EEW) engine predicting Peak Ground Velocity (PGV) and Central Weather Administration (CWA) intensity levels within 3–13 s of P-wave arrival with 9.43 ms inference latency.
2. **TEM PSHA2025 (Gao et al., 2026):** Taiwan's updated national probabilistic seismic hazard model encompassing 38 on-land seismogenic structures, 55 offshore seismogenic structures, slip rates, 3D fault geometries, multiple-segment rupture pairings, and Ground Motion Prediction Equation (GMPE) logic trees.

### 1.2 Problem Statement
* **Operational Blind Spot in EEW:** Existing early warning systems broadcast countdown times and raw ground-shaking metrics without actionable, facility-specific context. Facility directors and emergency response teams lack instantaneous situational awareness regarding which specific structures are on the verge of collapse.
* **Manual Bottleneck in Geotechnical Analysis:** Probabilistic Seismic Hazard Assessments (PSHA), fragility curves, and fault parameters are locked in dense scientific PDFs and static tabular spreadsheets. Manually interpreting these data during an ongoing crisis is impossible.
* **Failure of Traditional RAG:** Standard RAG pipelines cannot reliably extract complex multi-column geotechnical research papers, non-linear attenuation relationship curves (GMPEs), and structural fragility tables, frequently inducing dangerous hallucinations.

### 1.3 Solution Vision
**SeismoAgent-TW** is an autonomous, multimodal agentic decision-support system that:
* Ingests and vectorizes static geotechnical knowledge (TEM PSHA2025, fault parameter tables, fragility matrices) onto GPU memory using **NVIDIA cuVS** and **Nemotron Parse**.
* Ingests real-time streaming seismic alerts directly from **TT-SAM**.
* Executes autonomous reasoning and self-reflection loops via **Llama-Nemotron Super 49B** to generate automated facility triage reports and utility cutoff triggers in $\le 2$ seconds with **zero hallucination** enforced by **NVIDIA NeMo Guardrails**.

---

## 2. Objectives & Key Performance Indicators (KPIs)

| Metric | Target Value | Verification Method |
| :--- | :--- | :--- |
| **End-to-End Latency** | $\le 2.0\ \text{s}$ | Benchmark from TT-SAM alert ingestion to complete triage JSON emission. |
| **Retrieval Accuracy** | $\ge 92\%$ | Precision/Recall on extracting fault attributes and building fragility limits. |
| **Hallucination Rate** | **0.0%** | Deterministic check on numerical entities (Slip rate, Dip, PGV, CWA Intensity). |
| **Parsing Fidelity** | $\ge 90\%$ | Verification of Nemotron Parse on scientific tables and GMPE plots. |
| **SOP Alignment** | $\ge 95\%$ | Concordance with official NCU campus disaster response protocols. |

---

## 3. User Personas & Operational Use Cases

### 3.1 Personas
* **Persona 1: Campus & Facility Safety Director:** Needs rapid situational awareness within 10 seconds to direct building-by-building evacuations without interpreting raw seismograms.
* **Persona 2: Automated SCADA / Building Management System (BMS):** Machine consumer that requires structured JSON directives to trigger automated emergency shutdowns (elevators, main gas valves, laboratory chemical conduits).
* **Persona 3: Structural & Seismological Researcher:** Scientific user querying the system interactively for post-event analysis comparing real-time ground shaking with long-term PSHA return periods.

### 3.2 Core Use Cases
* **UC-01 (Automated Pre-S-Wave Triage):** Ingest TT-SAM early warning packet $\rightarrow$ Match target coordinates against fault line distances $\rightarrow$ Query structural vulnerability limits $\rightarrow$ Issue emergency directive before destructive S-wave arrival.
* **UC-02 (Interactive Geotechnical Knowledge Retrieval):** User queries structural attributes of active fault systems (e.g., Shanchiao Fault, Hukou Fault) $\rightarrow$ Agent synthesizes slip rates, dip, and maximum magnitude with source paper citations.
* **UC-03 (Post-Event Scenario Comparison):** Ingest recorded station waveforms $\rightarrow$ Compare observed PGV against TEM PSHA2025 return period curves ($T_R = 475, 2475\ \text{years}$) $\rightarrow$ Estimate cumulative structural damage probability.

---

## 4. System Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   OFFLINE GEOTECHNICAL INGESTION                                      │
│                                                                                                        │
│  TEM PSHA2025 PDF (82 pp.)       Fault Parameters (38 faults)       Fault Alignments (38 traces)       │
│  [Gao et al., 2026]              [Fault Parameters_update.xlsx]     [Fault Alignments.xlsx]            │
│               │                                   │                                 │                  │
│               ▼                                   ▼                                 ▼                  │
│   NVIDIA Nemotron Parse              Geospatial Vectorizer             Polyline Interpolator           │
│   (Tables, GMPE curves, text)        (Slip rate, Dip, Mw Max)          (Lon/Lat Trajectories)          │
│               │                                   │                                 │                  │
│               └───────────────────────────────────┼─────────────────────────────────┘                  │
│                                                   ▼                                                    │
│                                      NVIDIA cuVS Vector Index                                          │
│                                   (CAGRA GPU Graph / IVF-PQ)                                           │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ONLINE REAL-TIME EMERGENCY TRIAGE                                    │
│                                                                                                        │
│  Multi-station Waveform Stream ──► [TT-SAM Engine] ──► Real-Time Seismic Alert Packet (UDP/JSON)       │
│                                    (Chen et al., 2026)  (t = 3-13s post P-wave, PGV, CWA Intensity)   │
│                                                                      │                                 │
│                                                                      ▼                                 │
│                                                       [Fast Triage Ingestion Service]                  │
│                                                                      │                                 │
│                                              ┌───────────────────────┴───────────────────────┐         │
│                                              ▼                                               ▼         │
│                                    [Spatial Proximity Engine]                      [cuVS Hybrid Query] │
│                                    (Fault Segment Distance)                        (Fragility Matrix)  │
│                                              │                                               │         │
│                                              └───────────────────────┬───────────────────────┘         │
│                                                                      ▼                                 │
│                                                        [Context Assembly Buffer]                       │
│                                                                      │                                 │
│                                                                      ▼                                 │
│                                                     [Llama-Nemotron Super 49B]                         │
│                                                     (TensorRT-LLM Optimized Engine)                    │
│                                                                      │                                 │
│                                                                      ▼                                 │
│                                                      [NVIDIA NeMo Guardrails]                          │
│                                                      • Numerical Entity Verifier                       │
│                                                      • Hallucination Blocker (0.0% target)             │
│                                                      • SOP Schema Validator                            │
│                                                                      │                                 │
│                                              ┌───────────────────────┴───────────────────────┐         │
│                                              ▼                                               ▼         │
│                                  [Automated SCADA Directive]                     [Emergency Triage UI] │
│                                  (Gas Cutoff, Elevator Halt)                     (Campus Evacuation)   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Ingestion Flow (Offline / Background)
1. **Document & Table Parsing:** `TEM PSHA2025-draft.pdf` is parsed using **NVIDIA Nemotron Parse**, extracting scientific sections, GMPE equations, logic tree branches, and tabular listings.
2. **Structured Geotechnical Serialization:** `Fault Parameters_update.xlsx` (38 active seismogenic faults) and `Fault Alignments.xlsx` are indexed into structured domain models (`FaultParameter` and `FaultAlignment`).
3. **GPU-Accelerated Indexing:** Text chunks, structured tables, and fault metadata are embedded and indexed into **NVIDIA cuVS** using CAGRA (CUDA Anisotropic Graph) indexing for microsecond similarity search.

### 4.2 Triage Flow (Online / Real-Time $\le 2\ \text{s}$)
1. **Alert Reception:** The system receives an early warning payload from **TT-SAM** (predicted PGV, CWA seismic intensity, epicenter estimate, event timestamp).
2. **Deterministic Pre-Filtering:** The Spatial Proximity Engine calculates distance from the affected area (e.g., NCU campus at $24.968^\circ\text{N}, 121.194^\circ\text{E}$) to adjacent active faults (Shanchiao Fault ID 1, Shuanglienpo Structure ID 2, Yangmei Structure ID 3, Hukou Fault ID 4).
3. **Agentic Synthesis:** **Llama-Nemotron Super 49B** executes chain-of-thought evaluation:
   - Matches predicted PGV against building vulnerability thresholds (pre-1999 vs. post-1999 building codes).
   - Evaluates secondary risks (liquefaction in alluvial basins, ground failure near fault rupture).
4. **Guardrail Check:** **NVIDIA NeMo Guardrails** verifies that all quoted numbers strictly match ground truth tables before JSON serialization.
5. **Dispatch:** Emits automated machine control signals (SCADA) and human-readable triage dashboards.

---

## 5. Technical Stack & Hardware Specifications

| Layer | Technology | Rationale & Specifications |
| :--- | :--- | :--- |
| **Parsing & OCR** | **NVIDIA Nemotron Parse** | High-fidelity extraction of multi-column geophysical literature, mathematical GMPE notation, and complex tables. |
| **Vector Index** | **NVIDIA cuVS (CAGRA / IVF-PQ)** | Sub-millisecond GPU-accelerated nearest-neighbor vector search directly on VRAM. |
| **Embedding Model** | **NV-Embed-v2 / BGE-M3** | Dense vector representations with strong support for scientific domain terminology and multilingual query alignment. |
| **Reasoning LLM** | **Llama-Nemotron Super 49B** | High-precision agentic reasoning, chain-of-thought reflection, and concise technical summarization. |
| **Inference Serving** | **NVIDIA TensorRT-LLM** | FP8 / INT4 quantized serving delivering sub-2-second end-to-end response times under high-concurrency alert surges. |
| **Safety Guardrails**| **NVIDIA NeMo Guardrails** | Deterministic Colang-based rule enforcement preventing numerical hallucination and enforcing strict JSON schemas. |
| **EEW Integration** | **TT-SAM Engine (Chen et al., 2026)** | 3–13s P-wave rolling transformer predicting PGV and CWA Intensity with 9.43 ms inference latency. |
| **Execution Runtime** | **NVIDIA DGX / RTX 6000 Ada** | Enterprise-grade compute node ensuring high-bandwidth GPU memory and reliability during critical emergencies. |

---

## 6. Domain Data Assets & Schema Specifications

The system ingests and processes the following assets from `data/raw/`:

### 6.1 Fault Parameters (`Fault Parameters_update.xlsx`)
Encompasses 38 on-land seismogenic structures in Taiwan.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FaultParameter",
  "type": "object",
  "properties": {
    "id": { "type": "integer", "description": "Fault identification number (1-38)" },
    "name": { "type": "string", "description": "Standard geological name of fault structure" },
    "type": { "type": "string", "enum": ["N", "R", "S"], "description": "Faulting mechanism: Normal, Reverse, Strike-slip" },
    "rake": { "type": "number", "description": "Rake angle in degrees (-180 to 180)" },
    "dip": { "type": "number", "description": "Dip angle in degrees (0 to 90)" },
    "depth_max": { "type": "number", "description": "Maximum seismogenic locking depth in km" },
    "mw_max": { "type": "number", "description": "Maximum credible earthquake moment magnitude" },
    "slip_rate": { "type": "number", "description": "Long-term slip rate in mm/year" }
  },
  "required": ["id", "name", "type", "rake", "dip", "depth_max", "mw_max", "slip_rate"]
}
```

*Key Local Structures near NCU Campus:*
- **ID 1 (Shanchiao Fault):** Type N, Rake $-90^\circ$, Dip $60^\circ$, Depth Max $13.76\ \text{km}$, $M_w\ \text{Max} = 7.0$, Slip rate $1.85\ \text{mm/yr}$.
- **ID 2 (Shuanglienpo Structure):** Type R, Rake $90^\circ$, Dip $45^\circ$, Depth Max $5.0\ \text{km}$, $M_w\ \text{Max} = 6.2$, Slip rate $0.25\ \text{mm/yr}$.
- **ID 3 (Yangmei Structure):** Type R, Rake $90^\circ$, Dip $60^\circ$, Depth Max $3.0\ \text{km}$, $M_w\ \text{Max} = 6.0$, Slip rate $0.38\ \text{mm/yr}$.
- **ID 4 (Hukou Fault):** Type R, Rake $90^\circ$, Dip $30^\circ$, Depth Max $10.0\ \text{km}$, $M_w\ \text{Max} = 6.8$, Slip rate $1.16\ \text{mm/yr}$.

### 6.2 TT-SAM Real-Time Alert Packet
Alert payload broadcast by TT-SAM inference engine within 3–13 s of P-wave trigger:

```json
{
  "alert_id": "TTSAM-20260909-152000-E01",
  "timestamp_utc": "2026-09-09T07:20:00.000Z",
  "p_wave_trigger_elapsed_sec": 3.5,
  "epicenter": {
    "estimated_latitude": 24.15,
    "estimated_longitude": 120.85,
    "estimated_depth_km": 12.0
  },
  "predicted_magnitude": 6.7,
  "station_predictions": [
    {
      "station_id": "NCU_01",
      "latitude": 24.968,
      "longitude": 121.194,
      "pred_pgv_cm_s": 28.4,
      "cwa_intensity_level": "5-Strong",
      "estimated_s_arrival_sec": 7.8
    }
  ]
}
```

### 6.3 Emergency Facility Triage Output
Structured directive consumed by campus safety officers and SCADA systems:

```json
{
  "triage_id": "TRG-20260909-001",
  "alert_reference": "TTSAM-20260909-152000-E01",
  "response_timestamp": "2026-09-09T07:20:01.420Z",
  "elapsed_processing_sec": 1.42,
  "facility_assessment": {
    "facility_name": "NCU Science Building 4",
    "structural_code_era": "Pre-1999 (High Vulnerability)",
    "predicted_pgv_cm_s": 28.4,
    "cwa_intensity": "5-Strong",
    "triage_level": "RED_CRITICAL",
    "collapse_probability": 0.38,
    "seconds_to_s_wave": 6.38
  },
  "automated_scada_actions": [
    { "target": "ELEVATORS_ALL", "action": "HALT_AT_NEAREST_FLOOR_DOORS_OPEN", "urgency": "IMMEDIATE" },
    { "target": "MAIN_GAS_VALVE_B4", "action": "EMERGENCY_SHUTOFF", "urgency": "IMMEDIATE" },
    { "target": "CLEANROOM_VENTILATION", "action": "HALT_TOXIC_GAS_CONDUITS", "urgency": "IMMEDIATE" }
  ],
  "evacuation_instructions": "Pre-1999 structural frame exceeding design PGA/PGV threshold. Drop, Cover, Hold On immediately. Evacuate to outdoor athletic field upon shaking cessation.",
  "grounded_sources": [
    "TEM PSHA2025: Section 4.2 Fault ID 2 (Shuanglienpo)",
    "TT-SAM Waveform Prediction: NCU_01 Station PGV 28.4 cm/s",
    "NCU Emergency Disaster Response Protocol v3.1"
  ]
}
```

---

## 7. Triage Decision Engine & Fragility Modeling

### 7.1 CWA Seismic Intensity & PGV Calibration
Calibrated against Central Weather Administration (Taiwan) official standard (2020 revision) utilized in TT-SAM:

| CWA Intensity Level | PGV Range ($\text{cm/s}$) | Ground Shaking Description | Human Perception & Impact |
| :--- | :--- | :--- | :--- |
| **0 - Micro** | $< 0.2$ | Imperceptible | Felt only by seismographs. |
| **1 - Very Minor** | $0.2 - 0.7$ | Extremely Weak | Felt only by sensitive individuals at rest. |
| **2 - Minor** | $0.7 - 1.9$ | Weak | Hanging lights swing slightly. |
| **3 - Light** | $1.9 - 5.7$ | Moderate | Windows and dishes rattle. |
| **4 - Moderate** | $5.7 - 15.0$ | Rather Strong | Heavy furniture moves; people frightened. |
| **5-Weak (5弱)** | $15.0 - 30.0$ | Strong | Wall cracks appear in unreinforced buildings. |
| **5-Strong (5強)** | $30.0 - 50.0$ | Very Strong | Heavy furniture topples; unreinforced masonry collapses. |
| **6-Weak (6弱)** | $50.0 - 80.0$ | Severe | Severe damage to vulnerable structures; difficulty standing. |
| **6-Strong (6強)** | $80.0 - 140.0$ | Extremely Severe | Severe destruction; ground fissures appear. |
| **7 - Great** | $\ge 140.0$ | Catastrophic | Structural collapse widespread; major ground displacement. |

### 7.2 Structural Vulnerability Logic Tree
1. **Pre-1999 Buildings (Constructed prior to Chi-Chi earthquake seismic code revision):**
   - Threshold $\text{PGV} \ge 25.0\ \text{cm/s}$ or $\text{CWA Intensity} \ge \text{5-Weak} \rightarrow$ **RED_CRITICAL Triage**. High risk of soft-story shear collapse.
2. **Post-1999 / Post-2005 Buildings (Modern ductile moment-resisting frames):**
   - Threshold $\text{PGV} \ge 50.0\ \text{cm/s}$ or $\text{CWA Intensity} \ge \text{6-Weak} \rightarrow$ **RED_CRITICAL Triage**.
   - Threshold $25.0 \le \text{PGV} < 50.0\ \text{cm/s} \rightarrow$ **AMBER_WARNING Triage**. Architectural damage likely, structural collapse low.
3. **Automated Cutoff Thresholds:**
   - Any predicted $\text{PGV} \ge 15.0\ \text{cm/s}$ ($\text{Intensity} \ge 5\text{-Weak}$) at facility site triggers instantaneous gas valve and elevator interlock before S-wave arrival.

---

## 8. Safety, NeMo Guardrails & Hallucination Defense

During a high-stakes seismic emergency, inaccurate information can result in loss of life. SeismoAgent-TW guarantees **0.0% numerical hallucination** through a three-stage guardrail pipeline:

```text
[Generated Response Candidate]
              │
              ▼
  [NeMo Colang Flow Engine]
              │
              ├─► 1. Entity Extraction: Identify all numerical values (PGV, Dip, Depth, Mw, Lat/Lon)
              │
              ├─► 2. Deterministic Catalog Match: Verify against SQLite / InMemory Fault Table
              │      • If value matches catalog within $\pm 0.001 \rightarrow$ Pass
              │      • If value contradicts catalog $\rightarrow$ Trigger Self-Correction Loop
              │
              ├─► 3. Structural SOP Alignment: Verify that suggested evacuation path
              │      matches registered building emergency exit blueprints
              │
              ▼
  [Validated JSON Output]
```

### 8.1 Verification Rules in NeMo Guardrails
* **Rule NUM-01:** Any statement asserting fault slip rate, dip angle, rake, or maximum magnitude must originate verbatim from `Fault Parameters_update.xlsx` or `TEM PSHA2025`.
* **Rule SEC-02:** If the S-wave arrival countdown is $\le 3\ \text{seconds}$, the agent drops detailed prose reasoning and outputs an abbreviated ultra-low-latency machine execution command packet.

---

## 9. Implementation Phases & Roadmap

```text
2026
Q3 (Weeks 1-4)       Q3/Q4 (Weeks 5-8)          Q4 (Weeks 9-12)            Q1 2027
┌──────────────────┐ ┌────────────────────────┐ ┌────────────────────────┐ ┌───────────────────┐
│ Phase 1: Ingest  │ │ Phase 2: TT-SAM Stream │ │ Phase 3: Agentic Triage│ │ Phase 4: Campus   │
│ • Nemotron Parse │ │ • UDP Listener         │ │ • TensorRT-LLM 49B     │ │   Digital Twin    │
│ • cuVS Indexing  │ │ • Rolling Update Sync  │ │ • NeMo Guardrails      │ │ • SCADA Pilot     │
│ • Schema Specs   │ │ • Spatial Filter       │ │ • Sub-2s Latency Test  │ │ • Field Drill     │
└──────────────────┘ └────────────────────────┘ └────────────────────────┘ └───────────────────┘
```

* **Phase 1: Ingestion & Vector Indexing (Weeks 1–4):** Parse `TEM PSHA2025-draft.pdf`, fault parameters, and fault alignments into `cuVS` GPU vector database.
* **Phase 2: TT-SAM Early Warning Ingestion (Weeks 5–8):** Establish streaming bridge with NCU TT-SAM model; integrate multi-station waveform alerts and rolling update triggers.
* **Phase 3: Agentic Reasoning & Guardrails (Weeks 9–12):** Deploy **Llama-Nemotron Super 49B** with TensorRT-LLM; calibrate NeMo Guardrails against Taiwan CWA intensity tables.
* **Phase 4: Pilot Deployment & SCADA Validation (Weeks 13–16):** Live integration on NCU campus infrastructure; bench-testing automated elevator and utility shutdown under simulated $M_w\ 7.0$ Shanchiao and Hukou rupture scenarios.

---

## 10. References & Scientific Citations

1. **Chen, Y.-H., Chan, C.-H., Chang, C.-C., & Ma, K.-F. (2026).** *A Deep Learning Framework for Peak Ground Velocity Prediction Using Multi-Station Velocity Waveforms: The Taiwan Transformer Shaking Alert Model (TT-SAM).* Journal of Geophysical Research: Machine Learning and Computation.
2. **Gao, J.-C., Kao, J.-C., Chan, C.-H., Chuang, R. Y., Chen, C.-H., Shyu, J. B. H., Ching, K.-E., Wang, Y., & Ma, K.-F. (2026).** *Probabilistic Seismic Hazard Assessment for Taiwan: Updates and Improvements in TEM PSHA2025.* Earthquake-Disaster & Risk Evaluation and Management (E-DREaM) Center, National Central University.
3. **Taiwan Earthquake Model (TEM) Working Group.** *Active Fault Parameters & Alignment Database (38 Seismogenic Structures).* E-DREaM Center, NCU.
4. **Central Weather Administration (CWA), Taiwan.** *Seismic Intensity Scale Revision Guidelines (2020).*
5. **NVIDIA Corporation.** *NVIDIA AI Enterprise Stack: NeMo Framework, cuVS Vector Search Library, Nemotron Parse, and TensorRT-LLM Documentation.*
