"""Pydantic schemas for chat requests, streaming responses, and citations."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """An individual message in the chat conversation."""
    role: str = Field(..., description="Role of the sender: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    """Payload for submitting a chat prompt to the RAG pipeline."""
    query: str = Field(..., min_length=1, max_length=4000, description="User question or prompt")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Prior conversation context")
    stream: bool = Field(default=True, description="Whether to stream response via Server-Sent Events (SSE)")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of document chunks to retrieve")


class SourceCitation(BaseModel):
    """Metadata regarding retrieved grounding document chunks."""
    document_name: str
    page_or_section: str
    snippet: str
    score: float


class StreamChunk(BaseModel):
    """Individual Server-Sent Event data packet."""
    event: str = Field(default="token", description="'token', 'citations', 'done', or 'error'")
    token: Optional[str] = None
    citations: Optional[List[SourceCitation]] = None
    error: Optional[str] = None


class ChatResponse(BaseModel):
    """Complete non-streaming response object."""
    query: str
    answer: str
    citations: List[SourceCitation]
    latency_ms: float
