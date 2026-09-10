# SeismoAgent-TW Frontend (Next.js App Router)

Modern, decoupled ChatGPT-style RAG user interface built with Next.js 14/15, React, Tailwind CSS, Lucide Icons, and Zod.

## Features

- **Server-Sent Events (SSE) Streaming**: Real-time token-by-token rendering with a blinking cursor and stop-generation support.
- **XSS Protection**: Secure markdown rendering via `react-markdown` + `rehype-sanitize` to neutralize malicious scripts injected into documents.
- **Client-Side Zod Validation**: Validates user prompts and parameters prior to network transmission.
- **Grounding Citations**: Interactive cards displaying source documents, snippets, and similarity confidence scores.
- **Document Management**: Drag-and-drop file upload modal for PDF/TXT ingestion with size limit checks.
- **Zero Exposed AI Keys**: The frontend connects solely to the FastAPI backend via `NEXT_PUBLIC_API_URL`. All LLM keys stay in `backend/.env`.

---

## Setup & Running

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Ensure `NEXT_PUBLIC_API_URL` points to your running FastAPI backend (e.g. `http://localhost:8000`).

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
