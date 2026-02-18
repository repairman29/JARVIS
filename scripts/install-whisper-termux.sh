#!/usr/bin/env bash
# Install whisper.cpp on the Pixel (Termux) for the voice node STT.
# Run in Termux: bash ~/JARVIS/scripts/install-whisper-termux.sh
#
# After this, set whisper_cmd in ~/.jarvis/voice_node.yaml (this script prints the line).
# Option: pass --write-config to patch voice_node.yaml if it exists.

set -e
WRITE_CONFIG=""
[ "$1" = "--write-config" ] && WRITE_CONFIG=1

export HOME="${HOME:-/data/data/com.termux/files/home}"
WHISPER_DIR="${WHISPER_DIR:-$HOME/whisper.cpp}"
MODEL="${WHISPER_MODEL:-base.en}"

echo "Installing dependencies..."
pkg update -y
pkg install -y git cmake clang make ffmpeg curl

if [ ! -d "$WHISPER_DIR" ]; then
  echo "Cloning whisper.cpp..."
  git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git "$WHISPER_DIR"
fi
cd "$WHISPER_DIR"

echo "Building (this may take a few minutes)..."
# -DGGML_NO_OPENMP=ON needed for stable build on Termux
cmake -S . -B build -DGGML_NO_OPENMP=ON
cmake --build build -j"$(nproc 2>/dev/null || echo 2)"

BIN="$WHISPER_DIR/build/bin/whisper-cli"
if [ ! -x "$BIN" ]; then
  # Some builds use main or whisper instead of whisper-cli
  for name in whisper-cli main whisper; do
    [ -x "$WHISPER_DIR/build/bin/$name" ] && BIN="$WHISPER_DIR/build/bin/$name" && break
  done
fi
if [ ! -x "$BIN" ]; then
  echo "Build failed: no binary in build/bin/" >&2
  exit 1
fi

echo "Downloading model: $MODEL..."
mkdir -p "$WHISPER_DIR/models"
if [ -f "$WHISPER_DIR/models/download-ggml-model.sh" ]; then
  bash "$WHISPER_DIR/models/download-ggml-model.sh" "$MODEL"
else
  # Fallback: try models/ in repo root
  [ -f "$WHISPER_DIR/download-ggml-model.sh" ] && bash "$WHISPER_DIR/download-ggml-model.sh" "$MODEL" || true
fi

MODEL_FILE="$WHISPER_DIR/models/ggml-$MODEL.bin"
[ ! -f "$MODEL_FILE" ] && MODEL_FILE="$WHISPER_DIR/models/ggml-$MODEL.gguf"
[ ! -f "$MODEL_FILE" ] && MODEL_FILE="$WHISPER_DIR/ggml-$MODEL.bin"
[ ! -f "$MODEL_FILE" ] && MODEL_FILE="$WHISPER_DIR/models/$MODEL.bin"
if [ ! -f "$MODEL_FILE" ]; then
  echo "Model not found at $MODEL_FILE. Try: cd $WHISPER_DIR && bash models/download-ggml-model.sh base.en" >&2
  exit 1
fi

# Voice node appends the WAV path; whisper-cli -otxt writes to <path>.txt
WHISPER_CMD="$BIN -m $MODEL_FILE -l en -otxt -f"
echo ""
echo "Whisper is ready. Add this to ~/.jarvis/voice_node.yaml (under the STT section):"
echo ""
echo "whisper_cmd: \"$WHISPER_CMD\""
echo ""

if [ -n "$WRITE_CONFIG" ]; then
  JARVIS_DIR="${JARVIS_DIR:-$HOME/JARVIS}"
  [ -f "$JARVIS_DIR/scripts/voice_node_config.example.yaml" ] && JARVIS_DIR="$(cd "$JARVIS_DIR" 2>/dev/null && pwd)" || true
  CFG="$HOME/.jarvis/voice_node.yaml"
  mkdir -p "$(dirname "$CFG")"
  REPL="whisper_cmd: \"$WHISPER_CMD\""
  if [ -f "$CFG" ]; then
    if grep -q "whisper_cmd:" "$CFG" 2>/dev/null; then
      sed -i "s|whisper_cmd:.*|$REPL|" "$CFG"
      echo "Updated whisper_cmd in $CFG"
    else
      echo "$REPL" >> "$CFG"
      echo "Appended whisper_cmd to $CFG"
    fi
  else
    [ -f "$JARVIS_DIR/scripts/voice_node_config.example.yaml" ] && cp "$JARVIS_DIR/scripts/voice_node_config.example.yaml" "$CFG"
    if [ -f "$CFG" ]; then
      sed -i "s|whisper_cmd:.*|$REPL|" "$CFG"
      echo "Created $CFG with whisper_cmd."
    fi
  fi
fi

echo "Test: $BIN -m $MODEL_FILE -l en -otxt -f <path-to-16khz-wav>"
