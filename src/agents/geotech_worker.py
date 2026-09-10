"""Specialized agent performing spatial graph traversal and physics-informed GMPE attenuation validation."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from src.domain.fault import FaultCatalog, FaultDistanceResult
from src.domain.gmpe import GMPEValidationResult, validate_ground_motion_physics
from src.domain.graph import GeoGraph, build_taiwan_seismic_graph


@dataclass
class GeotechGraphReport:
    """Findings from spatial graph traversal, cascading fault pairings, and GMPE physics."""
    primary_fault_id: int
    primary_fault_name: str
    primary_fault_distance_km: float
    cascading_rupture_scenarios: List[Dict[str, Any]]
    gmpe_physics_validation: GMPEValidationResult
    graph_provenance: List[str]


class GeotechnicalGraphWorker:
    """Agent interrogating the Spatial-Geotechnical Knowledge Graph (GeoGraph)."""

    def __init__(self, graph: Optional[GeoGraph] = None, catalog: Optional[FaultCatalog] = None):
        self.catalog = catalog or FaultCatalog.load_from_excel()
        self.graph = graph or build_taiwan_seismic_graph(self.catalog)

    def evaluate(
        self,
        target_lat: float,
        target_lon: float,
        event_magnitude: float,
        predicted_pgv: float
    ) -> GeotechGraphReport:
        # 1. Locate closest active fault
        nearest: Optional[FaultDistanceResult] = self.catalog.find_nearest_fault(target_lat, target_lon)
        fault_id = nearest.fault.id if nearest else 1
        fault_name = nearest.fault.name if nearest else "Unknown"
        fault_dist = nearest.min_distance_km if nearest else 10.0
        fault_type = nearest.fault.fault_type if nearest else "R"

        # 2. Multi-hop traversal: Query Table 2 cascading rupture pairings
        cascades = self.graph.get_cascading_ruptures(fault_id)

        # 3. Physics-informed attenuation check
        gmpe_result = validate_ground_motion_physics(
            predicted_pgv=predicted_pgv,
            mw=event_magnitude,
            distance_km=fault_dist,
            fault_type=fault_type
        )

        provenance = [
            f"GeoGraph Node: FAULT_{fault_id} ({fault_name}) [Slip: {nearest.fault.slip_rate_mm_yr} mm/yr, Dip: {nearest.fault.dip}°]",
            f"Spatial Edge: Proximity to ({target_lat}, {target_lon}) = {fault_dist} km",
        ]
        for c in cascades:
            provenance.append(
                f"Graph Rupture Edge: {c['pairing_label']} (Combined Mw: {c['combined_mw']}, Recurrence: {c['recurrence_interval_yr']} yr)"
            )

        return GeotechGraphReport(
            primary_fault_id=fault_id,
            primary_fault_name=fault_name,
            primary_fault_distance_km=fault_dist,
            cascading_rupture_scenarios=cascades,
            gmpe_physics_validation=gmpe_result,
            graph_provenance=provenance
        )
