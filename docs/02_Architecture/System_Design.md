---
title: RAG_TEM System Design
created: 2026-09-09
type: architecture
tags:
  - architecture
  - rag
  - seismic
  - earthquake-model
---

# RAG_TEM System Design

## 1. System Objective
**RAG_TEM** (branded as **SeismoAgent-TW**) is a specialized Multimodal Agentic Retrieval-Augmented Generation system designed for the **Taiwan Earthquake Model (TEM)** and **Probabilistic Seismic Hazard Assessment (PSHA)** domain, with real-time early warning triage powered by TT-SAM and the NVIDIA AI Enterprise stack.

> [!IMPORTANT]
> The authoritative Product Requirements Document is documented in **[[PRD_SeismoAgent_TW|PRD: SeismoAgent-TW v1.0.0]]**.

---

## 2. High-Level Architecture

```text
[Raw Documents & Tables]
(TEM PSHA Draft, Fault Alignments.xlsx, Fault Parameters.xlsx)
                │
                ▼
      [Ingestion Pipeline]
   (PDF Parsing & Structured Table Parsing)
                │
                ▼
       [Semantic Chunking]
  (Document sections, fault records)
                │
                ▼
       [Embedding & Storage]
   (Vector Store & Hybrid Inverted Index)
                │
 ┌──────────────┴──────────────┐
 ▼                             ▼
[User Query] ────► [Hybrid Retriever] ────► [Reranker]
                                                   │
                                                   ▼
                                            [Context Assembly]
                                                   │
                                                   ▼
                                            [LLM Generation]
                                                   │
                                                   ▼
                                        [Seismic Grounded Answer]
```

---

## 3. Core Subsystems

### 3.1 Data Ingestion (`src/pipelines/ingestion.py`)
- Extracts text, tables, and formula references from seismic PDF reports.
- Ingests structured fault attributes (length, strike, dip, slip rate, magnitude) from Excel/CSV formats.

### 3.2 Domain Models (`src/domain/`)
- Pydantic or dataclass definitions representing:
  - `FaultParameter`: Physical attributes of active faults in Taiwan.
  - `SeismicRecord`: Historical and modeled seismic event records.
  - `DocumentChunk`: Text chunks with metadata, page numbers, and section headers.

### 3.3 Retrieval Engine (`src/pipelines/retrieval.py`)
- Hybrid retrieval combining dense vector similarity with sparse lexical matching (BM25) to accurately match specific fault identifiers and exact geological terms.

### 3.4 Generation & Synthesis (`src/pipelines/generation.py`)
- Formulates grounded prompts with source citations.
- Enforces strict adherence to TEM PSHA guidelines to avoid hallucinations.
