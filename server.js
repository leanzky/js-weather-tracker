import express from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' }));

// Weather Underground Configurations
const WU_API_KEY = "d645e2d3c11b45dd85e2d3c11b25dd55";
const STATION_ID = "ITIGAO1";
const WEATHER_API_URL = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${WU_API_KEY}`;

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

let weatherCache = null;
let lastFetchedTime = null;
let rainHistory = []; // Global store for logging data trends

/**
 * Fetches data using Node's built-in https module
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`API returned status ${res.statusCode}: ${raw}`));
            return;
          }
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error('Failed to parse JSON: ' + e.message));
        }
      });
    });
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out after 10 seconds'));
    });
    req.on('error', reject);
  });
}

async function fetchAndCacheWeather() {
  console.log(`[${new Date().toLocaleTimeString()}] Fetching fresh data from Weather Underground...`);
  try {
    const data = await httpsGet(WEATHER_API_URL);
    weatherCache = data;
    lastFetchedTime = new Date();

    // Append standard logs to tracking history array
    if (data && data.observations && data.observations.length > 0) {
      const obs = data.observations[0];
      const timestamp = new Date(obs.obsTimeLocal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      rainHistory.push({
        time: timestamp,
        rate: obs.metric.precipRate,
        total: obs.metric.precipTotal
      });

      // Keep past 1 hour of active logs (12 snapshots total across 5-min intervals)
      if (rainHistory.length > 12) {
        rainHistory.shift();
      }
    }

    console.log(`[${new Date().toLocaleTimeString()}] Cache updated successfully for station: ${STATION_ID}`);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error updating cache:`, error.message);
  }
}

app.get('/ping', (req, res) => {
  res.json({ status: 'alive', cached: weatherCache !== null });
});

app.get('/api/weather-cached', (req, res) => {
  if (!weatherCache) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "Cache is still loading. Please try again in a moment."
    });
  }
  res.json({
    ...weatherCache,
    rain_history: rainHistory, // Attaches rolling historical timelines to the response
    backend_meta: {
      cached_at: lastFetchedTime?.toISOString() ?? null,
      next_refresh_expected: lastFetchedTime
        ? new Date(lastFetchedTime.getTime() + REFRESH_INTERVAL).toISOString()
        : null
    }
  });
});

// Initial fetch then poll every 5 minutes
fetchAndCacheWeather();
setInterval(fetchAndCacheWeather, REFRESH_INTERVAL);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Weather Dashboard Backend Running on port ${PORT}  `);
  console.log(`  http://localhost:${PORT}/api/weather-cached        `);
  console.log(`====================================================`);
});