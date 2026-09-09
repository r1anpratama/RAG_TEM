---
title: ADR 001 - Clean Architecture and Second Brain Framework
date: 2026-09-09
status: Accepted
type: adr
tags:
  - adr
  - architecture
  - clean-code
---

# ADR 001: Clean Architecture and Second Brain Framework

## Context
The RAG_TEM project requires robust domain knowledge management (geophysics, fault catalogs, PSHA methodologies) alongside clean, reproducible software engineering. A poorly organized codebase or scattered notes will quickly deteriorate project maintainability.

## Decision
1. **Adopt Obsidian as the Project Second Brain**:
   - Organize all knowledge hierarchically within the repository using numbered categories (`00_Index`, `01_Workflows`, `02_Architecture`, `03_Literature_and_Domain`, `04_Decisions_ADR`).
   - Keep internal Obsidian cache (`.obsidian/`) untracked in Git to prevent noise.
2. **Apply the Ponytail Clean Code Ladder**:
   - Favor standard libraries, built-in features, and clean one-liners where appropriate.
   - Forbid premature abstraction layers and unneeded third-party libraries.
   - Require small, runnable validation checks for non-trivial logic.
3. **Strict English Standardization**:
   - Standardize all technical assets (code, docs, commits) in English for universal compatibility.

## Consequences
- **Positive**: High clarity, minimal codebase footprint, transparent decision history, easy onboarding.
- **Negative**: Requires strict discipline to update Obsidian notes concurrently with code changes.
