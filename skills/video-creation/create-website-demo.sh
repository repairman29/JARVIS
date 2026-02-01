#!/bin/bash
# create-website-demo.sh - Record a website demo with voiceover
# Usage: ./create-website-demo.sh <project-name> <url> [script.txt] [voice-id]

set -e

PROJECT="${1:-website-demo}"
URL="${2:-https://example.com}"
SCRIPT_FILE="${3:-script.txt}"
VOICE_ID="${4:-IKne3meq5aSn9XLyUdCD}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🎬 Creating website demo: ${PROJECT}${NC}"
echo -e "   URL: ${URL}"

# Check requirements
command -v node >/dev/null 2>&1 || { echo "Install node: brew install node"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "Install ffmpeg: brew install ffmpeg"; exit 1; }

# Check Playwright
if ! npm list -g playwright >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing Playwright...${NC}"
    npm install -g playwright
    npx playwright install chromium
fi

mkdir -p output recordings

# Generate recording script
cat > "output/${PROJECT}-record.js" << ENDSCRIPT
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { 
      dir: './recordings/', 
      size: { width: 1280, height: 720 } 
    },
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // ===== DEMO STEPS =====
  // Edit this section to customize your demo
  
  await page.goto('${URL}');
  await page.waitForTimeout(3000);
  
  // Example: Scroll down
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
  
  // Example: Click something
  // await page.click('text=Get Started');
  // await page.waitForTimeout(2000);
  
  // Example: Fill form
  // await page.fill('input[name="email"]', 'demo@example.com');
  // await page.waitForTimeout(1000);
  
  await page.waitForTimeout(2000);
  
  // ===== END DEMO STEPS =====
  
  await context.close();
  await browser.close();
  console.log('Recording saved!');
})();
ENDSCRIPT

echo -e "${GREEN}📹 Recording website...${NC}"
echo -e "${YELLOW}Edit output/${PROJECT}-record.js to customize demo steps, then press Enter${NC}"
read -p ""

node "output/${PROJECT}-record.js"

# Find the recording
WEBM_FILE=$(ls -t recordings/*.webm 2>/dev/null | head -1)
if [ -z "$WEBM_FILE" ]; then
    echo "No recording found!"
    exit 1
fi

echo -e "${GREEN}🎥 Converting to MP4...${NC}"
ffmpeg -i "$WEBM_FILE" \
    -c:v libx264 -crf 23 -preset fast \
    "output/${PROJECT}.mp4" -y 2>/dev/null

# Generate voiceover if API key exists and script file exists
if [ -n "$ELEVENLABS_API_KEY" ] && [ -f "$SCRIPT_FILE" ]; then
    echo -e "${GREEN}🎙️ Generating voiceover...${NC}"
    
    SCRIPT_TEXT=$(cat "$SCRIPT_FILE" | tr '\n' ' ' | sed 's/"/\\"/g')
    
    curl -s "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
        -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"${SCRIPT_TEXT}\", \"model_id\": \"eleven_multilingual_v2\", \"voice_settings\": {\"stability\": 0.5, \"similarity_boost\": 0.75}}" \
        --output "output/${PROJECT}-voice.mp3"
    
    if [ -s "output/${PROJECT}-voice.mp3" ]; then
        echo -e "${GREEN}🔗 Combining video and audio...${NC}"
        
        AUDIO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "output/${PROJECT}-voice.mp3")
        VIDEO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "output/${PROJECT}.mp4")
        FACTOR=$(echo "scale=4; $AUDIO_DUR / $VIDEO_DUR" | bc)
        
        ffmpeg -i "output/${PROJECT}.mp4" -i "output/${PROJECT}-voice.mp3" \
            -filter_complex "[0:v]setpts=${FACTOR}*PTS[v]" \
            -map "[v]" -map 1:a \
            -c:v libx264 -crf 23 \
            -c:a aac -b:a 192k \
            -shortest \
            "output/${PROJECT}-final.mp4" -y 2>/dev/null
        
        echo -e "${GREEN}✅ Done: output/${PROJECT}-final.mp4${NC}"
    fi
else
    echo -e "${YELLOW}Skipping voiceover (no API key or script file)${NC}"
    echo -e "${GREEN}✅ Done: output/${PROJECT}.mp4${NC}"
fi

# Cleanup
rm -f "$WEBM_FILE"

echo ""
echo -e "${GREEN}📦 Output files:${NC}"
ls -lh output/${PROJECT}* 2>/dev/null
