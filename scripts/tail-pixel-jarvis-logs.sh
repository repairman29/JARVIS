#!/usr/bin/env bash
# Tail JARVIS autonomous logs on the Pixel (heartbeat, plan-execute, latest report).
# From Mac: ./scripts/tail-pixel-jarvis-logs.sh [pixel-ip]
#   Add -f to follow (e.g. ./scripts/tail-pixel-jarvis-logs.sh -f)
# Uses .pixel-ip or JARVIS_PIXEL_IP if no IP given. SSH keys recommended (BatchMode).

USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
CACHE_FILE="${SCRIPT_DIR}/../.pixel-ip"
FOLLOW=""

for arg in "$@"; do
  [ "$arg" = "-f" ] && FOLLOW="-f"
done
PIXEL_IP=""
for arg in "$@"; do
  [ "$arg" != "-f" ] && [ -n "$arg" ] && PIXEL_IP="$arg" && break
done

if [ -z "$PIXEL_IP" ]; then
  [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="${JARVIS_PIXEL_IP:-192.168.86.209}"
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10 -p $PORT"
if [ -n "$FOLLOW" ]; then
  ssh $SSH_OPTS "$USER@$PIXEL_IP" "tail -f ~/heartbeat.log ~/plan-execute.log 2>/dev/null"
else
  echo "=== heartbeat.log (last 30) ==="
  ssh $SSH_OPTS "$USER@$PIXEL_IP" "tail -30 ~/heartbeat.log 2>/dev/null || echo '(empty)'"
  echo ""
  echo "=== plan-execute.log (last 30) ==="
  ssh $SSH_OPTS "$USER@$PIXEL_IP" "tail -30 ~/plan-execute.log 2>/dev/null || echo '(empty)'"
  echo ""
  echo "=== ~/.jarvis/reports/latest.txt ==="
  ssh $SSH_OPTS "$USER@$PIXEL_IP" "cat ~/.jarvis/reports/latest.txt 2>/dev/null || echo '(empty)'"
  echo ""
  echo "=== watchdog.log (last 10) ==="
  ssh $SSH_OPTS "$USER@$PIXEL_IP" "tail -10 ~/watchdog.log 2>/dev/null || echo '(empty)'"
fi
