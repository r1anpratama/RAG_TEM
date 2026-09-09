"""End-to-End Real-Time Triage Engine executing automated facility assessments under 2 seconds."""

import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional
import json

from src.domain.fault import FaultCatalog, FaultDistanceResult
from src.domain.seismic import BuildingEra, TriageResult, evaluate_triage
from src.pipelines.retrieval import HybridRetriever, SearchResult
from src.pipelines.tts_stream import TTSAMAlertPacket, StationPrediction


@dataclass
class FacilityConfig:
    """Configuration for a monitored campus or industrial facility."""
    facility_id: str
    facility_name: str
    latitude: float
    longitude: float
    building_era: BuildingEra


@dataclass
class EmergencyTriageReport:
    """Full emergency decision and triage output compliant with PRD Section 6.3."""
    triage_id: str
    alert_reference: str
    response_timestamp: str
    elapsed_processing_sec: float
    facility_id: str
    facility_name: str
    structural_code_era: str
    predicted_pgv_cm_s: float
    cwa_intensity: str
    triage_level: str
    collapse_probability: float
    seconds_to_s_wave: float
    nearest_fault_name: str
    nearest_fault_distance_km: float
    automated_scada_actions: List[Dict[str, str]]
    evacuation_instructions: str
    grounded_sources: List[str]

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)


class TriageService:
    """Autonomous agentic triage service orchestrating fault catalogs, intensity models, and PSHA retrieval."""

    def __init__(
        self,
        fault_catalog: Optional[FaultCatalog] = None,
        retriever: Optional[HybridRetriever] = None
    ):
        self.fault_catalog = fault_catalog or FaultCatalog.load_from_excel()
        self.retriever = retriever or HybridRetriever.from_pdf()

    def process_alert(
        self,
        alert: TTSAMAlertPacket,
        facility: FacilityConfig
    ) -> EmergencyTriageReport:
        """Process incoming TT-SAM alert packet and issue emergency facility triage."""
        start_time = time.perf_counter()

        # 1. Match facility to closest station prediction in the alert
        matched_pred: Optional[StationPrediction] = None
        min_dist_to_station = float("inf")
        for sp in alert.station_predictions:
            # Simple squared distance for microsecond station match
            d2 = (sp.latitude - facility.latitude) ** 2 + (sp.longitude - facility.longitude) ** 2
            if d2 < min_dist_to_station:
                min_dist_to_station = d2
                matched_pred = sp

        predicted_pgv = matched_pred.pred_pgv_cm_s if matched_pred else 10.0
        seconds_to_s = matched_pred.estimated_s_arrival_sec if matched_pred else 5.0

        # 2. Compute nearest active seismogenic fault
        nearest_fault_res = self.fault_catalog.find_nearest_fault(facility.latitude, facility.longitude)
        fault_name = nearest_fault_res.fault.name if nearest_fault_res else "Unknown"
        fault_dist = nearest_fault_res.min_distance_km if nearest_fault_res else 0.0

        # 3. Evaluate structural vulnerability and automated SCADA triggers
        triage_eval: TriageResult = evaluate_triage(
            facility_name=facility.facility_name,
            building_era=facility.building_era,
            predicted_pgv_cm_s=predicted_pgv
        )

        # 4. Context retrieval from TEM PSHA2025
        retrieval_query = f"{fault_name} rupture hazard ground motion peak velocity"
        search_results = self.retriever.search(retrieval_query, top_k=2)

        grounded_sources = [
            f"TT-SAM Early Warning: Alert ID {alert.alert_id} (P-delay: {alert.p_wave_trigger_elapsed_sec}s)",
            f"TEM Seismogenic Catalog: Fault ID {nearest_fault_res.fault.id} ({fault_name}), Distance: {fault_dist} km",
        ]
        for sr in search_results:
            grounded_sources.append(
                f"TEM PSHA2025 (Page {sr.chunk.page_number}): {sr.chunk.text[:80]}..."
            )

        elapsed_sec = round(time.perf_counter() - start_time, 4)

        report = EmergencyTriageReport(
            triage_id=f"TRG-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')[:21]}",
            alert_reference=alert.alert_id,
            response_timestamp=datetime.now(timezone.utc).isoformat(),
            elapsed_processing_sec=elapsed_sec,
            facility_id=facility.facility_id,
            facility_name=facility.facility_name,
            structural_code_era=facility.building_era.value,
            predicted_pgv_cm_s=predicted_pgv,
            cwa_intensity=triage_eval.cwa_intensity.value,
            triage_level=triage_eval.triage_level.value,
            collapse_probability=triage_eval.collapse_probability,
            seconds_to_s_wave=seconds_to_s,
            nearest_fault_name=fault_name,
            nearest_fault_distance_km=fault_dist,
            automated_scada_actions=[asdict(a) for a in triage_eval.scada_actions],
            evacuation_instructions=triage_eval.evacuation_advice,
            grounded_sources=grounded_sources
        )

        return report
