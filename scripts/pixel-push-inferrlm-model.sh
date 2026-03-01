#!/usr/bin/env bash
# Download a GGUF model (Gemma 3 1B or 4B) and push it to the Pixel so you can load it in InferrLM.
# Usage: ./scripts/pixel-push-inferrlm-model.sh [1b|4b] [pixel-ip]
#   Default: 1b (smaller, faster to download). Use 4b for best task capability.
# Prereqs: Pixel on same Wi-Fi; Termux with sshd (SSH) or USB/Wi-Fi ADB. For SSH, run once: ./scripts/setup-ssh-keys-to-pixel.sh
# After push: open InferrLM on the Pixel → Load model from Download → select the .gguf → Server ON → test with node scripts/pixel-llm-speed-test.js

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"

# Model choice: 1b (default) or 4b
SIZE="1b"
if [ "$1" = "4b" ] || [ "$1" = "4B" ]; then
  SIZE="4b"
  shift
elif [ "$1" = "1b" ] || [ "$1" = "1B" ]; then
  shift
fi

# Pixel IP
if [ -n "$1" ] && [ "$1" != "4b" ] && [ "$1" != "1b" ]; then
  PIXEL_IP="$1"
  echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
else
  [ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1 | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
fi

if [ "$SIZE" = "4b" ]; then
  HF_REPO="ggml-org/gemma-3-4b-it-GGUF"
  FILENAME="gemma-3-4b-it-Q4_K_M.gguf"
  LABEL="Gemma 3 4B (Q4_K_M)"
else
  HF_REPO="ggml-org/gemma-3-1b-it-GGUF"
  FILENAME="gemma-3-1b-it-Q4_K_M.gguf"
  LABEL="Gemma 3 1B (Q4_K_M)"
fi
URL="https://huggingface.co/${HF_REPO}/resolve/main/${FILENAME}"

DOWNLOAD_DIR="${JARVIS_ROOT}/.pixel-model-download"
mkdir -p "$DOWNLOAD_DIR"
LOCAL_FILE="${DOWNLOAD_DIR}/${FILENAME}"

echo "=== Push InferrLM model to Pixel ==="
echo "Model: $LABEL"
echo "Pixel: $PIXEL_IP"
echo ""

# 1. Download on Mac if not already present
if [ ! -f "$LOCAL_FILE" ]; then
  echo "Downloading ${FILENAME} (~$([ "$SIZE" = "4b" ] && echo "2.5" || echo "0.9") GB)..."
  if ! curl -L -o "$LOCAL_FILE" --connect-timeout 10 --retry 2 "$URL" 2>/dev/null; then
    echo "Download failed. Try manually: $URL" >&2
    exit 1
  fi
  echo "Downloaded."
else
  echo "Using cached ${FILENAME}."
fi

REMOTE_DIR=""
# 2. Prefer SSH: push to Termux storage (same as Android Download if termux-setup-storage was run)
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o BatchMode=yes"
if ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "test -d ~/storage/downloads" 2>/dev/null; then
  REMOTE_DIR="/data/data/com.termux/files/home/storage/downloads"
  echo "Pushing to Pixel (SSH) → Download folder..."
  if scp -P "$PORT" $SSH_OPTS "$LOCAL_FILE" "$USER@$PIXEL_IP:$REMOTE_DIR/" 2>/dev/null; then
    echo "Pushed to Termux Download (~/storage/downloads)."
  else
    REMOTE_DIR=""
  fi
fi
if [ -z "$REMOTE_DIR" ] && ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "mkdir -p ~/JARVIS/models" 2>/dev/null; then
  REMOTE_DIR="/data/data/com.termux/files/home/JARVIS/models"
  echo "Pushing to Pixel (SSH) → ~/JARVIS/models (run termux-setup-storage for Download)..."
  if scp -P "$PORT" $SSH_OPTS "$LOCAL_FILE" "$USER@$PIXEL_IP:$REMOTE_DIR/" 2>/dev/null; then
    echo "Pushed to ~/JARVIS/models. In InferrLM, open from that path if the app can browse it, or move the file to Download with a file manager."
  else
    REMOTE_DIR=""
  fi
fi

# 3. Fallback: ADB push to Android Download
if [ -z "$REMOTE_DIR" ]; then
  if adb devices 2>/dev/null | grep -qE 'device$'; then
    echo "Pushing via ADB → /sdcard/Download/..."
    if adb push "$LOCAL_FILE" "/sdcard/Download/$FILENAME" 2>/dev/null; then
      echo "Pushed to Android Download folder."
    else
      echo "ADB push failed." >&2
      exit 1
    fi
  else
    echo "SSH and ADB failed. Ensure:" >&2
    echo "  - Termux: sshd running, and run  termux-setup-storage  once for Download folder" >&2
    echo "  - Or: USB/Wi-Fi ADB connected (adb devices)" >&2
    echo "  - Model is on Mac at: $LOCAL_FILE" >&2
    exit 1
  fi
fi

echo ""
echo "Next steps:"
echo "  1. On the Pixel: open InferrLM → Load model → choose $FILENAME from Download (or JARVIS/models)."
echo "  2. Set it as default, turn Server ON (port 8889)."
echo "  3. Test: ssh -p $PORT $USER@$PIXEL_IP 'cd ~/JARVIS && node scripts/pixel-llm-speed-test.js'"
echo "     Or on Pixel: Chrome → http://127.0.0.1:18888 and send a message."
echo ""
echo "See docs/PIXEL_INFERRLM_MODEL_INSTALL.md for more options and troubleshooting."
