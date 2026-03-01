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
echo "Done. First-time setup inside Ubuntu (run these after 'proot-distro login ubuntu'):"
echo "  apt update && apt install -y git curl python3-pip"
echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs"
echo "  (JARVIS/neural-farm are at Termux path; install deps from there:)"
echo "  cd /data/data/com.termux/files/home/JARVIS && npm install"
echo "  cd /data/data/com.termux/files/home/neural-farm && pip install -r requirements.txt 2>/dev/null || pip install litellm"
echo ""
echo "Then from Termux, start JARVIS in Proot:"
echo "  bash ~/JARVIS/scripts/run-jarvis-in-proot.sh"
echo "See docs/PIXEL_PROOT_DISTRO.md for full instructions."
