#!/usr/bin/env bash
# Set up swap in Termux on the Pixel. Run on device: bash ~/JARVIS/scripts/setup-swap-termux.sh
# If you get "No such file or directory" when running this: the script isn't on the Pixel yet.
#   From Mac: cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh  (push JARVIS to Pixel), then run this again in Termux.

set -e
export HOME="${HOME:-/data/data/com.termux/files/home}"
SWAPFILE="${SWAPFILE:-$HOME/swapfile}"
PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"

echo "=== Termux swap setup ==="
echo ""

if [ -f "$SWAPFILE" ] && command -v swapon >/dev/null 2>&1 && swapon --show 2>/dev/null | grep -q "$SWAPFILE"; then
  echo "Swap already active: $SWAPFILE"
  swapon --show 2>/dev/null
  exit 0
fi

# 1) Ensure util-linux is installed (provides mkswap, swapon)
if ! command -v mkswap >/dev/null 2>&1; then
  echo "Installing util-linux (mkswap, swapon)..."
  pkg install util-linux -y || true
fi
MKSWAP=$(command -v mkswap 2>/dev/null)
SWAPON=$(command -v swapon 2>/dev/null)
[ -z "$MKSWAP" ] && [ -x "$PREFIX/bin/mkswap" ] && MKSWAP="$PREFIX/bin/mkswap"
[ -z "$SWAPON" ] && [ -x "$PREFIX/bin/swapon" ] && SWAPON="$PREFIX/bin/swapon"
if [ -z "$MKSWAP" ] || [ -z "$SWAPON" ]; then
  echo "  mkswap/swapon not available. Run: pkg install util-linux -y"
  echo "  Swap file will be created; enable later when util-linux is installed."
  MKSWAP=""
  SWAPON=""
else
  echo "  Using: $MKSWAP, $SWAPON"
fi
echo ""

# 2) Create swap file if missing
if [ ! -f "$SWAPFILE" ]; then
  echo "Creating 4GB swap file (one-time, ~1 min)..."
  dd if=/dev/zero of="$SWAPFILE" bs=1024 count=4194304
  chmod 600 "$SWAPFILE"
else
  echo "Swap file exists: $SWAPFILE"
fi
echo ""

# 3) Format and enable (only if binaries exist)
if [ -n "$MKSWAP" ] && [ -x "$MKSWAP" ]; then
  echo "Formatting swap file..."
  "$MKSWAP" "$SWAPFILE" 2>/dev/null || true
fi
echo "Enabling swap (swapon)..."
if [ -n "$SWAPON" ] && [ -x "$SWAPON" ] && "$SWAPON" "$SWAPFILE" 2>/dev/null; then
  echo "  Swap ON."
  "$SWAPON" --show 2>/dev/null || true
  echo ""
  echo "To re-enable after reboot, add to ~/.bashrc or run once per session:"
  echo "  swapon $SWAPFILE"
  # Optional: ensure one line in bashrc for auto swapon
  if [ -n "$HOME" ] && ! grep -q "swapon.*swapfile" "$HOME/.bashrc" 2>/dev/null; then
    echo "" >> "$HOME/.bashrc"
    echo "# Re-enable swap after Termux session start" >> "$HOME/.bashrc"
    echo "[ -f $SWAPFILE ] && swapon $SWAPFILE 2>/dev/null || true" >> "$HOME/.bashrc"
    echo "  (Added swapon to ~/.bashrc for next sessions)"
  fi
  exit 0
fi

# 4) Try with root if available
if [ -n "$SWAPON" ] && command -v su >/dev/null 2>&1; then
  echo "  Trying with root (su)..."
  if su -c "swapon $SWAPFILE" 2>/dev/null; then
    echo "  Swap ON (via root)."
    "$SWAPON" --show 2>/dev/null || true
    exit 0
  fi
fi

# 5) Failed
echo "  swapon failed (typical on non-rooted Android: kernel blocks swap for apps)."
echo ""
echo "Options:"
echo "  • Rooted (Magisk): run 'su' then 'swapon $SWAPFILE' in a root shell."
echo "  • Non-root: Android often disallows swap for apps; system zRAM may be enough."
echo "  • Shizuku: some guides use Shizuku + Termux for root-less swap (advanced)."
echo ""
echo "Swap file is ready at $SWAPFILE; enable it when you have root or accept no swap."
exit 0
