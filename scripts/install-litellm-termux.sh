#!/usr/bin/env bash
# Run in Termux on the Pixel when "litellm not installed" appears.
# Uses the same python3 that start-jarvis-pixel.sh uses (python3 -m pip).
# Usage: on the Pixel in Termux: bash ~/JARVIS/scripts/install-litellm-termux.sh

set -e
# Only run in Termux (Android). On Mac you get "externally-managed-environment" and wrong Python.
if ! echo "${PREFIX:-}" | grep -q termux 2>/dev/null; then
  echo "This script is for Termux on the Pixel (Android), not for Mac."
  echo "On the Pixel: open Termux and run: bash ~/JARVIS/scripts/install-litellm-termux.sh"
  exit 1
fi
export HOME="${HOME:-/data/data/com.termux/files/home}"
# Required for maturin/Rust builds (rpds-py, etc.) on Android
export ANDROID_API_LEVEL="${ANDROID_API_LEVEL:-$(getprop ro.build.version.sdk 2>/dev/null || echo 34)}"
PY="$(command -v python3 2>/dev/null || echo python3)"
echo "Using Python: $PY ($($PY --version 2>&1)), ANDROID_API_LEVEL=$ANDROID_API_LEVEL"
echo "Installing litellm for this Python (pkg + TUR)..."
pkg install -y python-cryptography 2>/dev/null || true
TUR="--extra-index-url https://termux-user-repository.github.io/pypi/"
$PY -m pip install --upgrade pip -q 2>/dev/null || true

# Try latest litellm (needs fastuuid; may fail on Termux if no wheel/Rust).
$PY -m pip install $TUR fastuuid 2>/dev/null || true
if $PY -m pip install $TUR "litellm[proxy]" 2>/dev/null; then
  : # success
elif $PY -m pip install $TUR litellm uvicorn "fastapi" pyyaml aiohttp 2>/dev/null; then
  echo "Installed litellm with minimal proxy deps (no full proxy extras)."
else
  # fastuuid fails to build on Termux (Rust/platform). Use litellm <1.76.1 (no fastuuid).
  # Pre-install tokenizers+tiktoken from TUR wheels (avoids Rust build); litellm needs jsonschema->rpds-py (Rust, needs ANDROID_API_LEVEL).
  echo "Trying litellm<1.76.1 (no fastuuid) for Termux..."
  TUR_WHEELS="https://github.com/termux-user-repository/pypi-wheel-builder/releases/download/wheels"
  $PY -m pip install --no-cache-dir --no-deps \
    "$TUR_WHEELS/tokenizers-0.21.2-cp312-cp312-linux_aarch64.whl" \
    "$TUR_WHEELS/tiktoken-0.9.0-cp312-cp312-linux_aarch64.whl" 2>/dev/null || true
  TUR_INDEX="--index-url https://termux-user-repository.github.io/pypi/ --extra-index-url https://pypi.org/simple"
  PIP_WHEEL="--no-cache-dir --only-binary=tokenizers --only-binary=tiktoken"
  for attempt in 1 2 3; do
    [ "$attempt" -gt 1 ] && echo "Retry $attempt/3..."
    $PY -m pip install $PIP_WHEEL $TUR_INDEX tokenizers tiktoken 2>/dev/null || true
    if $PY -m pip install $TUR "litellm[proxy]<1.76.1" 2>/dev/null; then
      echo "Installed litellm 1.76.0 (proxy) without fastuuid."
      break
    fi
    if $PY -m pip install $TUR "litellm<1.76.1" uvicorn "fastapi" pyyaml aiohttp 2>/dev/null; then
      echo "Installed litellm <1.76.1 with minimal deps (no fastuuid)."
      break
    fi
    if [ "$attempt" -eq 3 ]; then
      echo "litellm could not be installed (Rust deps: fastuuid/tokenizers)."
      echo "Gateway will use adapter at 8888; chat and voice still work. Run: bash ~/start-jarvis.sh"
      exit 0
    fi
    sleep 5
  done
fi

echo "Verifying..."
if $PY -c "import litellm" 2>/dev/null; then
  echo "OK: litellm is installed for $PY. Run: bash ~/JARVIS/scripts/start-jarvis-pixel.sh"
else
  echo "WARN: import litellm still failed. Check: $PY -c 'import litellm'"
  exit 1
fi
