/**
 * Pixel camera skill — take a photo via termux-camera-photo (Termux + termux-api).
 * Only works when JARVIS runs inside Termux on Android (e.g. Pixel 8 Pro).
 * Requires: pkg install termux-api. Output path must be absolute.
 */

const { execSync } = require('child_process');
const path = require('path');

function take_photo({ camera_id = 0, path: userPath } = {}) {
  const cam = camera_id === 1 ? 1 : 0;
  const outPath = userPath
    ? path.isAbsolute(userPath)
      ? userPath
      : path.resolve(process.env.HOME || process.env.PREFIX || '/data/data/com.termux/files/home', userPath)
    : path.resolve(process.env.HOME || process.env.PREFIX || '/data/data/com.termux/files/home', 'camera_capture.jpg');

  try {
    execSync(`termux-camera-photo -c ${cam} "${outPath}"`, {
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 1024,
    });
    return {
      success: true,
      on_device: true,
      path: outPath,
      camera: cam === 0 ? 'back' : 'front',
      hint: 'Pass this image path to a vision endpoint (e.g. gateway) for "what am I holding?" or description.',
    };
  } catch (e) {
    const notTermux =
      e.message &&
      (e.message.includes('ENOENT') ||
        e.message.includes('termux-camera-photo') ||
        e.message.includes('command not found'));
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
      hint: 'Ensure termux-api app is installed and camera permission granted.',
    };
  }
}

module.exports = {
  tools: {
    take_photo,
  },
};
