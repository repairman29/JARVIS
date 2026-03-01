#!/usr/bin/env bash
# Refresh the Pixel IP used by jarvis-chat, ssh-pixel, etc. (e.g. after switching WiFi: work ↔ home, or Tailscale).
# Usage:
#   ./scripts/pixel-refresh-ip.sh              # discover via ADB, update .pixel-ip
#   ./scripts/pixel-refresh-ip.sh 192.168.1.50 # set Wi‑Fi IP explicitly
#   ./scripts/pixel-refresh-ip.sh 100.75.3.115 # set Tailscale IP (from Tailscale app on Pixel)
#
# All scripts that use .pixel-ip or JARVIS_PIXEL_IP will then use the new IP. See docs/PIXEL_TAILSCALE_RUNBOOK.md.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"

if [ -n "$1" ]; then
  PIXEL_IP="$1"
  echo "$PIXEL_IP" > "$CACHE_FILE"
  echo "Pixel IP set to: $PIXEL_IP (saved to .pixel-ip)"
  exit 0
fi

# Prefer ADB if a device is connected (USB or already connected over WiFi)
PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')

if [ -n "$PIXEL_IP" ]; then
  echo "$PIXEL_IP" > "$CACHE_FILE"
  echo "Pixel IP set to: $PIXEL_IP (from ADB, saved to .pixel-ip)"
  exit 0
fi

# No ADB or no device
echo "Could not get Pixel IP from ADB (connect Pixel via USB or adb connect <pixel-ip>:5555 first)."
if [ -f "$CACHE_FILE" ]; then
  echo "Current .pixel-ip: $(cat "$CACHE_FILE" | tr -d '\r\n \t')"
fi
echo ""
echo "On new WiFi or Tailscale, either:"
echo "  1. Connect Pixel via USB and run:  ./scripts/pixel-refresh-ip.sh"
echo "  2. On the Pixel (Termux): run  ifconfig  and note the inet under wlan0; or use Tailscale app for 100.x.x.x"
echo "  3. Then on Mac:  ./scripts/pixel-refresh-ip.sh <that-ip>  (Wi‑Fi or Tailscale IP)"
echo "  4. Or for one command:  JARVIS_PIXEL_IP=<ip> ./scripts/jarvis-chat 'hello'"
echo "  See docs/PIXEL_TAILSCALE_RUNBOOK.md for Pixel-over-Tailscale."
exit 1
