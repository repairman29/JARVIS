#!/usr/bin/env bash
# Run a command on the Pixel over SSH. Uses key ~/.ssh/id_ed25519_termux if present.
# After one-time: ssh-copy-id -i ~/.ssh/id_ed25519_termux.pub -p 8022 u0_a310@192.168.86.209
# Usage: bash scripts/pixel-run-remote.sh "your command"
#        bash scripts/pixel-run-remote.sh "bash ~/JARVIS/scripts/install-litellm-termux.sh"

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
KEY="$HOME/.ssh/id_ed25519_termux"

# Optional: first arg can be IP (e.g. 192.168.86.209), then command
if [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  PIXEL_IP="$1"
  shift
fi
[ -z "$PIXEL_IP" ] && PIXEL_IP=$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')
[ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
CMD="$*"

OPTS=(-o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$PORT" "$USER@$PIXEL_IP")
[ -f "$KEY" ] && OPTS=(-i "$KEY" "${OPTS[@]}")

if [ -n "$CMD" ]; then
  ssh "${OPTS[@]}" "$CMD"
else
  ssh "${OPTS[@]}"
fi
