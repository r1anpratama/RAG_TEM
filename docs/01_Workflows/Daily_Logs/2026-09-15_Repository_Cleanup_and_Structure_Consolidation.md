---
title: Repository Cleanup and Structure Consolidation
date: 2026-09-15
author: Antigravity
status: completed
tags:
  - refactor
  - repository-governance
  - second-brain
  - clean-code
---

# Repository Cleanup & Folder Structure Consolidation

## 1. Context & Motivation
As the project evolved with multimodal RAG, Leaflet GIS mapping, and live cloud deployment, redundant directories and duplicate files accumulated at the root level:
- Multiple root documentation folders (`00_Index/`, `01_Workflows/`, `02_Architecture/`, `03_Literature_and_Domain/`, `04_Decisions_ADR/`) cluttered the repository top-level.
- Duplicate data files existed across `assets/` and `data/raw/` (`Fault Alignments.xlsx`, `Fault Parameters_update.xlsx`, and research PDFs).
- A loose image `data/fig13_full.png` and large binary `TSMIP_...hdf5` were placed in `assets/`.
- Duplicate PRD document `docs/PRD_SeismoAgent_TW.md` duplicated `02_Architecture/PRD_SeismoAgent_TW.md`.
- Isolated `.licenses/` folder held a single text file.

## 2. Actions Taken
1. **Protected Production Frontend (`website/`)**:
   - The entire `website/` directory remained 100% untouched to ensure continuous deployment stability with Vercel.
2. **Consolidated Second Brain into `docs/`**:
   - Moved `00_Index/`, `01_Workflows/`, `02_Architecture/`, `03_Literature_Domain/`, and `04_Decisions_ADR/` under `docs/`.
   - Copied `.obsidian` configurations into `docs/.obsidian/` so `docs/` can be opened directly as an independent Obsidian Vault.
   - Preserved all internal wikilinks (`[[...]]`).
3. **Data Asset Unification**:
   - Moved `Coordinates-area_source.txt` into `data/raw/`.
   - Moved `TSMIP_1999_2019_Vs30_integral.hdf5` into `data/raw/`.
   - Moved `data/fig13_full.png` into `data/raw/fig13_full.png`.
   - Removed redundant root `assets/` directory.
   - Updated `src/config.py` and `src/domain/area_source.py` to point `DEFAULT_AREA_SOURCE_PATH` to `data/raw/Coordinates-area_source.txt`.
   - Updated `scripts/generate_hazard_tiles.py` to reference `data/raw/fig13_full.png`.
4. **License Cleanup**:
   - Moved `.licenses/literature_search_arxiv_LICENSE.txt` to `docs/licenses/` and removed `.licenses/`.
5. **Governance Documentation**:
   - Updated `AGENTS.md`, `README.md`, and `docs/00_Index/Principles_and_Rules.md` to establish the new 5-folder clean hierarchy.

## 3. Resulting Top-Level Hierarchy
The root now contains only 5 visible, standard directories:
- `data/` (raw datasets, processed scenario HDF5s, literature datasets)
- `docs/` (unified Obsidian second brain, architecture, and live QR asset)
- `scripts/` (developer utility scripts)
- `src/` (core Python library)
- `tests/` (Python test suite)
- `website/` (Next.js 16 frontend & Edge API)
- `.agents/` (Antigravity agent skills)

## 4. Verification
- `python -m pytest tests/`: 32/32 tests passing.
- `python -m pytest website/backend/tests/`: 19/19 tests passing.
- Zero untracked or dangling files.
