#!/usr/bin/env bash
# Run automated checks (syntax, scripts, optional phase tests). No Pixel required for syntax/local.
# Usage: bash scripts/check-automation.sh [--phase-tests] [--adb]
#   --phase-tests: run on-device phase test script locally (some FAILs expected if not on Pixel).
#   --adb: run Mac phase tests (ADB + SSH; skips if no device / no SSH).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$JARVIS_ROOT"
FAILED=0

echo "=== JARVIS automation checks ==="
echo ""

# 1. Bash syntax on key scripts
echo "--- Bash syntax (bash -n) ---"
for f in scripts/start-jarvis-pixel.sh scripts/install-litellm-termux.sh scripts/setup-jarvis-termux.sh \
         scripts/pixel-complete-all-phases.sh scripts/pixel-test-phases-on-device.sh scripts/pixel-phase-tests.sh \
         scripts/pixel-sync-and-start.sh scripts/adb-pixel-ppk-bypass.sh; do
  if [ -f "$f" ]; then
    if bash -n "$f" 2>&1; then
      echo "  OK: $f"
    else
      echo "  FAIL: $f"
      FAILED=1
    fi
  fi
done
echo ""

# 2. On-device phase test script (local run; 8889/InferrLM may fail on Mac)
if [[ " $* " = *" --phase-tests "* ]]; then
  echo "--- Phase tests (on-device script, run locally) ---"
  bash scripts/pixel-test-phases-on-device.sh 0 2>&1 | tee /tmp/jarvis-phase0.log || true
  if grep -q "8889 closed" /tmp/jarvis-phase0.log 2>/dev/null; then
    echo "  (Phase 0: 8889 closed is expected on Mac; other checks ran.)"
  fi
  echo ""
fi

# 3. Mac phase tests (ADB + SSH; skips if no device / no SSH)
if [[ " $* " = *" --adb "* ]]; then
  echo "--- Phase tests (from Mac: ADB + SSH) ---"
  ADB_SERIAL="${ADB_SERIAL:-}" bash scripts/pixel-phase-tests.sh all 2>&1 | tee /tmp/jarvis-mac-phase.log || true
  echo ""
fi

# 4. Neural-farm readiness (optional; may fail if deps not installed)
if [ -d "$(dirname "$JARVIS_ROOT")/neural-farm" ]; then
  FARM="$(dirname "$JARVIS_ROOT")/neural-farm"
  echo "--- neural-farm check_ready.py ---"
  if (cd "$FARM" && python3 check_ready.py 2>&1); then
    echo "  neural-farm: OK"
  else
    echo "  neural-farm: issues (e.g. pip install -r requirements.txt on Mac; on Pixel use install-litellm-termux.sh)"
  fi
  echo ""
fi

echo "=== Done ==="
exit $FAILED
