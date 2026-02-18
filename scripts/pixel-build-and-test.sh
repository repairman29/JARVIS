#!/usr/bin/env bash
# Build JARVIS (deps), then optionally push to Pixel and run phase tests.
# Usage:
#   ./scripts/pixel-build-and-test.sh              # build only
#   ./scripts/pixel-build-and-test.sh push          # build + push + start on Pixel (needs TERMUX_USER, SSH)
#   ./scripts/pixel-build-and-test.sh test         # build + run phase tests (needs ADB and/or TERMUX_USER + IP)
#   ./scripts/pixel-build-and-test.sh push test    # build, push, start, then test

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DO_PUSH=""
DO_TEST=""
PIXEL_IP=""
for arg in "$@"; do
  [ "$arg" = "push" ] && DO_PUSH=1
  [ "$arg" = "test" ] && DO_TEST=1
  # First arg that looks like an IP or hostname (not push/test)
  if [ -z "$PIXEL_IP" ] && [ "$arg" != "push" ] && [ "$arg" != "test" ]; then
    PIXEL_IP="$arg"
  fi
done

echo "=== JARVIS build ==="
cd "$JARVIS_ROOT"
npm install
[ -d "$(dirname "$JARVIS_ROOT")/neural-farm" ] && echo "  neural-farm present" || echo "  WARN: neural-farm not found (needed for push)"
echo ""

if [ -n "$DO_PUSH" ]; then
  echo "=== Push + start on Pixel ==="
  echo "  Need: Pixel on same Wi‑Fi, Termux with sshd (user defaults to u0_a310)."
  # Uses TERMUX_USER (default u0_a310) from pixel-sync-and-start.sh
  bash "$SCRIPT_DIR/pixel-sync-and-start.sh" $PIXEL_IP
  echo ""
fi

if [ -n "$DO_TEST" ]; then
  echo "=== Phase tests ==="
  echo "  From Mac: ADB (set ADB_SERIAL if multiple devices) and/or TERMUX_USER + pixel-ip for SSH."
  bash "$SCRIPT_DIR/pixel-phase-tests.sh" all $PIXEL_IP
  echo ""
fi

if [ -z "$DO_PUSH" ] && [ -z "$DO_TEST" ]; then
  echo "Next:"
  echo "  Push to Pixel:  bash scripts/pixel-build-and-test.sh push [pixel-ip]"
  echo "  Run tests:      bash scripts/pixel-build-and-test.sh test [pixel-ip]"
  echo "  Both:          bash scripts/pixel-build-and-test.sh push test"
  echo "  (Username: u0_a310. If your Termux whoami differs: TERMUX_USER=<whoami> ...)"
  echo "  Multiple ADB devices: ADB_SERIAL=<device-id> ... (get id from 'adb devices')"
fi

echo "Done."
