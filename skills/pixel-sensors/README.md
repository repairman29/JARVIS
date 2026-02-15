# pixel-sensors

Device sensors on the Pixel (Termux): battery, WiFi, location. Part of the Sovereign Nexus / Pixel Perfection roadmap (see `docs/SOVEREIGN_MOBILE_NEXUS.md`, `docs/PIXEL_PERFECTION_ROADMAP.md`).

**Requires:** JARVIS running in Termux on Android with `pkg install termux-api`. Location tools need location permission (Android 9+).

**Tools:**
- `get_pixel_device_status` — battery percentage, charging, temp, health. Use for "what's my battery?" or proactive "power critical" when low.
- `get_pixel_wifi` — SSID, BSSID, link speed. Use for "what WiFi am I on?" or "connected network".
- `get_pixel_location` — GPS latitude, longitude, accuracy, altitude. Use for "where am I?" or "my location".

On non-Termux (e.g. desktop), tools return `on_device: false` so the agent can say it doesn't have sensor access.
