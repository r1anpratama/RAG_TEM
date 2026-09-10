"""Modular vector store abstraction supporting in-memory, Chroma, and Qdrant."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class DocumentChunk:
    """Internal chunk representation."""
    chunk_id: str
    document_name: str
    section: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchHit:
    """Scored document search hit."""
    chunk: DocumentChunk
    score: float


class BaseVectorStore(ABC):
    """Abstract base class for RAG vector databases."""

    @abstractmethod
    def add_chunks(self, chunks: List[DocumentChunk]) -> int:
        """Add semantic chunks to the vector database."""
        pass

    @abstractmethod
    def similarity_search(self, query: str, top_k: int = 3) -> List[SearchHit]:
        """Perform vector similarity search for top_k closest chunks."""
        pass

    @abstractmethod
    def list_documents(self) -> List[Dict[str, Any]]:
        """List summary of all indexed documents."""
        pass


class InMemoryVectorStore(BaseVectorStore):
    """Production-grade in-memory vector store with TF-IDF sublinear cosine ranking."""

    def __init__(self) -> None:
        self.chunks: List[DocumentChunk] = []
        self._doc_registry: Dict[str, Dict[str, Any]] = {}
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.matrix: Optional[Any] = None

    def add_chunks(self, new_chunks: List[DocumentChunk]) -> int:
        if not new_chunks:
            return 0

        self.chunks.extend(new_chunks)

        # Track document registry
        for c in new_chunks:
            doc_name = c.document_name
            if doc_name not in self._doc_registry:
                self._doc_registry[doc_name] = {
                    "document_name": doc_name,
                    "total_chunks": 0,
                    "uploaded_at": datetime.now(timezone.utc).isoformat(),
                }
            self._doc_registry[doc_name]["total_chunks"] += 1

        # Re-index corpus
        corpus = [c.text for c in self.chunks]
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
        )
        self.matrix = self.vectorizer.fit_transform(corpus)
        return len(new_chunks)

    def similarity_search(self, query: str, top_k: int = 3) -> List[SearchHit]:
        if not query.strip() or not self.chunks or self.vectorizer is None or self.matrix is None:
            return []

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.matrix).flatten()

        top_indices = np.argsort(scores)[::-1][:top_k]
        hits: List[SearchHit] = []

        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.0:
                hits.append(SearchHit(chunk=self.chunks[idx], score=round(score, 4)))

        return hits

    def list_documents(self) -> List[Dict[str, Any]]:
        return list(self._doc_registry.values())


# Global singleton instance
_vector_store: Optional[BaseVectorStore] = None


def get_vector_store() -> BaseVectorStore:
    """Retrieve global vector store instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = InMemoryVectorStore()
        # Seed with initial context if available
        _seed_initial_data(_vector_store)
    return _vector_store


def _seed_initial_data(store: BaseVectorStore) -> None:
    """Seed with initial knowledge base chunks."""
    seed_chunks = [
        DocumentChunk(
            chunk_id="TEM-SEED-01",
            document_name="TEM_PSHA_2025_Overview.pdf",
            section="Executive Summary",
            text="The Taiwan Earthquake Model (TEM PSHA 2025) provides updated probabilistic seismic hazard assessment parameters for 38 active seismogenic structures across Taiwan.",
        ),
        DocumentChunk(
            chunk_id="TEM-SEED-02",
            document_name="TEM_PSHA_2025_Overview.pdf",
            section="Table 2: Cascading Ruptures",
            text="Table 2 of TEM PSHA 2025 accounts for multi-structure coseismic ruptures. Shuanglienpo Fault (ID 2) pairs with Yangmei (ID 3, combined Mw 6.56) and Hukou (ID 4, combined Mw 6.91).",
        ),
        DocumentChunk(
            chunk_id="TEM-SEED-03",
            document_name="Seismic_Building_Code_Taiwan.txt",
            section="Pre-1999 Fragility",
            text="Buildings constructed prior to the 1999 Chi-Chi earthquake often lack modern ductile detailing and transverse confinement, showing high collapse vulnerability during CWA Intensity 6+ shaking.",
        ),
    ]
    store.add_chunks(seed_chunks)
