"""Verification tests for the Taiwan 38 Active Fault Catalog."""

from src.domain.fault import FaultCatalog, haversine_distance_km

def test_fault_catalog_loading():
    catalog = FaultCatalog.load_from_excel()
    assert catalog.total_faults == 38, f"Expected 38 faults, got {catalog.total_faults}"

    # Test Shanchiao Fault (ID 1)
    shanchiao = catalog.get_by_id(1)
    assert shanchiao is not None
    assert shanchiao.name.lower() == "shanchiao fault"
    assert shanchiao.fault_type == "N"
    assert shanchiao.dip == 60.0
    assert shanchiao.rake == -90.0
    assert shanchiao.mw_max == 7.0
    assert shanchiao.slip_rate_mm_yr == 1.85

    # Test Hukou Fault (ID 4)
    hukou = catalog.get_by_name("Hukou fault")
    assert hukou is not None
    assert hukou.id == 4
    assert hukou.fault_type == "R"
    assert hukou.dip == 30.0
    assert hukou.rake == 90.0
    assert hukou.mw_max == 6.8
    assert hukou.slip_rate_mm_yr == 1.16

    # Test Alignment coordinates
    align = catalog.get_alignment(1)
    assert align is not None
    assert len(align.coordinates) > 10, f"Expected coordinate points for ID 1, got {len(align.coordinates)}"

    # Test NCU Campus proximity query (NCU: 24.968 N, 121.194 E)
    ncu_lat, ncu_lon = 24.968, 121.194
    nearest = catalog.find_nearest_fault(ncu_lat, ncu_lon)
    assert nearest is not None
    # Nearest structure to NCU should be Shuanglienpo (ID 2) or Yangmei (ID 3), within 15 km
    assert nearest.min_distance_km < 15.0, f"Expected nearest fault < 15km, got {nearest.min_distance_km} km"
    assert nearest.fault.id in [2, 3, 4]

if __name__ == "__main__":
    test_fault_catalog_loading()
    print("[PASS] Fault catalog verification passed.")
