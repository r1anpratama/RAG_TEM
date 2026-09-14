---
title: "TEM PSHA2025 Hazard Console: Interactive Source Map + Docked Grounded Assistant"
created: 2026-09-14
type: daily-log
tags:
  - frontend
  - backend
  - psha
  - rag
  - leaflet
---

# Daily Log: 2026-09-14 - TEM PSHA2025 Hazard Console

## 1. Objective
Replace the thin TEM PSHA Hazard tab (one Leaflet panel + GMPE curve + a hardcoded cascade card)
with a console that puts **every paper-derived result on one interactive map** and a **grounded
assistant beside it** that can answer questions about whatever the map is showing.

## 2. Findings That Decided The Approach
1. **`GET /api/graph` was dead.** It answered **500** because `GeoGraph` stores `nodes` /
   `edges_out` dictionaries while the handler read `graph.graph.nodes(...)` (a networkx API this
   class never had). The working serializer already existed in `src/api/server.py` (`/api/v1/graph`).
   Fixed by serializing the real object; the endpoint now also feeds the map.
2. **The Table 2 pairings were already curated.** `src/domain/graph.py` encodes them as
   `RUPTURES_WITH` edges (14 tuples, but `01+O01` is Shanchiao + an *offshore* structure and is
   skipped by the `f1 != f2` guard, so **13 on-land pairs** reach the API). No new extraction was
   needed — only de-duplication of the bidirectional edges.
3. **Table 1 geometry is not machine-readable.** The paper's Table 1 (length, width, area,
   Mw(W&C), recurrence interval) exists only in the PDF, and its text layer interleaves wrapped
   cells (e.g. Shanchiao's slip rate appears at the *start* of its row). The Excel the project
   treats as authoritative (`Fault Parameters_update.xlsx`) carries 8 columns and no geometry.
   Those columns are therefore **not shown at all** rather than guessed — PRD rule NUM-01 requires
   slip rate / dip / rake / magnitude to come from the Excel or the paper verbatim.
4. **The catalog's ID space stops at 38.** Paper IDs 39–48 (new structures, Kouhsiaoli) do not
   exist here, so published hazard-change statements that reference them cannot be plotted.
5. **No LLM is reachable.** No Ollama on `:11434` and no API keys, so the existing engine always
   fell through to `_stream_deterministic`, which echoed one hand-written seed chunk. The three
   seeds were also partly unsourced. Answer quality had to come from *grounding*, not from a model.
6. **The citation contract was broken twice.** The engine emits `event: "citations"` (plural) with
   `document_name` / `page_or_section`, while `useRagStream` matched `event: "citation"` (singular)
   and `MessageBubble` read `source_id` / `title`. Citations therefore never rendered anywhere.
7. **`GisMap` is an EEWS component.** It always renders stations, wavefronts and an epicenter and
   is driven by `scenario`, so bending it into a hazard map would have risked the early-warning tab.
   A focused source map (~380 lines) was the smaller, safer diff.
8. **Headless verification of Leaflet is not possible in this environment.** Chrome's HMR
   websocket fails (`ERR_INVALID_HTTP_RESPONSE`) against `next dev`, and the *pre-existing* EEWS map
   fails to mount under the same probe (`Initializing Taiwan Wavefront GIS Basemap...` persisted).
   The control proves the limitation is environmental, not a regression.

## 3. What Was Built

| File | Change |
|---|---|
| `src/domain` → `website/backend/app/rag/psha_knowledge.py` | **New.** Generates 68 grounded chunks from the real catalog (38), the Table 2 pairings (13), the run facilities (4) and 13 quoted paper facts; plus the structured lookup used by the assistant. |
| `website/backend/app/rag/vector_store.py` | Seeds from `build_psha_chunks()` instead of 3 hand-written summaries. |
| `website/backend/app/rag/engine.py` | Exact structured lookup *before* retrieval/LLM, so parameter values are never paraphrased; shared `_stream_text` pacing. |
| `website/backend/app/api/routers/triage.py` | `/api/graph` repaired; new `GET /api/psha/dataset` (counts + Table 2 pairings). |
| `website/backend/app/rag/psha_knowledge.py` (payload) | `dataset()` dropped its `facilities` key once the map stopped drawing them; `_facility_chunks()` stays so the assistant can still answer about the twin buildings. |
| `website/frontend/src/components/mission-control/psha-hazard-map.tsx` | **New.** Leaflet source map: 38 traces, Table 2 links, published Δ-hazard halos, 3 colour modes, kinematic filter, search, 4 basemaps, click-to-select. |
| `website/frontend/src/components/dashboard/psha-view.tsx` | Rewritten: banner, KPI strip, filters, map, structure dossier, Table 2 table, docked assistant, GMPE curve, paper-results panel. |
| `website/frontend/src/components/dashboard/psha-view.tsx` (chat) | Reuses `useRagStream` + `MessageBubble`; "Ask the assistant" pushes the selected structure into the conversation. |
| `website/frontend/src/components/dashboard/psha-view.tsx` (markers) | All digital-twin pins are gone from the hazard map (the NCU Library and Hsinchu Science Park fab first, then the remaining campus pins), together with the map's "Twins" toggle and "NCU" fly-to button. The map now plots seismic sources only. |
| `website/frontend/src/app/page.tsx` | The generic `KpiMetrics` row (TT-SAM / RTX 3090 / target site / felt intensity) is no longer rendered on the PSHA tab, which carries its own catalogue metrics instead. EEWS and Copilot keep it. |
| `website/frontend/src/components/layout/header.tsx` | `showScenarioControls` hides the scenario picker and the "Trigger Wave" button on the PSHA tab (both belong to the early-warning flow); the FastAPI health pill stays on every tab. |
| `website/frontend/src/components/dashboard/psha-view.tsx` (props) | `PSHAView` no longer accepts `scenario`, so nothing invisible steers it: its GMPE panel is pinned to the Table 2 "02+04" case (Mw 6.91, 72.4 cm/s at 2.8 km). |
| `website/frontend/src/hooks/use-rag-stream.ts` | Normalizes the citation event (singular *or* plural) and its field names. |
| `website/frontend/src/types/chat.ts`, `types/triage.ts` | `WireCitation` + `PshaDataset` / `PshaPairing` / `PshaColorMode`. |
| `website/backend/tests/test_psha_knowledge.py` | **New.** 11 tests: dataset counts, pairing de-duplication, `/api/graph` regression, seeded coverage, natural-language fault resolution, retrieval fallback. |
| `website/frontend/src/components/mission-control/graph-preview.tsx` | **Deleted.** Its only caller was `psha-view.tsx`, and its default cascades were fabricated (Mw 7.15 / 350 yr) rather than the published Table 2 values. |
| `src/domain/area_source.py` | **New.** Parses `assets/Coordinates-area_source.txt` into 28 closed areal source rings: skips malformed and out-of-range vertices, validates ring closure, exposes centroid/bbox and a Leaflet `[lat, lon]` ring. Optional Gutenberg-Richter a-value on the header line (`> S01 4.17`). |
| `src/config.py` | `ASSETS_DIR` added next to the other base paths. |
| `website/frontend/src/components/mission-control/psha-hazard-map.tsx` (layer) | **"Area sources (28)" toggle**, **off by default**. Lime dashed **outline only** (transparent fill keeps the zone hoverable); when the asset carries an a-value it is printed at the zone centroid; turning the layer on re-frames the view, because the zones reach ~1° past the fault traces. |
| `website/frontend/src/components/mission-control/psha-hazard-controls.tsx` | **New.** Hazard raster definitions (`HAZARD_LAYERS`, the four Fig. 13 maps with their scale family), the XYZ template `/tiles/<layer_id>/{z}/{x}/{y}.png`, the glassmorphism control panel (4 radios, 2 overlay checkboxes, opacity slider, tile-missing notice) and the dynamic `HazardColorbar`. |
| `psha-hazard-map.tsx` (raster) | Custom panes `hillshadePane` (z 250) and `hazardPane` (z 260) put the free Esri hillshade under the hazard raster and both under the vector overlays (z 400). Tile layers live in their own effects so dragging the slider never rebuilds the polygons; missing tiles resolve to a blank pixel instead of broken-image icons. A HEAD probe on `/tiles/<layer_id>/7/107/55.png` drives the panel warning. |
| `website/frontend/public/tiles/README.md` | **New.** Documents the expected XYZ pyramid, the four `layer_id` folders, the colour ramps and a `gdal2tiles.py` recipe. |
| `website/frontend/src/components/dashboard/psha-view.tsx` (mode) | A fourth trace style, `structures` (neutral grey 1.5 px, matching the paper's hazard figures), is now the default. |

## 4. Verification
| Check | Result |
|---|---|
| `pytest` (root) | **46 passed** (28 pre-existing + 18 new) |
| `npx tsc --noEmit` | No errors in any new or edited file (4 pre-existing `three` typing errors remain) |
| `next build` | `✓ Compiled successfully`; the run then fails on the **pre-existing** `three` type errors |
| `GET /api/graph` | 200 (was 500) |
| `GET /api/psha/dataset` | 200 — 38 structures, 13 pairings, 28 areal zones (9 KB) |
| `GET /?tab=psha` | 200, all console sections present in the server-rendered DOM |
| Assistant: "slip rate of the Hukou fault?" | Structured card — ID 4, Mw 6.8, 1.16 mm/yr, with its three Table 2 pairings (6.91 / 7,253 yr vs ID 2; 7.09 / 1,264 yr vs ID 5; 6.90 / 6,610 yr vs ID 6) |
| Assistant: "which structures pair with fault ID 2?" | ID 2 card + Yangmei (Mw 6.56, 11,332 yr) and Hukou (Mw 6.91, 7,253 yr) |
| Assistant: "final hazard map results of TEM PSHA2025?" | Quoted Fig. 13 (a)–(d) + Appendix Fig. a with three citations |
| Citation rendering | Citations now arrive as `citations` and map to `title` / `snippet` / `score` |
| Hazard raster UI (CDP, production build on :3001) | Leaflet mounted (1 container, 46 tiles, 1 canvas); panel text, 4 radios (Mean checked), 2 checkboxes, slider at 80%; unchecking *Seismogenic structures* changed the overlay canvas hash and re-checking restored it exactly; unchecking *Hillshade* dropped 15 Esri tiles to 0; slider 80 %→25 % moved the `.psha-hazard-raster` container opacity 0.8→0.25; colorbar gradient switched from the seismic ramp to the diverging ramp with the "PGA anomaly (g)" label; pane z-order `tile 200 < hillshade 250 < hazard 260 < overlay 400`; **zero page exceptions** |

## 5. Known Limitations & Follow-Ups
1. **Client-side map mounting is unverified** for the reason in §2.8; open
   `http://localhost:3000/?tab=psha` in a normal browser to confirm. The tab renders without the
   map if the dynamic chunk or Leaflet fails.
2. **Production build stays broken** by `ncu-3d-campus.tsx` / `detailed-building-3d.ts`:
   `three` has no type declarations (`TS7016`) plus two implicit-`any` callbacks. Fixing it needs
   `@types/three` (network) or an ambient `declare module "three"`. Unrelated to this change.
3. **Table 1 geometry** (length / width / area / Mw(W&C) / recurrence interval) is deliberately
   absent. Add it if a machine-readable source appears — the parse of the PDF text layer is not
   trustworthy enough to publish.
4. **Structures 39–48** (including the Kouhsiaoli fault, ID 47) are outside the project catalog, so
   two published hazard-change statements cannot be drawn on the map.
5. **No LLM means no free-form synthesis.** Questions outside the structured intents are answered by
   TF-IDF retrieval over the grounded chunks; adding an `LLM_API_BASE` upgrades that path without
   touching the structured one.
6. `/api/graph` returns every facility↔fault proximity edge (~19 KB). Fine at this size; paginate
   if the source catalog grows past a few hundred structures.
7. **`next dev` can wedge after an atomic file rewrite.** Both tabs answered **500** with
   `ENOENT: ... psha-view.tsx` raised from
   `tailwindcss/lib/lib/content.js → resolveChangedFiles`, even though the file existed and `stat`
   succeeded from Node. Restarting the dev server did *not* clear it; deleting
   `website/frontend/.next` did. So: an unexplained 500 naming a file that exists means clear
   `.next`, not hunt for a missing file.
8. **The areal-source a-values are not machine-readable, and the published figure is a *different*
   zone set.** They exist only as labels baked into the raster figure (Fig. 4a) — `pypdf`'s text
   layer on that page returns no text at all, and no table in the paper lists them. Reading them off
   a screenshot was attempted and **rejected on evidence**, not on effort:
   1. The native raster of Fig. 4(a) was extracted with PyMuPDF (1394×896), its blue outline masked
      by colour, and the asset network rasterised into the same frame.
   2. Alignment was then optimised three ways — FFT translation search per scale, a 6-parameter
      affine fit (allowing anisotropic scale and rotation), and a global scale × rotation ×
      translation search. The best mean point-to-outline residual was **18.4 px**, against a drawn
      line width of ~2 px; a correct alignment would be well under 2 px. Projection effects cannot
      explain it: over 4°×5°, TWD97/TM2 differs from a plate-carrée affine by only a few pixels.
   3. A side-by-side render shows why: the asset holds **28 cells** around the island, while
      Fig. 4(a) draws roughly 20 much larger cells. Fig. 2 (the subregion figure, which carries a
      lon/lat graticule and shows the a-value as region *colour* rather than as printed numbers)
      was georeferenced from its tick marks the same way, and the asset does not trace those
      boundaries either.
   Evidence: `data/processed/area_source_alignment/asset_vs_fig4a.png` (side by side) and
   `asset_on_fig2.png` (asset over Fig. 2, georeferenced from ticks).
   Consequently the map renders an a-value **only when the asset carries one** (`> S01 4.17`), and
   the tooltip says so explicitly when it does not. Binding the figure's ~22 published numbers to
   these 28 zones would be invention — PRD rule NUM-01 forbids it. The per-zone table must come
   from the same source the coordinates came from.
9. **PowerShell in this harness cannot round-trip UTF-8.** `Get-Content -Raw | Set-Content` mangles
   the README's box-drawing and emoji (console codepage is cp950), and printing non-ASCII to stdout
   raises `UnicodeEncodeError`. Text files must go through the file tools; verify non-ASCII content
   with a Python membership check that prints booleans, never the characters.
10. **The hazard raster tiles do not exist yet.** The XYZ plumbing, panes, opacity and colorbar are
    live, but `public/tiles/<layer_id>/` holds only the README, so the overlay is empty and the
    control panel says so. Export the four Fig. 13 rasters as Web Mercator XYZ (`z0`-`z9`) into
    those folders and nothing else needs to change. Until then the hillshade alone is visible.
11. **The production build needed a temporary `typescript.ignoreBuildErrors` to run the CDP check**
    (the pre-existing `three` typing errors still fail `next build`). That flag was reverted right
    after the verification; `next.config.mjs` is back to its original two lines.
