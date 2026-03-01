#!/usr/bin/env bash
# Run ON the Pixel in Termux. Idempotent: install Proot+Ubuntu if needed, first-time deps in Ubuntu, then start JARVIS in Proot.
# Respects existing processes: if gateway+chat already up, skips unless --restart. With --restart, stops Termux stack then starts in Proot.
# Usage: bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh [--restart]
# Or from Mac: scripts/pixel-sync-and-start-proot.sh  (pushes then runs this via SSH/ADB).

set -e
export HOME="${HOME:-/data/data/com.termux/files/home}"
TERMUX_HOME="$HOME"
JARVIS="$TERMUX_HOME/JARVIS"
RESTART=""
for a in "$@"; do [ "$a" = "--restart" ] && RESTART=1; done

# Optional: run Termux setup from Download if JARVIS not present
DOWNLOAD=""
for try in "$TERMUX_HOME/storage/downloads" "/storage/emulated/0/Download" "/sdcard/Download"; do
  [ -d "$try" ] && [ -f "$try/JARVIS.tar.gz" ] && [ -f "$try/neural-farm.tar.gz" ] && DOWNLOAD="$try" && break
done
if [ ! -d "$JARVIS" ] && [ -n "$DOWNLOAD" ] && [ -f "$DOWNLOAD/setup-jarvis-termux.sh" ]; then
  echo "[proot-bootstrap] JARVIS not found; running setup from Download..."
  bash "$DOWNLOAD/setup-jarvis-termux.sh" "$DOWNLOAD"
fi
[ ! -d "$JARVIS" ] && { echo "JARVIS not found at $JARVIS. Push from Mac or run setup first."; exit 1; }

# Check if stack is already up (gateway + chat)
G=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:18789/ 2>/dev/null || echo "000")
C=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:18888/ 2>/dev/null || echo "000")
if [ "$G" = "200" ] && [ "$C" = "200" ] && [ -z "$RESTART" ]; then
  echo "[proot-bootstrap] JARVIS already up (gateway 18789, chat 18888). Use --restart to restart."
  exit 0
fi

# Stop Termux-side JARVIS so we don't double-bind ports when starting Proot
if [ -n "$RESTART" ] || [ "$G" = "200" ] || [ "$C" = "200" ]; then
  echo "[proot-bootstrap] Stopping existing JARVIS processes (Termux)..."
  pkill -f inferrlm_adapter 2>/dev/null || true
  pkill -f "litellm.*config" 2>/dev/null || true
  pkill -f "clawdbot gateway" 2>/dev/null || true
  pkill -f "gateway run" 2>/dev/null || true
  pkill -f pixel-chat-server 2>/dev/null || true
  pkill -f pixel-llm-router 2>/dev/null || true
  sleep 2
fi

# Proot-distro + Ubuntu (idempotent)
if ! command -v proot-distro >/dev/null 2>&1; then
  echo "[proot-bootstrap] Installing proot-distro..."
  pkg update -y 2>/dev/null || true
  pkg install -y proot-distro 2>/dev/null || true
fi
if ! proot-distro login ubuntu -- true 2>/dev/null; then
  echo "[proot-bootstrap] Installing Ubuntu (proot-distro)..."
  proot-distro install ubuntu
fi

# First-time deps inside Ubuntu (idempotent; script is safe to run every time)
PROOT_DEPS="$JARVIS/scripts/pixel-proot-first-time-deps.sh"
if [ -f "$PROOT_DEPS" ]; then
  echo "[proot-bootstrap] Ensuring Proot/Ubuntu deps (Node, pip, npm install)..."
  proot-distro login ubuntu -- env PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}" TERMUX_HOME="$TERMUX_HOME" JARVIS_DIR="$JARVIS" FARM_DIR="$TERMUX_HOME/neural-farm" bash "$PROOT_DEPS" 2>/dev/null || true
fi

# Start JARVIS in Proot (pass through --restart if present)
echo "[proot-bootstrap] Starting JARVIS in Proot..."
bash "$JARVIS/scripts/run-jarvis-in-proot.sh" "$@"
echo "[proot-bootstrap] Done. Chat: http://127.0.0.1:18888"
