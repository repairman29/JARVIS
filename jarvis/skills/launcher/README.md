# JARVIS Launcher Skill

Transform JARVIS into a powerful productivity launcher with Raycast-style capabilities.

## Features

- **App Management**: Launch, quit, and manage applications
- **System Controls**: Volume, brightness, Wi-Fi, sleep, lock screen
- **Quick Calculations**: Math, unit conversions, percentages
- **Process Management**: List, search, and terminate processes
- **System Information**: CPU, memory, disk, battery status
- **Screenshots**: Full screen, window, selection capture
- **URL Opening**: Open links in specific browsers with incognito support

## Installation

1. Copy this skill to your JARVIS skills directory:
   ```bash
   cp -r skills/launcher ~/jarvis/skills/
   ```

2. Add to your JARVIS TOOLS.md:
   ```markdown
   ## Launcher / Productivity

   **Skill:** `launcher` (installed). Use for app launching, system controls, calculations, screenshots.

   | Tool | When to use |
   |------|-------------|
   | `launch_app` | "launch Chrome", "open VS Code", "new Safari window" |
   | `quit_app` | "quit Slack", "close Spotify", "force quit Chrome" |
   | `system_control` | "turn up volume", "lock screen", "toggle dark mode" |
   | `quick_calc` | "15% of 240", "5 miles to km", "sqrt(144)" |
   | `process_manager` | "what's using CPU", "kill Chrome process" |
   | `screenshot` | "take screenshot", "screenshot Chrome window" |
   | `open_url` | "open github.com", "open reddit in incognito Chrome" |
   ```

3. Restart JARVIS gateway:
   ```bash
   clawdbot gateway restart
   ```

## Dependencies

### macOS
- Built-in system commands (no additional dependencies)
- Optional: `blueutil` for Bluetooth control (`brew install blueutil`)
- Optional: `brightness` CLI tool for brightness control

### Cross-Platform Support
The skill is designed to work on macOS initially, with plans for Windows and Linux support.

## Usage Examples

### Natural Language Commands

- "Launch Chrome and open github.com"
- "What's using the most memory on my computer?"
- "Turn up the volume and take a screenshot"
- "Convert 5 miles to kilometers"
- "Close Slack and Spotify, then lock my screen"

### Voice Commands (if supported)

- "Hey JARVIS, launch VS Code"
- "JARVIS, what's 15% of 240?"
- "JARVIS, take a screenshot of Chrome"

## Security & Permissions

- **System Controls**: Uses safe macOS APIs and commands
- **Process Management**: Requires confirmation for system process termination
- **App Launching**: Sandboxed execution with proper error handling
- **Screenshots**: Respects macOS privacy and accessibility settings

## Extending the Skill

Add new tools by:

1. Adding to `skill.json` tools array
2. Implementing in `index.js` tools object  
3. Documenting in `SKILL.md`
4. Testing with JARVIS

## Roadmap

- [ ] Windows and Linux support
- [ ] Enhanced unit conversion library
- [ ] Timezone conversion with proper library
- [ ] Voice command optimization
- [ ] Custom app shortcuts and aliases
- [ ] Integration with other JARVIS skills

This skill brings the power of Raycast and Alfred to JARVIS with the added intelligence of natural language processing and cross-skill orchestration.