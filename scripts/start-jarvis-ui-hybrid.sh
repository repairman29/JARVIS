#!/usr/bin/env bash
# Run the JARVIS UI in hybrid mode from your MacBook: farm (Pixel) when reachable, else Edge.
# Uses .pixel-ip or JARVIS_PIXEL_IP for the farm URL so you don't have to hardcode the IP.
#
# Prereqs:
#   - apps/jarvis-ui/.env has NEXT_PUBLIC_JARVIS_EDGE_URL and JARVIS_AUTH_TOKEN (and optionally CLAWDBOT_GATEWAY_TOKEN).
#   - Pixel IP in .pixel-ip or JARVIS_PIXEL_IP. On new WiFi: ./scripts/pixel-refresh-ip.sh [ip]
#
# Usage: ./scripts/start-jarvis-ui-hybrid.sh
#        JARVIS_PIXEL_IP=192.168.1.50 ./scripts/start-jarvis-ui-hybrid.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"

# Resolve Pixel IP
if [ -n "$JARVIS_PIXEL_IP" ]; then
  PIXEL_IP="${JARVIS_PIXEL_IP}"
elif [ -f "$CACHE_FILE" ]; then
  PIXEL_IP="$(cat "$CACHE_FILE" | tr -d '\r\n \t')"
else
  echo "No Pixel IP found. Set it first:"
  echo "  ./scripts/pixel-refresh-ip.sh              # with Pixel on USB (ADB)"
  echo "  ./scripts/pixel-refresh-ip.sh 192.168.x.x   # or set IP explicitly"
  echo "  Or: JARVIS_PIXEL_IP=192.168.x.x $0"
  exit 1
fi

if [ -z "$PIXEL_IP" ]; then
  echo "Pixel IP is empty in .pixel-ip. Run: ./scripts/pixel-refresh-ip.sh <ip>"
  exit 1
fi

export JARVIS_FARM_URL="http://${PIXEL_IP}:18789"
export FARM_URL="$JARVIS_FARM_URL"
echo "Hybrid UI: farm URL = $JARVIS_FARM_URL (from .pixel-ip / JARVIS_PIXEL_IP)"
echo "Open http://localhost:3001 — if the Pixel is reachable you'll see 'Farm'; else 'Edge'."
echo ""

cd "$JARVIS_ROOT/apps/jarvis-ui"
exec npm run dev
