"""Dual-Track Multi-Agent Orchestrator for SeismoAgent-TW."""

import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import json

from src.agents.geotech_worker import GeotechGraphReport, GeotechnicalGraphWorker
from src.agents.safety_critic import SafetyCriticWorker, SafetyVerificationResult
from src.agents.seismic_analyst import SeismicAnalysisReport, SeismicSourceAnalyst
from src.agents.structural_worker import FacilityAssessmentResult, StructuralTriageWorker
from src.domain.graph import GeoGraph, build_taiwan_seismic_graph
from src.domain.seismic import SCADAAction
from src.pipelines.tts_stream import TTSAMAlertPacket


@dataclass
class ReflexActionPacket:
    """Ultra-low-latency machine actuator output (Track A: < 5 ms)."""
    elapsed_ms: float
    trigger_status: str
    actuators: List[Dict[str, str]]


@dataclass
class DualTrackTriageDispatch:
    """Complete, unified emergency decision output from both Reflex and Deliberative tracks."""
    dispatch_id: str
    alert_reference: str
    timestamp_utc: str
    reflex_track_latency_ms: float
    deliberative_track_latency_ms: float
    total_processing_latency_ms: float
    reflex_packet: ReflexActionPacket
    seismic_analysis: SeismicAnalysisReport
    geotech_report: GeotechGraphReport
    facility_rankings: List[FacilityAssessmentResult]
    safety_verification: SafetyVerificationResult
    executive_summary: str

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)


class DualTrackOrchestrator:
    """Master agent controller executing sub-5ms reflex actuator triggers and 1-2s multi-agent deliberation."""

    def __init__(self, graph: Optional[GeoGraph] = None):
        self.graph = graph or build_taiwan_seismic_graph()
        self.seismic_analyst = SeismicSourceAnalyst()
        self.geotech_worker = GeotechnicalGraphWorker(graph=self.graph)
        self.structural_worker = StructuralTriageWorker(graph=self.graph)
        self.safety_critic = SafetyCriticWorker()

    def process(
        self,
        alert: TTSAMAlertPacket,
        target_facility_ids: Optional[List[str]] = None
    ) -> DualTrackTriageDispatch:
        total_start = time.perf_counter()

        # =====================================================================
        # TRACK A: REFLEX EXECUTION (< 5 ms)
        # =====================================================================
        reflex_start = time.perf_counter()

        # Extract peak predicted ground shaking across monitoring stations
        max_station_pgv = max((sp.pred_pgv_cm_s for sp in alert.station_predictions), default=0.0)
        reflex_actuators = []

        if max_station_pgv >= 15.0:
            reflex_actuators.extend([
                {"target": "ELEVATORS_ALL", "action": "HALT_AT_NEAREST_FLOOR_DOORS_OPEN", "urgency": "INSTANT"},
                {"target": "MAIN_GAS_VALVE", "action": "EMERGENCY_SHUTOFF", "urgency": "INSTANT"},
                {"target": "CLEANROOM_VENTILATION", "action": "HALT_TOXIC_GAS_CONDUITS", "urgency": "INSTANT"},
            ])
            trigger_status = "ACTIVATED_CRITICAL_CUTOFF"
        elif max_station_pgv >= 5.7:
            reflex_actuators.append(
                {"target": "ALARM_STROBES", "action": "TRIGGER_PRE_S_WAVE_CHIME", "urgency": "HIGH"}
            )
            trigger_status = "WARNING_CHIME_ONLY"
        else:
            trigger_status = "STANDBY_BELOW_THRESHOLD"

        reflex_elapsed_ms = round((time.perf_counter() - reflex_start) * 1000, 3)
        reflex_packet = ReflexActionPacket(
            elapsed_ms=reflex_elapsed_ms,
            trigger_status=trigger_status,
            actuators=reflex_actuators
        )

        # =====================================================================
        # TRACK B: DELIBERATIVE MULTI-AGENT COLLABORATION (1-2 seconds)
        # =====================================================================
        delib_start = time.perf_counter()

        # 1. Seismic Source Analyst
        seismic_rep = self.seismic_analyst.analyze(alert)

        # 2. Geotechnical Graph Worker (Spatial Graph Traversal + GMPE Physics Validation)
        # Target primary coordinates: NCU Campus
        ncu_lat, ncu_lon = 24.968, 121.194
        ncu_pgv = next(
            (sp.pred_pgv_cm_s for sp in alert.station_predictions if "NCU" in sp.station_id),
            max_station_pgv
        )
        geotech_rep = self.geotech_worker.evaluate(
            target_lat=ncu_lat,
            target_lon=ncu_lon,
            event_magnitude=alert.predicted_magnitude,
            predicted_pgv=ncu_pgv
        )

        # 3. Structural Triage Worker (Multi-Facility Ranking & Drift Estimation)
        facility_ranks = self.structural_worker.evaluate_facilities(
            predicted_pgv=ncu_pgv,
            facility_ids=target_facility_ids
        )

        # 4. Safety Critic Worker (Verification against ground truth)
        claims = {
            "fault_id": geotech_rep.primary_fault_id,
            "pgv": ncu_pgv,
            "cwa_intensity": facility_ranks[0].cwa_intensity if facility_ranks else "5-Weak"
        }
        critic_res = self.safety_critic.verify_fault_claims(claims)

        delib_elapsed_ms = round((time.perf_counter() - delib_start) * 1000, 2)
        total_elapsed_ms = round((time.perf_counter() - total_start) * 1000, 2)

        # Executive Summary Generation
        top_priority = facility_ranks[0] if facility_ranks else None
        num_cascades = len(geotech_rep.cascading_rupture_scenarios)
        exec_summary = (
            f"Seismic event Mw {alert.predicted_magnitude} detected with lead time {alert.p_wave_trigger_elapsed_sec}s. "
            f"Reflex Track triggered {len(reflex_actuators)} actuators in {reflex_elapsed_ms} ms. "
            f"Primary seismogenic structure is {geotech_rep.primary_fault_name} ({geotech_rep.primary_fault_distance_km} km away). "
            f"TEM Table 2 identifies {num_cascades} possible coseismic rupture pairings. "
            f"Highest priority facility: {top_priority.facility_name if top_priority else 'N/A'} "
            f"(Triage: {top_priority.triage_level if top_priority else 'N/A'}, Est. Drift: {top_priority.est_drift_ratio_pct if top_priority else 'N/A'}%). "
            f"Physics consistency: {geotech_rep.gmpe_physics_validation.anomaly_flag}. "
            f"Safety Critic status: {critic_res.critic_notes}"
        )

        return DualTrackTriageDispatch(
            dispatch_id=f"DISPATCH-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
            alert_reference=alert.alert_id,
            timestamp_utc=datetime.now(timezone.utc).isoformat(),
            reflex_track_latency_ms=reflex_elapsed_ms,
            deliberative_track_latency_ms=delib_elapsed_ms,
            total_processing_latency_ms=total_elapsed_ms,
            reflex_packet=reflex_packet,
            seismic_analysis=seismic_rep,
            geotech_report=geotech_rep,
            facility_rankings=facility_ranks,
            safety_verification=critic_res,
            executive_summary=exec_summary
        )
