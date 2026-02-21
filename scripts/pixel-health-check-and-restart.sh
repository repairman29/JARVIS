#!/usr/bin/env bash
# From the Mac: probe the Pixel gateway (18789). If unreachable, SSH in and start the stack.
# Use from cron for reliability, e.g. every 5 min: */5 * * * * cd ~/JARVIS && ./scripts/pixel-health-check-and-restart.sh
#
# Usage: ./scripts/pixel-health-check-and-restart.sh
#        JARVIS_PIXEL_IP=192.168.86.209 ./scripts/pixel-health-check-and-restart.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
GATEWAY_PORT="${JARVIS_PIXEL_PORT:-18789}"

if [ -n "$JARVIS_PIXEL_IP" ]; then
  PIXEL_IP="$JARVIS_PIXEL_IP"
elif [ -f "$CACHE_FILE" ]; then
  PIXEL_IP="$(cat "$CACHE_FILE" | tr -d '\r\n \t')"
else
  echo "No Pixel IP. Set JARVIS_PIXEL_IP or run ./scripts/pixel-refresh-ip.sh"
  exit 1
fi

[ -z "$PIXEL_IP" ] && { echo "Pixel IP empty"; exit 1; }

if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://${PIXEL_IP}:${GATEWAY_PORT}/" | grep -q 200; then
  exit 0
fi

echo "Pixel gateway at $PIXEL_IP:$GATEWAY_PORT unreachable — restarting stack..."
exec "$SCRIPT_DIR/ssh-pixel-start-jarvis.sh" "$PIXEL_IP"
