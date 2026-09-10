---
title: ADR 002 - Spatial-Graph-Agentic Architecture & Dual-Track Decision Engine
date: 2026-09-10
status: Accepted
type: adr
tags:
  - adr
  - architecture
  - graph-rag
  - multi-agent
---

# ADR 002: Spatial-Graph-Agentic Architecture & Dual-Track Decision Engine

## Context
Initial prototype testing demonstrated fast single-table retrieval and threshold checking (~1.5ms). However, real-world geotechnical decision-making and emergency triage require:
1. Multi-hop spatial and tectonic relationships (e.g., fault segment pairings from TEM PSHA2025 Table 2).
2. Physics-based validation against Ground Motion Prediction Equations (GMPEs).
3. Deliberative, structured reasoning to prioritize multi-facility triage and explain decisions transparently without numerical hallucinations.

A survey of recent literature on arXiv (arXiv:2609.06391, arXiv:2608.25986, arXiv:2608.25952, arXiv:2501.06932) highlights the superiority of Graph-Agentic RAG and Dual-Track Decision pipelines.

## Decision
We adopt the **Spatial-Graph-Agentic Architecture** with five primary pillars:
1. **Geo-GraphRAG**: Construct an in-memory spatial property graph connecting faults, multiple rupture pairings, GMPE logic branches, campus facilities, and lifeline infrastructure.
2. **Dual-Track Decision Flow**:
   - *Track A (Reflex Track, < 5 ms)*: Deterministic SCADA machine interlocks executed immediately upon TT-SAM alert.
   - *Track B (Deliberative Multi-Agent Track, 1.0 - 2.0 s)*: Multi-agent cooperative evaluation (*Seismic Analyst*, *Geotechnical Graph Worker*, *Structural Triage Worker*, *Safety Critic*).
3. **Physics-Informed Attenuation Validation**: Cross-reference TT-SAM PGV predictions against empirical GMPE bounds to detect anomalies.
4. **Safety Critic Verification**: Deterministic checking of all generated numerical statements against the knowledge graph to enforce a 0.0% hallucination rate.

## Consequences
- **Positive**: Transforms a simple prototype into an intelligent, state-of-the-art decision-support system worthy of publication and production deployment.
- **Negative**: Increases architectural complexity, requiring rigorous unit testing and graph serialization.
