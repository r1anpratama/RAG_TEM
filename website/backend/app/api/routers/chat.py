"""Chat endpoint streaming tokens via Server-Sent Events (SSE)."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

try:
    from ...rag.engine import RAGEngine
    from ...schemas.chat import ChatRequest
except (ImportError, ValueError):
    try:
        from app.rag.engine import RAGEngine
        from app.schemas.chat import ChatRequest
    except ImportError:
        from website.backend.app.rag.engine import RAGEngine
        from website.backend.app.schemas.chat import ChatRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Chat"])
_engine = RAGEngine()


@router.post("/chat", summary="Stream RAG tokens via SSE")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    """Submit a query and receive a real-time token-by-token response via Server-Sent Events."""
    if not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Query string cannot be blank.",
        )

    # Return StreamingResponse with SSE headers
    return StreamingResponse(
        _engine.stream_query(
            query=request.query,
            history=request.history,
            top_k=request.top_k,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
        },
    )
