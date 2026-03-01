#!/usr/bin/env bash
# From the Mac: SSH to the Pixel and stop the JARVIS stack.
# Usage: bash scripts/pixel-stop-stack-remote.sh [pixel-ip]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"

PIXEL_IP="${1:-}"
[ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
[ -z "$PIXEL_IP" ] && PIXEL_IP="${JARVIS_PIXEL_IP:-192.168.86.209}"

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10 -p $PORT"
echo "Stopping JARVIS stack on $PIXEL_IP..."
ssh $SSH_OPTS "$USER@$PIXEL_IP" "pkill -f inferrlm_adapter 2>/dev/null; pkill -f pixel-inferrlm-proxy 2>/dev/null; pkill -f 'litellm.*config' 2>/dev/null; pkill -f 'clawdbot gateway' 2>/dev/null; pkill -f 'gateway run' 2>/dev/null; pkill -f pixel-chat-server 2>/dev/null; pkill -f pixel-llm-router 2>/dev/null; pkill -f webhook-trigger-server 2>/dev/null
pkill -f iphone-vision-bridge 2>/dev/null; sleep 1; echo 'Done. Stack stopped.'"
echo "Done."
