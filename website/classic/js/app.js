/**
 * Main Controller for SeismoAgent-TW Web Dashboard.
 * Handles scenario dispatch, live S-wave countdown, and WebSocket streaming.
 */

let ws = null;
let countdownInterval = null;

async function triggerScenario(scenarioId) {
  clearInterval(countdownInterval);

  let payload = {
    event_id: "SCENARIO-" + scenarioId,
    elapsed_seconds: 8.5,
    magnitude: 6.91,
    depth_km: 8.0,
    epicenter_lat: 24.945,
    epicenter_lon: 121.185,
    predicted_pgv_nc_cm_s: 72.4,
    is_preliminary: true
  };

  if (scenarioId === 'hualien_offshore_mw72') {
    payload.magnitude = 7.20;
    payload.depth_km = 35.0;
    payload.epicenter_lat = 23.980;
    payload.epicenter_lon = 121.650;
    payload.predicted_pgv_nc_cm_s = 24.5;
  }

  // Update Banner to Red Alert
  const banner = document.getElementById('alert-banner');
  banner.className = "bg-red-950 border-b border-red-800 px-4 py-3 transition-colors duration-500";
  document.getElementById('banner-title').innerText = `🚨 CRITICAL EARTHQUAKE ALERT: MW ${payload.magnitude} DETECTED`;
  document.getElementById('banner-desc').innerText = `Near-source shallow rupture detected. Epicenter ${payload.epicenter_lat}°N, ${payload.epicenter_lon}°E. Executing automated SCADA cutoffs!`;

  // Start countdown
  let remaining = 4.8;
  document.getElementById('swave-timer').innerText = remaining.toFixed(1) + 's';
  countdownInterval = setInterval(() => {
    remaining -= 0.1;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('swave-timer').innerText = "0.0s (ARRIVED)";
      document.getElementById('swave-timer').className = "text-2xl font-black font-mono text-red-500 animate-bounce";
    } else {
      document.getElementById('swave-timer').innerText = remaining.toFixed(1) + 's';
    }
  }, 100);

  // Draw expanding wave fronts on map
  drawWaveFronts(payload.epicenter_lat, payload.epicenter_lon);

  // Call Triage API
  try {
    const resp = await fetch('/api/v1/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await resp.json();

    // Update Latencies
    document.getElementById('track-a-latency').innerText = result.execution_summary.track_a_latency_ms + ' ms';
    document.getElementById('track-b-latency').innerText = result.execution_summary.track_b_latency_ms + ' ms';

    // Update Facility Cards
    const triageList = result.track_b_deliberative.facility_triage;
    if (triageList && triageList.length > 0) {
      updateFacilityCard('b4', triageList[0]);
      if (triageList.length > 1) updateFacilityCard('eng5', triageList[1]);
      if (triageList.length > 2) updateFacilityCard('fab', triageList[2]);
    }
  } catch (err) {
    console.error("Triage dispatch error:", err);
  }
}

function updateFacilityCard(key, data) {
  const tagEl = document.getElementById(`tag-fac-${key}`);
  const idrEl = document.getElementById(`idr-fac-${key}`);
  const riskEl = document.getElementById(`risk-fac-${key}`);
  const cwaEl = document.getElementById(`cwa-fac-${key}`);

  if (tagEl) {
    tagEl.innerText = `${data.triage_tag} / ${data.action_recommendation}`;
    tagEl.className = data.triage_tag.includes('RED')
      ? "px-2 py-0.5 rounded text-xs font-bold font-mono bg-red-600/20 text-red-400 border border-red-500/30"
      : (data.triage_tag.includes('YELLOW')
        ? "px-2 py-0.5 rounded text-xs font-bold font-mono bg-amber-600/20 text-amber-400 border border-amber-500/30"
        : "px-2 py-0.5 rounded text-xs font-bold font-mono bg-emerald-600/20 text-emerald-400 border border-emerald-500/30");
  }
  if (idrEl) idrEl.innerText = data.drift_ratio_pct + '%';
  if (riskEl) riskEl.innerText = data.collapse_probability;
  if (cwaEl) cwaEl.innerText = data.cwa_intensity;
}

function startLiveStreaming() {
  if (ws) ws.close();
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}/ws/alert-stream`);

  const banner = document.getElementById('alert-banner');
  banner.className = "bg-red-950 border-b border-red-800 px-4 py-3 transition-colors duration-500";

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    document.getElementById('banner-title').innerText = `🔴 TT-SAM STREAMING ALERT (t=${data.elapsed_seconds}s) — MW ${data.magnitude}`;
    document.getElementById('banner-desc').innerText = `Predicted PGV at NCU: ${data.predicted_pgv_cm_s} cm/s (Intensity ${data.intensity_cwa}). SCADA cutoffs active!`;
    document.getElementById('swave-timer').innerText = data.s_wave_remaining_s.toFixed(1) + 's';

    if (data.is_final) {
      document.getElementById('swave-timer').innerText = "0.0s (IMPACT)";
    }
  };
}

// Initialize on window load
window.onload = () => {
  initMap();
  initGMPEChart();
  initKnowledgeGraph();
};
