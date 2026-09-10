"""Specialized agent assessing multi-facility vulnerability, drift ratios, and triage rank."""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from src.domain.graph import GeoGraph, NodeType, build_taiwan_seismic_graph
from src.domain.seismic import BuildingEra, CWAIntensity, TriageLevel, classify_cwa_intensity, evaluate_triage


@dataclass
class FacilityAssessmentResult:
    """Detailed structural assessment for an individual facility."""
    facility_id: str
    facility_name: str
    building_era: str
    predicted_pgv_cm_s: float
    cwa_intensity: str
    triage_level: str
    collapse_risk_pct: float
    est_drift_ratio_pct: float
    priority_rank: int
    connected_lifelines: List[str]
    evacuation_advice: str


class StructuralTriageWorker:
    """Agent calculating engineering damage states, inter-story drift, and triage priorities across facilities."""

    def __init__(self, graph: Optional[GeoGraph] = None):
        self.graph = graph or build_taiwan_seismic_graph()

    def evaluate_facilities(
        self,
        predicted_pgv: float,
        facility_ids: Optional[List[str]] = None
    ) -> List[FacilityAssessmentResult]:
        target_ids = facility_ids or [
            "FAC_NCU_SCIENCE_B4",
            "FAC_NCU_ENG_B5",
            "FAC_NCU_LIBRARY",
            "FAC_HSP_TSMC_FAB"
        ]

        assessments: List[FacilityAssessmentResult] = []

        for fid in target_ids:
            node = self.graph.get_node(fid)
            if not node:
                continue

            era_str = node.properties.get("building_era", BuildingEra.POST_1999.value)
            building_era = (
                BuildingEra.PRE_1999 if "Pre-1999" in era_str else BuildingEra.POST_1999
            )
            t1 = node.properties.get("fundamental_period_s", 0.5)

            # Evaluate standard triage
            base_triage = evaluate_triage(
                facility_name=node.name,
                building_era=building_era,
                predicted_pgv_cm_s=predicted_pgv
            )

            # Calculate engineering Inter-Story Drift Ratio (IDR %) surrogate
            # IDR roughly scales with PGV * T1 / building_height
            drift_factor = 0.08 if building_era == BuildingEra.PRE_1999 else 0.045
            est_drift_pct = round(min(5.0, (predicted_pgv * t1 * drift_factor)), 2)

            # Identify connected lifelines
            lifelines = [l["lifeline_name"] for l in self.graph.get_facility_lifelines(fid)]

            assessments.append(
                FacilityAssessmentResult(
                    facility_id=fid,
                    facility_name=node.name,
                    building_era=era_str,
                    predicted_pgv_cm_s=predicted_pgv,
                    cwa_intensity=base_triage.cwa_intensity.value,
                    triage_level=base_triage.triage_level.value,
                    collapse_risk_pct=round(base_triage.collapse_probability * 100, 1),
                    est_drift_ratio_pct=est_drift_pct,
                    priority_rank=0,  # assigned below
                    connected_lifelines=lifelines,
                    evacuation_advice=base_triage.evacuation_advice
                )
            )

        # Sort priority: RED_CRITICAL first, then highest collapse risk, then highest drift
        def sort_key(item: FacilityAssessmentResult):
            tier_val = 3 if item.triage_level == "RED_CRITICAL" else (2 if item.triage_level == "AMBER_WARNING" else 1)
            return (tier_val, item.collapse_risk_pct, item.est_drift_ratio_pct)

        sorted_assessments = sorted(assessments, key=sort_key, reverse=True)
        for rank, item in enumerate(sorted_assessments, start=1):
            item.priority_rank = rank

        return sorted_assessments
