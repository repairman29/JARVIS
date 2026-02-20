#!/bin/bash
# Install Proot-Distro and Ubuntu in Termux (Pixel). Run in Termux.
# After this, run 'proot-distro login ubuntu' and install Node/JARVIS inside Ubuntu.
# See docs/PIXEL_PROOT_DISTRO.md.

set -e
echo "=== Proot-Distro setup (Termux) ==="

if ! command -v pkg >/dev/null 2>&1; then
  echo "This script is for Termux (pkg). Exiting."
  exit 1
fi

pkg update -y
pkg install -y proot-distro

echo "Installing Ubuntu (proot-distro)..."
proot-distro install ubuntu

echo ""
echo "Done. Next steps:"
echo "  1. Enter Ubuntu:  proot-distro login ubuntu"
echo "  2. Inside Ubuntu: apt update && apt install -y git curl"
echo "  3. Node 22:       curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs"
echo "  4. Clone JARVIS (or use your repo) and run the stack; InferrLM on device stays at 127.0.0.1:8889."
echo "See docs/PIXEL_PROOT_DISTRO.md for full instructions."
