const https = require('https');

const GEOCODE_URL = 'geocoding-api.open-meteo.com';
const FORECAST_URL = 'api.open-meteo.com';
const USER_AGENT = 'JARVIS-Weather-Skill/1.0 (https://github.com/repairman29/CLAWDBOT)';

// WMO weather codes (Open-Meteo) -> short description
const WMO = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

function get(host, path) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      { host, path, headers: { 'User-Agent': USER_AGENT } },
      (res) => {
        let body = '';
        res.on('data', (ch) => { body += ch; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid JSON'));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function geocode(location) {
  const name = encodeURIComponent(String(location).trim());
  const path = `/v1/search?name=${name}&count=1`;
  const data = await get(GEOCODE_URL, path);
  const results = data.results || [];
  if (results.length === 0) return null;
  const r = results[0];
  return {
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    timezone: r.timezone || 'auto'
  };
}

function weatherDescription(code) {
  return WMO[code] != null ? WMO[code] : 'Unknown';
}

const tools = {
  weather_current: async ({ location, latitude, longitude, units = 'fahrenheit' }) => {
    let lat = latitude;
    let lon = longitude;
    let placeName = '';

    if ((lat == null || lon == null) && location) {
      const geo = await geocode(location);
      if (!geo) {
        return { success: false, message: `Could not find location: ${location}`, location };
      }
      lat = geo.latitude;
      lon = geo.longitude;
      placeName = `${geo.name}, ${geo.country}`;
    } else if (lat != null && lon != null) {
      placeName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    } else {
      return { success: false, message: 'Provide location (city name) or latitude and longitude.' };
    }

    const tempUnit = units === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const windUnit = 'mph';
    const path = `/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`;
    try {
      const data = await get(FORECAST_URL, path);
      const cur = data.current;
      if (!cur) {
        return { success: false, message: 'No current weather data', location: placeName || location };
      }
      const conditions = weatherDescription(cur.weather_code);
      return {
        success: true,
        location: placeName || location,
        temperature: cur.temperature_2m,
        temperature_unit: tempUnit === 'fahrenheit' ? '°F' : '°C',
        conditions,
        humidity_percent: cur.relative_humidity_2m,
        wind_speed: cur.wind_speed_10m,
        wind_unit: windUnit,
        message: `${placeName || location}: ${cur.temperature_2m}${tempUnit === 'fahrenheit' ? '°F' : '°C'}, ${conditions}. Wind ${cur.wind_speed_10m} ${windUnit}.`
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Weather fetch failed',
        location: placeName || location
      };
    }
  }
};

module.exports = { tools };
