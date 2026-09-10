/**
 * Chart.js Attenuation Curve Visualizer (Lin & Lee 2008 / Campbell & Bozorgnia 2014).
 */

let gmpeChartInstance = null;

function initGMPEChart() {
  const ctx = document.getElementById('gmpeChart').getContext('2d');
  const distances = [1, 2, 5, 10, 15, 20, 30, 40, 50, 75, 100];

  // Lin & Lee 2008 curve for Mw 6.91
  const medianPGV = distances.map(d => {
    const ln = 3.65 + 0.58 * 6.91 - 1.15 * Math.log(d + 0.05 * Math.exp(0.55 * 6.91));
    return Math.round(Math.exp(ln) * 10) / 10;
  });

  const upper2Sigma = medianPGV.map(v => Math.round(v * Math.exp(2 * 0.58) * 10) / 10);
  const lower2Sigma = medianPGV.map(v => Math.round(v * Math.exp(-2 * 0.58) * 10) / 10);

  gmpeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: distances,
      datasets: [
        {
          label: 'Median GMPE (cm/s)',
          data: medianPGV,
          borderColor: '#06b6d4',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3
        },
        {
          label: '+2σ Upper Bound',
          data: upper2Sigma,
          borderColor: '#10b981',
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          tension: 0.3
        },
        {
          label: '-2σ Lower Bound',
          data: lower2Sigma,
          borderColor: '#10b981',
          borderDash: [5, 5],
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          fill: '-1',
          borderWidth: 1.5,
          tension: 0.3
        },
        {
          label: 'Observed TT-SAM PGV',
          data: [{ x: 2.8, y: 72.4 }],
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          pointRadius: 7,
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'logarithmic',
          title: { display: true, text: 'Rupture Distance Rrup (km)', color: '#94a3b8' },
          grid: { color: '#1e293b' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: 'PGV (cm/s)', color: '#94a3b8' },
          grid: { color: '#1e293b' },
          ticks: { color: '#94a3b8' }
        }
      },
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
      }
    }
  });
}
