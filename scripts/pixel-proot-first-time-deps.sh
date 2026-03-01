#!/usr/bin/env bash
# Run INSIDE proot (Ubuntu). Idempotent first-time deps: Node, pip, npm install in JARVIS, pip in neural-farm.
# Invoked by pixel-proot-bootstrap-and-start.sh via: proot-distro login ubuntu -- bash /path/to/this
# TERMUX_HOME and paths must be set by caller.

set -e
TERMUX_HOME="${TERMUX_HOME:-/data/data/com.termux/files/home}"
JARVIS_DIR="${JARVIS_DIR:-$TERMUX_HOME/JARVIS}"
FARM_DIR="${FARM_DIR:-$TERMUX_HOME/neural-farm}"

echo "[proot first-time] Checking deps..."
export DEBIAN_FRONTEND=noninteractive

# apt (idempotent)
apt-get update -qq 2>/dev/null || true
apt-get install -y -qq git curl python3-pip 2>/dev/null || true

# Node 22 (NodeSource) if not present
if ! command -v node >/dev/null 2>&1 || [ "$(node -v 2>/dev/null | cut -d. -f1 | tr -d v)" -lt 20 ] 2>/dev/null; then
  echo "[proot first-time] Installing Node 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>/dev/null || true
  apt-get install -y -qq nodejs 2>/dev/null || true
fi
command -v node >/dev/null 2>&1 || { echo "Node install failed"; exit 1; }

# JARVIS npm install (only if node_modules missing or empty; skip otherwise to avoid
# removing hoisted clawdbot sub-deps that npm install prunes on every run)
if [ -d "$JARVIS_DIR" ] && [ -f "$JARVIS_DIR/package.json" ]; then
  if [ ! -d "$JARVIS_DIR/node_modules/clawdbot" ]; then
    echo "[proot first-time] npm install in JARVIS..."
    cd "$JARVIS_DIR" && npm install --no-audit --no-fund 2>/dev/null || true
  else
    echo "[proot first-time] JARVIS node_modules present, skipping npm install"
  fi
fi

# neural-farm pip (litellm[proxy] can fail on ARM64; Ubuntu 25.10 PEP 668 needs --break-system-packages)
if [ -d "$FARM_DIR" ]; then
  echo "[proot first-time] pip install in neural-farm..."
  if [ -f "$FARM_DIR/requirements.txt" ]; then
    pip install -q --break-system-packages -r "$FARM_DIR/requirements.txt" 2>&1 | tail -5 || true
  fi
  if ! python3 -c "import litellm" 2>/dev/null; then
    pip install -q --break-system-packages --ignore-installed typing-extensions "litellm[proxy]" 2>&1 | tail -5 || true
  fi
  if ! python3 -c "import litellm" 2>/dev/null; then
    pip install -q --break-system-packages litellm uvicorn fastapi pyyaml aiohttp websockets 2>&1 | tail -5 || true
  fi
  if ! python3 -c "import litellm" 2>/dev/null; then
    echo "[proot first-time] Trying litellm<1.76.1 (avoids fastuuid)..."
    pip install -q --break-system-packages "litellm<1.76.1" uvicorn fastapi pyyaml aiohttp websockets 2>&1 | tail -5 || true
  fi
fi

echo "[proot first-time] Done."
