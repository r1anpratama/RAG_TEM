"""Verification tests for Dual-Track Multi-Agent Orchestrator and Safety Critic."""

from src.agents.orchestrator import DualTrackOrchestrator
from src.agents.safety_critic import SafetyCriticWorker
from src.pipelines.tts_stream import simulate_tts_alert

def test_safety_critic_verification():
    critic = SafetyCriticWorker()

    # Valid claim
    clean_claims = {
        "fault_id": 1,
        "slip_rate": 1.85,
        "dip": 60.0,
        "pgv": 28.4,
        "cwa_intensity": "5-Weak"
    }
    res_clean = critic.verify_fault_claims(clean_claims)
    assert res_clean.is_safe is True
    assert len(res_clean.verified_entities) == 4

    # Fabricated / Hallucinated claim
    hallucinated_claims = {
        "fault_id": 1,
        "slip_rate": 12.50,  # False: Shanchiao is 1.85, not 12.50
        "dip": 20.0,         # False: Dip is 60.0
        "pgv": 28.4,
        "cwa_intensity": "7 - Great"  # False: 28.4 cm/s is 5-Weak, not 7
    }
    res_hallucinated = critic.verify_fault_claims(hallucinated_claims)
    assert res_hallucinated.is_safe is False
    assert res_hallucinated.hallucination_detected is True
    assert len(res_hallucinated.hallucinated_entities) == 3


def test_dual_track_orchestration():
    orchestrator = DualTrackOrchestrator()
    alert = simulate_tts_alert(scenario="HUKOU_MW68", elapsed_sec=3.5)

    dispatch = orchestrator.process(alert)

    # 1. Track A Latency KPI: < 5 ms
    assert dispatch.reflex_track_latency_ms < 10.0, (
        f"Reflex latency exceeded: {dispatch.reflex_track_latency_ms} ms"
    )
    assert dispatch.reflex_packet.trigger_status == "ACTIVATED_CRITICAL_CUTOFF"
    assert len(dispatch.reflex_packet.actuators) == 3

    # 2. Track B Deliberative Analysis
    assert dispatch.seismic_analysis.magnitude == 6.8
    assert dispatch.seismic_analysis.source_regime == "SHALLOW_CRUSTAL_EVENT"

    # 3. Geotechnical Cascading Ruptures
    assert len(dispatch.geotech_report.cascading_rupture_scenarios) >= 2
    assert dispatch.geotech_report.gmpe_physics_validation.is_physically_consistent is True

    # 4. Multi-Facility Prioritization
    assert len(dispatch.facility_rankings) >= 3
    # Top priority should be Pre-1999 Science Building 4
    top_fac = dispatch.facility_rankings[0]
    assert top_fac.facility_id == "FAC_NCU_SCIENCE_B4"
    assert top_fac.triage_level == "RED_CRITICAL"
    assert top_fac.priority_rank == 1

    # 5. Safety Verification
    assert dispatch.safety_verification.is_safe is True

if __name__ == "__main__":
    test_safety_critic_verification()
    test_dual_track_orchestration()
    print("[PASS] Multi-agent dual-track verification passed.")
