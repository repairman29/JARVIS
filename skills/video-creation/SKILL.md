# Video Creation Skill

Create professional demo videos for CLIs, websites, apps, and more — with AI voiceovers.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Demo Types](#demo-types)
3. [CLI/Terminal Demos](#cliterminal-demos)
4. [Website/Browser Demos](#websitebrowser-demos)
5. [Screen Recording](#screen-recording)
6. [Screenshot Sequences](#screenshot-sequences)
7. [AI Voiceover](#ai-voiceover)
8. [Combining Sources](#combining-sources)
9. [Platform Guidelines](#platform-guidelines)
10. [Quick Reference](#quick-reference)

---

## Prerequisites

### Required Tools
```bash
# Core tools
brew install ffmpeg          # Video/audio processing (required)
brew install imagemagick     # Image manipulation

# Terminal demos
brew install asciinema       # Terminal recording
brew install agg             # Convert to GIF

# Browser demos
npm install -g playwright    # Browser automation with video
npx playwright install       # Install browsers

# Screen recording (macOS)
# Built-in: screencapture (screenshots)
# ffmpeg can capture screen directly
```

### API Keys
| Service | Purpose | Get Key |
|---------|---------|---------|
| ElevenLabs | AI voiceover | https://elevenlabs.io |

```bash
export ELEVENLABS_API_KEY="sk_your_key"
```

---

## Demo Types

| Type | Best For | Tool |
|------|----------|------|
| **Terminal** | CLI tools, scripts | asciinema |
| **Browser** | Websites, web apps | Playwright |
| **Screen** | Desktop apps, any UI | ffmpeg screen capture |
| **Screenshots** | Step-by-step guides | screencapture + ffmpeg |
| **Hybrid** | Complex demos | Combine multiple sources |

---

## CLI/Terminal Demos

### Basic Recording
```bash
asciinema rec demo.cast
# Run commands, then Ctrl+D to stop
```

### Scripted Recording
```bash
asciinema rec --command "bash -c '
clear
echo \"  🚀 My CLI Demo\"
sleep 2
echo \"\$ mycli scan\"
mycli scan
sleep 3
'" demo.cast
```

### Convert to Video
```bash
# To GIF
agg demo.cast demo.gif --font-size 16 --theme monokai

# To MP4
ffmpeg -i demo.gif -pix_fmt yuv420p -vf "scale=1280:720" demo.mp4 -y
```

### Terminal Colors Reference
```bash
# Colors
\033[31m  # Red
\033[32m  # Green  
\033[33m  # Yellow
\033[34m  # Blue
\033[35m  # Magenta
\033[36m  # Cyan

# Styles
\033[1m   # Bold
\033[0m   # Reset

# Example
echo -e "\033[1;32m✔\033[0m Success"
echo -e "\033[1;31m✖\033[0m Error"
```

---

## Website/Browser Demos

### Using Playwright (Recommended)

Playwright can automate browsers AND record video automatically.

#### Install
```bash
npm install -g playwright
npx playwright install chromium
```

#### Basic Recording Script
```javascript
// record-website.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: './recordings/',
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  
  // Your demo steps
  await page.goto('https://yoursite.com');
  await page.waitForTimeout(2000);
  
  await page.click('text=Get Started');
  await page.waitForTimeout(2000);
  
  await page.fill('input[name="email"]', 'demo@example.com');
  await page.waitForTimeout(1000);
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Close to save video
  await context.close();
  await browser.close();
  
  console.log('Video saved to ./recordings/');
})();
```

#### Run Recording
```bash
node record-website.js
```

#### Advanced: With Mouse Highlighting
```javascript
// record-with-cursor.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Show browser
  const context = await browser.newContext({
    recordVideo: { dir: './recordings/', size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Add cursor highlight CSS
  await page.addStyleTag({
    content: `
      * { cursor: none !important; }
      .demo-cursor {
        width: 20px; height: 20px;
        background: rgba(255, 100, 100, 0.6);
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        z-index: 99999;
        transition: transform 0.1s;
      }
      .demo-cursor.clicking { transform: scale(0.8); }
    `
  });
  
  // Add cursor element
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.className = 'demo-cursor';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX - 10 + 'px';
      cursor.style.top = e.clientY - 10 + 'px';
    });
    
    document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
    document.addEventListener('mouseup', () => cursor.classList.remove('clicking'));
  });
  
  // Demo steps
  await page.goto('https://yoursite.com');
  await page.waitForTimeout(2000);
  
  // Simulate typing with visible effect
  await page.click('input[name="search"]');
  await page.type('input[name="search"]', 'hello world', { delay: 100 });
  await page.waitForTimeout(2000);
  
  await context.close();
  await browser.close();
})();
```

#### Template: E-commerce Demo
```javascript
// demo-ecommerce.js
const { chromium } = require('playwright');

async function demoEcommerce(url) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: './recordings/', size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  
  // Landing page
  await page.goto(url);
  await page.waitForTimeout(3000);
  
  // Browse products
  await page.click('text=Shop');
  await page.waitForTimeout(2000);
  
  // Click a product
  await page.click('.product-card >> nth=0');
  await page.waitForTimeout(2000);
  
  // Add to cart
  await page.click('text=Add to Cart');
  await page.waitForTimeout(2000);
  
  // View cart
  await page.click('[data-testid="cart-icon"]');
  await page.waitForTimeout(3000);
  
  await context.close();
  await browser.close();
}

demoEcommerce('https://your-store.com');
```

#### Template: SaaS Dashboard Demo
```javascript
// demo-saas.js
const { chromium } = require('playwright');

async function demoSaaS(url, email, password) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: './recordings/', size: { width: 1920, height: 1080 } }
  });
  const page = await context.newPage();
  
  // Login
  await page.goto(url + '/login');
  await page.waitForTimeout(1000);
  await page.fill('input[name="email"]', email, { delay: 50 });
  await page.fill('input[name="password"]', password, { delay: 50 });
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Dashboard tour
  await page.click('text=Analytics');
  await page.waitForTimeout(2000);
  
  await page.click('text=Settings');
  await page.waitForTimeout(2000);
  
  // Create something
  await page.click('text=New Project');
  await page.waitForTimeout(1000);
  await page.fill('input[name="name"]', 'Demo Project', { delay: 50 });
  await page.click('text=Create');
  await page.waitForTimeout(3000);
  
  await context.close();
  await browser.close();
}

demoSaaS('https://app.yoursite.com', 'demo@example.com', 'demopass');
```

---

## Screen Recording

### Using ffmpeg (macOS)

#### List Available Devices
```bash
ffmpeg -f avfoundation -list_devices true -i "" 2>&1 | grep -E "^\[|screen|Capture"
```

#### Record Full Screen
```bash
# Record screen (device 1 is usually main display)
ffmpeg -f avfoundation -framerate 30 -i "1:none" \
  -c:v libx264 -preset ultrafast -crf 18 \
  -t 60 \
  screen-recording.mp4

# With audio (microphone)
ffmpeg -f avfoundation -framerate 30 -i "1:0" \
  -c:v libx264 -preset ultrafast -crf 18 \
  -c:a aac -b:a 128k \
  -t 60 \
  screen-with-audio.mp4
```

#### Record Specific Area
```bash
# Record 1280x720 area starting at position 100,100
ffmpeg -f avfoundation -framerate 30 -i "1:none" \
  -vf "crop=1280:720:100:100" \
  -c:v libx264 -preset ultrafast \
  -t 30 \
  cropped-recording.mp4
```

#### Using macOS Built-in (Alternative)
```bash
# Start recording (Cmd+Shift+5 equivalent via CLI isn't available)
# But you can use screencapture for screenshots:
screencapture -V 30 -x screenshot.png  # 30 second delay, no sound
```

### Post-Processing Screen Recordings
```bash
# Resize to standard dimensions
ffmpeg -i raw-recording.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -crf 23 \
  final-recording.mp4

# Speed up (2x)
ffmpeg -i raw-recording.mp4 \
  -filter:v "setpts=0.5*PTS" \
  -filter:a "atempo=2.0" \
  sped-up.mp4

# Add fade in/out
ffmpeg -i raw-recording.mp4 \
  -vf "fade=t=in:st=0:d=1,fade=t=out:st=28:d=2" \
  -t 30 \
  with-fades.mp4
```

---

## Screenshot Sequences

Convert a series of screenshots into a video — great for step-by-step guides.

### Capture Screenshots
```bash
# Manual: Take screenshots with Cmd+Shift+4
# Or automated with screencapture:
for i in {1..5}; do
  screencapture -x "step-$i.png"
  sleep 5  # Wait for you to set up next step
done
```

### Using Playwright for Screenshots
```javascript
// capture-steps.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  await page.goto('https://yoursite.com');
  await page.screenshot({ path: 'step-1-landing.png' });
  
  await page.click('text=Sign Up');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step-2-signup.png' });
  
  await page.fill('input[name="email"]', 'demo@example.com');
  await page.screenshot({ path: 'step-3-email.png' });
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step-4-success.png' });
  
  await browser.close();
})();
```

### Convert Screenshots to Video
```bash
# Rename to sequential numbers if needed
ls *.png | nl -v 0 | while read n f; do mv "$f" "$(printf '%03d' $n).png"; done

# Create video (3 seconds per image)
ffmpeg -framerate 1/3 -i '%03d.png' \
  -c:v libx264 -r 30 -pix_fmt yuv420p \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  slideshow.mp4

# With crossfade transitions
ffmpeg -framerate 1/3 -i '%03d.png' \
  -vf "zoompan=z='min(zoom+0.001,1.2)':d=90:s=1280x720,fade=t=in:st=0:d=0.5,fade=t=out:st=2.5:d=0.5" \
  -c:v libx264 -pix_fmt yuv420p \
  slideshow-animated.mp4
```

### Add Annotations to Screenshots
```bash
# Add text overlay using ImageMagick
convert step-1.png \
  -gravity South \
  -fill white -stroke black -strokewidth 2 \
  -pointsize 36 \
  -annotate +0+20 "Step 1: Visit the homepage" \
  step-1-annotated.png

# Add arrow/highlight
convert step-1.png \
  -fill "rgba(255,255,0,0.3)" \
  -draw "rectangle 100,200 400,250" \
  step-1-highlighted.png
```

---

## AI Voiceover

### ElevenLabs API

#### List Voices
```bash
curl -s "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" | \
  jq '.voices[] | "\(.voice_id) - \(.name) - \(.labels.description // "No description")"'
```

#### Recommended Voices
| Voice ID | Name | Style | Best For |
|----------|------|-------|----------|
| `IKne3meq5aSn9XLyUdCD` | Charlie | Confident, Energetic | Product demos |
| `EXAVITQu4vr4xnSDxMaL` | Sarah | Mature, Reassuring | Professional |
| `JBFqnCBsd6RMkjVDRZzb` | George | Warm, Storyteller | Narratives |
| `CwhRBWXzGAHq8TQ4Fs17` | Roger | Laid-Back, Casual | Casual content |

#### Generate Voiceover
```bash
# Write script to file (avoid JSON escaping issues)
cat > script.txt << 'EOF'
Welcome to our demo. Today I'll show you how easy it is to get started.
First, click the sign up button. Enter your email and create a password.
That's it! You're now ready to use our platform.
EOF

# Convert to single line for API
SCRIPT=$(cat script.txt | tr '\n' ' ')

# Generate audio
curl -s "https://api.elevenlabs.io/v1/text-to-speech/IKne3meq5aSn9XLyUdCD" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$SCRIPT\",
    \"model_id\": \"eleven_multilingual_v2\",
    \"voice_settings\": {
      \"stability\": 0.5,
      \"similarity_boost\": 0.75,
      \"style\": 0.3
    }
  }" --output voiceover.mp3
```

#### Voice Settings
| Setting | Range | Effect |
|---------|-------|--------|
| `stability` | 0-1 | Higher = more consistent, Lower = more expressive |
| `similarity_boost` | 0-1 | How closely to match original voice |
| `style` | 0-1 | Style exaggeration (0 = neutral) |

#### Script Writing Tips
- **Pace**: ~150 words per minute
- **Sentences**: Keep short (under 20 words)
- **Pauses**: Use periods for natural breaks
- **Tone**: Write conversationally
- **Timing**: Match script length to video length

---

## Combining Sources

### Add Voiceover to Video
```bash
# Get durations
AUDIO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 voiceover.mp3)
VIDEO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 demo.mp4)

# Calculate speed adjustment
FACTOR=$(echo "scale=4; $AUDIO_DUR / $VIDEO_DUR" | bc)

# Combine (slow down video to match audio)
ffmpeg -i demo.mp4 -i voiceover.mp3 \
  -filter_complex "[0:v]setpts=${FACTOR}*PTS[v]" \
  -map "[v]" -map 1:a \
  -c:v libx264 -crf 23 \
  -c:a aac -b:a 192k \
  -shortest \
  final-with-voice.mp4
```

### Concatenate Multiple Videos
```bash
# Create file list
cat > videos.txt << EOF
file 'intro.mp4'
file 'demo-part1.mp4'
file 'demo-part2.mp4'
file 'outro.mp4'
EOF

# Concatenate
ffmpeg -f concat -safe 0 -i videos.txt -c copy combined.mp4
```

### Add Intro/Outro
```bash
# Create title card (5 seconds)
ffmpeg -f lavfi -i color=c=black:s=1920x1080:d=5 \
  -vf "drawtext=text='My Product Demo':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 \
  intro.mp4

# Combine intro + demo + outro
ffmpeg -f concat -safe 0 -i <(echo -e "file 'intro.mp4'\nfile 'demo.mp4'\nfile 'outro.mp4'") \
  -c copy final.mp4
```

### Picture-in-Picture (Webcam + Screen)
```bash
# Record webcam separately, then overlay
ffmpeg -i screen-recording.mp4 -i webcam.mp4 \
  -filter_complex "[1:v]scale=320:240[pip];[0:v][pip]overlay=W-w-10:H-h-10" \
  -c:v libx264 -crf 23 \
  pip-video.mp4
```

### Add Background Music
```bash
# Mix voiceover with quiet background music
ffmpeg -i demo.mp4 -i voiceover.mp3 -i background-music.mp3 \
  -filter_complex "[1:a]volume=1.0[voice];[2:a]volume=0.1[music];[voice][music]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" \
  -c:v copy -c:a aac \
  final-with-music.mp4
```

---

## Platform Guidelines

### YouTube
| Asset | Dimensions | Limit |
|-------|------------|-------|
| Video | 1920x1080 (16:9) | 256GB |
| Thumbnail | 1280x720 | 2MB |
| Banner | 2560x1440 | 6MB |

### Product Hunt
| Asset | Dimensions | Notes |
|-------|------------|-------|
| Gallery | 1270x760 | Up to 5 images |
| Thumbnail | 240x240 | Square |

### Twitter/X
| Asset | Dimensions | Limit |
|-------|------------|-------|
| Video | 1280x720 | 2:20 length |
| GIF | Any | 15MB |

### LinkedIn
| Asset | Dimensions | Limit |
|-------|------------|-------|
| Video | 1920x1080 | 10 min |

### Website Embed
```html
<!-- Self-hosted video -->
<video autoplay loop muted playsinline>
  <source src="/demo.mp4" type="video/mp4">
</video>

<!-- YouTube embed -->
<iframe width="560" height="315" 
  src="https://www.youtube.com/embed/VIDEO_ID" 
  frameborder="0" allowfullscreen></iframe>

<!-- Responsive wrapper -->
<div style="position:relative;padding-bottom:56.25%;height:0;">
  <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" 
    src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen>
  </iframe>
</div>
```

---

## Quick Reference

### Full Pipeline: Website Demo
```bash
#!/bin/bash
PROJECT="my-website-demo"

# 1. Record with Playwright
cat > record.js << 'EOF'
const { chromium } = require('playwright');
(async () => {
  const context = await (await chromium.launch()).newContext({
    recordVideo: { dir: './', size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  await page.goto('https://mysite.com');
  await page.waitForTimeout(3000);
  await page.click('text=Get Started');
  await page.waitForTimeout(5000);
  await context.close();
})();
EOF
node record.js
mv *.webm ${PROJECT}-raw.webm

# 2. Convert to MP4
ffmpeg -i ${PROJECT}-raw.webm -c:v libx264 -crf 23 ${PROJECT}.mp4 -y

# 3. Generate voiceover
curl -s "https://api.elevenlabs.io/v1/text-to-speech/IKne3meq5aSn9XLyUdCD" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your script here", "model_id": "eleven_multilingual_v2"}' \
  --output ${PROJECT}-voice.mp3

# 4. Combine
ffmpeg -i ${PROJECT}.mp4 -i ${PROJECT}-voice.mp3 \
  -c:v copy -c:a aac -shortest \
  ${PROJECT}-final.mp4 -y

echo "Done: ${PROJECT}-final.mp4"
```

### Full Pipeline: CLI Demo
```bash
#!/bin/bash
PROJECT="my-cli-demo"

# 1. Record terminal
asciinema rec --command "bash demo-script.sh" ${PROJECT}.cast

# 2. Convert
agg ${PROJECT}.cast ${PROJECT}.gif --font-size 16 --theme monokai
ffmpeg -i ${PROJECT}.gif -pix_fmt yuv420p ${PROJECT}.mp4 -y

# 3. Voiceover
curl -s "https://api.elevenlabs.io/v1/text-to-speech/IKne3meq5aSn9XLyUdCD" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your script here", "model_id": "eleven_multilingual_v2"}' \
  --output ${PROJECT}-voice.mp3

# 4. Combine with speed adjustment
AUDIO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 ${PROJECT}-voice.mp3)
VIDEO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 ${PROJECT}.mp4)
FACTOR=$(echo "scale=4; $AUDIO_DUR / $VIDEO_DUR" | bc)

ffmpeg -i ${PROJECT}.mp4 -i ${PROJECT}-voice.mp3 \
  -filter_complex "[0:v]setpts=${FACTOR}*PTS[v]" \
  -map "[v]" -map 1:a -shortest \
  ${PROJECT}-final.mp4 -y

echo "Done: ${PROJECT}-final.mp4"
```

### Cheat Sheet
```bash
# Terminal recording
asciinema rec demo.cast
agg demo.cast demo.gif --theme monokai

# Browser recording
npx playwright codegen --save-storage=auth.json https://site.com  # Generate script
node record.js  # Run recording

# Screen capture
ffmpeg -f avfoundation -framerate 30 -i "1:none" -t 60 screen.mp4

# Screenshots to video
ffmpeg -framerate 1/3 -i '%03d.png' -c:v libx264 slideshow.mp4

# Add voiceover
ffmpeg -i video.mp4 -i voice.mp3 -c:v copy -c:a aac -shortest final.mp4

# Resize video
ffmpeg -i input.mp4 -vf "scale=1280:720" output.mp4

# Speed up 2x
ffmpeg -i input.mp4 -filter:v "setpts=0.5*PTS" fast.mp4

# Concatenate
ffmpeg -f concat -safe 0 -i list.txt -c copy combined.mp4
```
