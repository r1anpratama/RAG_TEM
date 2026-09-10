"""Spatial-Geotechnical Knowledge Graph (Geo-GraphRAG) for Taiwan Earthquake Model & Infrastructure."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple

from src.domain.fault import FaultCatalog, haversine_distance_km
from src.domain.seismic import BuildingEra


class NodeType(str, Enum):
    FAULT = "FAULT"
    MULTI_RUPTURE_PAIR = "MULTI_RUPTURE_PAIR"
    FACILITY = "FACILITY"
    LIFELINE = "LIFELINE"


class EdgeType(str, Enum):
    RUPTURES_WITH = "RUPTURES_WITH"
    PROXIMATE_TO = "PROXIMATE_TO"
    DEPENDS_ON = "DEPENDS_ON"
    GOVERNED_BY = "GOVERNED_BY"


@dataclass
class GraphNode:
    """A node in the spatial-geotechnical knowledge graph."""
    id: str
    name: str
    node_type: NodeType
    properties: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    """A directed, attributed relationship in the knowledge graph."""
    source_id: str
    target_id: str
    edge_type: EdgeType
    properties: Dict[str, Any] = field(default_factory=dict)


class GeoGraph:
    """In-memory Spatial-Geotechnical Knowledge Graph for fast relational and multi-hop reasoning."""

    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges_out: Dict[str, List[GraphEdge]] = {}
        self.edges_in: Dict[str, List[GraphEdge]] = {}

    def add_node(self, node: GraphNode) -> None:
        self.nodes[node.id] = node
        if node.id not in self.edges_out:
            self.edges_out[node.id] = []
        if node.id not in self.edges_in:
            self.edges_in[node.id] = []

    def add_edge(self, edge: GraphEdge) -> None:
        if edge.source_id not in self.nodes or edge.target_id not in self.nodes:
            raise KeyError(f"Both source {edge.source_id} and target {edge.target_id} must exist in graph.")
        self.edges_out[edge.source_id].append(edge)
        self.edges_in[edge.target_id].append(edge)

    def get_node(self, node_id: str) -> Optional[GraphNode]:
        return self.nodes.get(node_id)

    def get_cascading_ruptures(self, fault_id: int) -> List[Dict[str, Any]]:
        """Query multi-structure rupture pairings for a fault based on TEM PSHA2025 Table 2."""
        f_node_id = f"FAULT_{fault_id}"
        scenarios = []

        for edge in self.edges_out.get(f_node_id, []):
            if edge.edge_type == EdgeType.RUPTURES_WITH:
                paired_node = self.nodes.get(edge.target_id)
                if paired_node:
                    scenarios.append({
                        "paired_fault_id": paired_node.properties.get("fault_id"),
                        "paired_fault_name": paired_node.name,
                        "combined_mw": edge.properties.get("combined_mw"),
                        "recurrence_interval_yr": edge.properties.get("recurrence_interval_yr"),
                        "pairing_label": edge.properties.get("pairing_label"),
                        "citation": "TEM PSHA2025: Table 2"
                    })

        return scenarios

    def get_facilities_at_risk(self, fault_id: int, max_distance_km: float = 30.0) -> List[Dict[str, Any]]:
        """Find all facilities proximate to a given fault within the threshold radius."""
        f_node_id = f"FAULT_{fault_id}"
        at_risk = []

        for edge in self.edges_in.get(f_node_id, []):
            if edge.edge_type == EdgeType.PROXIMATE_TO:
                dist = edge.properties.get("distance_km", float("inf"))
                if dist <= max_distance_km:
                    fac_node = self.nodes.get(edge.source_id)
                    if fac_node and fac_node.node_type == NodeType.FACILITY:
                        at_risk.append({
                            "facility_id": fac_node.id,
                            "facility_name": fac_node.name,
                            "distance_km": dist,
                            "building_era": fac_node.properties.get("building_era"),
                            "fundamental_period_s": fac_node.properties.get("fundamental_period_s"),
                            "occupancy": fac_node.properties.get("occupancy")
                        })

        return sorted(at_risk, key=lambda x: x["distance_km"])

    def get_facility_lifelines(self, facility_id: str) -> List[Dict[str, Any]]:
        """Identify critical lifelines (gas, power, chemicals) connected to a facility."""
        lifelines = []
        for edge in self.edges_out.get(facility_id, []):
            if edge.edge_type == EdgeType.DEPENDS_ON:
                line_node = self.nodes.get(edge.target_id)
                if line_node:
                    lifelines.append({
                        "lifeline_id": line_node.id,
                        "lifeline_name": line_node.name,
                        "service_type": line_node.properties.get("service_type"),
                        "cutoff_actuator": line_node.properties.get("cutoff_actuator"),
                        "hazard_impact": edge.properties.get("hazard_impact")
                    })
        return lifelines


def build_taiwan_seismic_graph(fault_catalog: Optional[FaultCatalog] = None) -> GeoGraph:
    """Build the comprehensive Spatial-Geotechnical Knowledge Graph with TEM Table 2 multi-rupture pairs."""
    catalog = fault_catalog or FaultCatalog.load_from_excel()
    graph = GeoGraph()

    # 1. Add all 38 On-Land Fault Nodes
    for f in catalog.list_all():
        graph.add_node(
            GraphNode(
                id=f"FAULT_{f.id}",
                name=f.name,
                node_type=NodeType.FAULT,
                properties={
                    "fault_id": f.id,
                    "fault_type": f.fault_type,
                    "rake": f.rake,
                    "dip": f.dip,
                    "depth_max_km": f.depth_max_km,
                    "mw_max": f.mw_max,
                    "slip_rate_mm_yr": f.slip_rate_mm_yr
                }
            )
        )

    # 2. Add Multi-Structure Rupture Pairings from TEM PSHA2025 Table 2
    # Format: (fault_id_1, fault_id_2, combined_mw, recurrence_yr, label)
    table_2_pairings = [
        (1, 1, 7.11, 1907, "01+O01 Shanchiao + Outer Chinshan"),
        (2, 3, 6.56, 11332, "02+03 Shuanglienpo + Yangmei"),
        (2, 4, 6.91, 7253, "02+04 Shuanglienpo + Hukou"),
        (4, 5, 7.09, 1264, "04+05 Hukou + Fengshan River"),
        (4, 6, 6.90, 6610, "04+06 Hukou + Hsinchu"),
        (6, 8, 6.72, 2820, "06+08 Hsinchu + Hsinchu frontal"),
        (6, 9, 6.76, 2175, "06+09 Hsinchu + Touhuanping"),
        (9, 10, 6.94, 1288, "09+10 Touhuanping + Miaoli frontal"),
        (10, 15, 7.10, 2422, "10+15 Miaoli frontal + Tuntzuchiao"),
        (11, 14, 7.08, 4556, "11+14 Tunglo + Sanyi"),
        (13, 14, 7.23, 4407, "13+14 Shihtan + Sanyi"),
        (13, 15, 7.16, 4787, "13+15 Shihtan + Tuntzuchiao (1935 Quake)"),
        (19, 22, 7.13, 510, "19+22 Chiuchiungkeng + Muchiliao-Liuchia"),
        (20, 21, 7.27, 1902, "20+21 Meishan + Chiayi frontal"),
    ]

    for f1, f2, mw, rec_yr, label in table_2_pairings:
        src_id, tgt_id = f"FAULT_{f1}", f"FAULT_{f2}"
        if src_id in graph.nodes and tgt_id in graph.nodes and f1 != f2:
            # Bidirectional pairing
            graph.add_edge(GraphEdge(
                source_id=src_id,
                target_id=tgt_id,
                edge_type=EdgeType.RUPTURES_WITH,
                properties={"combined_mw": mw, "recurrence_interval_yr": rec_yr, "pairing_label": label}
            ))
            graph.add_edge(GraphEdge(
                source_id=tgt_id,
                target_id=src_id,
                edge_type=EdgeType.RUPTURES_WITH,
                properties={"combined_mw": mw, "recurrence_interval_yr": rec_yr, "pairing_label": label}
            ))

    # 3. Add Lifelines Nodes
    lifelines_data = [
        ("LIFELINE_GAS_MAIN", "Campus Natural Gas Main Feeder", "GAS", "MAIN_GAS_VALVE"),
        ("LIFELINE_POWER_161KV", "Taipower 161kV Regional Substation", "POWER", "BREAKER_MAIN_TRIP"),
        ("LIFELINE_TOXIC_CONDUIT", "Science Park Toxic Gas Exhaust Line", "CHEMICAL", "CLEANROOM_VENTILATION"),
    ]
    for lid, lname, stype, act in lifelines_data:
        graph.add_node(GraphNode(
            id=lid,
            name=lname,
            node_type=NodeType.LIFELINE,
            properties={"service_type": stype, "cutoff_actuator": act}
        ))

    # 4. Add Digital Twin Facility Nodes
    facilities_data = [
        ("FAC_NCU_SCIENCE_B4", "NCU Science Building 4 (Physics/Geophysics)", 24.968, 121.194, BuildingEra.PRE_1999, 0.45, "Students & Lab Researchers", ["LIFELINE_GAS_MAIN", "LIFELINE_TOXIC_CONDUIT"]),
        ("FAC_NCU_ENG_B5", "NCU Engineering Building 5 (Semiconductor Lab)", 24.969, 121.192, BuildingEra.POST_1999, 0.60, "Graduate Research Staff", ["LIFELINE_POWER_161KV", "LIFELINE_TOXIC_CONDUIT"]),
        ("FAC_NCU_LIBRARY", "NCU Main Library", 24.967, 121.196, BuildingEra.POST_1999, 0.85, "General Campus Public", ["LIFELINE_POWER_161KV"]),
        ("FAC_HSP_TSMC_FAB", "Hsinchu Science Park Advanced Fab", 24.780, 121.000, BuildingEra.POST_1999, 2.20, "24/7 Automated Cleanroom", ["LIFELINE_GAS_MAIN", "LIFELINE_POWER_161KV", "LIFELINE_TOXIC_CONDUIT"]),
    ]

    for fid, fname, flat, flon, era, t1, occ, lines in facilities_data:
        graph.add_node(GraphNode(
            id=fid,
            name=fname,
            node_type=NodeType.FACILITY,
            properties={
                "latitude": flat,
                "longitude": flon,
                "building_era": era.value,
                "fundamental_period_s": t1,
                "occupancy": occ
            }
        ))

        # Add DEPENDS_ON edges to lifelines
        for line_id in lines:
            graph.add_edge(GraphEdge(
                source_id=fid,
                target_id=line_id,
                edge_type=EdgeType.DEPENDS_ON,
                properties={"hazard_impact": "Secondary fire or toxic inhalation risk upon rupture"}
            ))

        # Add PROXIMATE_TO edges to active faults within 40 km
        for f in catalog.list_all():
            align = catalog.get_alignment(f.id)
            if not align or not align.coordinates:
                continue
            # calculate minimum distance to fault trace
            min_dist = min(haversine_distance_km(flat, flon, lat, lon) for lon, lat in align.coordinates)
            if min_dist <= 40.0:
                graph.add_edge(GraphEdge(
                    source_id=fid,
                    target_id=f"FAULT_{f.id}",
                    edge_type=EdgeType.PROXIMATE_TO,
                    properties={"distance_km": round(min_dist, 2)}
                ))

    return graph
