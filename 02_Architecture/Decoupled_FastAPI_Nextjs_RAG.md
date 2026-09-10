# Decoupled RAG Architecture (FastAPI Backend + Next.js App Router Frontend)

- **Date:** 2026-09-10
- **Status:** Implemented, Consolidated into `website/` & Verified
- **Components:** `website/backend/` (FastAPI + Pydantic + In-Memory Vector DB / Pluggable Chroma/Qdrant), `website/frontend/` (Next.js 14 App Router + Tailwind CSS + Lucide + Zod), and `website/classic/` (Geospatial & GeoGraph dashboard)
- **Author:** Antigravity / SeismoAgent-TW Team

---

## 1. Architectural Philosophy & Decoupled Design

To guarantee enterprise scalability, publication-grade security, and an ergonomic user experience, the RAG platform is divided into two autonomous layers:

```mermaid
graph LR
    subgraph Client ["Frontend (website/frontend/ - Next.js 14 App Router)"]
        UI["ChatGPT-style UI<br/>(Message Bubble, Input, Sidebar)"]
        StreamHook["useRagStream Hook<br/>(TextDecoder SSE Reader)"]
        XSS["react-markdown + rehype-sanitize"]
        ZodVal["Client Zod Schema Validation"]
    end

    subgraph Server ["Backend (website/backend/ - FastAPI Python)"]
        CORS["CORS Middleware<br/>(Restricted to localhost:3000)"]
        RateLimiter["Sliding Window Rate Limiter<br/>(IP-based, 429 Too Many Requests)"]
        ChatRouter["/api/chat<br/>StreamingResponse(text/event-stream)"]
        DocRouter["/api/upload<br/>PDF/TXT Validation & Chunking"]
        RAGEngine["RAG Orchestrator<br/>(Semantic Retrieval & Citations)"]
        VectorStore["Vector Store<br/>(InMemory / Chroma / Qdrant)"]
    end

    UI --> ZodVal --> StreamHook
    StreamHook -->|POST /api/chat (SSE Stream)| CORS
    CORS --> RateLimiter --> ChatRouter --> RAGEngine --> VectorStore
    RAGEngine -->|yield data: token| ChatRouter --> StreamHook --> XSS --> UI
    UI -->|POST /api/upload| DocRouter --> VectorStore
```

---

## 2. Backend Specification (`website/backend/`)

### 2.1 File & Directory Layout
```
website/backend/
├── app/
│   ├── api/
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py         # POST /api/chat (SSE token-by-token streaming)
│   │   │   ├── document.py     # POST /api/upload (PDF/TXT extraction & indexing)
│   │   │   └── health.py       # GET /api/health (service & vector status)
│   │   └── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py           # Central Settings from .env
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── engine.py           # Async token generator & RAG pipeline
│   │   └── vector_store.py     # BaseVectorStore & InMemoryVectorStore
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── chat.py             # ChatRequest, SourceCitation, StreamChunk
│   │   └── document.py         # UploadResponse, DocumentMetadata
│   ├── __init__.py
│   └── main.py                 # FastAPI application factory, CORS, Rate Limiter
├── tests/
│   ├── __init__.py
│   └── test_backend_api.py     # 6 automated tests for SSE, uploads, & rate limits
├── .env.example
└── requirements.txt
```

### 2.2 Security & Isolation
1. **Zero Key Leakage**: All OpenAI, Anthropic, or Vector DB API keys reside exclusively in `backend/.env`.
2. **Strict CORS**: `CORSMiddleware` restricts cross-origin resource sharing to `http://localhost:3000` (or domains specified in `CORS_ORIGINS`).
3. **Sliding-Window Rate Limiting**: Built-in per-client IP sliding window throttle preventing bot flooding and DoS attacks (returns HTTP 429 when exceeded).
4. **File Validation**:
   - Only `.pdf` and `.txt` extensions permitted.
   - 10 MB strict payload limit enforced before chunking.
   - Text extracted using `pypdf` with boundary guards.

---

## 3. Frontend Specification (`website/frontend/`)

### 3.1 File & Directory Layout
```
website/frontend/
├── src/
│   ├── app/
│   │   ├── globals.css         # Dark theme Shadcn/Tailwind design tokens
│   │   ├── layout.tsx          # Root HTML / Viewport layout
│   │   └── page.tsx            # Main ChatGPT-style layout orchestrator
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chat-container.tsx   # Message list & starter suggestion cards
│   │   │   ├── chat-input.tsx       # Bottom auto-expanding input bar with stop button
│   │   │   └── message-bubble.tsx   # Sanitized react-markdown & citation accordions
│   │   ├── sidebar/
│   │   │   └── sidebar.tsx          # Collapsible navigation, documents list, health badge
│   │   └── upload/
│   │       └── upload-modal.tsx     # Drag-and-drop document upload dialog
│   ├── hooks/
│   │   └── use-rag-stream.ts        # SSE reader hook with TextDecoder & AbortController
│   ├── lib/
│   │   ├── api.ts                   # Backend API caller functions
│   │   ├── utils.ts                 # Class merger (clsx + tailwind-merge) & byte formatters
│   │   └── validators.ts            # Client-side Zod validation schemas
│   └── types/
│       └── chat.ts                  # Strong TypeScript interfaces
├── .env.example
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### 3.2 XSS Defense & Streaming
- **Sanitized Markdown**: All document quotes and LLM outputs are processed through `react-markdown` with `rehype-sanitize`. Malicious HTML tags (`<script>`, `<iframe>`, `onerror=`) are stripped at the AST level.
- **Client-Side Zod Validation**: Queries are validated against `chatInputSchema` before making any network requests.
- **Server-Sent Events Consumption**: The `useRagStream` hook handles partial JSON stream packets, maintains message state, updates tokens in place, and supports instantaneous generation cancellation (`AbortController`).

---

## 4. Verification & Testing

- Automated tests in `backend/tests/test_backend_api.py` verify:
  1. `/api/health` response and vector store status.
  2. `/api/chat` SSE streaming headers (`text/event-stream`) and event lifecycle.
  3. Rejection of unapproved file formats (`.sh`).
  4. Successful ingestion and indexing of `.txt` documents.
  5. List retrieval at `/api/documents`.
  6. Rate limiting enforcement (HTTP 429).
