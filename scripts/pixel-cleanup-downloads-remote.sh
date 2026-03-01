#!/usr/bin/env bash
# From the Mac: SSH to the Pixel and run the Download cleanup script (removes JARVIS tarballs, setup scripts, copied logs).
# Usage: bash scripts/pixel-cleanup-downloads-remote.sh [pixel-ip]

USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"

PIXEL_IP="${1:-}"
[ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
[ -z "$PIXEL_IP" ] && PIXEL_IP="${JARVIS_PIXEL_IP:-192.168.86.209}"

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10 -p $PORT"
echo "Running cleanup on Pixel ($PIXEL_IP)..."
ssh $SSH_OPTS "$USER@$PIXEL_IP" "bash -s" < "$SCRIPT_DIR/pixel-cleanup-downloads.sh"
echo ""
echo "Done. Pixel Download folder cleaned."
