#!/bin/bash
# create-demo-video.sh - Full pipeline for creating demo videos with voiceover
# Usage: ./create-demo-video.sh <project-name> <script-file> [voice-id]

set -e

PROJECT="${1:-demo}"
SCRIPT_FILE="${2:-script.txt}"
VOICE_ID="${3:-IKne3meq5aSn9XLyUdCD}"  # Default: Charlie (confident, energetic)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🎬 Creating demo video: ${PROJECT}${NC}"

# Check requirements
command -v asciinema >/dev/null 2>&1 || { echo "Install asciinema: brew install asciinema"; exit 1; }
command -v agg >/dev/null 2>&1 || { echo "Install agg: brew install agg"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "Install ffmpeg: brew install ffmpeg"; exit 1; }

if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo -e "${YELLOW}Warning: ELEVENLABS_API_KEY not set. Skipping voiceover.${NC}"
    SKIP_VOICE=true
fi

# Create output directory
mkdir -p output

# Step 1: Record (if recording script exists)
if [ -f "${PROJECT}-recording.sh" ]; then
    echo -e "${GREEN}📹 Recording terminal demo...${NC}"
    asciinema rec --command "bash ${PROJECT}-recording.sh" "output/${PROJECT}.cast" --overwrite
else
    echo -e "${YELLOW}No recording script found (${PROJECT}-recording.sh). Skipping recording.${NC}"
fi

# Step 2: Convert to GIF and MP4
if [ -f "output/${PROJECT}.cast" ]; then
    echo -e "${GREEN}🎞️ Converting to GIF...${NC}"
    agg "output/${PROJECT}.cast" "output/${PROJECT}.gif" --font-size 16 --speed 1 --theme monokai
    
    echo -e "${GREEN}🎥 Converting to MP4...${NC}"
    ffmpeg -i "output/${PROJECT}.gif" \
        -movflags faststart \
        -pix_fmt yuv420p \
        -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
        "output/${PROJECT}.mp4" -y 2>/dev/null
fi

# Step 3: Generate voiceover
if [ "$SKIP_VOICE" != "true" ] && [ -f "$SCRIPT_FILE" ]; then
    echo -e "${GREEN}🎙️ Generating voiceover...${NC}"
    
    # Read script and escape for JSON
    SCRIPT_TEXT=$(cat "$SCRIPT_FILE" | tr '\n' ' ' | sed 's/"/\\"/g')
    
    cat > /tmp/tts-request.json << EOF
{
    "text": "${SCRIPT_TEXT}",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.3
    }
}
EOF
    
    curl -s "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
        -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
        -H "Content-Type: application/json" \
        -d @/tmp/tts-request.json \
        --output "output/${PROJECT}-voiceover.mp3"
    
    # Check if audio was generated
    if [ -s "output/${PROJECT}-voiceover.mp3" ]; then
        echo -e "${GREEN}🔊 Voiceover generated successfully${NC}"
    else
        echo -e "${YELLOW}Warning: Voiceover generation failed${NC}"
        SKIP_VOICE=true
    fi
fi

# Step 4: Combine video and audio
if [ "$SKIP_VOICE" != "true" ] && [ -f "output/${PROJECT}.mp4" ] && [ -f "output/${PROJECT}-voiceover.mp3" ]; then
    echo -e "${GREEN}🎬 Combining video and audio...${NC}"
    
    # Get durations
    AUDIO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "output/${PROJECT}-voiceover.mp3")
    VIDEO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "output/${PROJECT}.mp4")
    
    # Calculate speed factor
    FACTOR=$(echo "scale=4; $AUDIO_DUR / $VIDEO_DUR" | bc)
    
    echo "  Audio: ${AUDIO_DUR}s, Video: ${VIDEO_DUR}s, Factor: ${FACTOR}"
    
    ffmpeg -i "output/${PROJECT}.mp4" -i "output/${PROJECT}-voiceover.mp3" \
        -filter_complex "[0:v]setpts=${FACTOR}*PTS[v]" \
        -map "[v]" -map 1:a \
        -c:v libx264 -preset fast -crf 23 \
        -c:a aac -b:a 192k \
        -shortest \
        "output/${PROJECT}-final.mp4" -y 2>/dev/null
    
    echo -e "${GREEN}✅ Final video created: output/${PROJECT}-final.mp4${NC}"
else
    echo -e "${GREEN}✅ Video created: output/${PROJECT}.mp4${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}📦 Output files:${NC}"
ls -lh output/${PROJECT}* 2>/dev/null || echo "No files generated"
