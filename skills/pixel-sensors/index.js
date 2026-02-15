/**
 * Pixel sensors skill — battery (and optional WiFi/location) via termux-api.
 * Only works when JARVIS runs inside Termux on Android (e.g. Pixel 8 Pro).
 * Requires: pkg install termux-api
 */

const { execSync } = require('child_process');

function get_pixel_device_status() {
  try {
    const out = execSync('termux-battery-status 2>/dev/null', {
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 4096,
    });
    const data = JSON.parse(out);
    const percentage = data.percentage != null ? data.percentage : '?';
    const status = data.status || 'unknown';
    const charging = status === 'charging';
    const temp = data.temperature != null ? `${data.temperature}` : null;
    const health = data.health || null;

    const summary = [
      `Battery: ${percentage}%`,
      charging ? ' (charging)' : ' (not charging)',
      temp != null ? `, temp: ${temp}` : '',
      health ? `, health: ${health}` : '',
    ].join('');

    return {
      success: true,
      on_device: true,
      battery: {
        percentage,
        status,
        charging,
        temperature: temp,
        health,
      },
      summary,
      hint: 'Use this for proactive replies like "power critical" when percentage is low.',
    };
  } catch (e) {
    const notTermux = e.message && (
      e.message.includes('ENOENT') ||
      e.message.includes('termux-battery-status') ||
      e.message.includes('command not found')
    );
    if (notTermux) {
      return {
        success: false,
        on_device: false,
        error: 'Not running on Termux or termux-api not installed.',
        hint: 'On Pixel: pkg install termux-api. This skill is for the Pixel/Termux agent.',
      };
    }
    return {
      success: false,
      on_device: true,
      error: e.message || String(e),
      hint: 'Run: pkg install termux-api in Termux.',
    };
  }
}

function runTermuxApi(cmd) {
  try {
    const out = execSync(cmd + ' 2>/dev/null', {
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 8192,
    });
    return out ? JSON.parse(out) : null;
  } catch (e) {
    return null;
  }
}

function get_pixel_wifi() {
  const data = runTermuxApi('termux-wifi-connectioninfo');
  if (!data) {
    return {
      success: false,
      on_device: typeof process.env.PREFIX === 'string' && process.env.PREFIX.includes('termux'),
      error: 'termux-wifi-connectioninfo failed or not available.',
      hint: 'Termux and Termux:API must be from the same source (F-Droid or GitHub). Try F-Droid: in Chrome open f-droid.org/packages/com.termux and f-droid.org/packages/com.termux.api and use Download APK for both; install Termux first, then Termux:API. Or use battery/camera only.',
    };
  }
  const ssid = data.ssid || data.SSID || '?';
  const bssid = data.bssid || data.BSSID || null;
  const linkSpeed = data.link_speed_mbps != null ? data.link_speed_mbps : (data.link_speed != null ? data.link_speed : null);
  const summary = ['WiFi: ' + ssid].concat(
    linkSpeed != null ? [' ', linkSpeed, ' Mbps'] : [],
    bssid ? [' (', bssid, ')'] : []
  ).join('');
  return {
    success: true,
    on_device: true,
    wifi: { ssid, bssid, link_speed_mbps: linkSpeed },
    summary,
  };
}

function get_pixel_location() {
  const data = runTermuxApi('termux-location');
  if (!data || (data.latitude == null && data.longitude == null)) {
    return {
      success: false,
      on_device: typeof process.env.PREFIX === 'string' && process.env.PREFIX.includes('termux'),
      error: 'termux-location failed or no fix.',
      hint: 'Termux + Termux:API from same source (F-Droid or GitHub), Location permission for Termux:API, and GPS on. Or use battery/camera only; see docs/PIXEL_VOICE_RUNBOOK.md.',
    };
  }
  const lat = data.latitude;
  const lon = data.longitude;
  const accuracy = data.accuracy != null ? data.accuracy : null;
  const altitude = data.altitude != null ? data.altitude : null;
  const summary = [`Location: ${lat}, ${lon}`].concat(
    accuracy != null ? [` (accuracy ~${accuracy}m)`] : [],
    altitude != null ? [` altitude ${altitude}m`] : []
  ).join('');
  return {
    success: true,
    on_device: true,
    location: { latitude: lat, longitude: lon, accuracy, altitude },
    summary,
  };
}

module.exports = {
  tools: {
    get_pixel_device_status,
    get_pixel_wifi,
    get_pixel_location,
  },
};
