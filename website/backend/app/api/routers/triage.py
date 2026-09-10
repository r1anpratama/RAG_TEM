"""Triage and Geospatial endpoints bridging core seismic domain models to the web frontend."""

from __future__ import annotations

import sys
import math
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

# Ensure project root is accessible for core domain modules
_project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from src.domain.fault import FaultCatalog, haversine_distance_km
from src.domain.graph import GeoGraph, build_taiwan_seismic_graph
from src.domain.gmpe import compute_taiwan_crustal_gmpe_pgv
from src.pipelines.tts_stream import TTSAMAlertPacket, Epicenter, StationPrediction
from src.agents.orchestrator import DualTrackOrchestrator

router = APIRouter(prefix="/api", tags=["Triage & GIS"])

# Lazy singletons
_graph: Optional[GeoGraph] = None
_fault_catalog: Optional[FaultCatalog] = None
_orchestrator: Optional[DualTrackOrchestrator] = None


def get_graph() -> GeoGraph:
    global _graph
    if _graph is None:
        _graph = build_taiwan_seismic_graph()
    return _graph


def get_fault_catalog() -> FaultCatalog:
    global _fault_catalog
    if _fault_catalog is None:
        _fault_catalog = FaultCatalog.load_from_excel()
    return _fault_catalog


def get_orchestrator() -> DualTrackOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = DualTrackOrchestrator(graph=get_graph())
    return _orchestrator


class TriageRequest(BaseModel):
    event_id: str = Field(default="SIM-2026-EVENT", description="Identifier for seismic event")
    elapsed_seconds: float = Field(default=8.5, description="Time elapsed since P-wave detection (s)")
    magnitude: float = Field(default=6.91, description="Estimated moment magnitude Mw")
    depth_km: float = Field(default=10.5, description="Hypocentral focal depth (km)")
    epicenter_lat: float = Field(default=24.935, description="Epicenter latitude (deg)")
    epicenter_lon: float = Field(default=121.175, description="Epicenter longitude (deg)")
    predicted_pgv_nc_cm_s: float = Field(
        default=68.5, description="Predicted Peak Ground Velocity at target facility (cm/s)"
    )
    is_preliminary: bool = Field(default=True, description="Whether alert is rolling preliminary")


@router.get("/faults", summary="List 38 Taiwan Seismogenic Structures")
async def list_faults(
    lat: Optional[float] = Query(None, description="Query latitude for nearest fault calculation"),
    lon: Optional[float] = Query(None, description="Query longitude for nearest fault calculation"),
) -> Dict[str, Any]:
    """Return all 38 active on-land fault traces with geometry and parameters."""
    catalog = get_fault_catalog()
    faults_data = []

    for f in catalog.list_all():
        align = catalog.get_alignment(f.id)
        coords = [[lat_pt, lon_pt] for lon_pt, lat_pt in (align.coordinates if align else [])]
        faults_data.append({
            "fault_id": f.id,
            "name": f.name,
            "fault_type": f.fault_type,
            "slip_rate_mm_yr": f.slip_rate_mm_yr,
            "mw_max": f.mw_max,
            "dip_deg": f.dip,
            "rake_deg": f.rake,
            "depth_max_km": f.depth_max_km,
            "coordinates": coords,
        })

    nearest_info = None
    if lat is not None and lon is not None:
        nearest_res = catalog.find_nearest_fault(lat, lon)
        if nearest_res:
            nearest_info = {
                "nearest_fault_id": nearest_res.fault.id,
                "name": nearest_res.fault.name,
                "distance_km": nearest_res.min_distance_km,
                "mw_max": nearest_res.fault.mw_max,
            }

    return {
        "total_faults": len(faults_data),
        "nearest_query": nearest_info,
        "faults": faults_data,
    }


@router.get("/graph", summary="Geo-GraphRAG Topology")
async def get_graph_topology() -> Dict[str, Any]:
    """Return serialized nodes and edges of the Taiwan spatial-seismic knowledge graph."""
    graph = get_graph()
    nodes = []
    edges = []

    for n_id, data in graph.graph.nodes(data=True):
        n_type = data.get("type", "UNKNOWN")
        label = data.get("name", n_id)
        color = "#ef4444" if n_type == "FAULT" else ("#06b6d4" if n_type == "FACILITY" else "#f59e0b")
        nodes.append({
            "id": n_id,
            "label": label,
            "type": n_type,
            "color": color,
            "attributes": {k: v for k, v in data.items() if k not in ["name", "type"]},
        })

    for u, v, data in graph.graph.edges(data=True):
        edges.append({
            "from": u,
            "to": v,
            "relation": data.get("relation", "CONNECTED_TO"),
            "weight": data.get("weight", 1.0),
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "summary": graph.get_topology_summary(),
    }


@router.get("/scenarios", summary="Earthquake Simulation Scenarios")
async def get_scenarios() -> List[Dict[str, Any]]:
    """Return pre-configured realistic earthquake scenarios."""
    return [
        {
            "id": "shuanglienpo_hukou_mw69",
            "title": "Shuanglienpo-Hukou Multi-Fault Rupture (Mw 6.91)",
            "description": "Near-source shallow crustal rupture 2.8 km from NCU campus and HSP Science Park.",
            "magnitude": 6.91,
            "depth_km": 8.0,
            "epicenter": {"lat": 24.945, "lon": 121.185},
            "predicted_pgv_cm_s": 72.4,
            "target_facility": "NCU Campus & Taoyuan Corridor",
            "countdown_seconds": 3.8,
        },
        {
            "id": "hualien_offshore_mw72",
            "title": "Hualien Offshore Subduction Transition (Mw 7.20)",
            "description": "2024-scale eastern offshore sequence with long-period ground motion.",
            "magnitude": 7.20,
            "depth_km": 35.0,
            "epicenter": {"lat": 23.980, "lon": 121.650},
            "predicted_pgv_cm_s": 24.5,
            "target_facility": "Eastern Lifelines & Taipei Basin",
            "countdown_seconds": 22.4,
        },
        {
            "id": "chichi_chelungpu_mw765",
            "title": "Chi-Chi Chelungpu Thrust Rupture (Mw 7.65)",
            "description": "Historical 1999 surface rupture benchmark with massive displacement.",
            "magnitude": 7.65,
            "depth_km": 8.0,
            "epicenter": {"lat": 23.850, "lon": 120.820},
            "predicted_pgv_cm_s": 98.0,
            "target_facility": "Central Taiwan Lifelines",
            "countdown_seconds": 0.0,
        },
    ]


@router.post("/triage", summary="Execute Dual-Track Seismic Triage")
async def execute_triage(req: TriageRequest) -> Dict[str, Any]:
    """Trigger Dual-Track real-time reflex and deliberative damage evaluation."""
    from datetime import datetime, timezone

    packet = TTSAMAlertPacket(
        alert_id=req.event_id,
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
        p_wave_trigger_elapsed_sec=req.elapsed_seconds,
        predicted_magnitude=req.magnitude,
        epicenter=Epicenter(
            estimated_latitude=req.epicenter_lat,
            estimated_longitude=req.epicenter_lon,
            estimated_depth_km=req.depth_km,
        ),
        station_predictions=[
            StationPrediction(
                station_id="NCU-CAMPUS-01",
                latitude=24.968,
                longitude=121.194,
                pred_pgv_cm_s=req.predicted_pgv_nc_cm_s,
                cwa_intensity_level="6-" if req.predicted_pgv_nc_cm_s >= 44.0 else ("5+" if req.predicted_pgv_nc_cm_s >= 25.0 else "5-"),
                estimated_s_arrival_sec=max(0.0, 14.5 - req.elapsed_seconds),
            )
        ],
    )

    orchestrator = get_orchestrator()
    dispatch = orchestrator.process(packet)

    facility_triage = []
    for f in dispatch.facility_rankings:
        facility_triage.append({
            "facility_id": f.facility_id,
            "facility_name": f.facility_name,
            "building_era": f.building_era,
            "triage_tag": f.triage_level,
            "drift_ratio_pct": round(f.est_drift_ratio_pct, 2),
            "collapse_probability": f"{round(f.collapse_risk_pct, 1)}%",
            "cwa_intensity": f.cwa_intensity,
            "action_recommendation": f.evacuation_advice,
            "connected_lifelines": f.connected_lifelines,
            "priority_rank": f.priority_rank,
        })

    return {
        "event_id": dispatch.dispatch_id,
        "alert_reference": req.event_id,
        "execution_summary": {
            "track_a_latency_ms": round(dispatch.reflex_track_latency_ms, 2),
            "track_b_latency_ms": round(dispatch.deliberative_track_latency_ms, 2),
            "total_latency_ms": round(dispatch.total_processing_latency_ms, 2),
            "reflex_status": dispatch.reflex_packet.trigger_status,
        },
        "track_a_reflex": {
            "trigger_level": dispatch.reflex_packet.trigger_status,
            "elapsed_ms": dispatch.reflex_packet.elapsed_ms,
            "actuators": dispatch.reflex_packet.actuators,
            "action_commands": [
                f"{act['target']}: {act['action']} (Urgency: {act['urgency']})"
                for act in dispatch.reflex_packet.actuators
            ],
        },
        "track_b_deliberative": {
            "facility_triage": facility_triage,
            "seismic_source": {
                "source_regime": dispatch.seismic_analysis.source_regime,
                "urgency_level": dispatch.seismic_analysis.urgency_level,
                "directivity_threat": dispatch.seismic_analysis.directivity_threat,
                "magnitude": dispatch.seismic_analysis.magnitude,
                "hypocenter_depth_km": dispatch.seismic_analysis.hypocenter_depth_km,
            },
            "geotech": {
                "primary_fault_id": dispatch.geotech_report.primary_fault_id,
                "primary_fault_name": dispatch.geotech_report.primary_fault_name,
                "distance_km": dispatch.geotech_report.primary_fault_distance_km,
                "cascading_ruptures": dispatch.geotech_report.cascading_rupture_scenarios,
                "physics_validation": {
                    "is_physically_consistent": dispatch.geotech_report.gmpe_physics_validation.is_physically_consistent,
                    "anomaly_flag": dispatch.geotech_report.gmpe_physics_validation.anomaly_flag,
                    "expected_median_pgv": dispatch.geotech_report.gmpe_physics_validation.theoretical_median_pgv_cm_s,
                    "sigma_deviation": dispatch.geotech_report.gmpe_physics_validation.deviation_sigmas,
                    "lower_bound_pgv": dispatch.geotech_report.gmpe_physics_validation.lower_bound_pgv_cm_s,
                    "upper_bound_pgv": dispatch.geotech_report.gmpe_physics_validation.upper_bound_pgv_cm_s,
                },
            },
            "safety_critic": {
                "is_safe": dispatch.safety_verification.is_safe,
                "hallucination_detected": dispatch.safety_verification.hallucination_detected,
                "verified_entities": dispatch.safety_verification.verified_entities,
                "hallucinated_entities": dispatch.safety_verification.hallucinated_entities,
                "notes": dispatch.safety_verification.critic_notes,
            },
            "executive_summary": dispatch.executive_summary,
        },
    }


@router.get("/gmpe", summary="Physics-Informed Ground Motion Prediction Equation")
async def get_gmpe_curves(
    magnitude: float = Query(6.91, description="Moment magnitude Mw"),
    vs30: float = Query(760.0, description="Average shear-wave velocity in top 30m (m/s)"),
) -> Dict[str, Any]:
    """Compute empirical Lin & Lee (2008) PGV attenuation curve across distance bins."""
    distances = [1, 2, 5, 10, 15, 20, 30, 40, 50, 75, 100]
    points = []

    for d in distances:
        est = compute_taiwan_crustal_gmpe_pgv(mw=magnitude, distance_km=float(d), vs30_m_s=vs30)
        med = est["median_pgv"]
        sig = est["sigma_ln"]
        points.append({
            "distance_km": d,
            "median_pgv": med,
            "upper_2sigma": round(med * math.exp(2.0 * sig), 2),
            "lower_2sigma": round(med * math.exp(-2.0 * sig), 2),
        })

    return {
        "model": "TEM PSHA2025: Lin & Lee (2008) Taiwan Crustal GMPE",
        "magnitude": magnitude,
        "vs30_m_s": vs30,
        "curve": points,
    }
