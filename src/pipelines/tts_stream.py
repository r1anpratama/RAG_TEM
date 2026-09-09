"""TT-SAM (Taiwan Transformer Shaking Alert Model) streaming alert schemas and simulator."""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional
import json


@dataclass
class StationPrediction:
    """Predicted ground shaking parameters at a specific monitoring site."""
    station_id: str
    latitude: float
    longitude: float
    pred_pgv_cm_s: float
    cwa_intensity_level: str
    estimated_s_arrival_sec: float


@dataclass
class Epicenter:
    """Estimated seismic source hypocenter."""
    estimated_latitude: float
    estimated_longitude: float
    estimated_depth_km: float


@dataclass
class TTSAMAlertPacket:
    """Real-time early warning packet emitted by TT-SAM inference engine."""
    alert_id: str
    timestamp_utc: str
    p_wave_trigger_elapsed_sec: float
    epicenter: Epicenter
    predicted_magnitude: float
    station_predictions: List[StationPrediction]

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)

    @classmethod
    def from_json(cls, json_str: str) -> "TTSAMAlertPacket":
        data = json.loads(json_str)
        epicenter = Epicenter(**data["epicenter"])
        station_preds = [StationPrediction(**sp) for sp in data["station_predictions"]]
        return cls(
            alert_id=data["alert_id"],
            timestamp_utc=data["timestamp_utc"],
            p_wave_trigger_elapsed_sec=data["p_wave_trigger_elapsed_sec"],
            epicenter=epicenter,
            predicted_magnitude=data["predicted_magnitude"],
            station_predictions=station_preds
        )


def simulate_tts_alert(
    scenario: str = "HUKOU_MW68",
    elapsed_sec: float = 3.5
) -> TTSAMAlertPacket:
    """Generate a realistic TT-SAM alert packet replicating Chen et al. (2026) rolling outputs."""
    now_utc = datetime.now(timezone.utc).isoformat()

    if scenario == "SHANCHIAO_MW70":
        # Critical event on Shanchiao fault (ID 1), near Taipei / North Taiwan
        return TTSAMAlertPacket(
            alert_id=f"TTSAM-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-SC01",
            timestamp_utc=now_utc,
            p_wave_trigger_elapsed_sec=elapsed_sec,
            epicenter=Epicenter(
                estimated_latitude=25.05,
                estimated_longitude=121.45,
                estimated_depth_km=10.5
            ),
            predicted_magnitude=7.0,
            station_predictions=[
                StationPrediction(
                    station_id="NCU_CAMPUS",
                    latitude=24.968,
                    longitude=121.194,
                    pred_pgv_cm_s=34.2,
                    cwa_intensity_level="5-Strong",
                    estimated_s_arrival_sec=max(1.0, round(9.5 - elapsed_sec, 2))
                ),
                StationPrediction(
                    station_id="TAIPEI_MAIN",
                    latitude=25.047,
                    longitude=121.517,
                    pred_pgv_cm_s=48.6,
                    cwa_intensity_level="5-Strong",
                    estimated_s_arrival_sec=max(0.5, round(6.0 - elapsed_sec, 2))
                )
            ]
        )
    else:
        # Default scenario: Hukou Fault (ID 4), near Taoyuan / Hsinchu border
        return TTSAMAlertPacket(
            alert_id=f"TTSAM-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-HK04",
            timestamp_utc=now_utc,
            p_wave_trigger_elapsed_sec=elapsed_sec,
            epicenter=Epicenter(
                estimated_latitude=24.87,
                estimated_longitude=121.05,
                estimated_depth_km=8.2
            ),
            predicted_magnitude=6.8,
            station_predictions=[
                StationPrediction(
                    station_id="NCU_CAMPUS",
                    latitude=24.968,
                    longitude=121.194,
                    pred_pgv_cm_s=28.4,
                    cwa_intensity_level="5-Weak",
                    estimated_s_arrival_sec=max(1.0, round(7.8 - elapsed_sec, 2))
                ),
                StationPrediction(
                    station_id="HSINCHU_SCIENCE_PARK",
                    latitude=24.780,
                    longitude=121.000,
                    pred_pgv_cm_s=42.1,
                    cwa_intensity_level="5-Strong",
                    estimated_s_arrival_sec=max(0.8, round(5.2 - elapsed_sec, 2))
                )
            ]
        )
