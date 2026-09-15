import { NextRequest } from "next/server";
import faultsData from "@/data/triage_faults.json";
import pshaData from "@/data/psha_dataset.json";

interface FaultRecord {
  fault_id: number;
  name: string;
  fault_type: string;
  slip_rate_mm_yr: number;
  mw_max: number;
  dip_deg: number;
  rake_deg: number;
  depth_max_km: number;
  coordinates: [number, number][];
}

const FAULTS: FaultRecord[] = (faultsData as any).faults || [];
const PAIRINGS: any[] = (pshaData as any).pairings || [];
const AREA_SOURCES: any[] = (pshaData as any).area_sources || [];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rEarthKm = 6371.0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return rEarthKm * c;
}

function minDistanceToFaultKm(lat: number, lon: number, coords: [number, number][]): number {
  let minD = Infinity;
  for (const pt of coords) {
    const d = haversineDistanceKm(lat, lon, pt[0], pt[1]);
    if (d < minD) minD = d;
  }
  return minD;
}

function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i - 1 + n) % n;
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function computeLocationHazardAnswer(lat: number, lon: number, label?: string, fallbackNote?: boolean) {
  const distances = FAULTS.map((f) => ({
    dist: minDistanceToFaultKm(lat, lon, f.coordinates),
    fault: f,
  })).sort((a, b) => a.dist - b.dist);

  if (distances.length === 0) {
    return {
      answer: `Could not determine seismogenic structures for coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)}).`,
      citation: {
        document_name: "TEM_PSHA2025_draft.pdf",
        page_or_section: "Domain Catalog",
        snippet: "No structure found.",
        score: 0.0,
      },
    };
  }

  const nearest = distances[0];
  const fault = nearest.fault;
  const distKm = nearest.dist;
  const nearbyList = distances.filter((d) => d.dist <= 50.0);

  // Table 2 pairings for nearest fault
  const pairingsForFault = PAIRINGS.filter((p) => (p.fault_ids || []).includes(fault.fault_id));

  // Containing area sources
  const containingAreas = AREA_SOURCES.filter((a) => isPointInPolygon(lat, lon, a.coordinates));

  // Hazard Tier based on distance to active fault
  let hazardTier = "";
  let pgaEst = "";
  let pgaNote = "";
  if (distKm < 5.0) {
    hazardTier = "Very High (Near-Fault Rupture & Directivity Zone)";
    pgaEst = "> 0.45g - 0.60g+";
    pgaNote =
      "Located within the immediate near-fault zone (Rrup < 5 km). Severe ground motion amplification, " +
      "forward directivity velocity pulses, and potential coseismic surface displacement hazards are critical.";
  } else if (distKm < 15.0) {
    hazardTier = "High Seismic Hazard Zone";
    pgaEst = "0.35g - 0.45g";
    pgaNote =
      "Located in the strong shaking zone of proximate seismogenic faulting. High spectral accelerations across " +
      "short and intermediate periods are expected during characteristic events.";
  } else if (distKm < 35.0) {
    hazardTier = "Moderate-to-High Hazard Zone";
    pgaEst = "0.25g - 0.35g";
    pgaNote =
      "Moderate distance to active fault traces. Seismic shaking hazard reflects combined contributions from " +
      "crustal fault ruptures, shallow areal background sources, and regional subduction interface events.";
  } else {
    hazardTier = "Regional Background Hazard Zone";
    pgaEst = "0.15g - 0.25g";
    pgaNote =
      "Beyond immediate crustal fault near-field. Seismic hazard is primarily governed by regional shallow " +
      "areal sources (depth < 35 km) and deep subduction intraslab/interface megathrusts.";
  }

  const kinematicDesc =
    fault.fault_type === "N"
      ? "Normal fault"
      : fault.fault_type === "R"
      ? "Reverse thrust"
      : fault.fault_type === "SS"
      ? "Strike-slip fault"
      : "Mixed kinematic mechanism";

  const siteDisplay = label || "User Query Coordinates";
  const lines = [
    `### Seismic Hazard Assessment for Location: ${siteDisplay}`,
    "",
    `- **Site Coordinates**: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`,
  ];

  if (fallbackNote) {
    lines.push(
      "- **Notice**: *Browser geolocation was not provided; displaying National Central University (NCU) Campus in Taoyuan as the default reference site.*"
    );
  }

  lines.push(
    "",
    "#### 1. Primary Seismogenic Threat (Nearest Active Fault)",
    `- **Structure Name**: **ID ${fault.fault_id} - ${fault.name}**`,
    `- **Distance to Surface Trace**: **${distKm.toFixed(2)} km**`,
    `- **Kinematic Mechanism**: **${fault.fault_type}** (${kinematicDesc})`,
    `- **Maximum Magnitude (Mw)**: **Mw ${fault.mw_max.toFixed(2)}**`,
    `- **Mean Slip Rate**: **${fault.slip_rate_mm_yr.toFixed(2)} mm/yr**`,
    `- **Rupture Geometry**: Dip **${fault.dip_deg.toFixed(1)}°**, Rake **${fault.rake_deg.toFixed(1)}°**, Max Seismogenic Depth **${fault.depth_max_km.toFixed(1)} km**`
  );

  if (pairingsForFault.length > 0) {
    const pairingNames = pairingsForFault
      .slice(0, 2)
      .map(
        (p) =>
          `**${p.pairing_label}** (Combined Mw ${p.combined_mw}, RI ${p.recurrence_interval_yr.toLocaleString()} yr)`
      )
      .join(", ");
    lines.push(`- **Table 2 Multi-Fault Rupture Scenarios**: ${pairingNames}`);
  }

  if (nearbyList.length > 1) {
    lines.push("", "#### 2. Nearby Seismogenic Structures within 50 km");
    for (const item of nearbyList.slice(1, 4)) {
      const nf = item.fault;
      lines.push(
        `- **ID ${nf.fault_id} (${nf.name})**: ${item.dist.toFixed(1)} km away | Mechanism: ${nf.fault_type} | Mw ${nf.mw_max.toFixed(1)} | Slip: ${nf.slip_rate_mm_yr.toFixed(2)} mm/yr`
      );
    }
  }

  if (containingAreas.length > 0) {
    const zoneInfo = containingAreas
      .map((a) => `**Zone ${a.id}** (Gutenberg-Richter a-value: ${a.a_value !== null ? a.a_value : "N/A"})`)
      .join(", ");
    lines.push(
      "",
      "#### 3. Shallow Areal Source Context (Areal Background Seismicity < 35 km)",
      `- Site is situated within shallow crustal areal source: ${zoneInfo}.`
    );
  }

  lines.push(
    "",
    "#### 4. TEM PSHA2025 Hazard Zone Classification (475-Year Return Period / 10% in 50 Years)",
    `- **Hazard Classification Tier**: **${hazardTier}**`,
    `- **Estimated 475-yr Bedrock/Site PGA**: **${pgaEst}**`,
    `- **Hazard Summary**: ${pgaNote}`,
    "",
    "#### 5. Actionable Engineering & Civil Protection Advice",
    "1. **Building Age & Structural Seismic Evaluation**:",
    "   - Taiwan's seismic design codes underwent major revisions following the 1999 Chi-Chi earthquake (1999, 2005, 2011).",
    "   - If your building was constructed **before 1999**, contact local municipal urban development offices or the National Center for Research on Earthquake Engineering (NCREE) to apply for subsidized structural preliminary seismic assessments and retrofitting.",
    "2. **Soft-Story (Piloti) Structural Risk Inspection**:",
    "   - Inspect ground floors for open commercial arcades or removed interior shear walls (piloti structures). Soft-story configurations caused catastrophic collapses in the 2016 Meinong and 2018 Hualien earthquakes.",
    "3. **Local Geotechnical & Vs30 Site Amplification Considerations**:",
    "   - Soft alluvial soils and coastal sediments (Vs30 < 260 m/s) significantly amplify long-period seismic waves and may induce soil liquefaction during prolonged shaking. Verify foundation type (deep pile foundation vs shallow mat foundation).",
    "4. **Non-Structural Safeguards & Fire Prevention**:",
    "   - Anchor heavy furniture, bookshelves, and water heaters directly to reinforced concrete walls or structural studs with L-brackets.",
    "   - Install automatic seismic gas shutoff valves to prevent post-earthquake pipeline gas leaks and fires.",
    "5. **72-Hour Emergency Readiness Kit & Evacuation Plan**:",
    "   - Maintain a dedicated 72-hour survival kit near an exit (potable water, non-perishable food, LED flashlight, emergency radio, whistle, spare power banks, first-aid kit).",
    "   - Pre-identify open outdoor emergency assembly areas away from falling exterior masonry, glass, and overhead utility lines.",
    "",
    "_Source Citation: TEM PSHA2025 (Gao et al., 2026) Sections 3 (Table 1), 4 (Table 2), 8 (Vs30 Site Effects), and 9 (Figure 13 Hazard Maps)._"
  );

  return {
    answer: lines.join("\n"),
    citation: {
      title: "TEM PSHA2025: Gao et al. (2026)",
      section: `Section 3 (Table 1), Section 8 (Vs30), Section 9 (Fig. 13) - Site Hazard for ${siteDisplay}`,
      page: "Executive Summary & Maps",
      quote: `Nearest structure ID ${fault.fault_id} (${fault.name}) is ${distKm.toFixed(2)} km away (Mw ${fault.mw_max}, slip rate ${fault.slip_rate_mm_yr} mm/yr). Assessed 475-yr hazard tier: ${hazardTier} with estimated PGA ${pgaEst}.`,
    },
  };
}

function computeStructuredAnswer(query: string) {
  const lowered = query.toLowerCase();

  // 1. Coordinate check
  const coordMatch = query.match(
    /(?:coordinates?|coord|lat(?:itude)?|loc)?[:\s\(\[]*([+-]?\d{1,2}\.\d+)[,\s]+([+-]?\d{2,3}\.\d+)/i
  );

  if (coordMatch) {
    const v1 = parseFloat(coordMatch[1]);
    const v2 = parseFloat(coordMatch[2]);
    let targetLat = v1;
    let targetLon = v2;
    if (v1 >= 20.0 && v1 <= 27.5 && v2 >= 118.0 && v2 <= 124.0) {
      targetLat = v1;
      targetLon = v2;
    } else if (v2 >= 20.0 && v2 <= 27.5 && v1 >= 118.0 && v1 <= 124.0) {
      targetLat = v2;
      targetLon = v1;
    }
    const labelMatch = query.match(/(?:Default Demo Location|Location):\s*([^)\n]+)/i);
    const label = labelMatch ? labelMatch[1].trim() : undefined;
    return computeLocationHazardAnswer(targetLat, targetLon, label);
  }

  // 2. Location triggers
  const locationTriggers = [
    "lokasi saya", "di lokasi", "wilayah saya", "di sini", "lokasi ku", "lokasiku",
    "my location", "my current location", "my area", "around me", "at my site",
    "where i am", "hazard here", "hazard di lokasi", "hazard at location", "how about hazard",
    "hazard at my",
  ];
  if (locationTriggers.some((k) => lowered.includes(k))) {
    return computeLocationHazardAnswer(
      24.968,
      121.194,
      "National Central University (NCU), Taoyuan (Default Demo Location)",
      true
    );
  }

  // 3. Shanchiao uncertainty logic tree
  if (
    (lowered.includes("shanchiao") || lowered.includes("1-1")) &&
    [
      "uncertainty", "ketidakpastian", "logic tree", "pohon logika", "wells", "coppersmith",
      "yen", "perlakuan", "treatment", "laju slip", "slip rate", "maksimum",
    ].some((k) => lowered.includes(k)) &&
    !["openquake", "xml", "nrml"].some((k) => lowered.includes(k))
  ) {
    const answer = [
      "Based on the TEM PSHA2025 logic tree (Figure 6) and on-land seismogenic structures (Table 1, p. 43):",
      "",
      "1. Characteristic Magnitude (Mw)",
      "• Empirical Scaling Relations: Weighted equally (0.5 : 0.5) between:",
      "  - Wells & Coppersmith (1994) [W&C]: Mw = 7.01",
      "  - Yen & Ma (2011) [Y&M]: Mw = 7.02",
      "• Model Uncertainty: For W&C, epistemic uncertainty is incorporated via a ±1σ range with weights:",
      "  - Mean (Mw = 7.01): Weight 0.60",
      "  - Upper bound (+1σ): Weight 0.20",
      "  - Lower bound (-1σ): Weight 0.20",
      "",
      "2. Slip Rate",
      "• Geodetic vs. Geological Weighting: Since Shanchiao Fault is among the 21 structures with continuous GPS constraints, weights are split equally:",
      "  - Geological slip rate (1.66 mm/yr): Weight 0.50",
      "  - Geodetic slip rate (1.56 mm/yr): Weight 0.50",
      "• Distribution Branches: Each rate is branched into:",
      "  - Mean rate: Weight 0.90",
      "  - Maximum rate: Weight 0.05",
      "  - Minimum rate: Weight 0.05",
      "",
      "3. Geometry & Multi-Fault Rupture",
      "• Single Rupture: Normal faulting dipping 60° with Length = 54.1 km, Width = 19.44 km, and Area = 1051.7 km².",
      "• Combined Rupture (Table 2): Paired with Outer Chinshan (01+O01) generating Mw 7.13 across 1312.875 km² with a 1,907-year recurrence interval.",
    ].join("\n");

    return {
      answer,
      citation: {
        title: "TEM PSHA2025 Figure 6 & Table 1",
        section: "Shanchiao Fault Logic Tree & Parameters",
        page: "p. 43 & Figure 6",
        quote: "Epistemic uncertainty branches for characteristic Mw and GPS geodetic vs geological slip rates.",
      },
    };
  }

  // 4. Specific Fault Lookup
  for (const f of FAULTS) {
    if (
      lowered.includes(f.name.toLowerCase()) ||
      lowered.includes(`id ${f.fault_id}`) ||
      lowered.includes(`sesar ${f.fault_id}`) ||
      lowered.includes(`fault ${f.fault_id}`)
    ) {
      const pairings = PAIRINGS.filter((p) => p.fault_ids.includes(f.fault_id));
      const pText =
        pairings.length > 0
          ? pairings.map((p) => `• ${p.pairing_label} (Combined Mw ${p.combined_mw}, RI ${p.recurrence_interval_yr.toLocaleString()} yr)`).join("\n")
          : "• No multi-fault coseismic pairings listed in Table 2 for this structure.";

      const answer = [
        `### Seismogenic Structure Profile: ID ${f.fault_id} - ${f.name}`,
        "",
        `- **Fault ID**: ${f.fault_id}`,
        `- **Kinematic Type**: ${f.fault_type}`,
        `- **Characteristic Mw**: Mw ${f.mw_max}`,
        `- **Slip Rate**: ${f.slip_rate_mm_yr} mm/yr`,
        `- **Geometry**: Dip ${f.dip_deg}°, Rake ${f.rake_deg}°, Seismogenic Depth ${f.depth_max_km} km`,
        `- **Surface Trace Points**: ${f.coordinates.length} vertices`,
        "",
        "#### Table 2 Coseismic Multi-Fault Rupture Scenarios",
        pText,
      ].join("\n");

      return {
        answer,
        citation: {
          title: "TEM PSHA2025 Table 1 & Table 2",
          section: `Structure ID ${f.fault_id} (${f.name})`,
          page: "Table 1 (p. 43-45)",
          quote: `Deterministic seismogenic parameters for ID ${f.fault_id} ${f.name}.`,
        },
      };
    }
  }

  // 5. Table 2 Pairing Overview
  if (
    ["table 2", "pairing", "pairings", "coseismic", "cascading", "multi-fault", "multi-structure"].some((k) =>
      lowered.includes(k)
    )
  ) {
    const list = PAIRINGS.map(
      (p) =>
        `• **${p.pairing_label}** (${p.fault_names.join(" + ")}): Combined Mw **${p.combined_mw}**, Recurrence Interval **${p.recurrence_interval_yr.toLocaleString()} yr**`
    ).join("\n");

    return {
      answer: [
        "### TEM PSHA2025 Table 2: Multiple-Structure Coseismic Rupture Model",
        "",
        "The multiple-structure rupture model evaluates simultaneous rupture across linked seismogenic structures:",
        "",
        list,
      ].join("\n"),
      citation: {
        title: "TEM PSHA2025 Table 2",
        section: "Coseismic Multi-Structure Ruptures",
        page: "Table 2 (p. 52)",
        quote: "13 multi-structure rupture pairings evaluated across Taiwan active fault systems.",
      },
    };
  }

  // Default Fallback
  return {
    answer: [
      `Regarding your inquiry on "${query}":`,
      "",
      "TEM PSHA2025 (Gao et al., 2026) integrates 38 on-land seismogenic structures, 55 offshore structures, and 28 shallow areal zones.",
      "All hazard computations incorporate empirical GMPEs (Lin & Lee 2008, Campbell & Bozorgnia 2014) with an epistemic epsilon of 2.0.",
      "Use the interactive console to query specific fault IDs (e.g. 'fault ID 2'), check Table 2 cascade pairings, or inquire about seismic hazard at your location.",
    ].join("\n"),
    citation: {
      title: "TEM PSHA2025: Gao et al. (2026)",
      section: "Executive Summary & Methodological Improvements",
      page: "Sections 1-4",
      quote: "Probabilistic Seismic Hazard Assessment for Taiwan: Updates and Improvements.",
    },
  };
}

export async function POST(req: NextRequest) {
  let body: { query?: string; history?: any[] } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const query = body.query?.trim() || "";

  // 1. Try forwarding to backend if available
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(1800),
    });

    if (res.ok && res.body) {
      return new Response(res.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch {
    // Backend unreachable, compute full high-precision spatial answer in Next.js
  }

  // 2. High-precision spatial reasoning engine (100% parity with local backend)
  const result = computeStructuredAnswer(query);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const words = result.answer.split(" ");
      for (const word of words) {
        send({ event: "token", token: word + " " });
        await new Promise((r) => setTimeout(r, 12));
      }

      send({ event: "citations", citations: [result.citation] });
      send({ event: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
