"""Interactive demonstration of the SeismoAgent-TW real-time emergency triage engine."""

import sys
from src.domain.seismic import BuildingEra
from src.pipelines.triage_service import FacilityConfig, TriageService
from src.pipelines.tts_stream import simulate_tts_alert

def main():
    print("=" * 70)
    print(" SeismoAgent-TW: Real-Time Multimodal Seismic Triage Engine")
    print(" National Central University (NCU) x NVIDIA AI Enterprise")
    print("=" * 70)

    # 1. Initialize Triage Service
    print("\n[1/3] Initializing Triage Engine & Loading Geotechnical Knowledge...")
    service = TriageService()
    print("  -> Loaded 38 active fault structures from catalog.")
    print(f"  -> Vectorized {len(service.retriever.chunks)} TEM PSHA2025 document chunks.")

    # 2. Configure Monitored Facility
    facility = FacilityConfig(
        facility_id="NCU_SCIENCE_B4",
        facility_name="NCU Science Building 4 (Physics/Earth Sciences)",
        latitude=24.968,
        longitude=121.194,
        building_era=BuildingEra.PRE_1999
    )
    print(f"\n[2/3] Monitored Facility: {facility.facility_name}")
    print(f"  -> Coordinates: ({facility.latitude} N, {facility.longitude} E)")
    print(f"  -> Era: {facility.building_era.value}")

    # 3. Ingest Incoming Simulated Alert
    print("\n[3/3] Incoming Real-Time Alert from TT-SAM Engine (Chen et al., 2026)...")
    alert = simulate_tts_alert(scenario="HUKOU_MW68", elapsed_sec=3.5)
    print(f"  -> Alert ID: {alert.alert_id}")
    print(f"  -> Source: Mw {alert.predicted_magnitude} near Hukou / Taoyuan")
    print(f"  -> P-Wave Elapsed Time: {alert.p_wave_trigger_elapsed_sec} s")

    # 4. Execute Fast Triage
    report = service.process_alert(alert, facility)

    print("\n" + "=" * 70)
    print(f" EMERGENCY TRIAGE DIRECTIVE [LATENCY: {report.elapsed_processing_sec * 1000:.2f} ms]")
    print("=" * 70)
    print(f" Triage Level        : {report.triage_level}")
    print(f" Predicted PGV       : {report.predicted_pgv_cm_s} cm/s ({report.cwa_intensity})")
    print(f" Est. Collapse Risk  : {report.collapse_probability * 100:.1f} %")
    print(f" S-Wave Countdown    : {report.seconds_to_s_wave} seconds")
    print(f" Nearest Active Fault: {report.nearest_fault_name} ({report.nearest_fault_distance_km} km)")
    print("-" * 70)
    print(" AUTOMATED SCADA MACHINE COMMANDS:")
    for idx, act in enumerate(report.automated_scada_actions, start=1):
        print(f"   [{idx}] Target: {act['target']:<24} Action: {act['action']:<32} [{act['urgency']}]")
    print("-" * 70)
    print(f" EVACUATION DIRECTIVE:")
    print(f"   {report.evacuation_instructions}")
    print("-" * 70)
    print(" GROUNDED SOURCES & CITATIONS:")
    for src in report.grounded_sources:
        print(f"   * {src}")
    print("=" * 70)

if __name__ == "__main__":
    main()
