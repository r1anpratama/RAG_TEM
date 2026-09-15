# User Location Seismic Hazard & Interactive Map Integration

**Date**: 2026-09-14  
**Author**: Antigravity AI Assistant  
**Context**: Integration of interactive geolocation query, Leaflet radar map marker, camera fly-to, and grounded TEM PSHA2025 site hazard and safety advice.

---

## 1. Feature Motivation & Requirements
When a user asks about seismic hazard at their current position (*"how about hazard di lokasi saya?"*, *"what is the seismic hazard at my location?"*, or clicks the "📍 Locate Me" button):
1. **Interactive Geolocation Handshake**: Request browser geolocation via `navigator.geolocation.getCurrentPosition`. If denied or unavailable, gracefully fall back to National Central University (NCU) Campus in Taoyuan (`24.9680°N, 121.1940°E`) with an explanatory note.
2. **Interactive Map Integration**:
   - Add a high-visibility, pulsating radar pin (`.psha-user-location-pin`, `.psha-radar-pulse`) to Leaflet.
   - Smoothly animate and fly camera to the user's coordinates at zoom level 11.
   - Bind an informational popup displaying latitude/longitude and hazard assessment context.
3. **PSHA Site Hazard Assessment & Advice**:
   - Compute the nearest seismogenic structure and distance using `FaultCatalog.find_nearest_fault(lat, lon)`.
   - Identify nearby structures within 50 km and multi-structure rupture pairings from Table 2.
   - Map into shallow areal source zones from `Coordinates-area_source.txt`.
   - Classify 475-year return period hazard tier (PGA estimate based on TEM PSHA2025 Figure 13).
   - Provide actionable engineering and civil protection advice (pre-1999 Chi-Chi building code audit, soft-story awareness, Vs30 soil amplification, gas shutoff valves, 72-hour emergency survival plan).
4. **Strict Standards Compliance**:
   - 100% English for code, UI, starter prompts, and RAG outputs.
   - Clean plain-text typography with zero raw LaTeX math delimiters (`$`).

---

## 2. Architecture & Implementation

### 2.1 Domain & Geometry Layer (`src/domain/`)
- **`FaultCatalog.find_nearby_faults(target_lat, target_lon, max_distance_km=60.0)`**:
  Calculates minimum haversine distance to each structure alignment in Taiwan and returns distance-sorted results.
- **`AreaSource.contains_point(lon, lat)` & `AreaSourceCatalog.find_containing_sources(lon, lat)`**:
  Implements efficient ray-casting point-in-polygon checks with bounding box pre-filtering.

### 2.2 RAG Knowledge & Dispatch Layer (`website/backend/app/rag/psha_knowledge.py`)
- **`_user_location_hazard_answer(lat, lon, location_label, fallback_note)`**:
  Compiles exact nearest fault geometry, kinematics, slip rate, max Mw, nearby structures, 475-yr PGA hazard tier, and actionable advice.
- **`answer_from_catalog(query)`**:
  Recognizes location inquiries (`lokasi saya`, `my location`, `di sini`, `here`), extracts coordinates if provided in the prompt, or defaults cleanly to NCU Campus benchmark site.

### 2.3 Frontend Map & UI (`website/frontend/`)
- **`psha-hazard-map.tsx`**:
  Receives `userLocation` prop, manages dedicated `userLocation` Leaflet layer with pulsating radar ring, and triggers `map.flyTo([lat, lon], 11, { duration: 1.4 })`.
- **`globals.css`**:
  Custom `@keyframes psha-radar-ping` and `.psha-radar-pulse` styling.
- **`psha-view.tsx`**:
  - Adds "📍 Locate Me" button in map controls and quick-pin button in chat input bar.
  - Adds `[My Location]` starter prompt card.
  - Automatically intercepts location queries in chat submissions to trigger geolocation and attach coordinates.

---

## 3. Verification & Validation
1. **Automated Unit Tests (`tests/test_psha_scenarios.py`)**:
   - `test_user_location_hazard_scenario`: Verified NCU coordinates, nearest fault calculation (ID 2 Shuanglienpo / ID 3 Yangmei), 475-yr return period assessment, safety advice, Indonesian dispatch (`how about hazard di lokasi saya ?`), and English coordinate dispatch.
2. **Full Regression Suite**:
   - 32/32 tests passed (`python -m pytest tests/`).
3. **Next.js Production Build**:
   - `npm run build` compiled with zero TypeScript or lint errors.
4. **Live SSE Streaming**:
   - `scripts/test_live_chat.py` verified live SSE streaming for all 6 scenarios.
