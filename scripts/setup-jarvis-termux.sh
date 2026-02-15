#!/data/data/com.termux/files/usr/bin/bash
# Run this script inside Termux on the Pixel. Expects JARVIS and neural-farm tarballs
# in ~/storage/downloads (or /sdcard/Download). Optional: clawdbot.env for gateway token etc.
set -e
export HOME=/data/data/com.termux/files/home
PREFIX="$HOME"
JARVIS_DIR="$PREFIX/JARVIS"
FARM_DIR="$PREFIX/neural-farm"
# Find where the tarballs are: same dir as this script, or Termux storage, or system Download
SCRIPT_DIR=""
if [ -n "$BASH_SOURCE" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$BASH_SOURCE")" 2>/dev/null && pwd)"
fi
DOWNLOAD=""
for try in "$SCRIPT_DIR" "$HOME/storage/downloads" "/storage/emulated/0/Download" "/sdcard/Download" "$HOME"; do
  [ -n "$try" ] && [ -f "$try/JARVIS.tar.gz" ] && [ -f "$try/neural-farm.tar.gz" ] && DOWNLOAD="$try" && break
done
[ -z "$DOWNLOAD" ] && DOWNLOAD="$HOME"
LOG="$PREFIX/jarvis-setup.log"

log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }

log "=== JARVIS on Termux setup ==="

# 1. Packages
log "Installing packages..."
pkg update -y
pkg install -y nodejs python cronie git || true
# Termux: cryptography from pkg (avoids Rust build failure with pip)
pkg install -y python-cryptography 2>/dev/null || true

# 2. If files are in system Download but not in $DOWNLOAD, copy to home so we can read them
if [ ! -f "$DOWNLOAD/JARVIS.tar.gz" ] && [ -f "/storage/emulated/0/Download/JARVIS.tar.gz" ]; then
  log "Copying files from system Download to home..."
  cp -f /storage/emulated/0/Download/JARVIS.tar.gz /storage/emulated/0/Download/neural-farm.tar.gz /storage/emulated/0/Download/setup-jarvis-termux.sh "$HOME/" 2>/dev/null || true
  [ -f /storage/emulated/0/Download/clawdbot.env ] && cp -f /storage/emulated/0/Download/clawdbot.env "$HOME/"
  DOWNLOAD="$HOME"
fi
[ -f "$HOME/JARVIS.tar.gz" ] && [ -z "$DOWNLOAD" ] && DOWNLOAD="$HOME"

# 3. Extract tarballs (tarballs contain JARVIS/ and neural-farm/ at top level)
mkdir -p "$PREFIX"
if [ -f "$DOWNLOAD/JARVIS.tar.gz" ]; then
  log "Extracting JARVIS..."
  tar -xzf "$DOWNLOAD/JARVIS.tar.gz" -C "$PREFIX"
fi
[ -d "$PREFIX/JARVIS" ] && JARVIS_DIR="$PREFIX/JARVIS"
[ ! -d "$JARVIS_DIR" ] && { log "Put JARVIS.tar.gz in Download (run push script from Mac) and re-run."; exit 1; }

if [ -f "$DOWNLOAD/neural-farm.tar.gz" ]; then
  log "Extracting neural-farm..."
  tar -xzf "$DOWNLOAD/neural-farm.tar.gz" -C "$PREFIX"
fi
[ -d "$PREFIX/neural-farm" ] && FARM_DIR="$PREFIX/neural-farm"
[ ! -d "$FARM_DIR" ] && { log "Put neural-farm.tar.gz in Download and re-run."; exit 1; }

# 4. neural-farm: .env and deps
log "Setting up neural-farm..."
echo "PIXEL_URL=http://127.0.0.1:8889" > "$FARM_DIR/.env"
# Install litellm. Use TUR for pre-built wheels if pip build fails (cryptography, fastuuid).
TUR="--extra-index-url https://termux-user-repository.github.io/pypi/"
[ -f "$FARM_DIR/requirements.txt" ] && pip install $TUR -r "$FARM_DIR/requirements.txt" -q 2>/dev/null || pip install $TUR "litellm[proxy]" -q 2>/dev/null || true
[ -f "$FARM_DIR/config-termux.yaml" ] && cp "$FARM_DIR/config-termux.yaml" "$FARM_DIR/config.yaml" 2>/dev/null || true

# 5. JARVIS: env and deps
log "Setting up JARVIS..."
mkdir -p "$HOME/.clawdbot"
for env_src in "$DOWNLOAD/clawdbot.env" "$HOME/clawdbot.env"; do
  [ -f "$env_src" ] && cp "$env_src" "$HOME/.clawdbot/.env" && log "Using provided .clawdbot/.env" && break
done
[ ! -f "$HOME/.clawdbot/.env" ] && echo "CLAWDBOT_GATEWAY_TOKEN=$(openssl rand -hex 16)" > "$HOME/.clawdbot/.env"
cd "$JARVIS_DIR" && npm install 2>/dev/null || true

# 6. Start adapter (Pixel local InferrLM)
log "Starting adapter (8888 -> 127.0.0.1:8889)..."
pkill -f inferrlm_adapter 2>/dev/null || true
cd "$FARM_DIR" && PIXEL_URL=http://127.0.0.1:8889 FARM_DEV=1 nohup python3 -u inferrlm_adapter.py >> "$PREFIX/adapter.log" 2>&1 &
sleep 2

# 7. Start LiteLLM proxy (use termux config if present)
log "Starting LiteLLM proxy (4000)..."
pkill -f "litellm.*config" 2>/dev/null || true
cd "$FARM_DIR"
pip install -r "$FARM_DIR/requirements.txt" -q 2>/dev/null || pip install "litellm[proxy]" -q 2>/dev/null || true
CONFIG="config-termux.yaml"
[ ! -f "$CONFIG" ] && CONFIG="config.yaml"
nohup python3 -m litellm --config "$CONFIG" --port 4000 >> "$PREFIX/litellm.log" 2>&1 &
sleep 3

# 8. Clipboard stubs so gateway starts on Termux (no native clipboard on Android/Linux arm64)
if [ -d "$JARVIS_DIR/scripts/pixel-stubs" ]; then
  log "Installing clipboard stubs for gateway..."
  mkdir -p "$JARVIS_DIR/node_modules/@mariozechner"
  for stub in clipboard-android-arm64 clipboard-linux-arm64-gnu clipboard-linux-arm64-musl; do
    [ -d "$JARVIS_DIR/scripts/pixel-stubs/$stub" ] && cp -r "$JARVIS_DIR/scripts/pixel-stubs/$stub" "$JARVIS_DIR/node_modules/@mariozechner/" 2>/dev/null || true
  done
fi

# 9. Start gateway and webhook
log "Starting gateway (18789, bind lan for browser on device) and webhook (18791)..."
cd "$JARVIS_DIR"
export PORT=18789
mkdir -p "$PREFIX/tmp" && export TMPDIR="$PREFIX/tmp"
node scripts/start-gateway-background.js 2>/dev/null || (nohup npx clawdbot gateway run --allow-unconfigured --port 18789 --bind lan >> "$PREFIX/gateway.log" 2>&1 &)
sleep 2
nohup node scripts/webhook-trigger-server.js >> "$PREFIX/webhook.log" 2>&1 &
sleep 1

# 10. Cron (absolute paths)
log "Setting crontab..."
CRON="$PREFIX/jarvis.cron"
echo "0 8 * * * HOME=$HOME cd $JARVIS_DIR && node scripts/jarvis-autonomous-plan-execute.js >> $PREFIX/plan-execute.log 2>&1" > "$CRON"
echo "0 14 * * * HOME=$HOME cd $JARVIS_DIR && node scripts/jarvis-autonomous-plan-execute.js >> $PREFIX/plan-execute.log 2>&1" >> "$CRON"
echo "0 20 * * * HOME=$HOME cd $JARVIS_DIR && node scripts/jarvis-autonomous-plan-execute.js >> $PREFIX/plan-execute.log 2>&1" >> "$CRON"
echo "0 */6 * * * HOME=$HOME cd $JARVIS_DIR && node scripts/jarvis-autonomous-heartbeat.js >> $PREFIX/heartbeat.log 2>&1" >> "$CRON"
crontab "$CRON"
crond -b 2>/dev/null || true

# Launchers in home so you can run "bash ~/start-jarvis.sh" from anywhere
echo "cd \"$JARVIS_DIR\" && bash scripts/start-jarvis-pixel.sh" > "$PREFIX/start-jarvis.sh"
echo "cd \"$JARVIS_DIR\" && bash scripts/start-pixel-chat-only.sh" > "$PREFIX/start-chat.sh"
chmod +x "$PREFIX/start-jarvis.sh" "$PREFIX/start-chat.sh"
log "Launchers: bash ~/start-jarvis.sh  and  bash ~/start-chat.sh"

log "Done. Enable Wake lock in Termux settings. Check: curl -s http://127.0.0.1:4000/ && curl -s http://127.0.0.1:18789/"
