/**
 * Leaflet GIS Map Controller for SeismoAgent-TW.
 * Uses 100% Free OpenStreetMap tiles with technical grey monochrome styling (No API key needed).
 */

let map = null;
let faultLayerGroup = null;
let pWaveCircle = null;
let sWaveCircle = null;
let epiMarker = null;

function initMap() {
  // Centered on Northern Taiwan / Taoyuan NCU area
  map = L.map('hazard-map').setView([24.968, 121.193], 10);

  // Free OpenStreetMap tile server with grey technical styling (Zero API key required)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
  }).addTo(map);

  faultLayerGroup = L.layerGroup().addTo(map);

  // Add NCU Campus Marker
  const ncuIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#06b6d4; width:16px; height:16px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 10px #06b6d4;'></div>",
    iconSize: [16, 16],
  });
  L.marker([24.968, 121.193], { icon: ncuIcon }).addTo(map)
    .bindPopup("<b>National Central University (NCU)</b><br>Target Digital Twin Campus<br>Lat: 24.968°N, Lon: 121.193°E");

  loadFaultTraces();
}

async function loadFaultTraces() {
  try {
    const resp = await fetch('/api/v1/faults');
    const data = await resp.json();

    if (data.faults && data.faults.length > 0) {
      data.faults.forEach(f => {
        if (f.coordinates && f.coordinates.length > 1) {
          const isAdjacentNCU = (f.fault_id === 2); // Shuanglienpo
          const polyline = L.polyline(f.coordinates, {
            color: isAdjacentNCU ? '#f43f5e' : '#ef4444',
            weight: isAdjacentNCU ? 4 : 2.5,
            opacity: isAdjacentNCU ? 0.95 : 0.8,
            dashArray: isAdjacentNCU ? null : '3, 4'
          }).addTo(faultLayerGroup);

          polyline.bindPopup(
            `<div style="color:#0f172a; font-family:sans-serif; font-size:12px;">` +
            `<strong style="color:#dc2626;">Fault ID ${f.fault_id}: ${f.name}</strong><br>` +
            `<b>Slip Rate:</b> ${f.slip_rate_mm_yr} mm/yr<br>` +
            `<b>Max Magnitude:</b> Mw ${f.mw_max}<br>` +
            `<b>Dip:</b> ${f.dip_deg}°, <b>Rake:</b> ${f.rake_deg}°` +
            `</div>`
          );
        }
      });
    }
  } catch (err) {
    console.error("Failed to load fault traces:", err);
  }
}

function drawWaveFronts(lat, lon) {
  if (pWaveCircle) map.removeLayer(pWaveCircle);
  if (sWaveCircle) map.removeLayer(sWaveCircle);
  if (epiMarker) map.removeLayer(epiMarker);

  map.panTo([lat, lon]);

  // Epicenter pulse
  epiMarker = L.circleMarker([lat, lon], {
    radius: 10,
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.9
  }).addTo(map);

  // P-Wave (fast, 6 km/s)
  pWaveCircle = L.circle([lat, lon], {
    radius: 25000,
    color: '#38bdf8',
    weight: 2,
    fillColor: '#38bdf8',
    fillOpacity: 0.08
  }).addTo(map);

  // S-Wave (destructive, 3.5 km/s)
  sWaveCircle = L.circle([lat, lon], {
    radius: 14000,
    color: '#ef4444',
    weight: 3,
    fillColor: '#ef4444',
    fillOpacity: 0.15
  }).addTo(map);
}
