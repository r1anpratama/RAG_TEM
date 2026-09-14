"""Tests for the three practical TEM PSHA utilization scenarios.

Scenario A: OpenQuake PSHA Engine input XML source model for Shanchiao Fault.
Scenario B: Shallow crustal Ground Motion Model (GMM) audit and justification.
Scenario C: Site-specific hazard increase explanation for Hsinchu and Miaoli.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from website.backend.app.rag.psha_knowledge import (
    answer_from_catalog,
    _openquake_shanchiao_answer,
    _gmpe_audit_answer,
    _hsinchu_miaoli_hazard_answer,
)


def test_scenario_a_openquake_shanchiao():
    """Verify Scenario A produces valid OpenQuake XML with Table 1, Table 2, and Figure 6 values."""
    res = _openquake_shanchiao_answer()
    assert "answer" in res
    assert "citation" in res
    ans = res["answer"]

    # Parameter checks
    assert "54.1" in ans  # Length
    assert "19.44" in ans  # Width
    assert "1051.7" in ans  # Area
    assert "01+O01" in ans  # Multi-rupture pairing
    assert "1312.875" in ans  # Combined area
    assert "7.13" in ans  # Combined Mw
    assert "1.66" in ans  # Geologic slip rate
    assert "1.56" in ans  # Geodetic slip rate
    assert "0.05" in ans and "0.90" in ans  # Max-Mean-Min distribution

    # Extract and parse XML blocks
    xml_blocks = [block.strip() for block in ans.split("```xml") if "```" in block]
    assert len(xml_blocks) >= 2

    source_model_xml = xml_blocks[0].split("```")[0].strip()
    logic_tree_xml = xml_blocks[1].split("```")[0].strip()

    # Parse XML with ElementTree to guarantee well-formed syntax
    root_source = ET.fromstring(source_model_xml)
    assert "nrml" in root_source.tag
    assert any("sourceModel" in child.tag for child in root_source)

    root_tree = ET.fromstring(logic_tree_xml)
    assert "nrml" in root_tree.tag
    assert any("logicTree" in child.tag for child in root_tree)

    # Test dispatch via query
    user_query = "Buatkan potongan XML source model OpenQuake untuk Sesar Shanchiao (ID 1-1) dengan model rupture tunggal dan rupture gabungan sesuai TEM PSHA2025."
    dispatched = answer_from_catalog(user_query)
    assert dispatched is not None
    assert "OpenQuake" in dispatched["answer"]
    assert "SRC_01_SHANCHIAO_SINGLE" in dispatched["answer"]


def test_scenario_b_gmpe_audit():
    """Verify Scenario B lists all 6 shallow crustal GMMs, weights summing to 1.0, and Salic et al. (2017) SP."""
    res = _gmpe_audit_answer()
    assert "answer" in res
    assert "citation" in res
    ans = res["answer"]

    # Models & weights
    assert "Lin et al. (2011)" in ans and "0.200" in ans
    assert "Chao et al. (2020)" in ans and "0.183" in ans
    assert "Phung et al. (2020a)" in ans and "0.169" in ans
    assert "Lin (2009)" in ans and "0.156" in ans
    assert "Boore et al. (2014)" in ans and "0.146" in ans
    assert "Campbell & Bozorgnia (2014)" in ans and "0.146" in ans

    # Evaluation methodology & metrics
    assert "Salic et al. (2017)" in ans
    assert "Selection Procedure" in ans
    assert "Loglikelihood" in ans or "LLH" in ans
    assert "Euclidean Distance" in ans or "EDR" in ans

    # Test dispatch via query
    user_query = "GMM apa saja yang dipakai untuk shallow crustal di Taiwan beserta bobotnya, dan apa dasar pemilihannya?"
    dispatched = answer_from_catalog(user_query)
    assert dispatched is not None
    assert "Salic et al. (2017)" in dispatched["answer"]
    assert "0.200" in dispatched["answer"]


def test_scenario_c_hsinchu_miaoli_hazard():
    """Verify Scenario C explains Hukou (ID 4), Touhuanping (ID 9), Miaoli Frontal (ID 10), and offshore structures."""
    res = _hsinchu_miaoli_hazard_answer()
    assert "answer" in res
    assert "citation" in res
    ans = res["answer"]

    # On-land structure revisions
    assert "Hukou" in ans and "ID 4" in ans
    assert "Touhuanping" in ans and "ID 9" in ans
    assert "Miaoli" in ans and "ID 10" in ans
    assert "0.80" in ans  # Hukou slip rate
    assert "1.95" in ans  # Touhuanping slip rate
    assert "2.94" in ans  # Miaoli frontal slip rate

    # Offshore structure inclusion
    assert "lepas pantai" in ans.lower() or "offshore" in ans.lower()
    assert "06+O52" in ans or "O52" in ans
    assert "08+O53" in ans or "O53" in ans

    # Test dispatch via query (Indonesian & English)
    user_query = "Mengapa estimasi hazard PGA 475 tahun di wilayah Hsinchu dan Miaoli mengalami kenaikan dibanding versi TEM PSHA2020?"
    dispatched = answer_from_catalog(user_query)
    assert dispatched is not None
    assert "Hukou" in dispatched["answer"]
    assert "Touhuanping" in dispatched["answer"]
    assert "Miaoli" in dispatched["answer"]

    en_query = "Why did the 475-year PGA hazard estimate in Hsinchu and Miaoli increase compared to TEM PSHA2020?"
    dispatched_en = answer_from_catalog(en_query)
    assert dispatched_en is not None
    assert "Hukou" in dispatched_en["answer"]


def test_shanchiao_uncertainty_logic_tree():
    """Verify detailed logic tree uncertainty treatment for Shanchiao Fault Mw and slip rate."""
    from website.backend.app.rag.psha_knowledge import _shanchiao_uncertainty_logic_tree_answer

    res = _shanchiao_uncertainty_logic_tree_answer()
    assert "answer" in res
    assert "citation" in res
    ans = res["answer"]

    # Mw logic tree assertions
    assert "Wells & Coppersmith" in ans or "W&C" in ans
    assert "7.01" in ans
    assert "Yen & Ma" in ans or "Y&M" in ans
    assert "7.02" in ans
    assert "0.5 : 0.5" in ans or "0.50" in ans
    assert "0.60" in ans  # Mean weight
    assert "0.20" in ans  # Upper and lower bound weights

    # Slip rate logic tree assertions
    assert "1.66" in ans  # Geologic rate
    assert "1.56" in ans  # Geodetic rate
    assert "0.05" in ans and "0.90" in ans  # Max-Mean-Min distribution

    # Test dispatch via Indonesian query
    id_query = "Bagaimana perlakuan ketidakpastian laju slip (slip rate) dan magnitudo maksimum pada Sesar Shanchiao di logic tree TEM PSHA2025?"
    dispatched_id = answer_from_catalog(id_query)
    assert dispatched_id is not None
    assert "Wells & Coppersmith" in dispatched_id["answer"]
    assert "1.66" in dispatched_id["answer"]

    # Test dispatch via English query
    en_query = "How are slip rate and maximum magnitude uncertainties treated for the Shanchiao fault in the TEM PSHA2025 logic tree?"
    dispatched_en = answer_from_catalog(en_query)
    assert dispatched_en is not None
    assert "Wells & Coppersmith" in dispatched_en["answer"]
    assert "1.56" in dispatched_en["answer"]


def test_user_location_hazard_scenario():
    """Verify user location hazard inquiry with coordinate extraction, nearest fault calculation, and safety advice."""
    from website.backend.app.rag.psha_knowledge import _user_location_hazard_answer

    # 1. Direct call for NCU Campus benchmark coordinates (24.9680 N, 121.1940 E)
    res = _user_location_hazard_answer(24.9680, 121.1940, location_label="NCU Campus, Taoyuan")
    assert "answer" in res
    assert "citation" in res
    ans = res["answer"]

    # Site and nearest structure
    assert "24.9680" in ans and "121.1940" in ans
    assert "ID 2" in ans or "ID 3" in ans  # Shuanglienpo or Yangmei fault
    assert "475-Year Return Period" in ans
    assert "Engineering & Civil Protection Advice" in ans
    assert "1999" in ans  # Chi-Chi code revision
    assert "Soft-Story" in ans
    assert "Vs30" in ans
    assert "72-Hour" in ans
    # Assert NO LaTeX math delimiters
    assert "$" not in ans

    # 2. Dispatch via Indonesian user query without coordinates (fallback to NCU)
    query_id = "how about hazard di lokasi saya ?"
    dispatched_id = answer_from_catalog(query_id)
    assert dispatched_id is not None
    assert "NCU" in dispatched_id["answer"]
    assert "Seismic Hazard Assessment" in dispatched_id["answer"]
    assert "$" not in dispatched_id["answer"]

    # 3. Dispatch via English query with embedded coordinates (Taipei 101 area: 25.0330 N, 121.5654 E)
    query_taipei = "How is the seismic hazard at my location? (Coordinates: 25.0330, 121.5654)"
    dispatched_taipei = answer_from_catalog(query_taipei)
    assert dispatched_taipei is not None
    # Nearest structure to central Taipei should be Shanchiao Fault (ID 1)
    assert "Shanchiao" in dispatched_taipei["answer"] or "ID 1" in dispatched_taipei["answer"]
    assert "25.0330" in dispatched_taipei["answer"]
    assert "Actionable Engineering" in dispatched_taipei["answer"]
    assert "$" not in dispatched_taipei["answer"]

