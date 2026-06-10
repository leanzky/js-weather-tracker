/**
 * Public Weather Dashboard Client Engine - Public-Friendly Edition
 */

const BACKEND_API_URL = "https://js-weather-tracker.onrender.com/api/weather-cached"; 
const REFRESH_INTERVAL = 5 * 60 * 1000; 

let rainChartInstance = null; // Global tracker to manage and redraw our chart instance

document.addEventListener("DOMContentLoaded", () => {
  fetchWeatherData();
  setInterval(fetchWeatherData, REFRESH_INTERVAL);
});

async function fetchWeatherData() {
  try {
    const response = await fetch(BACKEND_API_URL);
    if (!response.ok) throw new Error(`HTTP network anomaly: ${response.status}`);
    
    const data = await response.json();
    if (data && data.observations && data.observations.length > 0) {
      renderDashboard(data.observations[0]);
      
      // Update charts using the aggregated timelines from backend payload
      updateRainfallChart(data.rain_history || []);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    document.getElementById("station-location").innerText = "Data Temporarily Offline";
  }
}

function renderDashboard(observation) {
  // Station Metadata Mappings
  document.getElementById("station-location").innerText = observation.neighborhood + ", " + observation.country;
  document.getElementById("station-id").innerText = observation.stationID;
  document.getElementById("station-time").innerText = observation.obsTimeLocal;

  const metrics = observation.metric;
  
  // Core Measurements
  document.getElementById("metric-temp").innerText = metrics.temp;
  document.getElementById("metric-heat").innerText = metrics.heatIndex;
  document.getElementById("metric-humidity").innerText = observation.humidity;
  document.getElementById("metric-pressure").innerText = metrics.pressure;
  document.getElementById("metric-windspeed").innerText = metrics.windSpeed;
  document.getElementById("metric-windgust").innerText = metrics.windGust;
  document.getElementById("metric-winddir").innerText = observation.winddir;
  document.getElementById("metric-uv").innerText = observation.uv !== null ? observation.uv : '--';

  // --- PUBLIC FRIENDLY TRANSLATIONS ---

  // 1. Solar Radiation Translation
  const solar = observation.solarRadiation;
  document.getElementById("metric-solar").innerText = solar;
  const solarStatus = document.getElementById("solar-status");
  if (solarStatus) {
    if (solar > 700) solarStatus.innerText = "☀️ Intense Sunlight";
    else if (solar > 300) solarStatus.innerText = "⛅ Moderate Sunlight";
    else if (solar > 50) solarStatus.innerText = "☁️ Weak/Overcast";
    else solarStatus.innerText = "🌙 Night/No Sun";
  }

  // 2. Dew Point / Mugginess Translation
  const dew = metrics.dewpt;
  document.getElementById("metric-dew").innerText = dew;
  const airStatus = document.getElementById("air-status");
  if (airStatus) {
    if (dew >= 24) airStatus.innerText = "🥵 Extremely Sticky / Oppressive";
    else if (dew >= 20) airStatus.innerText = "Sticky / Muggy Air";
    else if (dew >= 15) airStatus.innerText = "Noticeable Humidity";
    else airStatus.innerText = "🍃 Crisp / Comfortable Air";
  }

  // 3. Precipitation / Rain Translation
  const rainRate = metrics.precipRate;
  const rainTotal = metrics.precipTotal;
  document.getElementById("metric-precip-rate").innerText = rainRate.toFixed(2);
  document.getElementById("metric-precip-total").innerText = rainTotal.toFixed(2);
  
  const rainStatus = document.getElementById("rain-status");
  if (rainStatus) {
    if (rainRate > 7.6) rainStatus.innerText = "🌧️ Heavy Downpour";
    else if (rainRate > 2.5) rainStatus.innerText = "🌧️ Moderate Steady Rain";
    else if (rainRate > 0) rainStatus.innerText = "🌦️ Light Drizzle";
    else if (rainTotal > 0 && rainRate === 0) rainStatus.innerText = "🛑 Rain Stopped";
    else rainStatus.innerText = "☀️ Dry / Clear Skies";
  }

  // Layout presentation adjustments
  updateDynamicTheming(metrics.heatIndex);
  evaluateComfortLevel(metrics.heatIndex);
  updateUVMeter(observation.uv);
  updateWindCompass(observation.winddir);
}

/**
 * Context-Aware Dynamic Theming Engine (Handles background colors & emoji opacity fixes)
 */
function updateDynamicTheming(heatIndex) {
  const bodyElement = document.getElementById("dashboard-body");
  const bgIcon = document.getElementById("bg-weather-icon");
  const baseClasses = "transition-all duration-1000 ease-in-out min-h-screen text-white font-sans p-4 md:p-8";
  
  if (heatIndex >= 41) {
    bodyElement.className = baseClasses + " bg-gradient-to-br from-red-600 via-orange-700 to-stone-900";
    if (bgIcon) {
      bgIcon.innerText = "🔥";
      bgIcon.className = "absolute -right-2 -top-2 text-[130px] opacity-25 select-none pointer-events-none transition-all";
    }
  } else if (heatIndex >= 34) {
    bodyElement.className = baseClasses + " bg-gradient-to-br from-amber-600 via-orange-600 to-slate-900";
    if (bgIcon) {
      bgIcon.innerText = "☀️";
      bgIcon.className = "absolute -right-2 -top-2 text-[130px] opacity-25 select-none pointer-events-none transition-all";
    }
  } else {
    bodyElement.className = baseClasses + " bg-gradient-to-br from-blue-600 via-indigo-800 to-slate-950";
    if (bgIcon) {
      bgIcon.innerText = "🌤️";
      bgIcon.className = "absolute -right-2 -top-2 text-[130px] opacity-25 select-none pointer-events-none transition-all";
    }
  }
}

function evaluateComfortLevel(heatIndex) {
  const statusLabel = document.getElementById("comfort-status");
  if (!statusLabel) return;
  
  if (heatIndex >= 41) {
    statusLabel.innerText = "🚨 Heat Stroke Danger! Stay Indoors & Hydrate";
    statusLabel.className = "text-sm font-bold text-red-300 animate-pulse";
  } else if (heatIndex >= 32) {
    statusLabel.innerText = "⚠️ Extreme Caution: Limit Outdoor Activity";
    statusLabel.className = "text-sm font-semibold text-orange-300";
  } else {
    statusLabel.innerText = "✅ Safe / Comfortable Baseline";
    statusLabel.className = "text-sm font-semibold text-emerald-300";
  }
}

function updateUVMeter(uvValue) {
  const element = document.getElementById("uv-gauge");
  if (!element || uvValue === null) return;
  const progressPercent = Math.min((uvValue / 11) * 100, 100);
  element.style.width = progressPercent + "%";
}

function updateWindCompass(degrees) {
  const element = document.getElementById("wind-direction-arrow");
  if (!element) return;
  element.style.transform = "rotate(" + degrees + "deg)";
}

/**
 * Builds or refreshes a dual-line overlay trend chart for precipitation metrics
 */
function updateRainfallChart(historyData) {
  const canvas = document.getElementById('rainTrendsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Map array timelines directly out of payload arrays
  const labels = historyData.map(item => item.time);
  const rates = historyData.map(item => item.rate);
  const totals = historyData.map(item => item.total);

  // Default display fallbacks for initial load states
  if (labels.length === 0) {
    labels.push(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    rates.push(0);
    totals.push(0);
  }

  // Update logic to overwrite data configurations instead of nesting overlapping items
  if (rainChartInstance) {
    rainChartInstance.data.labels = labels;
    rainChartInstance.data.datasets[0].data = rates;
    rainChartInstance.data.datasets[1].data = totals;
    rainChartInstance.update();
    return;
  }

  // Generate new instance configurations
  rainChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Fall Rate (mm/hr)',
          data: rates,
          borderColor: '#10b981', // Emerald Line
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Today Total (mm)',
          data: totals,
          borderColor: '#60a5fa', // Sky Blue Dotted Line
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: 'rgba(255, 255, 255, 0.8)', font: { size: 10 } }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 9 } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Rate (mm/hr)', color: 'rgba(255, 255, 255, 0.6)', font: { size: 9 } },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          min: 0,
          suggestedMax: 2
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Total (mm)', color: 'rgba(255, 255, 255, 0.6)', font: { size: 9 } },
          grid: { drawOnChartArea: false },
          ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          min: 0,
          suggestedMax: 5
        }
      }
    }
  });
}