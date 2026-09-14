"""TEM PSHA2025 grounded knowledge for the RAG store and the structured answer path.

Every fact in this module is either read from the project's authoritative tabular
sources (`data/raw/Fault Parameters_update.xlsx`, `data/raw/Fault Alignments.xlsx`),
rebuilt from the Geo-GraphRAG Table 2 pairings (`src/domain/graph.py`), or quoted
from `TEM PSHA2025-draft.pdf` (Gao et al., 2026). Nothing is invented here: the
PRD rule NUM-01 forbids stating fault parameters that do not originate in those
files. Chunks are plain dicts so this module stays import-cycle free.
"""

from __future__ import annotations

import re
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

_PROJECT_ROOT = Path(__file__).resolve().parents[4]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

PAPER = "TEM_PSHA2025_draft.pdf"
PARAM_SOURCE = "Fault Parameters_update.xlsx"
AREA_SOURCE_ASSET = "Coordinates-area_source.txt"

# (section, text) - verbatim-grounded statements from TEM PSHA2025 (Gao et al., 2026).
PAPER_FACTS: List[Tuple[str, str]] = [
    (
        "Abstract & Section 2 - Study area and catalog",
        "TEM PSHA2025 is the new probabilistic seismic hazard assessment for Taiwan. It expands the "
        "study area from the region surrounding Taiwan to a radius of 320 km, integrates multiple "
        "international earthquake catalogs, and analyzes earthquakes from 1900 through the end of 2023.",
    ),
    (
        "Section 7 - GMPE logic tree uncertainty",
        "All TEM PSHA2025 hazard maps considered an epsilon of 2 for the uncertainty of the ground "
        "motion prediction equations (GMPEs).",
    ),
    (
        "Section 3 - Source model",
        "On-land seismogenic structures were updated from Shyu et al. (2020); 55 offshore seismogenic "
        "structures were identified by Chen and Shyu (2025); subduction interface and intraslab sources "
        "cover the Ryukyu zone (regions NP1-NP5) and the Manila zone (regions SP1-SP4).",
    ),
    (
        "Section 3 - Shallow areal sources",
        "Shallow seismicity is modelled exclusively with areal sources with source depths shallower than "
        "35 km. The minimum magnitude of the truncated exponential model is 4.0. For Taiwan's main island "
        "the upper magnitude was adjusted from 6.9 to 7.0; offshore upper magnitudes follow TWSSHAC "
        "Level 3 rules (maximum observed magnitude 1900-2023 plus 0.25).",
    ),
    (
        "Section 4 - Multiple-structure rupture model",
        "The multiple-structure rupture model of Chang et al. (2023), as applied in TEM PSHA2020, assesses "
        "coseismic ruptures involving two or more structures, and is applied to on-land structures, "
        "offshore structures, and the subduction interface. Table 2 lists the pairings with their combined "
        "magnitudes and recurrence intervals.",
    ),
    (
        "Section 7 - GMPE weights (shallow crustal)",
        "For shallow crustal sources the logic tree weights are: Chao et al. (2020) 0.183, Lin (2009) "
        "0.156, Lin et al. (2011) 0.200, Phung et al. (2020a) 0.169, Boore et al. (2014) 0.146, and "
        "Campbell and Bozorgnia (2014) 0.146.",
    ),
    (
        "Section 7 - GMPE weights (subduction)",
        "For subduction zone sources the logic tree weights are: Chao et al. (2020) 0.232, Lin and Lee "
        "(2008) 0.256, Phung et al. (2020b) 0.276, and Abrahamson and Gulerce (2020) 0.236.",
    ),
    (
        "Section 8 - Site effects (Vs30)",
        "Site effects use an updated Vs30 map built from the enhanced TWSSHAC Level 3 site database with "
        "initial inverse distance weighting followed by linear interpolation, giving a final 2 km grid "
        "resolution. Vs30 is critical across the western plains of Taiwan where soft sedimentary layers "
        "are prevalent.",
    ),
    (
        "Section 9 / Fig. 13 - Final hazard map results",
        "The final TEM PSHA2025 results are: (a) the mean hazard map with site amplification effects at a "
        "10% probability of exceedance in 50 years (475-year return period); (b) the median hazard map "
        "within the complete TEM PSHA framework; (c) the difference map between median and mean values; "
        "and (d) the median hazard map for a 2% probability in 50 years (2475-year return period). "
        "The Appendix Fig. a gives the median hazard map on engineering bedrock (Vs30 = 760 m/s) at a "
        "10% probability in 50 years.",
    ),
    (
        "Section 4.2 - Hazard change from geodetic slip rates",
        "Relative to TEM PSHA2020, hazard around the Chaochou fault (ID 29) increased by approximately "
        "0.1 g because of higher geodetic slip rates. Decreases are observed around the Central Range "
        "fault (ID 34) by 0.1 g, the Kouhsiaoli fault (ID 47) by 0.1-0.2 g, and the Fengshan River "
        "strike-slip structure (ID 5) by 0.05 g, all resulting from geodetic slip rates lower than the "
        "geologic rates.",
    ),
    (
        "Section 4.1 - Hazard change from structural updates",
        "The relocation of the Chushiang structure (ID 39) decreases local hazard, geometry changes to "
        "the Chungchou structure reduced hazard near its former location, and the addition of new "
        "structures (IDs 45-48) increased hazard in their surrounding areas. Updated multiple-structure "
        "rupture pairings modified the relative probabilities of single and multiple ruptures.",
    ),
    (
        "Section 5 - Offshore seismogenic structures",
        "Incorporating the offshore seismogenic structure database increases seismic hazard along the "
        "coastal areas of Hsinchu and Kaohsiung because of the proximity of multiple offshore structures. "
        "The northeastern offshore region, dominated by normal faults with longer recurrence intervals, "
        "has only a limited impact on hazard at the 475-year return period.",
    ),
    (
        "Section 6 / Table 3 - Time-dependent rupture probabilities",
        "Table 3 reports the year of the last event and the associated seismogenic structure for "
        "structures used in the BPT model, and compares the time-independent Poisson probability over the "
        "next 50 years with the time-dependent BPT probability and the resulting recurrence-rate change.",
    ),
]


def _load_domain() -> Optional[Tuple[Any, Any]]:
    """Load the authoritative fault catalog and knowledge graph, or None if unavailable."""
    try:
        from src.domain.fault import FaultCatalog
        from src.domain.graph import build_taiwan_seismic_graph

        catalog = FaultCatalog.load_from_excel()
        return catalog, build_taiwan_seismic_graph(catalog)
    except Exception:  # pragma: no cover - only when core domain data is unreadable
        return None


@lru_cache(maxsize=1)
def _domain() -> Optional[Tuple[Any, Any]]:
    return _load_domain()


@lru_cache(maxsize=1)
def _area_sources():
    """Parse the areal source coordinate asset; empty catalog if it is missing."""
    from src.domain.area_source import AreaSourceCatalog

    return AreaSourceCatalog.load_from_text()


def _area_source_rows() -> List[Dict[str, Any]]:
    """Map payload for the toggleable areal source layer: id, ring, and optional a-value."""
    return [
        {
            "id": source.id,
            "coordinates": source.as_lat_lon(),
            "centroid": list(source.centroid[::-1]),  # [lat, lon]
            "vertex_count": source.vertex_count,
            "a_value": source.a_value,
        }
        for source in _area_sources().list_all()
    ]


def _area_source_chunks() -> List[Dict[str, str]]:
    """One grounded chunk per areal source zone so the assistant can describe the layer."""
    chunks: List[Dict[str, str]] = []
    for source in _area_sources().list_all():
        lon, lat = source.centroid
        min_lon, min_lat, max_lon, max_lat = source.bbox
        chunks.append(
            {
                "id": f"AREA-{source.id}",
                "document": AREA_SOURCE_ASSET,
                "section": f"Areal source zone {source.id}",
                "text": (
                    f"TEM PSHA2025 shallow areal source zone {source.id} is a closed polygon with "
                    f"{source.vertex_count} vertices, centroid at latitude {lat}, longitude {lon}. "
                    f"It spans longitude {round(min_lon, 4)} to {round(max_lon, 4)} and latitude "
                    f"{round(min_lat, 4)} to {round(max_lat, 4)}."
                    + (
                        f" Its Gutenberg-Richter a-value is {source.a_value}."
                        if source.a_value is not None
                        else " No a-value is recorded for this zone in the asset."
                    )
                    + f" Source: {AREA_SOURCE_ASSET}."
                ),
            }
        )
    return chunks


def _fault_chunks() -> List[Dict[str, str]]:
    domain = _domain()
    if not domain:
        return []
    catalog, _ = domain

    return [
        {
            "id": f"TEM-T1-{f.id:02d}",
            "document": PAPER,
            "section": f"Table 1 - on-land seismogenic structure ID {f.id}",
            "text": (
                f"Seismogenic structure ID {f.id}: {f.name}. Fault type {f.fault_type} "
                f"(N = normal, R = reverse, SS = strike-slip). Maximum magnitude Mw {f.mw_max}. "
                f"Mean slip rate {f.slip_rate_mm_yr} mm/yr. Dip {f.dip} degrees. Rake {f.rake} degrees. "
                f"Maximum seismogenic depth {f.depth_max_km} km. Source: {PARAM_SOURCE}."
            ),
        }
        for f in catalog.list_all()
    ]


def _pairing_rows() -> List[Dict[str, Any]]:
    """Rebuild the Table 2 pairings from the bidirectional knowledge-graph edges (deduplicated)."""
    domain = _domain()
    if not domain:
        return []
    catalog, graph = domain
    names = {f.id: f.name for f in catalog.list_all()}

    rows: Dict[str, Dict[str, Any]] = {}
    for node_id, edges in graph.edges_out.items():
        for edge in edges:
            if getattr(edge.edge_type, "value", str(edge.edge_type)) != "RUPTURES_WITH":
                continue
            props = edge.properties
            label = props.get("pairing_label", "")
            if label in rows:
                continue
            source_id = int(node_id.split("_")[1])
            target_id = int(edge.target_id.split("_")[1])
            rows[label] = {
                "pairing_label": label,
                "fault_ids": sorted([source_id, target_id]),
                "fault_names": [names.get(source_id, ""), names.get(target_id, "")],
                "combined_mw": props.get("combined_mw"),
                "recurrence_interval_yr": props.get("recurrence_interval_yr"),
            }
    return sorted(rows.values(), key=lambda r: -(r["combined_mw"] or 0))


def _pairing_chunks() -> List[Dict[str, str]]:
    return [
        {
            "id": f"TEM-T2-{i:02d}",
            "document": PAPER,
            "section": f"Table 2 - multiple-structure rupture {row['pairing_label']}",
            "text": (
                f"Multiple-structure rupture {row['pairing_label']}: "
                f"{row['fault_names'][0]} (ID {row['fault_ids'][0]}) and "
                f"{row['fault_names'][1]} (ID {row['fault_ids'][1]}) can rupture coseismically. "
                f"Combined magnitude Mw {row['combined_mw']}, recurrence interval "
                f"{row['recurrence_interval_yr']} years. Source: TEM PSHA2025 Table 2."
            ),
        }
        for i, row in enumerate(_pairing_rows(), start=1)
    ]


def _fact_chunks() -> List[Dict[str, str]]:
    return [
        {
            "id": f"TEM-FACT-{i:02d}",
            "document": PAPER,
            "section": section,
            "text": text,
        }
        for i, (section, text) in enumerate(PAPER_FACTS, start=1)
    ]


def _facility_chunks() -> List[Dict[str, str]]:
    """Digital-twin facilities and their lifelines, rebuilt from the knowledge graph."""
    domain = _domain()
    if not domain:
        return []
    _, graph = domain

    chunks: List[Dict[str, str]] = []
    for node in graph.nodes.values():
        node_type = getattr(node.node_type, "value", str(node.node_type))
        if node_type != "FACILITY":
            continue
        props = node.properties
        lifelines = graph.get_facility_lifelines(node.id)
        chunks.append(
            {
                "id": f"FACILITY-{node.id}",
                "document": "GeoGraph_digital_twins.json",
                "section": f"Facility {node.name}",
                "text": (
                    f"Monitored facility {node.name} ({node.id}) at latitude "
                    f"{props.get('latitude')}, longitude {props.get('longitude')}. Building era "
                    f"{props.get('building_era')} with fundamental period "
                    f"{props.get('fundamental_period_s')} s and occupancy "
                    f"'{props.get('occupancy')}'. Dependent lifelines: "
                    f"{', '.join(l['lifeline_name'] for l in lifelines) or 'none recorded'}. "
                    f"Lifeline cutoffs: "
                    f"{', '.join(str(l['cutoff_actuator']) for l in lifelines) or 'none recorded'}."
                ),
            }
        )
    return chunks


def build_psha_chunks() -> List[Dict[str, str]]:
    """All grounded chunks: structures, Table 2 pairings, paper facts, facilities, areal zones."""
    return (
        _fault_chunks()
        + _pairing_chunks()
        + _fact_chunks()
        + _facility_chunks()
        + _area_source_chunks()
    )


def dataset_summary() -> Dict[str, Any]:
    """Counts reported by the assistant when asked about the dataset itself."""
    domain = _domain()
    faults = domain[0].list_all() if domain else []
    by_type: Dict[str, int] = {}
    for f in faults:
        by_type[f.fault_type] = by_type.get(f.fault_type, 0) + 1
    return {
        "total_faults": len(faults),
        "fault_types": by_type,
        "multi_rupture_pairings": len(_pairing_rows()),
        "area_sources": _area_sources().total_sources,
        "paper_facts": len(PAPER_FACTS),
        "max_mw": max((f.mw_max for f in faults), default=None),
        "max_slip_rate_mm_yr": max((f.slip_rate_mm_yr for f in faults), default=None),
    }


def dataset() -> Dict[str, Any]:
    """Map payload for the PSHA dashboard: counts, Table 2 pairings, and areal source rings.

    Digital-twin facilities are deliberately absent: the hazard map plots seismic sources
    only. They remain in `_facility_chunks()` so the assistant can still answer about them.
    """
    return {
        "summary": dataset_summary(),
        "pairings": _pairing_rows(),
        "area_sources": _area_source_rows(),
    }


def _resolve_fault(query: str) -> Optional[int]:
    """Resolve a fault ID from an explicit ID, a '#N' reference, or a structure name."""
    domain = _domain()
    if not domain:
        return None
    catalog = domain[0]
    known_ids = {f.id for f in catalog.list_all()}

    for match in re.finditer(r"(?:id|fault|structure|struktur|sesar)\D{0,4}(\d{1,2})\b", query, re.I):
        candidate = int(match.group(1))
        if candidate in known_ids:
            return candidate
    for match in re.finditer(r"#\s?(\d{1,2})\b", query):
        candidate = int(match.group(1))
        if candidate in known_ids:
            return candidate

    lowered = query.lower()
    best: Optional[Tuple[int, int]] = None
    for f in catalog.list_all():
        name = f.name.lower()
        # Match on the distinctive part of the name, ignoring suffix words.
        key = re.split(r"\s+(?:fault|structure)\b", name)[0].strip()
        if len(key) < 4 or key not in lowered:
            continue
        if best is None or len(key) > best[1]:
            best = (f.id, len(key))
    return best[0] if best else None


def _fault_answer(fault_id: int) -> Dict[str, Any]:
    catalog, graph = _domain()  # type: ignore[misc]
    fault = catalog.get_by_id(fault_id)
    align = catalog.get_alignment(fault_id)
    cascades = graph.get_cascading_ruptures(fault_id)

    lines = [
        f"### Fault ID {fault.id} - {fault.name}",
        "",
        "| Parameter | Value |",
        "| :--- | :--- |",
        f"| Fault type | {fault.fault_type} |",
        f"| Maximum magnitude (Mw) | {fault.mw_max} |",
        f"| Mean slip rate | {fault.slip_rate_mm_yr} mm/yr |",
        f"| Dip | {fault.dip}° |",
        f"| Rake | {fault.rake}° |",
        f"| Maximum seismogenic depth | {fault.depth_max_km} km |",
        f"| Trace vertices | {len(align.coordinates) if align else 0} |",
    ]
    if cascades:
        lines += ["", f"**Multiple-structure ruptures (TEM PSHA2025 Table 2):**"]
        for c in cascades:
            lines.append(
                f"- with {c['paired_fault_name']} (ID {c['paired_fault_id']}): combined **Mw "
                f"{c['combined_mw']}**, recurrence {c['recurrence_interval_yr']:,} years"
            )
    else:
        lines += ["", "No multiple-structure rupture pairing is listed for this structure in Table 2."]
    lines += ["", f"_Source: {PARAM_SOURCE} (project authoritative) and TEM PSHA2025 Table 1/Table 2._"]

    return {
        "answer": "\n".join(lines),
        "citation": {
            "document_name": PARAM_SOURCE,
            "page_or_section": f"Structure ID {fault.id} - {fault.name} (Table 1 / Table 2)",
            "snippet": (
                f"ID {fault.id} {fault.name}: type {fault.fault_type}, Mw {fault.mw_max}, "
                f"slip rate {fault.slip_rate_mm_yr} mm/yr, dip {fault.dip}°, depth {fault.depth_max_km} km."
            ),
            "score": 1.0,
        },
    }


def _pairing_answer() -> Dict[str, Any]:
    rows = _pairing_rows()
    lines = [
        f"### TEM PSHA2025 Table 2 - {len(rows)} multiple-structure ruptures",
        "",
        "| Pairing | Structures | Combined Mw | Recurrence (yr) |",
        "| :--- | :--- | :--- | :--- |",
    ]
    for r in rows:
        lines.append(
            f"| {r['pairing_label']} | {r['fault_names'][0]} + {r['fault_names'][1]} | "
            f"{r['combined_mw']} | {r['recurrence_interval_yr']:,} |"
        )
    lines += [
        "",
        "_Source: TEM PSHA2025 Table 2 (multiple-structure rupture model of Chang et al., 2023)._",
    ]
    return {
        "answer": "\n".join(lines),
        "citation": {
            "document_name": PAPER,
            "page_or_section": "Table 2 - pairing and associated parameters for multiple-structure ruptures",
            "snippet": f"{len(rows)} coseismic pairings with combined Mw and recurrence intervals.",
            "score": 1.0,
        },
    }


def _dataset_answer() -> Dict[str, Any]:
    summary = dataset_summary()
    types = ", ".join(f"{k} {v}" for k, v in sorted(summary["fault_types"].items()))
    answer = (
        f"The reachable catalog covers **{summary['total_faults']} on-land seismogenic structures** "
        f"({types}), with **{summary['multi_rupture_pairings']} Table 2 multiple-structure rupture "
        f"pairings** and **{summary['area_sources']} shallow areal source zones** (a map layer that is "
        f"hidden until you switch it on). The largest maximum magnitude is **Mw {summary['max_mw']}** and "
        f"the highest mean slip rate is **{summary['max_slip_rate_mm_yr']} mm/yr**. TEM PSHA2025 "
        f"additionally models 55 offshore structures and the Ryukyu/Manila subduction sources, which are "
        f"not part of this on-land catalog."
    )
    return {
        "answer": answer,
        "citation": {
            "document_name": PARAM_SOURCE,
            "page_or_section": "Catalog summary",
            "snippet": f"{summary['total_faults']} structures, {summary['multi_rupture_pairings']} pairings.",
            "score": 1.0,
        },
    }


def answer_from_catalog(query: str) -> Optional[Dict[str, Any]]:
    """Answer exact, verifiable questions about structures and pairings from project data.

    Returns None when the question is not a structured lookup, so the caller can fall
    back to retrieval over the grounded chunks.
    """
    if not query or _domain() is None:
        return None

    lowered = query.lower()

    # A named structure wins outright: its card already carries its Table 2 pairings.
    fault_id = _resolve_fault(query)
    if fault_id is not None:
        return _fault_answer(fault_id)

    if any(
        k in lowered
        for k in ("pairing", "pairings", "cascade", "cascading", "table 2", "multi-structure",
                  "multiple-structure", "multi rupture", "multi-rupture", "pasangan", "gabungan")
    ):
        return _pairing_answer()

    if any(k in lowered for k in ("how many", "berapa banyak", "jumlah", "total", "dataset", "catalog")):
        return _dataset_answer()

    return None
