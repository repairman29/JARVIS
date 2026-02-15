#!/usr/bin/env bash
# Start (or restart) the JARVIS stack on the Pixel: adapter, proxy, gateway, webhook, chat.
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

echo "Starting adapter..."
pkill -f inferrlm_adapter 2>/dev/null || true
cd "$FARM_DIR" && PIXEL_URL=http://127.0.0.1:8889 FARM_DEV=1 nohup python3 -u inferrlm_adapter.py >> "$PREFIX/adapter.log" 2>&1 &
sleep 2

# Proxy (4000): only if litellm is installed (on Termux it often fails to build)
echo "Starting proxy (4000)..."
pkill -f "litellm.*config" 2>/dev/null || true
PROXY_OK=""
if python3 -c "import litellm" 2>/dev/null; then
  cd "$FARM_DIR"
  CONFIG="config-termux.yaml"
  [ ! -f "$CONFIG" ] && CONFIG="config.yaml"
  nohup python3 -m litellm --config "$CONFIG" --port 4000 >> "$PREFIX/litellm.log" 2>&1 &
  PROXY_OK=1
  sleep 3
else
  echo "  (litellm not installed — gateway will use adapter at 8888)"
  # Point gateway at adapter so we don't need the proxy
  mkdir -p "$HOME/.clawdbot"
  grep -q "NEURAL_FARM_BASE_URL" "$HOME/.clawdbot/.env" 2>/dev/null || echo "NEURAL_FARM_BASE_URL=http://127.0.0.1:8888/v1" >> "$HOME/.clawdbot/.env"
  cd "$JARVIS_DIR" && node scripts/set-primary-neural-farm.js >> "$PREFIX/set-farm.log" 2>&1 || true
  sleep 1
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
echo "Starting gateway (18789, bind lan so browser on device can reach it)..."
cd "$JARVIS_DIR"
export PORT=18789
# Termux can't write /tmp; use home so clawdbot can mkdir for logs
mkdir -p "$PREFIX/tmp"
export TMPDIR="$PREFIX/tmp"
node scripts/start-gateway-background.js 2>/dev/null || (TMPDIR="$PREFIX/tmp" nohup npx clawdbot gateway run --allow-unconfigured --port 18789 --bind lan >> "$PREFIX/gateway.log" 2>&1 &)
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
  [ "$P" = "200" ] && [ "$G" = "200" ] && [ "$C" = "200" ] && break
  sleep 3
done
echo "Proxy (4000):   ${P:-000}"
echo "Gateway (18789): ${G:-000}"
echo "Chat UI (18888): ${C:-000}"
if [ "${G:-000}" != "200" ] || [ "${P:-000}" != "200" ]; then
  echo ""
  echo "If Proxy or Gateway are down: ensure InferrLM app is running with Server ON (port 8889)."
  echo "Check logs: tail -20 ~/gateway.log  and  tail -20 ~/litellm.log"
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
