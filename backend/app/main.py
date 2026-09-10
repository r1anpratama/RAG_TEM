"""Main FastAPI Application Server for Decoupled RAG Backend."""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.api.routers import chat_router, document_router, health_router

app = FastAPI(
    title="RAG Platform API",
    description="Decoupled Backend with SSE Token Streaming, Vector DB, and Document Ingestion",
    version="1.0.0",
)

# 1. CORS Middleware (Origin strictly restricted to Next.js Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 2. In-Memory Rate Limiting (Token Bucket per IP) to prevent bot abuse
_request_counts: Dict[str, List[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    """Simple, zero-bloat sliding-window rate limiter per client IP."""
    # Exclude health checks from rate limiting
    if request.url.path == "/api/health":
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = 60.0  # 1 minute

    # Remove timestamps older than 60s
    _request_counts[client_ip] = [t for t in _request_counts[client_ip] if now - t < window]

    if len(_request_counts[client_ip]) >= settings.rate_limit_per_minute:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": f"Rate limit exceeded. Maximum {settings.rate_limit_per_minute} requests per minute allowed.",
            },
        )

    _request_counts[client_ip].append(now)
    response = await call_next(request)
    return response


# 3. Mount Routers
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(document_router)


@app.get("/")
async def root():
    return {
        "message": "RAG Platform API is active.",
        "docs_url": "/docs",
        "chat_endpoint": "/api/chat",
        "upload_endpoint": "/api/upload",
    }


if __name__ == "__main__":
    import uvicorn
    print(f"\nStarting RAG Backend Server on http://{settings.host}:{settings.port} ...\n")
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=False)
