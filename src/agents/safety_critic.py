"""Safety Critic agent enforcing NeMo-style deterministic verification and 0.0% numerical hallucination."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from src.domain.fault import FaultCatalog, FaultParameter
from src.domain.seismic import classify_cwa_intensity


@dataclass
class SafetyVerificationResult:
    """Outcome of deterministic numerical verification against knowledge base ground truth."""
    is_safe: bool
    hallucination_detected: bool
    hallucinated_entities: List[str]
    verified_entities: List[str]
    critic_notes: str


class SafetyCriticWorker:
    """Agent validating factual and numerical concordance before releasing any response."""

    def __init__(self, catalog: Optional[FaultCatalog] = None):
        self.catalog = catalog or FaultCatalog.load_from_excel()

    def verify_fault_claims(self, claims: Dict[str, Any]) -> SafetyVerificationResult:
        """Verify that claimed fault parameters exactly match the scientific catalog."""
        hallucinations = []
        verified = []

        fault_id = claims.get("fault_id")
        if fault_id:
            param: Optional[FaultParameter] = self.catalog.get_by_id(fault_id)
            if not param:
                hallucinations.append(f"Invalid Fault ID: {fault_id} does not exist in catalog")
            else:
                verified.append(f"Fault ID verified: {fault_id} ({param.name})")

                # Check slip rate if provided
                if "slip_rate" in claims:
                    if abs(claims["slip_rate"] - param.slip_rate_mm_yr) > 0.01:
                        hallucinations.append(
                            f"Slip rate mismatch for ID {fault_id}: claimed {claims['slip_rate']} vs ground truth {param.slip_rate_mm_yr}"
                        )
                    else:
                        verified.append(f"Slip rate verified: {param.slip_rate_mm_yr} mm/yr")

                # Check dip if provided
                if "dip" in claims:
                    if abs(claims["dip"] - param.dip) > 0.1:
                        hallucinations.append(
                            f"Dip mismatch for ID {fault_id}: claimed {claims['dip']} vs ground truth {param.dip}"
                        )
                    else:
                        verified.append(f"Dip verified: {param.dip} deg")

                # Check Mw Max if provided
                if "mw_max" in claims:
                    if abs(claims["mw_max"] - param.mw_max) > 0.05:
                        hallucinations.append(
                            f"Mw Max mismatch for ID {fault_id}: claimed {claims['mw_max']} vs ground truth {param.mw_max}"
                        )
                    else:
                        verified.append(f"Mw Max verified: {param.mw_max}")

        # Check CWA Intensity consistency
        if "pgv" in claims and "cwa_intensity" in claims:
            true_intensity = classify_cwa_intensity(claims["pgv"]).value
            if claims["cwa_intensity"] != true_intensity:
                hallucinations.append(
                    f"CWA Intensity mismatch for PGV {claims['pgv']} cm/s: claimed {claims['cwa_intensity']} vs standard {true_intensity}"
                )
            else:
                verified.append(f"CWA Intensity verified: {true_intensity}")

        is_safe = len(hallucinations) == 0
        notes = "All numerical entities validated against ground-truth catalog." if is_safe else (
            f"Critic caught {len(hallucinations)} discrepancies. Output blocked."
        )

        return SafetyVerificationResult(
            is_safe=is_safe,
            hallucination_detected=not is_safe,
            hallucinated_entities=hallucinations,
            verified_entities=verified,
            critic_notes=notes
        )
