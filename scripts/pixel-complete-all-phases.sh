#!/usr/bin/env bash
# Run on the Pixel in Termux to complete all phases (0–9) that can be done on-device.
# Prereq: JARVIS already pushed (Phase 0). For Phase 1 PPK + wakelock, run from Mac (see docs).
# Usage: bash ~/JARVIS/scripts/pixel-complete-all-phases.sh

set -e
JARVIS="${JARVIS_DIR:-$HOME/JARVIS}"
HOME="${HOME:-/data/data/com.termux/files/home}"

echo "=== Complete all phases (on-device) ==="
echo ""

# Phase 0: ensure JARVIS present
echo "--- Phase 0 (Foundation) ---"
[ -d "$JARVIS" ] || { echo "  FAIL: No $JARVIS. Push from Mac: cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh"; exit 1; }
[ -f "$JARVIS/scripts/start-jarvis-pixel.sh" ] || { echo "  FAIL: start-jarvis-pixel.sh missing"; exit 1; }
echo "  JARVIS present. Start stack: bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice"

# Phase 1: swap
echo ""
echo "--- Phase 1 (Persistence: swap) ---"
[ -f "$JARVIS/scripts/setup-swap-termux.sh" ] && bash "$JARVIS/scripts/setup-swap-termux.sh" || {
  [ ! -f "$HOME/swapfile" ] && dd if=/dev/zero of=~/swapfile bs=1024 count=4194304 && chmod 600 ~/swapfile
  echo "  swapfile ready (run setup-swap-termux.sh after push for mkswap/swapon)"
}

# Phase 2: optional util-linux (taskset)
echo ""
echo "--- Phase 2 (Hardware: optional) ---"
(command -v taskset >/dev/null 2>&1) || pkg install util-linux -y 2>/dev/null
command -v taskset >/dev/null 2>&1 && echo "  taskset available" || echo "  SKIP: taskset not installed (optional)"

# Phase 3: Tailscale — user installs app; just note
echo ""
echo "--- Phase 3 (Networking) ---"
echo "  Tailscale: install app on Pixel, same account as Mac. Use Wi‑Fi IP (e.g. 192.168.86.209:18888) if needed."

# Phase 4: no device steps (gateway config)
echo ""
echo "--- Phase 4 (Cognitive) ---"
echo "  OK if chat works (adapter 8888 → gateway 18789)."

# Phase 5: voice
echo ""
echo "--- Phase 5 (Voice) ---"
[ -p "$HOME/.tts_pipe" ] || mkfifo ~/.tts_pipe
mkdir -p ~/.jarvis
[ -f ~/.jarvis/voice_node.yaml ] || cp "$JARVIS/scripts/voice_node_config.example.yaml" ~/.jarvis/voice_node.yaml 2>/dev/null || true
echo "  TTS FIFO + voice_node.yaml OK"

# Phase 6: SOUL + .cursorrules
echo ""
echo "--- Phase 6 (Cursor autonomy) ---"
[ -f ~/.jarvis/SOUL.md ] || cp "$JARVIS/docs/SOUL_TEMPLATE.md" ~/.jarvis/SOUL.md 2>/dev/null || true
[ -f "$JARVIS/.cursorrules" ] || [ ! -f "$JARVIS/docs/cursorrules-pixel.example" ] || cp "$JARVIS/docs/cursorrules-pixel.example" "$JARVIS/.cursorrules"
echo "  SOUL.md + .cursorrules OK"

# Phase 7: cron
echo ""
echo "--- Phase 7 (Proactive: cron) ---"
CRON="$HOME/jarvis.cron"
if [ ! -f "$CRON" ]; then
  echo "0 8 * * * HOME=$HOME cd $JARVIS && node scripts/jarvis-autonomous-plan-execute.js >> $HOME/plan-execute.log 2>&1" > "$CRON"
  echo "0 14 * * * HOME=$HOME cd $JARVIS && node scripts/jarvis-autonomous-plan-execute.js >> $HOME/plan-execute.log 2>&1" >> "$CRON"
  echo "0 20 * * * HOME=$HOME cd $JARVIS && node scripts/jarvis-autonomous-plan-execute.js >> $HOME/plan-execute.log 2>&1" >> "$CRON"
  echo "0 */6 * * * HOME=$HOME cd $JARVIS && node scripts/jarvis-autonomous-heartbeat.js >> $HOME/heartbeat.log 2>&1" >> "$CRON"
fi
crontab "$CRON" 2>/dev/null || true
crond -b 2>/dev/null || true
echo "  Cron installed"

# Phase 8: termux-api (user install from F-Droid)
echo ""
echo "--- Phase 8 (Actuation) ---"
termux-battery-status 2>&1 | head -1 | grep -q . && echo "  termux-api OK" || echo "  SKIP: Install Termux:API from same source as Termux (F-Droid)"

# Phase 9: no extra (gateway + swap already)
echo ""
echo "--- Phase 9 (Security & resilience) ---"
echo "  Gateway bind lan; swap file present. See docs for HITL."

echo ""
echo "=== Done. Next: ==="
echo "  1. Start stack: bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice"
echo "  2. Test all:    bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh all"
echo "  (Phase 1 PPK + wakelock: run from Mac with ADB; see docs/PIXEL_OPTIONAL_STEPS.md)"
