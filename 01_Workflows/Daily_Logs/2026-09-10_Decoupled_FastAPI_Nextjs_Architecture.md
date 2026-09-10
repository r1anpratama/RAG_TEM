# Engineering Daily Log: Decoupled RAG Architecture Implementation

- **Date:** 2026-09-10
- **Author:** Antigravity / SeismoAgent-TW Team
- **Milestone:** Decoupled WebApp Architecture (FastAPI Backend + Next.js App Router Frontend)

---

## 1. Objectives Achieved

1. **Backend Decoupling (`backend/`)**:
   - Built a modular FastAPI backend with Server-Sent Events (SSE) streaming at `POST /api/chat`.
   - Engineered `POST /api/upload` endpoint with file extension enforcement (`.pdf`, `.txt`) and 10 MB payload restrictions.
   - Isolated all credentials in `backend/.env` with strict `backend/.env.example` templates.
   - Built sliding-window rate limiting middleware per client IP to safeguard against bot flooding (HTTP 429).
   - Created `backend/tests/test_backend_api.py` with 100% pass rate (6/6 tests).

2. **Frontend Decoupling (`frontend/`)**:
   - Built a modern Next.js 14 App Router client with Tailwind CSS and Dark theme Shadcn design tokens.
   - Implemented ChatGPT-style layout: left collapsible sidebar with document management and live server health indicator, central chat area, and bottom floating prompt input.
   - Implemented `useRagStream` hook using native `fetch` + `TextDecoder` to parse streaming SSE tokens and handle cancellation via `AbortController`.
   - Implemented XSS defense: all text and markdown rendered via `react-markdown` + `rehype-sanitize`.
   - Implemented client-side Zod validation on user prompt submissions.

3. **Obsidian Second Brain Documentation**:
   - Documented full architectural specification in `02_Architecture/Decoupled_FastAPI_Nextjs_RAG.md`.
   - Updated dashboard and index.

---

## 2. Test Verification

- Backend tests: `pytest backend/tests/` -> 6 passed.
- Core pipeline tests: `pytest tests/` -> 20 passed.
- Total passing tests: 26.
