/**
 * Pixel ADB skill — UI control via adb shell. Tap, swipe, type, screencap, ui dump, launch app.
 * On Pixel: enable Wireless debugging in Developer options, then from Termux or PC run adb connect 127.0.0.1:<port>.
 * Termux: pkg install android-tools. Set ADB_SERIAL=127.0.0.1:5555 (or your wireless debugging port) if needed.
 */

const { execSync } = require('child_process');

const DEFAULT_SERIAL = process.env.ADB_SERIAL || '127.0.0.1:5555';
const TIMEOUT = 10000;

function adbShell(cmd) {
  const serial = process.env.ADB_SERIAL || DEFAULT_SERIAL;
  const full = `adb -s ${serial} shell ${cmd}`;
  try {
    return execSync(full, { encoding: 'utf8', timeout: TIMEOUT, maxBuffer: 2 * 1024 * 1024 });
  } catch (e) {
    const msg = e.message || String(e);
    if (msg.includes('no devices') || msg.includes('device offline') || msg.includes('connection refused')) {
      return { success: false, error: `ADB not connected. Enable Wireless debugging, then: adb connect ${serial}`, hint: 'On Pixel: Settings → Developer options → Wireless debugging.' };
    }
    throw e;
  }
}

function adb_tap({ x, y }) {
  try {
    adbShell(`input tap ${Number(x)} ${Number(y)}`);
    return { success: true, action: 'tap', x: Number(x), y: Number(y) };
  } catch (e) {
    return { success: false, error: e.message || String(e), hint: 'Ensure ADB is connected (adb connect 127.0.0.1:5555).' };
  }
}

function adb_swipe({ x1, y1, x2, y2, duration_ms }) {
  const dur = duration_ms != null ? Number(duration_ms) : 300;
  try {
    adbShell(`input swipe ${Number(x1)} ${Number(y1)} ${Number(x2)} ${Number(y2)} ${dur}`);
    return { success: true, action: 'swipe', from: [x1, y1], to: [x2, y2], duration_ms: dur };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

function adb_text({ text }) {
  if (!text || typeof text !== 'string') return { success: false, error: 'text is required' };
  const forAndroid = text.replace(/\s/g, '%s');
  try {
    adbShell(`input text "${forAndroid.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
    return { success: true, action: 'text', length: text.length };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

function adb_screencap({ path } = {}) {
  const p = path || '/sdcard/Download/screencap.png';
  try {
    adbShell(`screencap -p ${p}`);
    return { success: true, action: 'screencap', path: p, hint: 'File is on device. Use adb pull to get it, or pass to vision.' };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

function adb_ui_dump({ path } = {}) {
  const p = path || '/sdcard/Download/ui_dump.xml';
  try {
    adbShell(`uiautomator dump ${p}`);
    const out = adbShell(`cat ${p}`);
    return { success: true, action: 'ui_dump', path: p, summary: out ? out.slice(0, 500) + (out.length > 500 ? '...' : '') };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

function adb_launch_app({ package: pkg, activity } = {}) {
  if (!pkg) return { success: false, error: 'package is required' };
  try {
    if (activity) {
      const component = `${pkg}/${activity.startsWith('.') ? pkg + activity : activity}`;
      adbShell(`am start -n ${component}`);
    } else {
      adbShell(`monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`);
    }
    return { success: true, action: 'launch', package: pkg };
  } catch (e) {
    return { success: false, error: e.message || String(e), hint: 'Use exact package name, e.g. com.android.chrome' };
  }
}

module.exports = {
  tools: {
    adb_tap,
    adb_swipe,
    adb_text,
    adb_screencap,
    adb_ui_dump,
    adb_launch_app,
  },
};
