"""End-to-End latency and correctness verification tests for TriageService."""

import json
from src.domain.seismic import BuildingEra
from src.pipelines.triage_service import FacilityConfig, TriageService
from src.pipelines.tts_stream import simulate_tts_alert

def test_triage_service_end_to_end():
    service = TriageService()

    facility_ncu = FacilityConfig(
        facility_id="NCU_ENG4",
        facility_name="NCU Engineering Building 4",
        latitude=24.968,
        longitude=121.194,
        building_era=BuildingEra.PRE_1999
    )

    # 1. Simulate Hukou Mw 6.8 Alert
    alert = simulate_tts_alert(scenario="HUKOU_MW68", elapsed_sec=3.5)
    report = service.process_alert(alert, facility_ncu)

    # KPI Verification: Latency <= 2.0s
    assert report.elapsed_processing_sec < 2.0, (
        f"Latency target exceeded: {report.elapsed_processing_sec}s >= 2.0s"
    )

    # Verification of facility metrics
    assert report.facility_id == "NCU_ENG4"
    assert report.predicted_pgv_cm_s == 28.4
    assert report.triage_level == "RED_CRITICAL"  # Pre-1999 + PGV 28.4 => RED
    assert report.seconds_to_s_wave > 0

    # SCADA verification
    assert len(report.automated_scada_actions) == 3
    targets = [a["target"] for a in report.automated_scada_actions]
    assert "ELEVATORS_ALL" in targets
    assert "MAIN_GAS_VALVE" in targets

    # JSON serialization check
    json_output = report.to_json()
    parsed = json.loads(json_output)
    assert parsed["triage_id"].startswith("TRG-")
    assert len(parsed["grounded_sources"]) >= 2

if __name__ == "__main__":
    test_triage_service_end_to_end()
    print("[PASS] Triage service end-to-end test passed.")
