#!/usr/bin/env bash
# Run on the Pixel in Termux. Does Phase 1 (swap only; PPK is ADB from Mac), 5 (FIFO + voice config). Skip 2–4 device steps.
# Usage: bash ~/JARVIS/scripts/pixel-run-phases-1-5-on-device.sh

set -e
JARVIS="${JARVIS_DIR:-$HOME/JARVIS}"

echo "=== Phase 1 (swap) ==="
if [ -f "$JARVIS/scripts/setup-swap-termux.sh" ]; then
  bash "$JARVIS/scripts/setup-swap-termux.sh" || true
else
  if [ ! -f "$HOME/swapfile" ]; then
    dd if=/dev/zero of=~/swapfile bs=1024 count=4194304
    chmod 600 ~/swapfile
  fi
  command -v mkswap >/dev/null 2>&1 && mkswap ~/swapfile 2>/dev/null; swapon ~/swapfile 2>/dev/null || echo "  Swap: run bash ~/JARVIS/scripts/setup-swap-termux.sh"
fi

echo "=== Phase 5 (FIFO + voice config) ==="
[ -p "$HOME/.tts_pipe" ] || mkfifo ~/.tts_pipe && echo "  TTS FIFO OK"
mkdir -p ~/.jarvis
[ -f ~/.jarvis/voice_node.yaml ] || cp "$JARVIS/scripts/voice_node_config.example.yaml" ~/.jarvis/voice_node.yaml 2>/dev/null && echo "  voice_node.yaml OK" || true

echo "=== Phase 6 (SOUL) ==="
[ -f ~/.jarvis/SOUL.md ] || cp "$JARVIS/docs/SOUL_TEMPLATE.md" ~/.jarvis/SOUL.md 2>/dev/null && echo "  SOUL.md OK" || true

echo "=== Phase 7 (cron) ==="
[ -f ~/jarvis.cron ] && crontab ~/jarvis.cron 2>/dev/null && crond -b 2>/dev/null; crontab -l 2>/dev/null | head -2 && echo "  Cron OK" || true

echo "Done. Run tests: bash $JARVIS/scripts/pixel-test-phases-on-device.sh all"
