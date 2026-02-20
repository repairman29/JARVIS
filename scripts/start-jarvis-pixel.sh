#!/usr/bin/env bash
# Start (or restart) the JARVIS stack on the Pixel: adapter, proxy, gateway, webhook, chat.
# Optional in ~/.clawdbot/.env:
#   JARVIS_PIXEL_LLM_URL=http://<host>:8889  — InferrLM for primary adapter (8888). Default: http://127.0.0.1:8889.
#   JARVIS_IPHONE_LLM_URL=http://<iphone-ip>:8889 — dual backend (Pixel + iPhone); see docs/PIXEL_DUAL_LLM_BACKEND.md.
# Run in Termux: bash ~/JARVIS/scripts/start-jarvis-pixel.sh
# With voice node in background: bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice

export HOME="${HOME:-/data/data/com.termux/files/home}"
PREFIX="$HOME"
# Find JARVIS: script is in JARVIS/scripts/, so repo root is parent of script dir
SCRIPT_DIR=""
[ -n "${BASH_SOURCE[0]}" ] && SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/start-gateway-background.js" ]; then
  JARVIS_DIR="$(dirname "$SCRIPT_DIR")"
elif [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/pixel-chat-server.js" ]; then
  JARVIS_DIR="$(dirname "$SCRIPT_DIR")"
else
  JARVIS_DIR="$HOME/JARVIS"
fi
FARM_DIR="$HOME/neural-farm"
[ ! -d "$FARM_DIR" ] && FARM_DIR="$(dirname "$JARVIS_DIR")/neural-farm"

[ ! -d "$JARVIS_DIR" ] && { echo "JARVIS not found at $JARVIS_DIR"; exit 1; }
[ ! -d "$FARM_DIR" ] && { echo "neural-farm not found at $FARM_DIR"; exit 1; }

# Load optional Pixel/iPhone dual-backend config (e.g. JARVIS_IPHONE_LLM_URL=http://192.168.1.100:8889)
CLAWDBOT_ENV="$HOME/.clawdbot/.env"
if [ -f "$CLAWDBOT_ENV" ]; then
  while IFS= read -r line; do
    [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] && export "$line"
  done < "$CLAWDBOT_ENV"
fi

# Primary adapter (8888): use JARVIS_PIXEL_LLM_URL if set (e.g. InferrLM on another host), else localhost
PIXEL_LLM_URL="${JARVIS_PIXEL_LLM_URL:-http://127.0.0.1:8889}"
echo "Starting adapter (Pixel 8888) → $PIXEL_LLM_URL"
pkill -f inferrlm_adapter 2>/dev/null || true
cd "$FARM_DIR" && PIXEL_URL="$PIXEL_LLM_URL" ADAPTER_PORT=8888 FARM_DEV=1 nohup python3 -u inferrlm_adapter.py >> "$PREFIX/adapter.log" 2>&1 &
sleep 2

# Optional second adapter when iPhone InferrLM URL is set (Option B: dual backend)
if [ -n "$JARVIS_IPHONE_LLM_URL" ]; then
  echo "Starting adapter (iPhone 8887) → $JARVIS_IPHONE_LLM_URL"
  cd "$FARM_DIR" && PIXEL_URL="${JARVIS_IPHONE_LLM_URL}" ADAPTER_PORT=8887 nohup python3 -u inferrlm_adapter.py >> "$PREFIX/adapter-iphone.log" 2>&1 &
  sleep 2
fi

# Start LLM router (18890) when using multiple backends (iPhone and/or Gemini Nano bridge at 8890)
# So Mac chat and on-device chat can use InferrLM + Gemini Nano. Bridge app must be running for 8890.
# Default: chat-task routing (chat → Nano, tasks → InferrLM). Override with PIXEL_LLM_ROUTE in .env.
# Optional: pick which InferrLM model for chat vs task (see docs/PIXEL_LLM_MODEL_GUIDE.md):
#   export PIXEL_LLM_PRIMARY_CHAT_MODEL="Gemma 3 Instruct - 1B"
#   export PIXEL_LLM_PRIMARY_TASK_MODEL="gemma-3-4b-it-Q4_K_M.gguf"
if [ -n "$JARVIS_IPHONE_LLM_URL" ] || [ -n "$JARVIS_GEMINI_NANO_BRIDGE" ]; then
  echo "Starting LLM router (18890)..."
  pkill -f pixel-llm-router 2>/dev/null || true
  export PIXEL_LLM_TERTIARY="${PIXEL_LLM_TERTIARY:-http://127.0.0.1:8890}"
  export PIXEL_LLM_ROUTE="${PIXEL_LLM_ROUTE:-chat-task}"
  cd "$JARVIS_DIR" && nohup node scripts/pixel-llm-router.js >> "$PREFIX/llm-router.log" 2>&1 &
  sleep 1
  mkdir -p "$HOME/.clawdbot"
  if grep -q "NEURAL_FARM_BASE_URL" "$HOME/.clawdbot/.env" 2>/dev/null; then
    tmp=$(mktemp 2>/dev/null || echo "$HOME/.clawdbot/.env.tmp")
    grep -v "^NEURAL_FARM_BASE_URL=" "$HOME/.clawdbot/.env" > "$tmp"
    echo "NEURAL_FARM_BASE_URL=http://127.0.0.1:18890/v1" >> "$tmp"
    mv "$tmp" "$HOME/.clawdbot/.env"
  else
    echo "NEURAL_FARM_BASE_URL=http://127.0.0.1:18890/v1" >> "$HOME/.clawdbot/.env"
  fi
  cd "$JARVIS_DIR" && node scripts/set-primary-neural-farm.js >> "$PREFIX/set-farm.log" 2>&1 || true
  sleep 1
fi

# Proxy (4000): only if litellm is installed for the same python3 we run (use python3 -m pip on device)
echo "Starting proxy (4000)..."
pkill -f "litellm.*config" 2>/dev/null || true
PY="${PYTHON3:-python3}"
PROXY_OK=""
if $PY -c "import litellm" 2>/dev/null; then
  cd "$FARM_DIR"
  CONFIG="config-termux.yaml"
  [ ! -f "$CONFIG" ] && CONFIG="config.yaml"
  nohup $PY -m litellm --config "$CONFIG" --port 4000 >> "$PREFIX/litellm.log" 2>&1 &
  PROXY_OK=1
  sleep 3
else
  echo "  (litellm not found for $PY — trying one-time install with $PY -m pip...)"
  TUR="--extra-index-url https://termux-user-repository.github.io/pypi/"
  $PY -m pip install $TUR "litellm[proxy]" -q 2>/dev/null || $PY -m pip install $TUR litellm uvicorn "fastapi" pyyaml aiohttp -q 2>/dev/null || true
  if $PY -c "import litellm" 2>/dev/null; then
    cd "$FARM_DIR"
    CONFIG="config-termux.yaml"
    [ ! -f "$CONFIG" ] && CONFIG="config.yaml"
    nohup $PY -m litellm --config "$CONFIG" --port 4000 >> "$PREFIX/litellm.log" 2>&1 &
    PROXY_OK=1
    sleep 3
  else
    echo "  (litellm still not installed — gateway will use adapter at 8888. Run: bash ~/JARVIS/scripts/install-litellm-termux.sh)"
    mkdir -p "$HOME/.clawdbot"
    grep -q "NEURAL_FARM_BASE_URL" "$HOME/.clawdbot/.env" 2>/dev/null || echo "NEURAL_FARM_BASE_URL=http://127.0.0.1:8888/v1" >> "$HOME/.clawdbot/.env"
    cd "$JARVIS_DIR" && node scripts/set-primary-neural-farm.js >> "$PREFIX/set-farm.log" 2>&1 || true
    sleep 1
  fi
fi

# Stub missing clipboard native modules so clawdbot gateway can start on Termux (Node may report android or linux)
STUBS_DIR="$JARVIS_DIR/scripts/pixel-stubs"
NMM="$JARVIS_DIR/node_modules/@mariozechner"
if [ -d "$STUBS_DIR" ]; then
  mkdir -p "$NMM"
  for stub in clipboard-android-arm64 clipboard-linux-arm64-gnu clipboard-linux-arm64-musl; do
    if [ -d "$STUBS_DIR/$stub" ] && [ ! -d "$NMM/$stub" ]; then
      cp -r "$STUBS_DIR/$stub" "$NMM/"
    fi
  done
fi
echo "Starting gateway (18789, bind lan so browser and Mac can reach it)..."
pkill -f "clawdbot gateway" 2>/dev/null || true
pkill -f "gateway run" 2>/dev/null || true
sleep 1
cd "$JARVIS_DIR"
export PORT=18789
export BIND_LAN=1
# Termux can't write /tmp; use home so clawdbot can mkdir for logs
mkdir -p "$PREFIX/tmp"
export TMPDIR="$PREFIX/tmp"
node scripts/start-gateway-background.js 2>/dev/null || (TMPDIR="$PREFIX/tmp" BIND_LAN=1 nohup npx clawdbot gateway run --allow-unconfigured --port 18789 --bind lan >> "$PREFIX/gateway.log" 2>&1 &)
sleep 3

echo "Starting webhook (18791)..."
nohup node scripts/webhook-trigger-server.js >> "$PREFIX/webhook.log" 2>&1 &
sleep 1

echo "Starting chat server (18888) for browser on device..."
pkill -f "pixel-chat-server" 2>/dev/null || true
nohup node scripts/pixel-chat-server.js >> "$PREFIX/chat-server.log" 2>&1 &
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
  echo ""
  echo "If Gateway is down: ensure InferrLM app is running with Server ON (port 8889)."
  echo "Check logs: tail -20 ~/gateway.log  and  tail -20 ~/litellm.log"
fi
if [ -n "$JARVIS_IPHONE_LLM_URL" ] && [ "${R:-000}" != "200" ]; then
  echo "LLM router (18890) not up. Check ~/llm-router.log and that iPhone is reachable at $JARVIS_IPHONE_LLM_URL"
fi
echo ""
echo ""
echo "JARVIS is live."
echo "  Chat:  http://127.0.0.1:18888   Voice: http://127.0.0.1:18888/voice"
echo "  Terminal voice: bash ~/JARVIS/scripts/start-voice-node-pixel.sh  (then press Enter to speak)"
if [ "$1" = "--voice" ]; then
  echo "Starting voice node in background..."
  ( sleep 2; cd "$JARVIS_DIR" && TTS_FIFO="${TTS_FIFO:-$HOME/.tts_pipe}" VOICE_NODE_MANUAL_TRIGGER=1 bash scripts/start-voice-node-pixel.sh >> "$PREFIX/voice-node.log" 2>&1 ) &
  echo "Voice node logging to ~/voice-node.log"
fi
