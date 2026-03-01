#!/usr/bin/env bash
# Run ON the Pixel (Termux). If the gateway (18789) is down, restart the full JARVIS stack (Proot path).
# Add to cron every 5 min so the stack self-heals:
#   */5 * * * * HOME=/data/data/com.termux/files/home bash /data/data/com.termux/files/home/JARVIS/scripts/pixel-watchdog.sh >> /data/data/com.termux/files/home/watchdog.log 2>&1
#
# Usage: bash ~/JARVIS/scripts/pixel-watchdog.sh

export HOME="${HOME:-/data/data/com.termux/files/home}"
JARVIS_DIR="${JARVIS_DIR:-$HOME/JARVIS}"
GATEWAY_PORT="${JARVIS_GATEWAY_PORT:-18789}"
LOG="${PIXEL_WATCHDOG_LOG:-$HOME/watchdog.log}"

if [ ! -d "$JARVIS_DIR" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') JARVIS not found at $JARVIS_DIR" >> "$LOG" 2>/dev/null || true
  exit 1
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://127.0.0.1:${GATEWAY_PORT}/" 2>/dev/null || echo "000")
if [ "$CODE" = "200" ]; then
  exit 0
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') Gateway $GATEWAY_PORT returned $CODE — restarting stack (Proot)" >> "$LOG" 2>/dev/null || true
# Kill any existing Proot session so ports are released, then start fresh
pkill -f "proot-distro login ubuntu" 2>/dev/null || true
sleep 2
if [ -f "$JARVIS_DIR/scripts/pixel-proot-bootstrap-and-start.sh" ]; then
  cd "$JARVIS_DIR" && bash scripts/pixel-proot-bootstrap-and-start.sh >> "$LOG" 2>&1
else
  cd "$JARVIS_DIR" && bash scripts/start-jarvis-pixel.sh >> "$LOG" 2>&1
fi
