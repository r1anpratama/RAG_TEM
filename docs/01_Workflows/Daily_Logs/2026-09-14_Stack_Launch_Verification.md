---
title: "Stack Launch Verification: Backend, Classic API, and Next.js Frontend"
created: 2026-09-14
type: daily-log
tags:
  - operations
  - fastapi
  - nextjs
  - verification
---

# Daily Log: 2026-09-14 - Stack Launch Verification

## 1. Objective
Read the repository, then bring the full three-service stack up on the local
working copy (`D:\AGENT\RAG_TEM`) and prove it serves.

## 2. Preconditions Checked
| Item | Result |
|---|---|
| Working copy | `D:\AGENT\RAG_TEM`, `HEAD 2012cd3`, `main...origin/main` |
| Python | 3.13.5 with FastAPI 0.136.3, Uvicorn 0.48.0, Pydantic 2.10.3, pytest 8.3.4 |
| Optional deps | pandas 3.0.3, numpy 2.4.6, openpyxl 3.1.5, pypdf 6.11.0, scipy 1.15.3, httpx 0.28.1 |
| Node / npm | v26.6.0 / 11.18.0 |
| Frontend deps | `website/frontend/node_modules` present (Next.js 16.3.5) |
| Ports 3000 / 8000 / 8080 | free |
| Port 3080 | DeepSeek Harness Web GUI (pid 42352) - untouched |

Only pending uncommitted work is the already-documented Next.js 16 migration
(`package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`, `00_Index/Dashboard.md`).
No source change was required to launch.

## 3. Commands Run
```powershell
# Core engine + backend web test suite (root)
$env:PYTHONPATH=".;website/backend"; python -m pytest -q

# 1. Decoupled RAG backend
python -m uvicorn website.backend.app.main:app --host 127.0.0.1 --port 8000

# 2. Classic SeismoAgent GIS API
$env:PYTHONPATH="."; python -m uvicorn src.api.server:app --host 127.0.0.1 --port 8080

# 3. Next.js 16 Mission Control dashboard
cd website\frontend; npm run dev
```
`npm_config_user_agent` was pinned to an `npm/...` value for the frontend shell, the
same guard recorded in [[2026-09-14_Frontend_Next16_Local_Dev_Harness]], to stop Next.js
from selecting pnpm.

## 4. Verification
| Check | Result |
|---|---|
| `pytest` (root, `tests/` + `website/backend/tests/`) | **28 passed** in 34.55 s |
| `GET :8000/api/health` | 200 - `status: healthy`, 3 chunks / 2 documents indexed |
| `GET :8000/api/triage/scenarios` | 200 - scenario list, first is EQ 20122 Daxi-Guanxi (19.76 km to NCU) |
| `GET :8000/docs` | 200 |
| `GET :8080/docs` | 200 |
| `GET :3000/` | 200, 116,444 bytes, title `Prototype \| RAG Model Dashboard` |
| `GET :3000/dashboard` | 200, 118,589 bytes |
| Page markers | "Earthquake Early Warning", "RAG Architecture", "NCU" all present |
| Next.js | 16.3.5, Turbopack, `Ready in 321 ms` |
| `POST :8000/api/triage` | 200 - Track A `0.02 ms` (`ACTIVATED_CRITICAL_CUTOFF`), Track B `0.88 ms`, total `0.91 ms` |

The triage POST exercises the real dual-track path end to end: three instant SCADA
interlocks (elevator halt, main gas shutoff, cleanroom toxic conduit cutoff) plus the
deliberative facility triage list, matching the README latency claims.

## 5. Notes & Follow-Ups
1. The three services run as background jobs of this session; stopping the session stops them.
2. `README.md` and `00_Index/Dashboard.md` still reference a `website/classic/` directory that
   [[Decoupled_FastAPI_Nextjs_RAG]] records as purged. Harmless, but stale.
3. RAG runs in deterministic synthesis mode (`OPENAI_API_KEY` empty, `VECTOR_DB_TYPE=in_memory`),
   so copilot answers are grounded and offline by design.
