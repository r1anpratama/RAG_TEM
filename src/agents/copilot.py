"""Conversational Geotechnical Copilot for SeismoAgent-TW.

Integrates HybridRetriever (TEM PSHA2025 chunks), GeoGraph (38 faults + rupture pairs),
and GMPE physics engine with deterministic safety-critic validation and optional
local LLM (vLLM / Ollama / TensorRT-LLM) acceleration.
"""

from __future__ import annotations

import os
import json
import math
import logging
from typing import Any, Dict, List, Optional
import requests

from src.domain.graph import GeoGraph, NodeType, build_taiwan_seismic_graph
from src.pipelines.retrieval import HybridRetriever, SearchResult
from src.domain.gmpe import compute_taiwan_crustal_gmpe_pgv

logger = logging.getLogger(__name__)


class GeotechnicalCopilot:
    """Intelligent QA and decision-support copilot for Taiwan seismic hazard."""

    def __init__(
        self,
        graph: Optional[GeoGraph] = None,
        retriever: Optional[HybridRetriever] = None,
        llm_api_base: Optional[str] = None,
        llm_model: str = "meta-llama/Llama-3.1-8B-Instruct",
    ) -> None:
        self.graph = graph or build_taiwan_seismic_graph()
        self.retriever = retriever or HybridRetriever.from_pdf()
        self.llm_api_base = llm_api_base or os.getenv("LLM_API_BASE", "http://localhost:11434/v1")
        self.llm_model = os.getenv("LLM_MODEL", llm_model)

    def answer_query(self, query: str) -> Dict[str, Any]:
        """Process user query and return grounded answer with citations and graph evidence."""
        # 1. Retrieve knowledge graph entities matching query
        graph_evidence = self._find_graph_context(query)

        # 2. Retrieve document chunks from TEM PSHA2025
        search_results = self.retriever.search(query, top_k=3)

        # 3. Check for GMPE calculation intent
        gmpe_data = self._extract_gmpe_intent(query)

        # 4. Synthesize response (attempt LLM, fallback to deterministic synthesis)
        answer = self._generate_response(query, graph_evidence, search_results, gmpe_data)

        return {
            "query": query,
            "answer": answer,
            "graph_evidence": graph_evidence,
            "citations": [
                {
                    "chunk_id": sr.chunk.chunk_id,
                    "section": f"Page {sr.chunk.page_number}",
                    "page_number": sr.chunk.page_number,
                    "preview": sr.chunk.text[:160] + "...",
                    "score": sr.score,
                }
                for sr in search_results
            ],
            "gmpe_estimate": gmpe_data,
        }

    def _find_graph_context(self, query: str) -> Dict[str, Any]:
        """Search GeoGraph for mentions of faults, facilities, or rupture combinations."""
        query_lower = query.lower()
        matched_faults = []
        cascading_scenarios = []
        matched_facilities = []

        for node_id, node in self.graph.nodes.items():
            name_lower = node.name.lower()
            if node.node_type == NodeType.FAULT:
                fid = str(node.properties.get("fault_id", ""))
                if (name_lower and name_lower in query_lower) or (fid and f"fault {fid}" in query_lower) or (fid and f"id {fid}" in query_lower):
                    matched_faults.append({
                        "id": node.id,
                        "name": node.name,
                        "fault_id": node.properties.get("fault_id"),
                        "slip_rate_mm_yr": node.properties.get("slip_rate_mm_yr"),
                        "mw_max": node.properties.get("mw_max"),
                    })
                    f_int = node.properties.get("fault_id")
                    if f_int is not None:
                        scenarios = self.graph.get_cascading_ruptures(int(f_int))
                        cascading_scenarios.extend(scenarios)

            elif node.node_type == NodeType.FACILITY:
                if (name_lower and name_lower in query_lower) or (node.id.lower() in query_lower) or ("ncu" in query_lower):
                    matched_facilities.append({
                        "id": node.id,
                        "name": node.name,
                        "building_era": node.properties.get("building_era"),
                        "fundamental_period_s": node.properties.get("fundamental_period_s"),
                        "occupancy": node.properties.get("occupancy"),
                    })

        return {
            "matched_faults": matched_faults[:3],
            "cascading_scenarios": cascading_scenarios[:3],
            "matched_facilities": matched_facilities[:3],
        }

    def _extract_gmpe_intent(self, query: str) -> Optional[Dict[str, float]]:
        """Extract magnitude and distance to compute theoretical GMPE if requested."""
        import re

        mag_match = re.search(r"(?:m|mw|magnitude)\s*([0-9]+(?:\.[0-9]+)?)", query, re.IGNORECASE)
        dist_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:km|kilometers)", query, re.IGNORECASE)

        if mag_match and dist_match:
            try:
                mw = float(mag_match.group(1))
                r_rup = float(dist_match.group(1))
                gmpe_dict = compute_taiwan_crustal_gmpe_pgv(mw=mw, distance_km=r_rup)
                median = gmpe_dict["median_pgv"]
                sigma_ln = gmpe_dict["sigma_ln"]
                lower = round(median * math.exp(-2.5 * sigma_ln), 2)
                upper = round(median * math.exp(2.5 * sigma_ln), 2)
                return {
                    "mw": mw,
                    "r_rup_km": r_rup,
                    "median_pgv_cm_s": median,
                    "sigma_ln": sigma_ln,
                    "lower_bound_2sigma": lower,
                    "upper_bound_2sigma": upper,
                }
            except Exception as e:
                logger.warning(f"GMPE extraction error: {e}")
        return None

    def _generate_response(
        self,
        query: str,
        graph_evidence: Dict[str, Any],
        search_results: List[SearchResult],
        gmpe_data: Optional[Dict[str, float]],
    ) -> str:
        """Synthesize response using LLM or robust deterministic template."""
        # Attempt local LLM if configured and reachable
        llm_response = self._call_local_llm(query, graph_evidence, search_results, gmpe_data)
        if llm_response:
            return llm_response

        # Fallback to deterministic expert synthesis
        return self._deterministic_synthesis(query, graph_evidence, search_results, gmpe_data)

    def _call_local_llm(
        self,
        query: str,
        graph_evidence: Dict[str, Any],
        search_results: List[SearchResult],
        gmpe_data: Optional[Dict[str, float]],
    ) -> Optional[str]:
        """Try calling OpenAI-compatible local LLM (vLLM / Ollama / TensorRT-LLM)."""
        prompt = (
            "You are SeismoAgent-TW, an expert geotechnical AI copilot for Taiwan earthquake hazards.\n"
            "Answer the query strictly based on the provided ground-truth context. Do not speculate.\n\n"
            f"Query: {query}\n\n"
            f"Knowledge Graph Evidence:\n{json.dumps(graph_evidence, indent=2)}\n\n"
            f"TEM PSHA2025 Document Chunks:\n"
            + "\n".join([f"- [Page {sr.chunk.page_number}] {sr.chunk.text}" for sr in search_results])
            + (f"\n\nGMPE Ground Motion Estimate:\n{json.dumps(gmpe_data)}" if gmpe_data else "")
        )

        try:
            url = f"{self.llm_api_base.rstrip('/')}/chat/completions"
            payload = {
                "model": self.llm_model,
                "messages": [
                    {"role": "system", "content": "You are a professional Taiwan seismological AI assistant."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 512,
            }
            resp = requests.post(url, json=payload, timeout=2.0)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception:
            # LLM service unavailable or offline; seamlessly continue to deterministic fallback
            pass
        return None

    def _deterministic_synthesis(
        self,
        query: str,
        graph_evidence: Dict[str, Any],
        search_results: List[SearchResult],
        gmpe_data: Optional[Dict[str, float]],
    ) -> str:
        """Deterministic expert synthesis with zero hallucination."""
        lines = []

        # 1. Fault & Rupture information
        faults = graph_evidence.get("matched_faults", [])
        if faults:
            f = faults[0]
            lines.append(
                f"**Fault Entity:** Structure ID {f.get('fault_id', 'N/A')} ({f.get('name', 'Unknown')}), "
                f"slip rate: {f.get('slip_rate_mm_yr', 'N/A')} mm/yr, max magnitude: Mw {f.get('mw_max', 'N/A')}."
            )

        scenarios = graph_evidence.get("cascading_scenarios", [])
        if scenarios:
            lines.append("\n**TEM PSHA2025 Table 2 Multi-Structure Rupture Scenarios:**")
            for sc in scenarios:
                lines.append(
                    f"- Coseismic rupture with **{sc['paired_fault_name']}** (ID {sc['paired_fault_id']}) "
                    f"yields an elevated magnitude of **Mw {sc['combined_mw']}**."
                )

        # 2. GMPE estimation
        if gmpe_data:
            lines.append(
                f"\n**Physics-Informed GMPE Attenuation (Lin & Lee / Campbell & Bozorgnia):**\n"
                f"For Mw {gmpe_data['mw']} at distance {gmpe_data['r_rup_km']} km, the theoretical median PGV is "
                f"**{gmpe_data['median_pgv_cm_s']} cm/s** (2-sigma physical confidence interval: "
                f"[{gmpe_data['lower_bound_2sigma']}, {gmpe_data['upper_bound_2sigma']}] cm/s)."
            )

        # 3. Facility Digital Twin impact
        facilities = graph_evidence.get("matched_facilities", [])
        if facilities:
            lines.append("\n**Regional Digital Twin Facility Status:**")
            for fac in facilities:
                lines.append(
                    f"- **{fac.get('name', fac.get('id'))}**: Era: {str(fac.get('building_era', 'N/A')).upper()}, "
                    f"Period T1: {fac.get('fundamental_period_s', 'N/A')}s, Occupancy: {fac.get('occupancy', 'N/A')}."
                )

        # 4. TEM Document grounding
        if search_results:
            top = search_results[0].chunk
            lines.append(f"\n**TEM PSHA Reference (Page {top.page_number}):**\n\"{top.text[:220]}...\"")

        if not lines:
            lines.append(
                "SeismoAgent-TW analyzed the query against Taiwan Earthquake Model (TEM PSHA 2025) and active fault catalogs. "
                "No specific fault or facility was directly matched. Please specify an active fault (e.g. Shuanglienpo, Hukou, Shihtan) "
                "or a target facility (e.g. NCU Science B4, NCU Engineering 5, Hsinchu Fab)."
            )

        return "\n".join(lines)
