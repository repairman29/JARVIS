#!/usr/bin/env bash
# Start the JARVIS stack inside proot (Ubuntu). Use from Termux via:
#   bash ~/JARVIS/scripts/run-jarvis-in-proot.sh
# Or from inside proot: JARVIS_DIR=... FARM_DIR=... bash start-jarvis-pixel-proot.sh
# Expects: Node and Python3 + pip installed in the proot distro; JARVIS and neural-farm at JARVIS_DIR and FARM_DIR.

set -e

# Termux home is visible inside proot at the same path
TERMUX_HOME="${TERMUX_HOME:-/data/data/com.termux/files/home}"
JARVIS_DIR="${JARVIS_DIR:-$TERMUX_HOME/JARVIS}"
FARM_DIR="${FARM_DIR:-$TERMUX_HOME/neural-farm}"
# Proot default HOME=/root; .clawdbot lives in Termux home — set HOME so gateway finds config
export HOME="$TERMUX_HOME"
# Prefer Ubuntu bins so proot-distro's lscpu check doesn't pick Termux's (scols_line_vprintf error)
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"
PREFIX="$HOME"
LOG_DIR="${PREFIX}"

[ ! -d "$JARVIS_DIR" ] && { echo "JARVIS not found at $JARVIS_DIR"; exit 1; }
[ ! -d "$FARM_DIR" ] && { echo "neural-farm not found at $FARM_DIR"; exit 1; }

# Skip if already up (unless RESTART=1)
if [ "$RESTART" != "1" ]; then
  G=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:18789/ 2>/dev/null || echo "000")
  C=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:18888/ 2>/dev/null || echo "000")
  if [ "$G" = "200" ] && [ "$C" = "200" ]; then
    echo "JARVIS already up (gateway 18789, chat 18888). Use RESTART=1 to restart."
    exit 0
  fi
fi

# Optional env (same as Termux path)
CLAWDBOT_ENV="$TERMUX_HOME/.clawdbot/.env"
if [ -f "$CLAWDBOT_ENV" ]; then
  while IFS= read -r line; do
    [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] && export "$line"
  done < "$CLAWDBOT_ENV"
fi

PIXEL_LLM_URL="${JARVIS_PIXEL_LLM_URL:-http://127.0.0.1:8889}"
echo "Starting adapter (8888) -> $PIXEL_LLM_URL"
pkill -f inferrlm_adapter 2>/dev/null || true
cd "$FARM_DIR" && PIXEL_URL="$PIXEL_LLM_URL" ADAPTER_PORT=8888 FARM_DEV=1 nohup python3 -u inferrlm_adapter.py >> "$LOG_DIR/adapter.log" 2>&1 &
sleep 2

if [ -n "$JARVIS_IPHONE_LLM_URL" ]; then
  echo "Starting adapter (iPhone 8887) -> $JARVIS_IPHONE_LLM_URL"
  cd "$FARM_DIR" && PIXEL_URL="${JARVIS_IPHONE_LLM_URL}" ADAPTER_PORT=8887 nohup python3 -u inferrlm_adapter.py >> "$LOG_DIR/adapter-iphone.log" 2>&1 &
  sleep 2
fi

if [ -n "$JARVIS_IPHONE_LLM_URL" ] || [ -n "$JARVIS_GEMINI_NANO_BRIDGE" ]; then
  echo "Starting LLM router (18890)..."
  pkill -f pixel-llm-router 2>/dev/null || true
  export PIXEL_LLM_TERTIARY="${PIXEL_LLM_TERTIARY:-http://127.0.0.1:8890}"
  export PIXEL_LLM_ROUTE="${PIXEL_LLM_ROUTE:-chat-task}"
  cd "$JARVIS_DIR" && nohup node scripts/pixel-llm-router.js >> "$LOG_DIR/llm-router.log" 2>&1 &
  sleep 1
  mkdir -p "$TERMUX_HOME/.clawdbot"
  grep -q "NEURAL_FARM_BASE_URL" "$CLAWDBOT_ENV" 2>/dev/null || echo "NEURAL_FARM_BASE_URL=http://127.0.0.1:18890/v1" >> "$CLAWDBOT_ENV"
  cd "$JARVIS_DIR" && node scripts/set-primary-neural-farm.js >> "$LOG_DIR/set-farm.log" 2>&1 || true
  sleep 1
fi

# Proxy (4000) - standard pip in Ubuntu; use litellm CLI (python -m litellm lacks __main__ on some installs)
echo "Starting proxy (4000)..."
pkill -f "litellm.*config" 2>/dev/null || true
# Ensure proxy deps (websockets) for litellm - required by proxy server
if ! python3 -c "import websockets" 2>/dev/null; then
  python3 -m pip install -q --break-system-packages websockets 2>&1 | tail -2 || true
fi
run_litellm() {
  cd "$FARM_DIR"
  CONFIG="config-termux.yaml"
  [ ! -f "$CONFIG" ] && CONFIG="config.yaml"
  # Use python3 to run litellm so it uses the same env where pip installed deps (avoids shebang /usr/bin/python3 path issues)
  LITELLM_EXE=""
  for p in /usr/local/bin/litellm /usr/bin/litellm; do
    [ -f "$p" ] && LITELLM_EXE="$p" && break
  done
  [ -z "$LITELLM_EXE" ] && command -v litellm >/dev/null 2>&1 && LITELLM_EXE="$(command -v litellm)"
  if [ -n "$LITELLM_EXE" ]; then
    nohup python3 "$LITELLM_EXE" --config "$CONFIG" --port 4000 >> "$LOG_DIR/litellm.log" 2>&1 &
  else
    nohup python3 -m litellm --config "$CONFIG" --port 4000 >> "$LOG_DIR/litellm.log" 2>&1 &
  fi
  sleep 3
}
if python3 -c "import litellm" 2>/dev/null; then
  run_litellm
else
  echo "  (installing litellm with pip...)"
  python3 -m pip install -q "litellm[proxy]" 2>&1 | tail -3 || true
  if ! python3 -c "import litellm" 2>/dev/null; then
    python3 -m pip install -q litellm uvicorn fastapi pyyaml aiohttp 2>&1 | tail -3 || true
  fi
  if ! python3 -c "import litellm" 2>/dev/null; then
    python3 -m pip install -q "litellm<1.76.1" uvicorn fastapi pyyaml aiohttp 2>&1 | tail -3 || true
  fi
  if python3 -c "import litellm" 2>/dev/null; then
    run_litellm
  else
    echo "  (litellm not installed; gateway will use adapter at 8888)"
    mkdir -p "$TERMUX_HOME/.clawdbot"
    [ -f "$CLAWDBOT_ENV" ] || touch "$CLAWDBOT_ENV"
    grep -q "NEURAL_FARM_BASE_URL" "$CLAWDBOT_ENV" 2>/dev/null || echo "NEURAL_FARM_BASE_URL=http://127.0.0.1:8888/v1" >> "$CLAWDBOT_ENV"
    cd "$JARVIS_DIR" && node scripts/set-primary-neural-farm.js >> "$LOG_DIR/set-farm.log" 2>&1 || true
    sleep 1
  fi
fi

# No clipboard stubs needed in real Linux
echo "Starting gateway (18789)..."
pkill -f "clawdbot gateway" 2>/dev/null || true
pkill -f "gateway run" 2>/dev/null || true
sleep 1
cd "$JARVIS_DIR"
export PORT=18789
export BIND_LAN=1
# Proot/Android: os.networkInterfaces() can throw and crash the gateway; patch it so Discord can start
export NODE_OPTIONS="${NODE_OPTIONS:-} --require $JARVIS_DIR/scripts/patch-proot-network.js"
# Remove stale gateway lock files
rm -f "$HOME/tmp/clawdbot-"*/gateway.*.lock 2>/dev/null
# Use start-gateway-background.js (handles env + vault + spawn properly in Proot)
nohup node scripts/start-gateway-background.js >> "$LOG_DIR/gateway.log" 2>&1 &
sleep 3

echo "Starting webhook (18791)..."
nohup node scripts/webhook-trigger-server.js >> "$LOG_DIR/webhook.log" 2>&1 &
sleep 1

echo "Starting iPhone vision bridge (18792)..."
pkill -f iphone-vision-bridge 2>/dev/null || true
nohup node scripts/iphone-vision-bridge.js >> "$LOG_DIR/vision-bridge.log" 2>&1 &
sleep 1

echo "Starting chat server (18888)..."
pkill -f "pixel-chat-server" 2>/dev/null || true
nohup node scripts/pixel-chat-server.js >> "$LOG_DIR/chat-server.log" 2>&1 &
sleep 2

echo "Waiting for services (up to 30s)..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  P=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/ 2>/dev/null || echo "000")
  G=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/ 2>/dev/null || echo "000")
  C=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18888/ 2>/dev/null || echo "000")
  R=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18890/health 2>/dev/null || echo "000")
  if [ -n "$JARVIS_IPHONE_LLM_URL" ]; then
    [ "$R" = "200" ] && [ "$G" = "200" ] && [ "$C" = "200" ] && break
  else
    [ "$P" = "200" ] && [ "$G" = "200" ] && [ "$C" = "200" ] && break
  fi
  sleep 3
done
echo "Proxy (4000):   ${P:-000}"
[ -n "$JARVIS_IPHONE_LLM_URL" ] && echo "LLM router (18890): ${R:-000}"
echo "Gateway (18789): ${G:-000}"
echo "Chat UI (18888): ${C:-000}"
if [ "${G:-000}" != "200" ]; then
  echo "If Gateway is down: ensure InferrLM app is ON (port 8889). Logs: $LOG_DIR/gateway.log"
fi
echo ""
echo "JARVIS is live (Proot)."
echo "  Chat:  http://127.0.0.1:18888   Voice: http://127.0.0.1:18888/voice"
echo "  Vision: http://<this-ip>:18792/vision  (desk iPhone camera node)"
echo "  Logs:  $LOG_DIR/*.log"
echo "  Voice node: run in Termux (PulseAudio), or start separately in Proot if you have audio working."
