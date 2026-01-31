# JARVIS Window Manager Skill

Advanced window management capabilities that surpass traditional tools like Spectacle, Rectangle, or even Raycast's window management.

## Features

### Core Window Operations
- **Smart Snapping**: Halves, quarters, thirds, two-thirds combinations
- **Multi-Display Support**: Move windows between monitors intelligently
- **Precise Resizing**: Pixel-perfect or percentage-based sizing
- **Window Focus**: Activate specific apps or windows by name

### Advanced Layouts
- **Predefined Arrangements**: Two-column, three-column, 2x2 grid layouts
- **Intelligent Tiling**: Automatic window organization for productivity
- **Workspace Presets**: Save and restore complete window arrangements
- **Context-Aware Positioning**: Smart defaults based on screen configuration

### Workspace Management
- **Named Workspaces**: Save current layout with descriptive names
- **Smart Restoration**: Automatically launch missing apps when restoring
- **Persistent Storage**: Workspaces saved locally with sync capability
- **Quick Switching**: Instantly switch between coding, design, communication setups

## Installation

1. **Copy Skill**:
   ```bash
   cp -r skills/window-manager ~/jarvis/skills/
   ```

2. **macOS Permissions**:
   - System Preferences → Security & Privacy → Privacy → Accessibility
   - Add Terminal or your JARVIS launcher app
   - Grant permission for window control

3. **Optional Enhancements**:
   ```bash
   # For advanced tiling features
   brew install koekeishiya/formulae/yabai
   
   # For enhanced display management
   brew install --cask displayplacer
   ```

4. **Update JARVIS Configuration**:
   
   Add to `~/jarvis/TOOLS.md`:
   ```markdown
   ## Window Manager
   
   **Skill:** `window-manager` (installed). Advanced window management and workspace control.
   
   | Tool | When to use |
   |------|-------------|
   | `snap_window` | "snap Chrome left half", "maximize VS Code", "center window" |
   | `move_window` | "move to second monitor", "put on main display" |
   | `window_arrangement` | "arrange in two columns", "create 2x2 grid" |
   | `workspace_save` | "save my coding workspace", "remember this layout" |
   | `workspace_restore` | "restore design workspace", "load coding setup" |
   ```

5. **Restart JARVIS**:
   ```bash
   clawdbot gateway restart
   ```

## Usage Examples

### Basic Window Control
- **"Snap Chrome to the left half of the screen"**
- **"Center the active window"**  
- **"Maximize VS Code"**
- **"Move Slack to the second monitor"**

### Advanced Layouts
- **"Arrange my windows in three columns"**
- **"Create a 2x2 grid with my open apps"**
- **"Set up main and stack layout for coding"**

### Workspace Management
- **"Save this as my morning workspace"**
- **"Restore my design workspace and launch missing apps"**
- **"What workspaces do I have saved?"**

### Complex Commands
- **"Set up my coding environment: VS Code on left, Chrome on right, Terminal in bottom corner"**
- **"I'm presenting - maximize Chrome and minimize everything else"**
- **"Organize for design work: Figma maximized on main display, Slack on second screen"**

## Natural Language Intelligence

JARVIS understands context and can execute complex multi-step window management:

### Smart App Recognition
- "Code" → VS Code
- "Browser" → Your default browser
- "Music" → Spotify, Apple Music, etc.
- "Chat" → Slack, Discord, etc.

### Contextual Commands
- **"Make this bigger"** → Intelligently resize based on current size
- **"Put it over there"** → Move to less crowded display area
- **"Clean up my desktop"** → Organize overlapping windows
- **"Focus mode"** → Hide distracting apps, maximize main work app

### Chained Operations
- **"Move Chrome to monitor 2, then snap VS Code to left half"**
- **"Save current layout, then switch to presentation mode"**
- **"Restore coding workspace, but put Slack on the second display instead"**

## Workspace Templates

### Pre-built Workspaces

**Coding Workspace**:
```
- VS Code: Left two-thirds
- Terminal: Bottom right quarter  
- Browser: Top right quarter
- Slack: Minimized
```

**Design Workspace**:
```
- Figma: Maximized on main display
- Browser: Left third of second display
- Slack: Right third of second display
- Finder: Minimized
```

**Writing Workspace**:
```
- Writing App: Left half
- Research Browser: Right half
- Notes: Minimized until needed
```

**Meeting Workspace**:
```
- Zoom: Maximized
- Slack: Right third overlay
- Notes: Left third overlay
- Everything else: Hidden
```

## Platform Support

### macOS (Full Support)
- **Native Integration**: Uses Accessibility APIs and System Events
- **Multi-Display**: Full support for external monitors
- **Permissions**: Requires one-time Accessibility permission
- **Performance**: Optimized for Mac window management

### Windows (Planned - Phase 2)
- **PowerShell Integration**: Native window management commands
- **FancyZones**: PowerToys integration for advanced layouts
- **Multi-Monitor**: Windows 10/11 display management
- **Virtual Desktops**: Windows workspace integration

### Linux (Planned - Phase 3)
- **X11/Wayland**: Native window manager integration
- **Tiling WM**: i3, bspwm, awesome integration
- **GNOME/KDE**: Desktop environment specific features
- **Custom Scripts**: Extensible for any Linux setup

## Advanced Features

### Smart Display Management
- **Resolution Aware**: Layouts adapt to different screen sizes
- **DPI Scaling**: Respects high-DPI display settings
- **Orientation**: Handles portrait/landscape monitor setups
- **Hot Plug**: Adjusts when monitors are connected/disconnected

### Performance Optimizations
- **Batch Operations**: Multiple window changes in single command
- **Lazy Loading**: Only load workspace data when needed
- **Memory Efficient**: Minimal resource usage for background monitoring
- **Fast Execution**: Sub-second response for most operations

### Security & Privacy
- **Local Storage**: Workspace data never leaves your device
- **Permissions**: Only requests necessary system access
- **Safe Operations**: Cannot access window content, only position/size
- **Error Handling**: Graceful fallbacks if apps aren't responsive

## Integration with Other JARVIS Skills

### Launcher Skill
- **"Launch my coding apps and arrange them"** → Uses both launcher + window manager
- **"Open Spotify and put it in the corner"** → Launch + snap in one command

### Focus/Productivity Skills  
- **"Enter deep work mode"** → Hide distractions + arrange work apps
- **"Break time"** → Save work layout + switch to relaxation setup

### AI Workflow Automation
- **"Morning routine"** → Launch apps + arrange windows + open today's tasks
- **"End of day cleanup"** → Save current work + organize for tomorrow

## Tips for Power Users

1. **Create workspace templates** for different work types
2. **Use percentage-based sizing** for multi-resolution setups  
3. **Chain window commands** for complex arrangements
4. **Set up display profiles** for different monitor configurations
5. **Combine with keyboard shortcuts** for instant access

## Troubleshooting

### Common Issues
- **Permission denied**: Grant Accessibility permissions in System Preferences
- **App not responding**: Some apps don't support programmatic window control
- **Layout not perfect**: Fine-tune with manual adjustments, then re-save workspace

### Performance Tips
- **Restart unresponsive apps** before window operations
- **Close unnecessary windows** for better arrangement results
- **Use specific app names** instead of generic terms

This skill transforms JARVIS into the most intelligent window manager available, combining the power of traditional tools with AI-driven natural language control and persistent workspace management.