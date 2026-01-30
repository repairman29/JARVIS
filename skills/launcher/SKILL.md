# Launcher — Productivity & System Control

Use this skill for **application launching**, **system controls**, **quick calculations**, and **process management**. This is JARVIS's Raycast-style productivity launcher.

## Setup

1. Install the skill: `clawdbot skills install ./skills/launcher` or copy to `~/jarvis/skills/launcher`.
2. No environment variables required - works out of the box.
3. Restart gateway: `clawdbot gateway restart`

## When to use

- **App management**: "launch Chrome", "quit Spotify", "what apps are running?"
- **System controls**: "turn up volume", "lock screen", "toggle dark mode", "sleep"
- **Quick calculations**: "what's 15% of 240?", "convert 5 miles to km", "3pm EST in PST"
- **Process management**: "kill Chrome process", "show top CPU processes", "what's using memory?"
- **System info**: "how much memory is available?", "battery status", "disk space"
- **Screenshots**: "take screenshot", "screenshot of Chrome window"
- **URLs**: "open github.com", "open reddit in incognito Chrome"

## Tools

| Tool | Use for |
|------|---------|
| `launch_app` | Launch applications: "open VS Code", "launch new Chrome window" |
| `quit_app` | Quit applications: "quit Slack", "force quit Chrome" |
| `list_running_apps` | Show running apps with memory usage, sorted by name/memory/CPU |
| `system_control` | Volume, brightness, wifi, sleep, lock, dark mode, restart, etc. |
| `quick_calc` | Math, unit conversion, timezone conversion in one tool |
| `open_url` | Open URLs in default or specific browser, with incognito support |
| `process_manager` | List, search, kill processes; show top CPU/memory users |
| `get_system_info` | CPU, memory, disk, network, battery status |
| `screenshot` | Fullscreen, window, or selection screenshots |

## Examples

### App Management
- **"Launch Chrome"** → `launch_app({ app: "Chrome" })`
- **"Open new VS Code window"** → `launch_app({ app: "VS Code", newInstance: true })`
- **"Quit Spotify"** → `quit_app({ app: "Spotify" })`
- **"What apps are running?"** → `list_running_apps({ sortBy: "memory" })`

### System Controls  
- **"Turn up volume"** → `system_control({ action: "volume_up" })`
- **"Set volume to 50"** → `system_control({ action: "volume_up", value: 50 })`
- **"Lock my screen"** → `system_control({ action: "lock" })`
- **"Toggle dark mode"** → `system_control({ action: "toggle_dark_mode" })`
- **"Sleep"** → `system_control({ action: "sleep" })`

### Quick Calculations
- **"What's 15% of 240?"** → `quick_calc({ expression: "15% of 240" })`
- **"Convert 5 miles to kilometers"** → `quick_calc({ expression: "5 miles to km" })`  
- **"What time is 3pm EST in PST?"** → `quick_calc({ expression: "3pm EST to PST" })`
- **"Square root of 144"** → `quick_calc({ expression: "sqrt(144)" })`

### Process Management
- **"What's using the most CPU?"** → `process_manager({ action: "top_cpu", limit: 5 })`
- **"Kill Chrome process"** → `process_manager({ action: "kill", query: "Chrome" })`
- **"Search for node processes"** → `process_manager({ action: "search", query: "node" })`

### System Information
- **"How much memory do I have?"** → `get_system_info({ info: "memory" })`
- **"Battery status"** → `get_system_info({ info: "battery" })`
- **"Show all system info"** → `get_system_info({ info: "all" })`

### Screenshots & URLs
- **"Take a screenshot"** → `screenshot({ type: "fullscreen", save: true })`
- **"Screenshot Chrome window"** → `screenshot({ type: "window", app: "Chrome" })`
- **"Open github.com"** → `open_url({ url: "github.com" })`
- **"Open reddit in Chrome incognito"** → `open_url({ url: "reddit.com", browser: "chrome", incognito: true })`

## Natural Language Integration

JARVIS can chain these commands intelligently:

- **"I'm done working, close Slack and VS Code, turn off wifi, and lock screen"** 
  → Quit apps, disable wifi, then lock
- **"Show me what's slowing down my computer"** 
  → Get system info + top CPU processes
- **"Open my calendar and turn up brightness for the meeting"**
  → Launch calendar app + increase brightness

## Advanced Features

### Smart App Launching
- JARVIS learns your app preferences (VS Code vs Cursor, Chrome vs Firefox)
- Handles common app name variations ("Code" = "VS Code", "Word" = "Microsoft Word")

### Context-Aware Controls  
- Volume/brightness changes adapt to current levels
- Screenshots automatically save to ~/Desktop with timestamps
- Process killing confirms before force termination

### Calculation Intelligence
- Supports natural language: "15 percent of 240", "how many minutes in 3.5 hours"
- Unit conversion: length, weight, temperature, currency (with live rates)
- Timezone conversion with natural language: "3pm EST", "noon Tokyo time"

## Security & Permissions

- **Process killing**: Requires confirmation for system processes
- **System controls**: Safe commands only (no destructive operations without explicit confirmation)
- **App launching**: Sandboxed execution with proper error handling
- **Screenshots**: Respects system privacy settings

## Tips

1. **Use natural language**: "turn the volume way up" works better than exact commands
2. **Chain commands**: JARVIS can execute multiple actions in sequence
3. **Smart defaults**: Screenshot saves to Desktop, volume adjusts by 10% increments
4. **App shortcuts**: "code" = VS Code, "chrome" = Google Chrome, "word" = Microsoft Word
5. **Process search**: Use partial names - "chrom" finds all Chrome processes

This skill transforms JARVIS into a powerful productivity launcher that's more intelligent and conversational than traditional command launchers like Raycast or Alfred.