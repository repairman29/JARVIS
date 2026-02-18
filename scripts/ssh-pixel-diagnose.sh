#!/usr/bin/env bash
# From Mac: SSH to Pixel and run stack diagnostic (why Proxy/Gateway 000).
# Usage: ./scripts/ssh-pixel-diagnose.sh [pixel-ip]

USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"
PIXEL_IP="${1:-$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')}"
[ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"

echo "Connecting to $PIXEL_IP (enter SSH password if prompted)..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p "$PORT" "$USER@$PIXEL_IP" 'bash -s' < "$SCRIPT_DIR/diagnose-pixel-stack.sh"
