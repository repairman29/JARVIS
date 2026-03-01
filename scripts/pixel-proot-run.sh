#!/usr/bin/env bash
# Run a single command inside Proot (Ubuntu) on the Pixel. Use for Discord setup so the
# command sees the same .clawdbot (sessions, clawdbot.json) as the gateway.
# Usage: bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID"
# Or:    bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && npx clawdbot pairing approve discord ABC123"

set -e
export HOME="${HOME:-/data/data/com.termux/files/home}"
TERMUX_HOME="$HOME"
JARVIS_DIR="${JARVIS_DIR:-$TERMUX_HOME/JARVIS}"

if [ ! -d "$JARVIS_DIR" ]; then
  echo "JARVIS not found at $JARVIS_DIR"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: bash pixel-proot-run.sh \"<command>\""
  echo "Example: bash pixel-proot-run.sh \"cd \$JARVIS_DIR && node scripts/enable-discord-dm-scope.js\""
  exit 1
fi

if ! command -v proot-distro >/dev/null 2>&1; then
  echo "proot-distro not found. Install: pkg install proot-distro && proot-distro install ubuntu"
  exit 1
fi

proot-distro login ubuntu -- env \
  PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}" \
  TERMUX_HOME="$TERMUX_HOME" \
  JARVIS_DIR="$JARVIS_DIR" \
  HOME="$TERMUX_HOME" \
  bash -c "$1"
