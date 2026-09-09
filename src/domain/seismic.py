"""Seismic intensity calibration and real-time facility triage logic."""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


class CWAIntensity(str, Enum):
    """Official Central Weather Administration (Taiwan) Seismic Intensity Scale (2020 revision)."""
    LEVEL_0 = "0 - Micro"
    LEVEL_1 = "1 - Very Minor"
    LEVEL_2 = "2 - Minor"
    LEVEL_3 = "3 - Light"
    LEVEL_4 = "4 - Moderate"
    LEVEL_5_WEAK = "5-Weak"
    LEVEL_5_STRONG = "5-Strong"
    LEVEL_6_WEAK = "6-Weak"
    LEVEL_6_STRONG = "6-Strong"
    LEVEL_7 = "7 - Great"


class BuildingEra(str, Enum):
    """Building construction era regarding seismic design code revision."""
    PRE_1999 = "Pre-1999 (High Vulnerability / Soft-Story Risk)"
    POST_1999 = "Post-1999 (Modern Ductile Moment Frame)"


class TriageLevel(str, Enum):
    """Emergency response triage priority level."""
    GREEN_NORMAL = "GREEN_NORMAL"
    AMBER_WARNING = "AMBER_WARNING"
    RED_CRITICAL = "RED_CRITICAL"


@dataclass(frozen=True)
class SCADAAction:
    """Automated machine control directive."""
    target: str
    action: str
    urgency: str = "IMMEDIATE"


@dataclass
class TriageResult:
    """Complete evaluation outcome for a monitored facility."""
    facility_name: str
    building_era: BuildingEra
    predicted_pgv_cm_s: float
    cwa_intensity: CWAIntensity
    triage_level: TriageLevel
    collapse_probability: float
    scada_actions: List[SCADAAction]
    evacuation_advice: str


def classify_cwa_intensity(pgv_cm_s: float) -> CWAIntensity:
    """Classify Peak Ground Velocity (PGV in cm/s) to official CWA seismic intensity level."""
    if pgv_cm_s < 0.2:
        return CWAIntensity.LEVEL_0
    elif pgv_cm_s < 0.7:
        return CWAIntensity.LEVEL_1
    elif pgv_cm_s < 1.9:
        return CWAIntensity.LEVEL_2
    elif pgv_cm_s < 5.7:
        return CWAIntensity.LEVEL_3
    elif pgv_cm_s < 15.0:
        return CWAIntensity.LEVEL_4
    elif pgv_cm_s < 30.0:
        return CWAIntensity.LEVEL_5_WEAK
    elif pgv_cm_s < 50.0:
        return CWAIntensity.LEVEL_5_STRONG
    elif pgv_cm_s < 80.0:
        return CWAIntensity.LEVEL_6_WEAK
    elif pgv_cm_s < 140.0:
        return CWAIntensity.LEVEL_6_STRONG
    else:
        return CWAIntensity.LEVEL_7


def evaluate_triage(
    facility_name: str,
    building_era: BuildingEra,
    predicted_pgv_cm_s: float
) -> TriageResult:
    """Evaluate structural vulnerability and determine automated emergency triage directives."""
    intensity = classify_cwa_intensity(predicted_pgv_cm_s)
    scada_actions: List[SCADAAction] = []

    # Automated safety cutoffs trigger when PGV >= 15.0 cm/s (CWA 5-Weak or greater)
    if predicted_pgv_cm_s >= 15.0:
        scada_actions.extend([
            SCADAAction(target="ELEVATORS_ALL", action="HALT_AT_NEAREST_FLOOR_DOORS_OPEN"),
            SCADAAction(target="MAIN_GAS_VALVE", action="EMERGENCY_SHUTOFF"),
            SCADAAction(target="CLEANROOM_VENTILATION", action="HALT_TOXIC_GAS_CONDUITS"),
        ])

    # Structural collapse probability & Triage level determination
    if building_era == BuildingEra.PRE_1999:
        if predicted_pgv_cm_s >= 25.0:
            level = TriageLevel.RED_CRITICAL
            collapse_prob = min(0.95, round(0.30 + (predicted_pgv_cm_s - 25.0) * 0.015, 2))
            advice = "High soft-story collapse risk. Drop, Cover, Hold On immediately. Evacuate immediately once shaking subsides."
        elif predicted_pgv_cm_s >= 10.0:
            level = TriageLevel.AMBER_WARNING
            collapse_prob = 0.12
            advice = "Moderate damage risk to non-structural masonry. Take cover under sturdy tables. Beware falling fixtures."
        else:
            level = TriageLevel.GREEN_NORMAL
            collapse_prob = 0.01
            advice = "Normal operational status. Remain alert and report any visual cracks."
    else:
        # Modern post-1999 ductile structures
        if predicted_pgv_cm_s >= 50.0:
            level = TriageLevel.RED_CRITICAL
            collapse_prob = min(0.75, round(0.15 + (predicted_pgv_cm_s - 50.0) * 0.008, 2))
            advice = "Severe ground motion exceeding ductile design threshold. Protect head and evacuate after main shock."
        elif predicted_pgv_cm_s >= 25.0:
            level = TriageLevel.AMBER_WARNING
            collapse_prob = 0.05
            advice = "Strong shaking expected. Architectural partitions may crack. Hold on; evacuation optional unless gas leaks detected."
        else:
            level = TriageLevel.GREEN_NORMAL
            collapse_prob = 0.002
            advice = "Structure structurally sound. Normal operations can continue."

    return TriageResult(
        facility_name=facility_name,
        building_era=building_era,
        predicted_pgv_cm_s=predicted_pgv_cm_s,
        cwa_intensity=intensity,
        triage_level=level,
        collapse_probability=collapse_prob,
        scada_actions=scada_actions,
        evacuation_advice=advice
    )
