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
@router.get("/triage/faults", summary="List 38 Taiwan Seismogenic Structures (Alias)")
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
@router.get("/triage/scenarios", summary="Earthquake Simulation Scenarios (Alias)")
async def get_scenarios() -> List[Dict[str, Any]]:
    """Return pre-configured realistic earthquake scenarios."""
    return [
        {
            "id": "eq_20122_daxi_guanxi",
            "title": "2011 Daxi-Guanxi Earthquake (EQ 20122 - 19.76 km)",
            "fault_name": "Daxi / Guanxi Active Fault Zone",
            "description": "Absolute closest recorded earthquake to NCU Campus (19.76 km). Recorded by near-source strong motion network.",
            "magnitude": 3.77,
            "depth_km": 12.00,
            "epicenter": {"lat": 24.7940, "lon": 121.2330},
            "predicted_pgv_cm_s": 0.45,
            "predicted_pga_gal": 8.50,
            "estimated_cwa_intensity": "2",
            "target_facility": "NCU Campus (19.76 km to Epicenter)",
            "distance_to_target_km": 19.76,
            "countdown_seconds": 5.60,
            "s_wave_countdown_sec": 5.60,
            "track_a_actuators": [
                {
                    "target": "ELEVATORS_ALL_CAMPUS",
                    "action": "MONITOR_ACCELERATION_STANDBY",
                    "urgency": "INSTANT_SUB_5MS",
                },
                {
                    "target": "MAIN_NATURAL_GAS_VALVE",
                    "action": "STANDBY_PRESSURE_MONITOR",
                    "urgency": "INSTANT_SUB_5MS",
                },
            ],
        },
        {
            "id": "eq_20883_taoyuan_daxi",
            "title": "2012 Daxi-Taoyuan Local Earthquake (EQ 20883)",
            "fault_name": "Daxi / Fuxing Fault Structure",
            "description": "Historical near-NCU event recorded by on-campus station TCU083 (0.11 km from S4). Epicenter 23.9 km in Daxi/Fuxing.",
            "magnitude": 4.66,
            "depth_km": 10.22,
            "epicenter": {"lat": 24.7620, "lon": 121.2608},
            "predicted_pgv_cm_s": 1.03,
            "predicted_pga_gal": 12.26,
            "estimated_cwa_intensity": "3",
            "target_facility": "NCU Campus (TCU083 Station Core)",
            "distance_to_target_km": 23.90,
            "countdown_seconds": 6.69,
            "s_wave_countdown_sec": 6.69,
            "track_a_actuators": [
                {
                    "target": "ELEVATORS_ALL_CAMPUS",
                    "action": "HALT_AT_NEAREST_FLOOR_DOORS_OPEN",
                    "urgency": "INSTANT_SUB_5MS",
                },
                {
                    "target": "MAIN_NATURAL_GAS_VALVE",
                    "action": "PNEUMATIC_EMERGENCY_SHUTOFF",
                    "urgency": "INSTANT_SUB_5MS",
                },
                {
                    "target": "CLEANROOM_TOXIC_VENTILATION",
                    "action": "HALT_CORROSIVE_GAS_DAMPER_CLOSED",
                    "urgency": "INSTANT_SUB_5MS",
                },
            ],
        },
        {
            "id": "shuanglienpo_hukou_mw69",
            "title": "Shuanglienpo-Hukou Multi-Fault Rupture (Mw 6.91)",
            "fault_name": "Shuanglienpo Fault (#2) + Hukou (#3)",
            "description": "Near-source shallow crustal rupture 2.8 km from NCU campus and HSP Science Park.",
            "magnitude": 6.91,
            "depth_km": 8.0,
            "epicenter": {"lat": 24.945, "lon": 121.185},
            "predicted_pgv_cm_s": 72.4,
            "predicted_pga_gal": 485.0,
            "estimated_cwa_intensity": "6-Strong",
            "target_facility": "NCU Science Building 4",
            "distance_to_target_km": 2.8,
            "countdown_seconds": 3.8,
            "s_wave_countdown_sec": 3.8,
            "track_a_actuators": [
                {
                    "target": "ELEVATORS_ALL_CAMPUS",
                    "action": "HALT_AT_NEAREST_FLOOR_DOORS_OPEN",
                    "urgency": "INSTANT_SUB_5MS",
                },
                {
                    "target": "MAIN_NATURAL_GAS_VALVE",
                    "action": "PNEUMATIC_EMERGENCY_SHUTOFF",
                    "urgency": "INSTANT_SUB_5MS",
                },
                {
                    "target": "CLEANROOM_TOXIC_VENTILATION",
                    "action": "HALT_CORROSIVE_GAS_DAMPER_CLOSED",
                    "urgency": "INSTANT_SUB_5MS",
                },
            ],
        },
        {
            "id": "meinong_2016_mw64",
            "title": "2016 Meinong Benchmark Earthquake (Mw 6.40)",
            "fault_name": "Chishan / Zuozhen Fault Corridor",
            "description": "2016 Southern Taiwan benchmark with high-density strong-motion network records.",
            "magnitude": 6.40,
            "depth_km": 14.6,
            "epicenter": {"lat": 22.920, "lon": 120.540},
            "predicted_pgv_cm_s": 58.2,
            "predicted_pga_gal": 395.0,
            "estimated_cwa_intensity": "6-Strong",
            "target_facility": "Southern Science Park & Lifelines",
            "distance_to_target_km": 31.5,
            "countdown_seconds": 12.0,
            "s_wave_countdown_sec": 12.0,
            "track_a_actuators": [
                {
                    "target": "ELEVATORS_ALL_CAMPUS",
                    "action": "HALT_AT_NEAREST_FLOOR_DOORS_OPEN",
                    "urgency": "INSTANT_SUB_5MS",
                },
                {
                    "target": "MAIN_NATURAL_GAS_VALVE",
                    "action": "PNEUMATIC_EMERGENCY_SHUTOFF",
                    "urgency": "INSTANT_SUB_5MS",
                },
            ],
        },
        {
            "id": "hualien_offshore_mw72",
            "title": "Hualien Offshore Subduction Transition (Mw 7.20)",
            "fault_name": "Ryukyu Trench Subduction",
            "description": "2024-scale eastern offshore sequence with long-period ground motion.",
            "magnitude": 7.20,
            "depth_km": 35.0,
            "epicenter": {"lat": 23.980, "lon": 121.650},
            "predicted_pgv_cm_s": 24.5,
            "predicted_pga_gal": 85.0,
            "estimated_cwa_intensity": "4",
            "target_facility": "Eastern Lifelines & Taipei Basin",
            "distance_to_target_km": 142.0,
            "countdown_seconds": 22.4,
            "s_wave_countdown_sec": 22.4,
            "track_a_actuators": [
                {
                    "target": "ELEVATORS_ALL_CAMPUS",
                    "action": "HALT_AT_NEAREST_FLOOR_DOORS_OPEN",
                    "urgency": "INSTANT_SUB_5MS",
                },
            ],
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


@router.get("/simulation/{event_id}", summary="Get Earthquake Simulation Waveform Data")
async def get_simulation_data(event_id: str) -> Dict[str, Any]:
    """Return pre-extracted HDF5 waveform telemetry for the specified earthquake."""
    import json
    from pathlib import Path
    
    data_dir = Path(__file__).resolve().parent.parent.parent / "data"
    
    if "20122" in event_id:
        file_path = data_dir / "eq_20122_simulation.json"
    elif "20883" in event_id:
        file_path = data_dir / "eq_20883_simulation.json"
    else:
        file_path = data_dir / "meinong_2016_simulation.json"
        
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation dataset for {event_id} not found at {file_path}."
        )
        
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

