"""Hybrid retrieval engine combining lexical and semantic matching for TEM PSHA literature."""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from src.pipelines.ingestion import DocumentChunk, extract_pdf_chunks


@dataclass
class SearchResult:
    """Retrieved document chunk with similarity score."""
    chunk: DocumentChunk
    score: float


class HybridRetriever:
    """In-memory hybrid retrieval engine for geotechnical literature and TEM PSHA drafts."""

    def __init__(self, chunks: List[DocumentChunk]):
        self.chunks = chunks
        self.corpus = [c.text for c in chunks]
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english"
        )
        self.chunk_vectors = self.vectorizer.fit_transform(self.corpus)

    @classmethod
    def from_pdf(cls, pdf_path: Optional[Path] = None) -> "HybridRetriever":
        """Initialize retriever by extracting chunks from the default TEM PSHA PDF."""
        chunks = extract_pdf_chunks(pdf_path)
        return cls(chunks)

    def search(self, query: str, top_k: int = 5) -> List[SearchResult]:
        """Search the document collection for query relevance."""
        if not query.strip() or not self.chunks:
            return []

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.chunk_vectors).flatten()

        top_indices = np.argsort(scores)[::-1][:top_k]
        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.0:
                results.append(
                    SearchResult(
                        chunk=self.chunks[idx],
                        score=round(score, 4)
                    )
                )

        return results
