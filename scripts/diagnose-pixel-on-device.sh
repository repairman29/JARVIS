#!/usr/bin/env bash
# Run this inside Termux on the Pixel when SSH isn't available.
# Usage: bash ~/JARVIS/scripts/diagnose-pixel-on-device.sh

echo "=== JARVIS Pixel self-check (on device) ==="
echo ""

echo "--- Ports ---"
for p in 8889 4000 18789 18888; do
  nc -z 127.0.0.1 $p 2>/dev/null && echo "  $p open" || echo "  $p closed"
done
echo ""

echo "--- Battery (termux-battery-status) ---"
termux-battery-status 2>&1 | head -8
echo ""

echo "--- WiFi (termux-wifi-connectioninfo) ---"
termux-wifi-connectioninfo 2>&1
echo ""

echo "--- Location (termux-location) ---"
termux-location 2>&1 | head -5
echo ""

echo "--- If WiFi/Location show 'not yet available on Google Play' ---"
echo "  Install Termux + Termux:API from same source. See docs/TERMUX_INSTALL_OFFICIAL.md"
echo ""
echo "--- To start stack: bash ~/JARVIS/scripts/start-jarvis-pixel.sh ---"
echo "--- To allow SSH from Mac: run 'sshd' in Termux, same Wi-Fi ---"
