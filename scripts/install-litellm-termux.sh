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
PY="$(command -v python3 2>/dev/null || echo python3)"
echo "Using Python: $PY ($($PY --version 2>&1))"
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
  # litellm 1.76.0 needs tiktoken/tokenizers; install from TUR so pip uses wheels instead of building.
  echo "Trying litellm<1.76.1 (no fastuuid) for Termux..."
  $PY -m pip install $TUR tokenizers tiktoken 2>/dev/null || true
  if $PY -m pip install $TUR "litellm[proxy]<1.76.1" 2>/dev/null; then
    echo "Installed litellm 1.76.0 (proxy) without fastuuid."
  elif $PY -m pip install $TUR "litellm<1.76.1" uvicorn "fastapi" pyyaml aiohttp 2>/dev/null; then
    echo "Installed litellm <1.76.1 with minimal deps (no fastuuid)."
  else
    echo "litellm could not be installed (Rust deps: fastuuid/tokenizers)."
    echo "Gateway will use adapter at 8888; chat and voice still work. Run: bash ~/start-jarvis.sh"
    exit 0
  fi
fi

echo "Verifying..."
if $PY -c "import litellm" 2>/dev/null; then
  echo "OK: litellm is installed for $PY. Run: bash ~/JARVIS/scripts/start-jarvis-pixel.sh"
else
  echo "WARN: import litellm still failed. Check: $PY -c 'import litellm'"
  exit 1
fi
