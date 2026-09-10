"""Specialized agent analyzing real-time seismic waveforms and source characteristics from TT-SAM."""

from dataclasses import dataclass
from typing import Dict, Any
from src.pipelines.tts_stream import TTSAMAlertPacket


@dataclass
class SeismicAnalysisReport:
    """Findings on source characteristics and warning lead time."""
    alert_id: str
    magnitude: float
    hypocenter_depth_km: float
    p_wave_elapsed_sec: float
    source_regime: str
    directivity_threat: str
    urgency_level: str


class SeismicSourceAnalyst:
    """Agent interpreting early warning stream packets emitted by the TT-SAM Transformer."""

    def analyze(self, alert: TTSAMAlertPacket) -> SeismicAnalysisReport:
        # Determine tectonic source regime based on focal depth
        depth = alert.epicenter.estimated_depth_km
        if depth <= 35.0:
            regime = "SHALLOW_CRUSTAL_EVENT"
        elif depth <= 70.0:
            regime = "INTERMEDIATE_DEPTH_BENIOFF"
        else:
            regime = "DEEP_SUBDUCTION_INTERFACE"

        # Evaluate urgency and warning window
        elapsed = alert.p_wave_trigger_elapsed_sec
        if alert.predicted_magnitude >= 7.0:
            urgency = "CATASTROPHIC_TIER_1"
        elif alert.predicted_magnitude >= 6.0:
            urgency = "HIGH_ALERT_TIER_2"
        else:
            urgency = "MODERATE_ALERT_TIER_3"

        # Directivity threat assessment
        directivity = (
            "HIGH_NEAR_SOURCE_FORWARD_DIRECTIVITY" if depth <= 15.0 and alert.predicted_magnitude >= 6.5
            else "NORMAL_RADIATION_PATTERN"
        )

        return SeismicAnalysisReport(
            alert_id=alert.alert_id,
            magnitude=alert.predicted_magnitude,
            hypocenter_depth_km=depth,
            p_wave_elapsed_sec=elapsed,
            source_regime=regime,
            directivity_threat=directivity,
            urgency_level=urgency
        )
