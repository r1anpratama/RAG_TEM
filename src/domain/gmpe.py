"""Physics-informed Ground Motion Prediction Equation (GMPE) attenuation engine for Taiwan."""

import math
from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class GMPEValidationResult:
    """Validation outcome of TT-SAM predicted ground motion against empirical GMPE bounds."""
    observed_pgv_cm_s: float
    theoretical_median_pgv_cm_s: float
    lower_bound_pgv_cm_s: float
    upper_bound_pgv_cm_s: float
    is_physically_consistent: bool
    deviation_sigmas: float
    anomaly_flag: str
    reference_model: str


def compute_taiwan_crustal_gmpe_pgv(
    mw: float,
    distance_km: float,
    fault_type: str = "R",
    vs30_m_s: float = 360.0
) -> Dict[str, float]:
    """Calculate median PGV (cm/s) and standard deviation sigma using Taiwan-specific crustal GMPE coefficients.
    
    Calibrated against Lin & Lee (2008) and Campbell & Bozorgnia (2014) logic tree branches in TEM PSHA2025.
    """
    # Safeguard minimum distance
    r_rup = max(1.0, distance_km)

    # Empirical coefficients for PGV in Taiwan active crustal tectonics
    c1 = 1.25
    c2 = 0.85
    c3 = 1.35
    c4 = 4.5
    c5 = 0.22
    sigma_ln = 0.58  # Logarithmic standard deviation (aleatory variability)

    # Style of faulting term (Reverse thrusts produce ~25% higher ground motions in Taiwan)
    f_type = 0.22 if fault_type.upper() in ["R", "REVERSE"] else 0.0

    # Site amplification term relative to reference rock (Vs30 = 760 m/s)
    f_site = 0.35 * math.log(760.0 / max(180.0, vs30_m_s))

    # Log-attenuation relation
    ln_pgv = c1 + (c2 * mw) - (c3 * math.log(r_rup + c4 * math.exp(c5 * mw))) + f_type + f_site
    median_pgv = math.exp(ln_pgv)

    return {
        "median_pgv": round(median_pgv, 2),
        "sigma_ln": sigma_ln,
        "ln_pgv": ln_pgv
    }


def validate_ground_motion_physics(
    predicted_pgv: float,
    mw: float,
    distance_km: float,
    fault_type: str = "R",
    max_sigma_tolerance: float = 2.5
) -> GMPEValidationResult:
    """Validate whether an incoming TT-SAM predicted PGV falls within theoretical physical GMPE confidence intervals."""
    gmpe = compute_taiwan_crustal_gmpe_pgv(mw, distance_km, fault_type)
    median_pgv = gmpe["median_pgv"]
    sigma_ln = gmpe["sigma_ln"]

    if predicted_pgv <= 0:
        return GMPEValidationResult(
            observed_pgv_cm_s=predicted_pgv,
            theoretical_median_pgv_cm_s=median_pgv,
            lower_bound_pgv_cm_s=0.0,
            upper_bound_pgv_cm_s=round(median_pgv * math.exp(max_sigma_tolerance * sigma_ln), 2),
            is_physically_consistent=False,
            deviation_sigmas=99.0,
            anomaly_flag="INVALID_ZERO_OR_NEGATIVE_INPUT",
            reference_model="TEM PSHA2025: Lin & Lee (2008) / CB14"
        )

    # Calculate number of sigmas deviation
    ln_pred = math.log(predicted_pgv)
    ln_med = gmpe["ln_pgv"]
    z_score = abs(ln_pred - ln_med) / sigma_ln

    lower_bound = math.exp(ln_med - max_sigma_tolerance * sigma_ln)
    upper_bound = math.exp(ln_med + max_sigma_tolerance * sigma_ln)

    is_valid = z_score <= max_sigma_tolerance
    anomaly = "PHYSICALLY_CONCORDANT" if is_valid else (
        "ANOMALOUS_OVER_PREDICTION" if predicted_pgv > upper_bound else "ANOMALOUS_UNDER_PREDICTION"
    )

    return GMPEValidationResult(
        observed_pgv_cm_s=predicted_pgv,
        theoretical_median_pgv_cm_s=median_pgv,
        lower_bound_pgv_cm_s=round(lower_bound, 2),
        upper_bound_pgv_cm_s=round(upper_bound, 2),
        is_physically_consistent=is_valid,
        deviation_sigmas=round(z_score, 2),
        anomaly_flag=anomaly,
        reference_model="TEM PSHA2025: Lin & Lee (2008) / CB14"
    )
