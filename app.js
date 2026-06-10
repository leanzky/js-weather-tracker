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

// --- PREMIUM SOCIAL MEDIA CARD SNAPSHOT ENGINE (CLEAN COMPACT ENGALIGNMENT) ---
document.getElementById("download-btn")?.addEventListener("click", () => {
  const downloadBtn = document.getElementById("download-btn");
  if (downloadBtn) downloadBtn.innerText = "⏳ Generating...";

  // Helper utility to safely clean mixed numbers and avoid double-unit stamps
  const cleanNum = (id) => {
    const txt = document.getElementById(id)?.innerText || "--";
    if (txt === "--") return "--";
    const matched = txt.match(/[-+]?[0-8]*\.?[0-9]+/);
    return matched ? matched[0] : txt;
  };

  // Safe data extraction wrappers
  const locationText = document.getElementById("station-location")?.innerText || "Tigaon";
  const updateTime = document.getElementById("station-time")?.innerText || "--";
  const temp = cleanNum("metric-temp");
  const heatIndex = cleanNum("metric-heat");
  const comfort = document.getElementById("comfort-status")?.innerText || "";
  const sunlight = document.getElementById("solar-status")?.innerText || "";
  const airStatus = document.getElementById("air-status")?.innerText || "";
  const humidity = cleanNum("metric-humidity");
  const dew = cleanNum("metric-dew");
  const windSpeed = cleanNum("metric-windspeed");
  const windDir = cleanNum("metric-winddir");
  const rainStatus = document.getElementById("rain-status")?.innerText || "";
  const rainRate = cleanNum("metric-precip-rate");
  const rainTotal = cleanNum("metric-precip-total");
  
  // Dynamic Background Gradient Selector
  const currentBgClass = document.getElementById("dashboard-body")?.className || "";
  let cardGradient = "linear-gradient(135deg, #1e40af, #312e81, #020617)"; // Deep luxury indigo
  if (currentBgClass.includes("from-red-600")) {
    cardGradient = "linear-gradient(135deg, #991b1b, #7c2d12, #1c1917)"; // Severe weather crimson
  } else if (currentBgClass.includes("from-amber-600")) {
    cardGradient = "linear-gradient(135deg, #b45309, #9a3412, #0f172a)"; // Heatwave amber
  }

  // Target local image parsing canvas loop
  const localSealImg = document.getElementById("dashboard-seal");
  let secureSealSrc = "";

  if (localSealImg && localSealImg.complete && localSealImg.naturalWidth !== 0) {
    try {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = localSealImg.naturalWidth;
      tempCanvas.height = localSealImg.naturalHeight;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(localSealImg, 0, 0);
      secureSealSrc = tempCanvas.toDataURL("image/png");
    } catch (e) {
      console.warn("Canvas export restricted, running Direct Path handling fallback:", e);
      secureSealSrc = "./images/seal.jpg";
    }
  } else {
    secureSealSrc = "./images/seal.jpg";
  }

  // Create clean 600px canvas workspace
  const cardContainer = document.createElement("div");
  cardContainer.style.position = "absolute";
  cardContainer.style.left = "-9999px";
  cardContainer.style.top = "-9999px";
  cardContainer.style.width = "600px";
  cardContainer.style.padding = "40px";
  cardContainer.style.background = cardGradient;
  cardContainer.style.fontFamily = "'Plus Jakarta Sans', system-ui, sans-serif";
  cardContainer.style.color = "#ffffff";
  cardContainer.style.boxSizing = "border-box";

  cardContainer.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');
      /* Hard resets to force html2canvas to align perfectly */
      * { box-sizing: border-box; margin: 0; padding: 0; }
    </style>

    <!-- Header Block -->
    <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; border-bottom: 2px solid rgba(255,255,255,0.12); padding-bottom: 20px; margin-bottom: 30px; width: 520px;">
      <div style="display: flex; flex-direction: row; align-items: center; gap: 16px;">
        <img src="${secureSealSrc}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.2);" />
        <div>
          <h2 style="font-size: 24px; font-weight: 900; tracking-tight: -0.04em; color: #ffffff; line-height: 1.2;">${locationText}</h2>
          <p style="margin-top: 4px; font-size: 12px; opacity: 0.75; font-weight: 600; letter-spacing: 0.02em;">📅 ${updateTime}</p>
        </div>
      </div>
      
      <!-- Live Advisory: Centered text display within a matching pill wrapper -->
      <div style="display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.14); padding: 8px 16px; border-radius: 20px; height: 36px;">
        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; line-height: 1; text-align: center; display: block; color: #ffffff;">
          LIVE ADVISORY
        </span>
      </div>
    </div>

    <!-- Main Temperature Display Section (Ghost Border Completely Removed) -->
    <div style="width: 520px; margin-bottom: 35px; text-align: center; display: flex; flex-direction: column; align-items: center;">
      <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; opacity: 0.5; letter-spacing: 0.08em; margin-bottom: 14px; display: block;">Ambient Reading</span>
      
      <!-- Temperature Core Counter -->
      <div style="line-height: 1; margin-bottom: 16px; display: flex; flex-direction: row; align-items: flex-start; justify-content: center;">
        <span style="font-size: 86px; font-weight: 900; letter-spacing: -0.04em; display: inline-block;">${temp}</span>
        <span style="font-size: 36px; font-weight: 700; margin-top: 8px; margin-left: 3px; display: inline-block;">°C</span>
      </div>

      <!-- RealFeel Heat Index Line: Shifted Down with Added Padding Comfort -->
      <p style="font-size: 16px; font-weight: 700; opacity: 0.95; margin: 6px auto 24px auto; text-align: center; letter-spacing: 0.01em;">
        RealFeel Heat Index: <span style="color: #fbbf24; font-weight: 800;">${heatIndex}°C</span>
      </p>
      
      <!-- Public Safety Danger Box: Centered Alignment Wrapper -->
      <div style="width: 100%; display: flex; justify-content: center; align-items: center;">
        <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.06); padding: 10px 22px; border-radius: 20px; max-width: 460px; min-width: 280px; display: flex; justify-content: center; align-items: center; box-sizing: border-box;">
          <span style="font-size: 13.5px; font-weight: 700; color: #ffffff; line-height: 1.4; text-align: center; letter-spacing: 0.01em; word-break: break-word; display: block; width: 100%;">
            ${comfort}
          </span>
        </div>
      </div>
    </div>

    <!-- Secondary Metrics Grid System -->
    <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; width: 520px;">
      
      <!-- Row 1 -->
      <div style="display: flex; flex-direction: row; gap: 16px; width: 100%;">
        <div style="width: 252px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); padding: 18px; border-radius: 22px; display: flex; flex-direction: column;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.5; letter-spacing: 0.04em; margin-bottom: 6px;">Solar Intensity</span>
          <div style="font-size: 16px; font-weight: 800; color: #fbbf24;">${sunlight}</div>
        </div>

        <div style="width: 252px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); padding: 18px; border-radius: 22px; display: flex; flex-direction: column;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.5; letter-spacing: 0.04em; margin-bottom: 6px;">Comfort Profile</span>
          <div style="font-size: 16px; font-weight: 800; color: #38bdf8;">${airStatus}</div>
        </div>
      </div>

      <!-- Row 2 -->
      <div style="display: flex; flex-direction: row; gap: 16px; width: 100%;">
        <div style="width: 252px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); padding: 18px; border-radius: 22px; display: flex; flex-direction: column; justify-content: center;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.5; letter-spacing: 0.04em; margin-bottom: 6px;">Atmospheric Moisture</span>
          <div style="font-size: 14px; font-weight: 700;">Humidity: <span style="color: #a7f3d0;">${humidity}%</span></div>
          <div style="font-size: 12px; opacity: 0.6; margin-top: 4px;">Dew Point: ${dew}°C</div>
        </div>

        <div style="width: 252px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); padding: 18px; border-radius: 22px; display: flex; flex-direction: column; justify-content: center;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.5; letter-spacing: 0.04em; margin-bottom: 6px;">Anemometer Vector</span>
          <div style="font-size: 14px; font-weight: 700;">Velocity: <span style="color: #fef08a;">${windSpeed} km/h</span></div>
          <div style="font-size: 12px; opacity: 0.6; margin-top: 4px;">Heading: ${windDir}° Compass</div>
        </div>
      </div>

    </div>

    <!-- Rainfall Tracker Banner -->
    <div style="width: 520px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 18px 22px; border-radius: 24px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #34d399; letter-spacing: 0.04em; margin-bottom: 4px;">Precipitation Tracker</span>
        <div style="font-size: 17px; font-weight: 800; color: #ffffff;">${rainStatus}</div>
      </div>
      <div style="text-align: right; font-size: 12px; font-weight: 600; opacity: 0.95; line-height: 1.4; display: flex; flex-direction: column;">
        <div>Fall Rate: <span style="font-weight: 800; color: #34d399;">${rainRate} mm/hr</span></div>
        <div style="margin-top: 2px;">Accumulated: <span style="font-weight: 800; color: #34d399;">${rainTotal} mm</span></div>
      </div>
    </div>

    <!-- Footer Identity Meta Tag -->
    <div style="width: 520px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; opacity: 0.45; font-size: 11px; font-weight: 600; letter-spacing: 0.01em;">
      <div>📍 Tigaon • Partido District • Camarines Sur</div>
      <div>PWS Hub Network</div>
    </div>
  `;

  document.body.appendChild(cardContainer);

  // Initialize secure canvas capture wrapper
  html2canvas(cardContainer, {
    useCORS: true,
    allowTaint: true,
    scale: 2.5, // Crisp high-definition desktop display format
    logging: false
  }).then(canvas => {
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