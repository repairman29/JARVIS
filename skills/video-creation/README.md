# Video Creation Skill

Create professional demo videos for **any** project — CLI tools, websites, apps — with AI voiceovers.

## Demo Types Supported

| Type | Tool | Best For |
|------|------|----------|
| **Terminal/CLI** | asciinema | Command-line tools, scripts |
| **Website** | Playwright | Landing pages, web apps, SaaS |
| **E-commerce** | Playwright | Online stores, checkout flows |
| **Screen Recording** | ffmpeg | Desktop apps, any UI |
| **Screenshots** | screencapture | Step-by-step guides |

## Quick Start

### CLI Demo
```bash
./create-demo-video.sh my-cli script.txt
```

### Website Demo
```bash
./create-website-demo.sh my-site https://mysite.com script.txt
```

### Using Templates
```bash
# SaaS Dashboard
node templates/saas-dashboard.js

# Landing Page
node templates/landing-page.js

# E-commerce Store
node templates/ecommerce.js
```

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Complete documentation (18KB) |
| `create-demo-video.sh` | CLI demo pipeline |
| `create-website-demo.sh` | Website demo pipeline |
| `record-website.js` | Generic website recorder |
| `templates/*.js` | Ready-to-use demo templates |
| `voices.json` | ElevenLabs voice reference |

## Requirements

```bash
# Core
brew install ffmpeg

# Terminal demos
brew install asciinema agg

# Website demos  
npm install -g playwright
npx playwright install chromium
```

## Environment

```bash
export ELEVENLABS_API_KEY="sk_your_key"
```

## Output

Each pipeline produces:
- Raw recording (`.cast`, `.webm`)
- GIF for web embedding
- MP4 video
- MP4 with voiceover (`-final.mp4`)

## Customization

1. Edit the recording script (`*-record.js`)
2. Write a voiceover script (`script.txt`)
3. Run the pipeline
4. Get polished video with AI voiceover

See `SKILL.md` for complete documentation including:
- ANSI color codes for terminal styling
- Playwright automation patterns
- ffmpeg commands for all operations
- Platform-specific guidelines (YouTube, Product Hunt, Twitter)
- Troubleshooting common issues
