#!/usr/bin/env bash
# From your Mac: SSH to the Pixel and run full setup + stack + tests.
# Runs: pixel-setup-hardening.sh, start-jarvis-pixel.sh, diagnose-pixel-stack.sh, pixel-sensors test.
# Usage: ./scripts/ssh-pixel-run-all.sh [pixel-ip]
# Prereq: Pixel on same Wi‑Fi, Termux with sshd (pkg install openssh), JARVIS at ~/JARVIS.

USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"

if [ -n "$1" ]; then
  PIXEL_IP="$1"
  echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
else
  PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
  PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')
  [ -n "$PIXEL_IP" ] && echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  [ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
fi

nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null || {
  echo "Cannot reach $PIXEL_IP:$PORT. Is Pixel on same Wi‑Fi? In Termux run: sshd"
  exit 1
}

echo "=== Connecting to $PIXEL_IP (enter SSH password if prompted) ==="
echo ""

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p "$PORT" "$USER@$PIXEL_IP" "bash -s" << 'REMOTE'
set -e
export HOME="${HOME:-/data/data/com.termux/files/home}"
JARVIS="${JARVIS_DIR:-$HOME/JARVIS}"
[ ! -d "$JARVIS" ] && JARVIS="$HOME/JARVIS"

echo "--- 1) Hardening (swap + ADB commands) ---"
[ -f "$JARVIS/scripts/pixel-setup-hardening.sh" ] && bash "$JARVIS/scripts/pixel-setup-hardening.sh" || echo "  (pixel-setup-hardening.sh not found, skip)"
echo ""

echo "--- 2) Start JARVIS stack ---"
[ -f "$JARVIS/scripts/start-jarvis-pixel.sh" ] && bash "$JARVIS/scripts/start-jarvis-pixel.sh" || { echo "  (start-jarvis-pixel.sh not found)"; exit 1; }
echo ""

echo "--- 3) Diagnostic ---"
[ -f "$JARVIS/scripts/diagnose-pixel-stack.sh" ] && bash "$JARVIS/scripts/diagnose-pixel-stack.sh" || true
echo ""

echo "--- 4) Pixel sensors (battery, wifi, location) test ---"
[ -f "$JARVIS/skills/pixel-sensors/index.js" ] && ( cd "$JARVIS" && node -e "const m=require('./skills/pixel-sensors/index.js'); console.log('Battery:', JSON.stringify(m.tools.get_pixel_device_status(), null, 2)); console.log('WiFi:', JSON.stringify(m.tools.get_pixel_wifi(), null, 2)); console.log('Location:', JSON.stringify(m.tools.get_pixel_location(), null, 2))" ) || echo "  (pixel-sensors not found, skip)"
echo ""

echo "--- 5) Pixel camera test (take_photo may need permission) ---"
[ -f "$JARVIS/skills/pixel-camera/index.js" ] && ( cd "$JARVIS" && node -e "const m=require('./skills/pixel-camera/index.js'); console.log(JSON.stringify(m.tools.take_photo(), null, 2))" ) || echo "  (pixel-camera not found, skip)"
echo ""

echo "=== Done. On Pixel open Chrome → http://127.0.0.1:18888 or /voice ==="
echo "Voice node (in another SSH or on device): bash ~/JARVIS/scripts/start-voice-node-pixel.sh"
REMOTE
