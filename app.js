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

// --- PREMIUM SOCIAL MEDIA CARD SNAPSHOT ENGINE ---
document.getElementById("download-btn")?.addEventListener("click", () => {
  const downloadBtn = document.getElementById("download-btn");
  if (downloadBtn) downloadBtn.innerText = "⏳ Generating...";

  // Gather current real-time metrics safely from your dashboard DOM elements
  const locationText = document.getElementById("station-location")?.innerText || "Tigaon";
  const updateTime = document.getElementById("station-time")?.innerText || "--";
  const temp = document.getElementById("metric-temp")?.innerText || "--";
  const heatIndex = document.getElementById("metric-heat")?.innerText || "--";
  const comfort = document.getElementById("comfort-status")?.innerText || "";
  const sunlight = document.getElementById("solar-status")?.innerText || "";
  const airStatus = document.getElementById("air-status")?.innerText || "";
  const humidity = document.getElementById("metric-humidity")?.innerText || "--";
  const dew = document.getElementById("metric-dew")?.innerText || "--";
  const windSpeed = document.getElementById("metric-windspeed")?.innerText || "--";
  const windDir = document.getElementById("metric-winddir")?.innerText || "--";
  const rainStatus = document.getElementById("rain-status")?.innerText || "";
  const rainRate = document.getElementById("metric-precip-rate")?.innerText || "0.00";
  const rainTotal = document.getElementById("metric-precip-total")?.innerText || "0.00";
  
  // Detect current active gradient style from your dashboard background layout
  const currentBgClass = document.getElementById("dashboard-body")?.className || "";
  let cardGradient = "linear-gradient(135deg, #2563eb, #4338ca, #0f172a)"; // Default comfortable blue
  if (currentBgClass.includes("from-red-600")) {
    cardGradient = "linear-gradient(135deg, #dc2626, #c2410c, #1c1917)"; // Danger hot
  } else if (currentBgClass.includes("from-amber-600")) {
    cardGradient = "linear-gradient(135deg, #d97706, #ea580c, #0f172a)"; // Warm amber
  }

  // Create an off-screen temporary structural block styled beautifully for portrait metrics
  const cardContainer = document.createElement("div");
  cardContainer.style.position = "absolute";
  cardContainer.style.left = "-9999px";
  cardContainer.style.top = "-9999px";
  cardContainer.style.width = "600px";
  cardContainer.style.padding = "40px";
  cardContainer.style.background = cardGradient;
  cardContainer.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
  cardContainer.style.color = "#ffffff";
  cardContainer.style.borderRadius = "0px"; // Clean export borders

  // Formulate clean, scannable layout template structure
  cardContainer.innerHTML = `
    <!-- Header Branding Block -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 20px; margin-bottom: 25px;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <img src="https://upload.wikimedia.org/wikipedia/commons/f/f6/Tigaon_Camarines_Sur_official_seal.png" style="width: 60px; height: 60px; object-fit: contain;" />
        <div>
          <h2 style="margin: 0; font-size: 26px; font-weight: 800; tracking-tight: -0.05em;">${locationText}</h2>
          <p style="margin: 3px 0 0 0; font-size: 12px; opacity: 0.8; font-weight: 500;">📅 Updated: ${updateTime}</p>
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
        LIVE REPORT
      </div>
    </div>

    <!-- Core Temperature Hero Grid -->
    <div style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 25px; border-radius: 24px; margin-bottom: 20px; text-align: center; position: relative;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; opacity: 0.6; letter-spacing: 0.05em;">Current Temperature</span>
      <h1 style="margin: 5px 0; font-size: 72px; font-weight: 900; line-height: 1;">${temp}°C</h1>
      <p style="margin: 5px 0 0 0; font-size: 15px; font-weight: 700; opacity: 0.9;">RealFeel Heat Index: <span style="color: #fbbf24;">${heatIndex}°C</span></p>
      <p style="margin: 8px 0 0 0; font-size: 12px; font-weight: 600; padding: 4px 12px; background: rgba(0,0,0,0.2); border-radius: 20px; display: inline-block;">${comfort}</p>
    </div>

    <!-- Multi-column Descriptive Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
      
      <!-- Sunlight / UV Panel -->
      <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 18px; border-radius: 20px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.6;">Sunlight Intensity</span>
        <div style="font-size: 15px; font-weight: 700; color: #fbbf24; margin-top: 4px;">${sunlight}</div>
      </div>

      <!-- Air Status Panel -->
      <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 18px; border-radius: 20px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.6;">Air & Comfort</span>
        <div style="font-size: 15px; font-weight: 700; color: #7dd3fc; margin-top: 4px;">${airStatus}</div>
      </div>

      <!-- Hydrology Metrics -->
      <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 18px; border-radius: 20px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.6;">Atmospheric Moisture</span>
        <div style="font-size: 13px; font-weight: 600; margin-top: 4px; opacity: 0.95;">Humidity: <b>${humidity}%</b></div>
        <div style="font-size: 12px; opacity: 0.7; margin-top: 2px;">Dew Point: ${dew}°C</div>
      </div>

      <!-- Wind Profile -->
      <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 18px; border-radius: 20px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.6;">Anemometer Wind</span>
        <div style="font-size: 13px; font-weight: 600; margin-top: 4px; opacity: 0.95;">Velocity: <b>${windSpeed} km/h</b></div>
        <div style="font-size: 12px; opacity: 0.7; margin-top: 2px;">Heading: ${windDir}° Compass</div>
      </div>
    </div>

    <!-- Rainfall Analytics Summary Footer Banner -->
    <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); padding: 20px; border-radius: 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <div>
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #34d399;">Precipitation Status</span>
        <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-top: 2px;">${rainStatus}</div>
      </div>
      <div style="text-align: right; font-size: 12px; opacity: 0.9; line-height: 1.4;">
        <div>Rate: <b>${rainRate} mm/hr</b></div>
        <div>Accumulated Total: <b>${rainTotal} mm</b></div>
      </div>
    </div>

    <!-- Professional Base Footer Info -->
    <div style="display: flex; justify-content: space-between; align-items: center; opacity: 0.5; font-size: 11px; padding-top: 5px;">
      <div>📍 Partido District • Camarines Sur • Bicol Region</div>
      <div>PWS Network Hub</div>
    </div>
  `;

  document.body.appendChild(cardContainer);

  // Run generation execution using clean CORS image configuration
  html2canvas(cardContainer, {
    useCORS: true,
    allowTaint: false,
    scale: 3, // Premium ultra-crisp resolution scale multiplier for high-density mobile screens
    logging: false
  }).then(canvas => {
    // Clean up temporary DOM instance
    document.body.removeChild(cardContainer);

    const filename = `Weather_Report_${locationText.replace(/[\s,]+/g, '_')}.png`;
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();

    if (downloadBtn) downloadBtn.innerText = "📸 Share Card";
  }).catch(err => {
    console.error("Failed to generate custom share card asset:", err);
    if (cardContainer.parentNode) document.body.removeChild(cardContainer);
    if (downloadBtn) downloadBtn.innerText = "📸 Share Card";
  });
});