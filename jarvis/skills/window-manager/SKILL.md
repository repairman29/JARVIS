# Window Manager — Advanced Window Control

Use this skill for **window management**, **display organization**, and **workspace layouts**. Provides Raycast-style window snapping with advanced tiling and workspace features.

## Setup

1. Install the skill: `clawdbot skills install ./skills/window-manager` or copy to `~/jarvis/skills/window-manager`.
2. **macOS**: Requires Accessibility permissions for window control
3. **Optional**: Install `yabai` for advanced tiling features: `brew install koekeishiya/formulae/yabai`
4. Restart gateway: `clawdbot gateway restart`

## When to use

- **Window snapping**: "snap Chrome to left half", "maximize VS Code", "center this window"
- **Multi-display**: "move window to second monitor", "put Slack on main display"
- **Window arrangement**: "arrange windows in two columns", "tile all windows"
- **Workspaces**: "save my coding workspace", "restore design workspace"
- **Window info**: "what windows are open?", "show me Chrome windows"

## Tools

| Tool | Use for |
|------|---------|
| `snap_window` | Window snapping: halves, quarters, thirds, center, maximize |
| `move_window` | Move windows between displays or to specific monitors |
| `resize_window` | Resize windows to specific dimensions or percentages |
| `get_window_info` | Get info about active window, all windows, or app windows |
| `window_focus` | Focus/activate specific app or window |
| `window_arrangement` | Arrange multiple windows in layouts (tiling) |
| `workspace_save` | Save current window layout as named workspace |
| `workspace_restore` | Restore previously saved workspace layout |
| `workspace_list` | List all saved workspace presets |

## Examples

### Window Snapping
- **"Snap Chrome to left half"** → `snap_window({ position: "left_half", app: "Chrome" })`
- **"Put this window in top right corner"** → `snap_window({ position: "top_right" })`
- **"Maximize VS Code"** → `snap_window({ position: "maximize", app: "VS Code" })`
- **"Center the active window"** → `snap_window({ position: "center" })`

### Multi-Display Management
- **"Move Slack to second monitor"** → `move_window({ direction: "next_display", app: "Slack" })`
- **"Put this window on main display"** → `move_window({ direction: "primary_display" })`
- **"Move window to display 2"** → `move_window({ direction: "next_display", targetDisplay: 1 })`

### Window Resizing
- **"Make this window 800x600"** → `resize_window({ width: 800, height: 600 })`
- **"Resize Chrome to 50% width"** → `resize_window({ width: 50, relative: true, app: "Chrome" })`
- **"Make window 75% of screen height"** → `resize_window({ height: 75, relative: true })`

### Window Layouts & Tiling
- **"Arrange windows in two columns"** → `window_arrangement({ layout: "two_column" })`
- **"Tile VS Code, Chrome, and Slack"** → `window_arrangement({ layout: "three_column", apps: ["VS Code", "Chrome", "Slack"] })`
- **"Create a 2x2 grid of windows"** → `window_arrangement({ layout: "grid_2x2" })`

### Workspace Management
- **"Save this as my coding workspace"** → `workspace_save({ name: "coding", description: "VS Code, Terminal, Chrome for dev" })`
- **"Restore my design workspace"** → `workspace_restore({ name: "design", launchApps: true })`
- **"What workspaces do I have?"** → `workspace_list({})`

### Window Information
- **"What windows are open?"** → `get_window_info({ type: "all" })`
- **"Show Chrome windows"** → `get_window_info({ type: "app_windows", app: "Chrome" })`
- **"What's my active window?"** → `get_window_info({ type: "active" })`

## Advanced Features

### Smart Window Snapping
- **Thirds**: Left third, center third, right third
- **Two-thirds**: Left two-thirds, right two-thirds  
- **Quarters**: All four corners of screen
- **Halves**: Left, right, top, bottom
- **Center**: Perfect center with smart sizing
- **Maximize**: Full screen without hiding dock/menu bar

### Multi-Display Intelligence
- **Display Detection**: Auto-detects connected displays
- **Smart Movement**: Preserves window size when moving between displays
- **Display-Aware Snapping**: Snaps relative to target display dimensions

### Workspace Presets
- **Layout Saving**: Captures position, size, and app of all windows
- **Smart Restoration**: Launches missing apps and recreates layout
- **Persistent Storage**: Workspaces saved locally and sync-ready

### Window Arrangement Layouts
- **Two Column**: Split screen with two main areas
- **Three Column**: Classic IDE layout (sidebar, main, inspector)
- **Grid 2x2**: Four equal quadrants
- **Main and Stack**: One large window + smaller stacked windows
- **Full Height Splits**: Vertical columns spanning full screen height
- **Cascade**: Overlapping windows in cascade pattern

## Natural Language Integration

JARVIS understands complex window management commands:

- **"Set up my coding workspace: VS Code on left, Chrome on right, Terminal in bottom right corner"**
  → Creates custom layout with multiple snapping commands
- **"I'm presenting - maximize Chrome and hide everything else"**
  → Maximizes Chrome + minimizes other windows
- **"Organize my design work: Figma on main display, Slack on second monitor"**
  → Multi-display arrangement with app-specific positioning

## Keyboard Shortcuts Integration

When used with global hotkeys, JARVIS can respond to:
- `⌘⌥←` → "Snap window left half"
- `⌘⌥→` → "Snap window right half" 
- `⌘⌥↑` → "Maximize window"
- `⌘⌥C` → "Center window"

## Compatibility

### macOS
- **Native**: Uses Accessibility APIs and System Events
- **Enhanced**: With `yabai` for advanced tiling features
- **Permissions**: Requires Accessibility permission for window control

### Windows (Planned)
- **PowerShell**: Window management via PowerShell commands
- **Third-party**: Integration with PowerToys FancyZones

### Linux (Planned) 
- **X11/Wayland**: Native window manager integration
- **i3/bspwm**: Advanced tiling window manager support

## Workspace Examples

### Coding Workspace
```
VS Code: Left two-thirds of screen
Terminal: Bottom right quarter  
Chrome: Top right quarter
```

### Design Workspace
```
Figma: Maximized on main display
Slack: Left third of second display
Finder: Right third of second display
```

### Writing Workspace  
```
Notion: Left half
Research Browser: Right half
Music App: Minimized
```

## Tips for Power Users

1. **Create workspace templates**: Save common layouts as presets
2. **Use relative sizing**: Percentage-based resizing adapts to display changes
3. **Chain commands**: "Snap VS Code left, then move Chrome to second display"
4. **App-specific layouts**: Different arrangements for different work types
5. **Display profiles**: Different workspace presets per display configuration

This skill transforms JARVIS into a powerful window manager that surpasses basic tools like Spectacle or Rectangle with intelligent natural language control and workspace persistence.