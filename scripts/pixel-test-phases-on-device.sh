#!/usr/bin/env bash
# Run inside Termux on the Pixel. Tests each phase of the Edge-Native Sovereign roadmap.
# Usage: bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh [phase]
#   phase: 0-9 or "all" (default: all). Exit 0 only if all requested phases pass.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_DIR="${JARVIS_DIR:-$HOME/JARVIS}"
FAILED=0

pass() { echo "  PASS: $*"; return 0; }
fail() { echo "  FAIL: $*"; return 1; }

# --- Phase 0: Foundation ---
test_phase_0() {
  echo "Phase 0 (Foundation)"
  local ok=0
  [ -d "$JARVIS_DIR" ] && pass "JARVIS dir exists" || { fail "JARVIS dir missing"; ok=1; }
  [ -f "$JARVIS_DIR/scripts/start-jarvis-pixel.sh" ] && pass "start-jarvis-pixel.sh exists" || { fail "start-jarvis-pixel.sh missing"; ok=1; }
  nc -z 127.0.0.1 8889 2>/dev/null && pass "8889 (InferrLM) open" || { fail "8889 closed (InferrLM server?)"; ok=1; }
  nc -z 127.0.0.1 18789 2>/dev/null && pass "18789 (gateway) open" || { fail "18789 closed"; ok=1; }
  nc -z 127.0.0.1 18888 2>/dev/null && pass "18888 (chat) open" || { fail "18888 closed"; ok=1; }
  curl -sf --max-time 3 http://127.0.0.1:18888/ 2>/dev/null | head -1 | grep -q . && pass "chat UI responds" || { fail "chat UI no response"; ok=1; }
  return $ok
}

# --- Phase 1: Persistence ---
test_phase_1() {
  echo "Phase 1 (Persistence)"
  local ok=0
  if [ -f "$HOME/swapfile" ]; then
    swapon --show 2>/dev/null | grep -q swapfile && pass "swap file exists and active" || pass "swap file exists (run swapon if needed)"
  else
    fail "~/swapfile not found"; ok=1
  fi
  # PPK/wakelock require ADB from host; we only check swap on device
  return $ok
}

# --- Phase 2: Hardware substrate ---
test_phase_2() {
  echo "Phase 2 (Hardware substrate)"
  local ok=0
  command -v taskset >/dev/null 2>&1 && pass "taskset available" || echo "  SKIP: taskset not found (optional)"
  [ -n "$VK_ICD_FILENAMES" ] && pass "Vulkan ICD env set" || echo "  SKIP: VK_ICD_FILENAMES not set (optional)"
  return $ok
}

# --- Phase 3: Networking ---
test_phase_3() {
  echo "Phase 3 (Networking)"
  local ok=0
  (command -v tailscale >/dev/null 2>&1 && tailscale status 2>/dev/null) && pass "Tailscale installed and running" || { echo "  SKIP: Tailscale not installed or not running"; }
  ss -tlnp 2>/dev/null | grep -q ':18789' && pass "18789 listening" || { fail "gateway not listening"; ok=1; }
  ss -tlnp 2>/dev/null | grep -q ':18888' && pass "18888 listening" || { fail "chat not listening"; ok=1; }
  return $ok
}

# --- Phase 4: Cognitive (hybrid model) ---
test_phase_4() {
  echo "Phase 4 (Cognitive / hybrid model)"
  local ok=0
  nc -z 127.0.0.1 8888 2>/dev/null && pass "adapter 8888 reachable" || { fail "adapter 8888 closed"; ok=1; }
  curl -sf --max-time 5 -X POST http://127.0.0.1:18789/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"openclaw:main","messages":[{"role":"user","content":"say ok"}],"stream":false}' 2>/dev/null | grep -q . && pass "gateway responds to chat/completions" || { fail "gateway no response"; ok=1; }
  [ -f "$HOME/.clawdbot/.env" ] && pass ".clawdbot/.env exists" || echo "  SKIP: .clawdbot/.env not found"
  return $ok
}

# --- Phase 5: Voice ---
test_phase_5() {
  echo "Phase 5 (Voice)"
  local ok=0
  FIFO="${TTS_FIFO:-$HOME/.tts_pipe}"
  [ -p "$FIFO" ] && pass "TTS FIFO exists ($FIFO)" || { fail "TTS FIFO missing ($FIFO)"; ok=1; }
  (pulseaudio --check 2>/dev/null || pgrep -x pulseaudio >/dev/null 2>&1) && pass "PulseAudio running" || { echo "  SKIP: PulseAudio not running"; }
  [ -f "$JARVIS_DIR/scripts/start-voice-node-pixel.sh" ] && pass "voice node script exists" || { fail "start-voice-node-pixel.sh missing"; ok=1; }
  (command -v whisper >/dev/null 2>&1 || [ -f "$HOME/whisper.cpp/main" ] || [ -f "$(which whisper 2>/dev/null)" ]) && pass "Whisper available" || echo "  SKIP: Whisper not installed"
  return $ok
}

# --- Phase 6: Cursor autonomy ---
test_phase_6() {
  echo "Phase 6 (Cursor autonomy)"
  local ok=0
  [ -f "$HOME/.jarvis/SOUL.md" ] && pass "SOUL.md in ~/.jarvis" || [ -f "$JARVIS_DIR/docs/SOUL_TEMPLATE.md" ] && pass "SOUL template in repo" || { fail "SOUL.md / SOUL_TEMPLATE.md not found"; ok=1; }
  [ -f "$JARVIS_DIR/.cursorrules" ] && pass ".cursorrules in JARVIS" || echo "  SKIP: .cursorrules not in JARVIS"
  return $ok
}

# --- Phase 7: Proactive (heartbeat, memory) ---
test_phase_7() {
  echo "Phase 7 (Proactive / heartbeat & memory)"
  local ok=0
  crontab -l 2>/dev/null | grep -qE 'heartbeat|plan-execute|jarvis' && pass "cron has JARVIS/heartbeat entries" || { fail "no JARVIS/heartbeat in crontab"; ok=1; }
  [ -f "$HOME/jarvis.cron" ] && pass "jarvis.cron exists" || echo "  SKIP: jarvis.cron not found"
  [ -f "$HOME/.jarvis/SOUL.md" ] || [ -f "$JARVIS_DIR/docs/SOUL_TEMPLATE.md" ] && pass "SOUL present" || { fail "SOUL missing"; ok=1; }
  return $ok
}

# --- Phase 8: Actuation ---
test_phase_8() {
  echo "Phase 8 (Actuation)"
  local ok=0
  termux-battery-status 2>&1 | head -1 | grep -q . && pass "termux-api (battery) works" || { fail "termux-battery-status failed (Termux:API same source?)"; ok=1; }
  [ -d "$JARVIS_DIR/skills/pixel-sensors" ] || [ -f "$JARVIS_DIR/scripts/diagnose-pixel-on-device.sh" ] && pass "pixel-sensors / diagnose script present" || echo "  SKIP: pixel-sensors not found"
  return $ok
}

# --- Phase 9: Security & resilience ---
test_phase_9() {
  echo "Phase 9 (Security & resilience)"
  local ok=0
  # Gateway should be up; we already checked in 0/3/4. Binding to 127 vs 0.0.0.0 is config - just ensure gateway is running.
  nc -z 127.0.0.1 18789 2>/dev/null && pass "gateway reachable on localhost" || { fail "gateway not reachable"; ok=1; }
  [ -f "$HOME/swapfile" ] && pass "swap file present" || echo "  SKIP: no swap file"
  return $ok
}

# --- Runner ---
run_phase() {
  local n="$1"
  case "$n" in
    0) test_phase_0 ;;
    1) test_phase_1 ;;
    2) test_phase_2 ;;
    3) test_phase_3 ;;
    4) test_phase_4 ;;
    5) test_phase_5 ;;
    6) test_phase_6 ;;
    7) test_phase_7 ;;
    8) test_phase_8 ;;
    9) test_phase_9 ;;
    *) echo "Unknown phase: $n"; return 1 ;;
  esac
}

PHASE="${1:-all}"
echo "=== JARVIS Edge-Native Sovereign — Phase tests (on device) ==="
echo "JARVIS_DIR=$JARVIS_DIR"
echo ""

if [ "$PHASE" = "all" ]; then
  for p in 0 1 2 3 4 5 6 7 8 9; do
    run_phase "$p" || FAILED=1
    echo ""
  done
else
  run_phase "$PHASE" || FAILED=1
fi

echo "=== Done ==="
exit $FAILED
