#!/usr/bin/env bash
# Run the JARVIS stack inside proot (Ubuntu). Use from Termux on the Pixel:
#   bash ~/JARVIS/scripts/run-jarvis-in-proot.sh
# Prereqs: proot-distro, Ubuntu installed (bash ~/JARVIS/scripts/pixel-proot-setup.sh),
#   and inside Ubuntu: Node, Python3, pip, JARVIS + neural-farm deps.
# JARVIS and neural-farm are read from Termux home (visible inside proot at same path).
# Usage: bash run-jarvis-in-proot.sh [--restart]  (--restart forces restart even if already up)

set -e
for a in "$@"; do [ "$a" = "--restart" ] && export RESTART=1; done
TERMUX_HOME="${HOME:-/data/data/com.termux/files/home}"
JARVIS_DIR="$TERMUX_HOME/JARVIS"

if [ ! -d "$JARVIS_DIR" ]; then
  echo "JARVIS not found at $JARVIS_DIR. Run from Termux with JARVIS in \$HOME."
  exit 1
fi

if ! command -v proot-distro >/dev/null 2>&1; then
  echo "proot-distro not found. Install: pkg install proot-distro && proot-distro install ubuntu"
  echo "Then run: bash ~/JARVIS/scripts/pixel-proot-setup.sh"
  exit 1
fi

PROOT_SCRIPT="$JARVIS_DIR/scripts/start-jarvis-pixel-proot.sh"
if [ ! -f "$PROOT_SCRIPT" ]; then
  echo "Proot start script not found: $PROOT_SCRIPT"
  exit 1
fi

echo "Entering Proot (Ubuntu) and starting JARVIS stack..."
echo "  JARVIS_DIR=$JARVIS_DIR  FARM_DIR=$TERMUX_HOME/neural-farm"
# PATH: prefer Ubuntu bins so proot-distro's lscpu check doesn't pick Termux's (scols_line_vprintf error)
proot-distro login ubuntu -- env \
  PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}" \
  TERMUX_HOME="$TERMUX_HOME" \
  JARVIS_DIR="$JARVIS_DIR" \
  FARM_DIR="$TERMUX_HOME/neural-farm" \
  RESTART="${RESTART:-0}" \
  bash "$PROOT_SCRIPT"
