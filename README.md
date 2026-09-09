# RAG_TEM

> **Retrieval-Augmented Generation for Taiwan Earthquake Model (TEM) & Probabilistic Seismic Hazard Assessment (PSHA)**

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Architecture](https://img.shields.io/badge/architecture-Clean%20%2F%20Modular-green.svg)]()
[![Code Style](https://img.shields.io/badge/code%20style-Ponytail%20Ladder-orange.svg)](https://github.com/DietrichGebert/ponytail)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Overview

**RAG_TEM** is a domain-specialized Retrieval-Augmented Generation system engineered for geophysical research, active fault characterization, and probabilistic seismic hazard models in Taiwan.

The platform integrates:
- **Taiwan Earthquake Model (TEM)** hazard drafts and parameters.
- **Active Fault Alignments & Parameters**: Geometric parameters, locking depths, slip rates, and characteristic magnitudes.
- **Deep Learning Ground Motion Frameworks**: Predictive machine learning models for peak ground acceleration (PGA) and velocity (PGV).
- **Obsidian Second Brain**: Fully structured internal knowledge graph mapping literature, system designs, and engineering workflows.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       Data Sources                          │
│  • TEM PSHA 2025 Draft (PDF)                                │
│  • Fault Alignments & Parameters (Excel / Tables)           │
│  • Ground Motion ML Studies (JGR 2026)                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ingestion & Indexing                     │
│  • Structure-aware chunking (Fault records, sections)       │
│  • Hybrid indexing (Dense embeddings + Lexical BM25)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Retrieval & Reranking                   │
│  • Fault-specific query routing                             │
│  • Reciprocal rank fusion with domain context               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Grounded Generation                     │
│  • Grounded citations with zero unverified extrapolation    │
│  • Domain verification & parameter consistency checks       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Layout

```text
RAG_TEM/
├── .agents/                    # Agent guidelines & Ponytail skills
│   ├── rules/                  # Ponytail clean code & project operating rules
│   └── skills/                 # Ponytail analysis & review skills
├── 00_Index/                   # Obsidian Second Brain: MOC & Dashboards
├── 01_Workflows/               # Obsidian Second Brain: Daily logs & execution runs
├── 02_Architecture/            # Obsidian Second Brain: System designs & schemas
├── 03_Literature_and_Domain/   # Obsidian Second Brain: Research & dataset summaries
├── 04_Decisions_ADR/           # Obsidian Second Brain: Architectural Decision Records
├── data/
│   ├── raw/                    # Raw fault catalogs, spreadsheets & PDF publications
│   └── processed/              # Processed chunks and generated indexes
├── src/
│   ├── domain/                 # Domain entities (Faults, Hazard Models, Seismic Events)
│   ├── pipelines/              # Ingestion, chunking, retrieval & generation pipelines
│   ├── utils/                  # Minimal helpers following Ponytail rules
│   └── config.py               # Central project path and configuration definitions
├── tests/                      # Verification checks & test suites
├── .gitignore                  # Git exclusion rules
├── AGENTS.md                   # AI Agent operating principles and Ponytail ladder
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
- Python 3.10 or higher
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/r1anpratama/RAG_TEM.git
cd RAG_TEM

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run Self-Checks
```bash
python -m tests.test_config
```

---

## 📜 Development Guidelines & Principles

- **Ponytail Clean Code Ladder**: Favor standard library solutions, keep code minimal and robust, avoid unnecessary dependencies or premature abstractions.
- **English Standard**: All code, docstrings, commit messages, and technical notes are maintained strictly in English.
- **Git Hygiene**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
