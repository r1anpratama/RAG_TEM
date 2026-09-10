"""Verification tests for the Physics-Informed GMPE attenuation engine."""

from src.domain.gmpe import compute_taiwan_crustal_gmpe_pgv, validate_ground_motion_physics

def test_gmpe_calculation():
    # Test near-fault ground motion for Mw 6.8 at 10 km (Hukou scenario)
    res = compute_taiwan_crustal_gmpe_pgv(mw=6.8, distance_km=10.0, fault_type="R")
    median_pgv = res["median_pgv"]
    # Physical ground motion at 10km for Mw 6.8 reverse fault in Taiwan is ~20 to 60 cm/s
    assert 15.0 <= median_pgv <= 65.0, f"Unexpected median PGV: {median_pgv} cm/s"
    assert res["sigma_ln"] > 0.4

def test_gmpe_physics_validation():
    # Scenario A: Concordant ground motion (PGV = 32.0 cm/s for Mw 6.8 at 10 km)
    val_normal = validate_ground_motion_physics(
        predicted_pgv=32.0,
        mw=6.8,
        distance_km=10.0,
        fault_type="R"
    )
    assert val_normal.is_physically_consistent is True
    assert val_normal.anomaly_flag == "PHYSICALLY_CONCORDANT"
    assert val_normal.deviation_sigmas < 2.0

    # Scenario B: Impossible outlier (PGV = 300.0 cm/s for minor Mw 4.5 event at 50 km)
    val_outlier = validate_ground_motion_physics(
        predicted_pgv=300.0,
        mw=4.5,
        distance_km=50.0,
        fault_type="R"
    )
    assert val_outlier.is_physically_consistent is False
    assert val_outlier.anomaly_flag == "ANOMALOUS_OVER_PREDICTION"
    assert val_outlier.deviation_sigmas > 3.0

if __name__ == "__main__":
    test_gmpe_calculation()
    test_gmpe_physics_validation()
    print("[PASS] GMPE physics verification passed.")
