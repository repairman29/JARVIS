# Weather — current conditions

Use when the user asks for weather, temperature, or conditions in a city or place. **No API key.** Uses Open-Meteo (geocoding + current weather).

---

## Setup

None. No env vars.

---

## When to use

| User says… | Tool | Notes |
|------------|------|--------|
| "What's the weather in Denver?", "Weather in London", "Temperature in Tokyo" | `weather_current` | Pass `location` (city/place name). |
| "Weather here" / "Current conditions" | `weather_current` | Use a default location or ask for city if ambiguous. |

---

## Tool reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `weather_current` | Current temp, conditions, humidity, wind for a location. | `location` (city/place), optional `latitude`/`longitude`, optional `units` (celsius \| fahrenheit, default fahrenheit) |

---

## Implementation

- Geocoding: `geocoding-api.open-meteo.com/v1/search?name=...`
- Forecast: `api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
- WMO weather_code mapped to short text (clear, partly cloudy, rain, etc.).
