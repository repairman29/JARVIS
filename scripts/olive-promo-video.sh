#!/bin/bash
# olive-promo-video.sh - Record shopolive.xyz demo and produce MP4 + GIF for Olive promo.
# Usage: ./scripts/olive-promo-video.sh [--skip-record]
# Run from repo root. Requires: node, Playwright (npx playwright install chromium), ffmpeg.
# Output: scripts/olive-promo-output/olive-hero.mp4, olive-hero.gif, olive-micro.gif

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO_SKILL="${REPO_ROOT}/skills/video-creation"
OUTPUT_DIR="${REPO_ROOT}/scripts/olive-promo-output"
RECORDINGS_DIR="${OUTPUT_DIR}/recordings"
SKIP_RECORD="${1:-}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$REPO_ROOT"
mkdir -p "$RECORDINGS_DIR"

# --- 1. Record (unless --skip-record) ---
if [ "$SKIP_RECORD" != "--skip-record" ]; then
  echo -e "${GREEN}📹 Recording shopolive.xyz...${NC}"
  if ! command -v node >/dev/null 2>&1; then
    echo "Need node. Install: brew install node"
    exit 1
  fi
  OLIVE_RECORDINGS_DIR="$RECORDINGS_DIR" node "${VIDEO_SKILL}/templates/olive-shopolive.js"
else
  echo -e "${YELLOW}Skipping record (--skip-record)${NC}"
fi

# --- 2. Find latest WebM ---
WEBM_FILE=$(ls -t "$RECORDINGS_DIR"/*.webm 2>/dev/null | head -1)
if [ -z "$WEBM_FILE" ]; then
  echo "No .webm found in $RECORDINGS_DIR. Run without --skip-record first."
  exit 1
fi

# --- 3. Convert to MP4 ---
echo -e "${GREEN}🎥 Converting to MP4...${NC}"
ffmpeg -i "$WEBM_FILE" \
  -c:v libx264 -crf 23 -preset fast \
  -pix_fmt yuv420p \
  "${OUTPUT_DIR}/olive-hero.mp4" -y 2>/dev/null || true
if [ ! -s "${OUTPUT_DIR}/olive-hero.mp4" ]; then
  echo "ffmpeg MP4 failed. Is ffmpeg installed? brew install ffmpeg"
  exit 1
fi

# --- 4. Hero GIF (full video or first 45s so outcome is visible, 640px, 10 fps) ---
echo -e "${GREEN}🎞️ Creating hero GIF...${NC}"
GIF_DUR=45
ffmpeg -t $GIF_DUR -i "${OUTPUT_DIR}/olive-hero.mp4" \
  -vf "fps=10,scale=640:-1:flags=lanczos,palettegen=stats_mode=diff" \
  -y "${OUTPUT_DIR}/palette-hero.png" 2>/dev/null || true
ffmpeg -t $GIF_DUR -i "${OUTPUT_DIR}/olive-hero.mp4" -i "${OUTPUT_DIR}/palette-hero.png" \
  -filter_complex "fps=10,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" \
  -y "${OUTPUT_DIR}/olive-hero.gif" 2>/dev/null || true
rm -f "${OUTPUT_DIR}/palette-hero.png"

# --- 5. Micro GIF (first ~12 s, 480px) ---
echo -e "${GREEN}🎞️ Creating micro GIF...${NC}"
ffmpeg -t 12 -i "${OUTPUT_DIR}/olive-hero.mp4" \
  -vf "fps=8,scale=480:-1:flags=lanczos,palettegen=stats_mode=diff" \
  -y "${OUTPUT_DIR}/palette-micro.png" 2>/dev/null || true
ffmpeg -t 12 -i "${OUTPUT_DIR}/olive-hero.mp4" -i "${OUTPUT_DIR}/palette-micro.png" \
  -filter_complex "fps=8,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" \
  -y "${OUTPUT_DIR}/olive-micro.gif" 2>/dev/null || true
rm -f "${OUTPUT_DIR}/palette-micro.png"

echo ""
echo -e "${GREEN}✅ Olive promo assets ready:${NC}"
ls -lh "${OUTPUT_DIR}"/olive-hero.mp4 "${OUTPUT_DIR}"/olive-hero.gif "${OUTPUT_DIR}"/olive-micro.gif 2>/dev/null
echo -e "   ${OUTPUT_DIR}/"
echo ""
echo "Next: copy olive-hero.mp4 and olive-hero.gif to Olive repo (e.g. docs/ or public/) or use for social."
