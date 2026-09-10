"""Verification tests for the Spatial-Geotechnical Knowledge Graph (GeoGraph)."""

from src.domain.graph import GeoGraph, NodeType, EdgeType, build_taiwan_seismic_graph

def test_graph_construction_and_traversal():
    graph = build_taiwan_seismic_graph()

    # 1. Node count verification
    fault_nodes = [n for n in graph.nodes.values() if n.node_type == NodeType.FAULT]
    assert len(fault_nodes) == 38, f"Expected 38 fault nodes, got {len(fault_nodes)}"

    facility_nodes = [n for n in graph.nodes.values() if n.node_type == NodeType.FACILITY]
    assert len(facility_nodes) >= 4, "Expected campus & regional facility digital twins"

    lifeline_nodes = [n for n in graph.nodes.values() if n.node_type == NodeType.LIFELINE]
    assert len(lifeline_nodes) >= 3, "Expected lifeline infrastructure nodes"

    # 2. Multi-structure rupture pairing verification (TEM PSHA2025 Table 2)
    # Test Shuanglienpo structure (ID 2): should pair with Yangmei (ID 3) and Hukou (ID 4)
    cascades_id2 = graph.get_cascading_ruptures(fault_id=2)
    assert len(cascades_id2) >= 2, f"Expected >= 2 pairings for ID 2, got {len(cascades_id2)}"
    paired_ids = [c["paired_fault_id"] for c in cascades_id2]
    assert 3 in paired_ids, "Shuanglienpo should pair with Yangmei (ID 3)"
    assert 4 in paired_ids, "Shuanglienpo should pair with Hukou (ID 4)"

    # Check elevated magnitude in pairing
    hukou_pairing = next(c for c in cascades_id2 if c["paired_fault_id"] == 4)
    assert hukou_pairing["combined_mw"] == 6.91
    assert hukou_pairing["recurrence_interval_yr"] == 7253

    # 3. Spatial proximity query: Facilities near Shuanglienpo fault (ID 2)
    near_id2 = graph.get_facilities_at_risk(fault_id=2, max_distance_km=15.0)
    assert len(near_id2) >= 2
    near_names = [f["facility_name"] for f in near_id2]
    assert any("Science Building 4" in name for name in near_names)

    # 4. Lifeline query: Dependencies for NCU Science B4
    lifelines = graph.get_facility_lifelines("FAC_NCU_SCIENCE_B4")
    assert len(lifelines) >= 2
    actuators = [l["cutoff_actuator"] for l in lifelines]
    assert "MAIN_GAS_VALVE" in actuators

if __name__ == "__main__":
    test_graph_construction_and_traversal()
    print("[PASS] GeoGraph verification passed.")
