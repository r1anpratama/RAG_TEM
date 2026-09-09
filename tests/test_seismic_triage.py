"""Verification tests for CWA intensity scale and seismic emergency triage."""

from src.domain.seismic import (
    CWAIntensity,
    BuildingEra,
    TriageLevel,
    classify_cwa_intensity,
    evaluate_triage,
)

def test_cwa_intensity_classification():
    assert classify_cwa_intensity(0.1) == CWAIntensity.LEVEL_0
    assert classify_cwa_intensity(0.5) == CWAIntensity.LEVEL_1
    assert classify_cwa_intensity(1.2) == CWAIntensity.LEVEL_2
    assert classify_cwa_intensity(4.0) == CWAIntensity.LEVEL_3
    assert classify_cwa_intensity(10.0) == CWAIntensity.LEVEL_4
    assert classify_cwa_intensity(20.0) == CWAIntensity.LEVEL_5_WEAK
    assert classify_cwa_intensity(35.0) == CWAIntensity.LEVEL_5_STRONG
    assert classify_cwa_intensity(65.0) == CWAIntensity.LEVEL_6_WEAK
    assert classify_cwa_intensity(100.0) == CWAIntensity.LEVEL_6_STRONG
    assert classify_cwa_intensity(150.0) == CWAIntensity.LEVEL_7


def test_triage_decision_logic():
    # Scenario 1: Severe PGV (28.4 cm/s) on Pre-1999 building (High Vulnerability)
    triage_pre = evaluate_triage(
        facility_name="NCU Science Building 4",
        building_era=BuildingEra.PRE_1999,
        predicted_pgv_cm_s=28.4
    )
    assert triage_pre.triage_level == TriageLevel.RED_CRITICAL
    assert triage_pre.cwa_intensity == CWAIntensity.LEVEL_5_WEAK
    assert triage_pre.collapse_probability > 0.30
    assert len(triage_pre.scada_actions) == 3
    assert any(a.target == "MAIN_GAS_VALVE" for a in triage_pre.scada_actions)

    # Scenario 2: Same PGV (28.4 cm/s) on Post-1999 building (Modern Ductile)
    triage_post = evaluate_triage(
        facility_name="NCU Library Modern Wing",
        building_era=BuildingEra.POST_1999,
        predicted_pgv_cm_s=28.4
    )
    assert triage_post.triage_level == TriageLevel.AMBER_WARNING
    assert triage_post.collapse_probability < 0.10
    # SCADA cutoffs still activate because PGV >= 15.0 cm/s
    assert len(triage_post.scada_actions) == 3

    # Scenario 3: Minor shaking (3.0 cm/s)
    triage_minor = evaluate_triage(
        facility_name="NCU Admin Center",
        building_era=BuildingEra.POST_1999,
        predicted_pgv_cm_s=3.0
    )
    assert triage_minor.triage_level == TriageLevel.GREEN_NORMAL
    assert len(triage_minor.scada_actions) == 0


if __name__ == "__main__":
    test_cwa_intensity_classification()
    test_triage_decision_logic()
    print("[PASS] Seismic triage verification passed.")
