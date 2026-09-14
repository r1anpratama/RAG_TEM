# Operationalizing Three Practical PSHA Scenarios (TEM PSHA2025)

**Date**: 2026-09-14  
**Author**: Antigravity AI Assistant  
**Context**: Implementation of Three Core Practical Utilization Scenarios for SeismoAgent_TW / RAG_TEM.

---

## 1. Overview & Motivation
To provide direct practical engineering and geological value from the decomposed TEM PSHA2025 report (Gao et al., 2026), three concrete scenarios were implemented:
1. **Scenario A (OpenQuake Assistant)**: Automated generation of valid OpenQuake NRML 0.5 source model XML and logic tree XML for Shanchiao Fault (ID 1-1 / 01+O01).
2. **Scenario B (GMPE Expert Review)**: Audit and technical justification of shallow crustal GMM selection and weights using the Salic et al. (2017) Selection Procedure (SP) based on LLH and EDR metrics.
3. **Scenario C (Site-Specific Hazard Explainer)**: Geological and parametric root cause analysis for 475-year PGA hazard increases in Hsinchu and Miaoli compared to TEM PSHA2020.

---

## 2. Technical Implementation

### 2.1 Backend Knowledge & Dispatch Layer (`website/backend/app/rag/psha_knowledge.py`)
- **Scenario A (`_openquake_shanchiao_answer()`)**:
  - Extracts Table 1 parameters: $L = 54.1\text{ km}$, $W = 19.44\text{ km}$, $\text{Area} = 1051.7\text{ km}^2$, fault type Normal ($N$), rake $-90^\circ$, dip $60^\circ$, depth $0.0 - 13.76\text{ km}$.
  - Integrates Table 2 multi-rupture pairing: `01+O01` (Shanchiao + Outer Chinshan O01), combined area $1312.875\text{ km}^2$, combined $M_w = 7.13$, recurrence interval $1,907$ years.
  - Implements Figure 6 logic tree branches: Geologic weight $0.5$ ($1.66\text{ mm/yr}$) and Geodetic weight $0.5$ ($1.56\text{ mm/yr}$), with Max-Mean-Min distribution ($0.05 - 0.90 - 0.05$).
  - Produces valid, well-formed OpenQuake NRML 0.5 XML with `<simpleFaultGeometry>` and `<logicTree>`.
- **Scenario B (`_gmpe_audit_answer()`)**:
  - Grounds the 6 shallow crustal GMMs & weights: Lin et al. (2011) [0.200], Chao et al. (2020) [0.183], Phung et al. (2020a) [0.169], Lin (2009) [0.156], Boore et al. (2014) [0.146], Campbell & Bozorgnia (2014) [0.146].
  - Details the evaluation methodology: Salic et al. (2017) Selection Procedure (SP) with Log-Likelihood (LLH; Scherbaum et al., 2009) and Euclidean Distance-based Ranking (EDR; Kale & Akkar, 2013).
  - Justifies regional model weighting ($70.8\%$ total) over global models ($29.2\%$).
- **Scenario C (`_hsinchu_miaoli_hazard_answer()`)**:
  - Grounds on-land slip rate increases (Chapter 4.1 & Figure 7): Hukou fault (ID 4, $0.80\text{ mm/yr}$), Touhuanping structure (ID 9, $1.95\text{ mm/yr}$), and Miaoli frontal structure (ID 10, $2.94\text{ mm/yr}$).
  - Grounds offshore structure inclusion (Chapter 5 & Figure 5): near-coast structures including `06+O52` and `08+O53`.
- **Routing (`answer_from_catalog`)**:
  - Detects query intent for OpenQuake XML, GMM logic tree review, and Hsinchu/Miaoli hazard increases, serving answers directly from the Tier-0 ground truth layer.

### 2.2 Frontend Hazard Chat UI (`website/frontend/src/components/dashboard/psha-view.tsx`)
- Structured starter prompt cards with badges:
  - `[Skenario A]`: Generator XML OpenQuake Sesar Shanchiao (ID 1-1).
  - `[Skenario B]`: Audit & Justifikasi Bobot GMM Shallow Crustal.
  - `[Skenario C]`: Analisis Kenaikan Hazard PGA 475-th Hsinchu & Miaoli.
  - Plus Table 2 and Fault Card lookups.

---

## 3. Verification & Validation
- **Automated Tests (`tests/test_psha_scenarios.py`)**:
  - `test_scenario_a_openquake_shanchiao`: XML parsing via `xml.etree.ElementTree` verified `<nrml>`, `<sourceModel>`, and `<logicTree>`, along with all Table 1/2/Figure 6 values.
  - `test_scenario_b_gmpe_audit`: Verified all 6 models, weights summing to 1.0, Salic et al. (2017), LLH, and EDR.
  - `test_scenario_c_hsinchu_miaoli_hazard`: Verified Hukou (ID 4), Touhuanping (ID 9), Miaoli Frontal (ID 10), and offshore structure citations.
- **Full Test Suite**: 30/30 tests passed (`pytest tests/`).
- **Frontend Build**: `next build` compiled cleanly with zero TypeScript errors.
