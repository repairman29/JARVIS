const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper function to execute shell commands safely
function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      timeout: 10000,
      ...options 
    }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

// Helper function to check if running on macOS
function isMacOS() {
  return process.platform === 'darwin';
}

// Helper function to check if running on Windows
function isWindows() {
  return process.platform === 'win32';
}

// Helper function to run PowerShell (Windows) – sends Win+Arrow for snap
function execPowerShell(script) {
  const escaped = script.replace(/'/g, "''");
  return execSync(`powershell -NoProfile -Command "${escaped}"`, {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true
  }).trim();
}

// Workspace storage path
const WORKSPACE_DIR = path.join(os.homedir(), '.jarvis', 'workspaces');

// Ensure workspace directory exists
function ensureWorkspaceDir() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
}

// Get screen dimensions
function getScreenInfo() {
  if (!isMacOS()) {
    throw new Error('Screen info currently only supported on macOS');
  }
  
  try {
    const displaysInfo = execCommand(`system_profiler SPDisplaysDataType -json`);
    const displays = JSON.parse(displaysInfo);
    
    // For now, get primary display info using a simpler method
    const resolution = execCommand(`osascript -e "tell application \\"Finder\\" to get bounds of window of desktop"`);
    const [, , width, height] = resolution.split(', ').map(Number);
    
    return {
      primary: { width, height, x: 0, y: 0 },
      displays: [{ width, height, x: 0, y: 0 }] // Simplified for now
    };
  } catch (error) {
    // Fallback to default resolution
    return {
      primary: { width: 1920, height: 1080, x: 0, y: 0 },
      displays: [{ width: 1920, height: 1080, x: 0, y: 0 }]
    };
  }
}

// Get active window information
function getActiveWindow() {
  if (!isMacOS()) {
    throw new Error('Active window detection currently only supported on macOS');
  }
  
  try {
    const script = `
      tell application "System Events"
        set frontApp to name of first application process whose frontmost is true
        set frontWindow to name of front window of application process frontApp
        return frontApp & "|" & frontWindow
      end tell
    `;
    
    const result = execCommand(`osascript -e '${script}'`);
    const [appName, windowTitle] = result.split('|');
    
    return { appName, windowTitle };
  } catch (error) {
    throw new Error(`Failed to get active window: ${error.message}`);
  }
}

// Calculate window position for snap positions
function calculateSnapPosition(position, screenInfo, display = 0) {
  const screen = screenInfo.displays[display] || screenInfo.primary;
  const { width, height, x, y } = screen;
  
  const positions = {
    left_half: { x, y, width: width / 2, height },
    right_half: { x: x + width / 2, y, width: width / 2, height },
    top_half: { x, y, width, height: height / 2 },
    bottom_half: { x, y: y + height / 2, width, height: height / 2 },
    
    top_left: { x, y, width: width / 2, height: height / 2 },
    top_right: { x: x + width / 2, y, width: width / 2, height: height / 2 },
    bottom_left: { x, y: y + height / 2, width: width / 2, height: height / 2 },
    bottom_right: { x: x + width / 2, y: y + height / 2, width: width / 2, height: height / 2 },
    
    left_third: { x, y, width: width / 3, height },
    center_third: { x: x + width / 3, y, width: width / 3, height },
    right_third: { x: x + (2 * width / 3), y, width: width / 3, height },
    
    left_two_thirds: { x, y, width: (2 * width / 3), height },
    right_two_thirds: { x: x + width / 3, y, width: (2 * width / 3), height },
    
    center: { 
      x: x + width * 0.1, 
      y: y + height * 0.1, 
      width: width * 0.8, 
      height: height * 0.8 
    },
    maximize: { x, y, width, height }
  };
  
  return positions[position];
}

// Tool implementations
const tools = {
  snap_window: async ({ position, app, display = 0 }) => {
    // Windows: use Win+Arrow (snap left/right, maximize, minimize)
    if (isWindows()) {
      const winArrowMap = {
        left_half: 0x25,   // VK_LEFT
        right_half: 0x27,  // VK_RIGHT
        maximize: 0x26,    // VK_UP
        minimize: 0x28,    // VK_DOWN
        top_half: 0x26,    // maximize (no native top-half on Windows)
        bottom_half: 0x28  // minimize
      };
      const vk = winArrowMap[position];
      if (vk === undefined) {
        return {
          success: false,
          message: `Snap position "${position}" on Windows only supports: left_half, right_half, maximize, minimize (and top_half/bottom_half map to maximize/minimize).`,
          position,
          platform: 'windows'
        };
      }
      try {
        // keybd_event: VK_LWIN=0x5B, KEYEVENTF_KEYUP=2. Press Win, press Arrow, release Arrow, release Win.
        const ps = `Add-Type -TypeDefinition "using System;using System.Runtime.InteropServices;public class W{ [DllImport(\\\"user32.dll\\\")]public static extern void keybd_event(byte b,byte s,uint f,UIntPtr e);public static void S(byte k){ keybd_event(0x5B,0,0,UIntPtr.Zero);keybd_event(k,0,0,UIntPtr.Zero);keybd_event(k,0,2,UIntPtr.Zero);keybd_event(0x5B,0,2,UIntPtr.Zero);} }"; [W]::S(${vk})`;
        execPowerShell(ps);
        return {
          success: true,
          message: `Window snapped to ${position} (Win+Arrow)`,
          position,
          app: app || 'foreground',
          platform: 'windows'
        };
      } catch (err) {
        return {
          success: false,
          message: `Window snap failed: ${err.message}`,
          position,
          platform: 'windows'
        };
      }
    }

    if (!isMacOS()) {
      throw new Error('Window snapping currently only supported on macOS');
    }

    try {
      const screenInfo = getScreenInfo();
      const snapPos = calculateSnapPosition(position, screenInfo, display);
      
      if (!snapPos) {
        throw new Error(`Unknown snap position: ${position}`);
      }

      let script;
      if (app) {
        script = `
          tell application "${app}"
            activate
            set bounds of front window to {${snapPos.x}, ${snapPos.y}, ${snapPos.x + snapPos.width}, ${snapPos.y + snapPos.height}}
          end tell
        `;
      } else {
        const activeWindow = getActiveWindow();
        script = `
          tell application "${activeWindow.appName}"
            set bounds of front window to {${snapPos.x}, ${snapPos.y}, ${snapPos.x + snapPos.width}, ${snapPos.y + snapPos.height}}
          end tell
        `;
      }

      if (position === 'maximize') {
        // Use different approach for maximize
        script = `
          tell application "System Events"
            ${app ? `tell application "${app}" to activate` : ''}
            tell (first application process whose frontmost is true)
              set frontWindow to front window
              click (button 2 of frontWindow) -- green maximize button
            end tell
          end tell
        `;
      } else if (position === 'minimize') {
        script = `
          tell application "System Events"
            ${app ? `tell application "${app}" to activate` : ''}
            tell (first application process whose frontmost is true)
              set frontWindow to front window
              click (button 1 of frontWindow) -- minimize button
            end tell
          end tell
        `;
      }

      execCommand(`osascript -e '${script}'`);
      
      return {
        success: true,
        message: `Window ${app ? `(${app}) ` : ''}snapped to ${position}`,
        position: position,
        app: app,
        bounds: snapPos
      };
    } catch (error) {
      return {
        success: false,
        message: `Window snap failed: ${error.message}`,
        position: position,
        app: app
      };
    }
  },

  move_window: async ({ direction, app, targetDisplay }) => {
    if (!isMacOS()) {
      throw new Error('Window movement currently only supported on macOS');
    }

    try {
      let script;
      if (direction === 'next_display' || direction === 'previous_display') {
        // Move to next/previous display
        script = `
          tell application "System Events"
            ${app ? `tell application "${app}" to activate` : ''}
            key code 123 using {control down, option down, command down} -- Move window left/right between displays
          end tell
        `;
      } else if (direction === 'primary_display') {
        // Move to primary display
        const screenInfo = getScreenInfo();
        const primaryBounds = screenInfo.primary;
        
        script = `
          tell application "System Events"
            ${app ? `tell application "${app}" to activate` : ''}
            tell (first application process whose frontmost is true)
              set position of front window to {${primaryBounds.x + 100}, ${primaryBounds.y + 100}}
            end tell
          end tell
        `;
      }

      execCommand(`osascript -e '${script}'`);
      
      return {
        success: true,
        message: `Window ${app ? `(${app}) ` : ''}moved ${direction}`,
        direction: direction,
        app: app,
        targetDisplay: targetDisplay
      };
    } catch (error) {
      return {
        success: false,
        message: `Window move failed: ${error.message}`,
        direction: direction,
        app: app
      };
    }
  },

  resize_window: async ({ width, height, relative = false, app }) => {
    if (!isMacOS()) {
      throw new Error('Window resizing currently only supported on macOS');
    }

    try {
      let targetWidth, targetHeight;
      
      if (relative) {
        const screenInfo = getScreenInfo();
        const screen = screenInfo.primary;
        targetWidth = width ? (screen.width * width / 100) : null;
        targetHeight = height ? (screen.height * height / 100) : null;
      } else {
        targetWidth = width;
        targetHeight = height;
      }

      const activeWindow = app ? { appName: app } : getActiveWindow();
      
      // Get current window bounds
      const boundsScript = `
        tell application "${activeWindow.appName}"
          get bounds of front window
        end tell
      `;
      
      const currentBounds = execCommand(`osascript -e '${boundsScript}'`);
      const [currentX, currentY, currentRight, currentBottom] = currentBounds.split(', ').map(Number);
      
      const newWidth = targetWidth || (currentRight - currentX);
      const newHeight = targetHeight || (currentBottom - currentY);
      
      const script = `
        tell application "${activeWindow.appName}"
          set bounds of front window to {${currentX}, ${currentY}, ${currentX + newWidth}, ${currentY + newHeight}}
        end tell
      `;

      execCommand(`osascript -e '${script}'`);
      
      return {
        success: true,
        message: `Window ${app ? `(${app}) ` : ''}resized to ${newWidth}x${newHeight}`,
        width: newWidth,
        height: newHeight,
        relative: relative,
        app: app
      };
    } catch (error) {
      return {
        success: false,
        message: `Window resize failed: ${error.message}`,
        app: app
      };
    }
  },

  get_window_info: async ({ type = 'active', app }) => {
    if (!isMacOS()) {
      throw new Error('Window info currently only supported on macOS');
    }

    try {
      let result = {};

      switch (type) {
        case 'active':
          const activeWindow = getActiveWindow();
          const boundsScript = `
            tell application "${activeWindow.appName}"
              get bounds of front window
            end tell
          `;
          const bounds = execCommand(`osascript -e '${boundsScript}'`);
          const [x, y, right, bottom] = bounds.split(', ').map(Number);
          
          result = {
            app: activeWindow.appName,
            title: activeWindow.windowTitle,
            bounds: { x, y, width: right - x, height: bottom - y },
            active: true
          };
          break;

        case 'all':
          const allWindowsScript = `
            tell application "System Events"
              set windowList to {}
              repeat with proc in (every application process whose visible is true)
                set procName to name of proc
                repeat with win in (every window of proc)
                  set windowList to windowList & {procName & "|" & (name of win)}
                end repeat
              end repeat
              return windowList
            end tell
          `;
          
          const windowsOutput = execCommand(`osascript -e '${allWindowsScript}'`);
          const windows = windowsOutput.split(', ').map(entry => {
            const [appName, windowTitle] = entry.split('|');
            return { app: appName, title: windowTitle };
          }).filter(w => w.app && w.title);
          
          result = { windows, count: windows.length };
          break;

        case 'app_windows':
          if (!app) {
            throw new Error('App name required for app_windows type');
          }
          
          const appWindowsScript = `
            tell application "System Events"
              tell application process "${app}"
                get name of every window
              end tell
            end tell
          `;
          
          const appWindows = execCommand(`osascript -e '${appWindowsScript}'`);
          const windowTitles = appWindows.split(', ').filter(title => title.trim());
          
          result = {
            app: app,
            windows: windowTitles.map(title => ({ app, title })),
            count: windowTitles.length
          };
          break;

        case 'display_info':
          result = getScreenInfo();
          break;

        default:
          throw new Error(`Unknown window info type: ${type}`);
      }

      return {
        success: true,
        type: type,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get window info: ${error.message}`,
        type: type
      };
    }
  },

  window_focus: async ({ app, windowTitle }) => {
    if (!isMacOS()) {
      throw new Error('Window focus currently only supported on macOS');
    }

    try {
      let script;
      if (windowTitle) {
        script = `
          tell application "${app}"
            activate
            set frontmost of window "${windowTitle}" to true
          end tell
        `;
      } else {
        script = `
          tell application "${app}" to activate
        `;
      }

      execCommand(`osascript -e '${script}'`);
      
      return {
        success: true,
        message: `Focused ${app}${windowTitle ? ` window: ${windowTitle}` : ''}`,
        app: app,
        windowTitle: windowTitle
      };
    } catch (error) {
      return {
        success: false,
        message: `Window focus failed: ${error.message}`,
        app: app
      };
    }
  },

  window_arrangement: async ({ layout, apps, display = 0 }) => {
    if (!isMacOS()) {
      throw new Error('Window arrangement currently only supported on macOS');
    }

    try {
      const screenInfo = getScreenInfo();
      let arrangements = [];

      switch (layout) {
        case 'two_column':
          arrangements = [
            { position: 'left_half' },
            { position: 'right_half' }
          ];
          break;

        case 'three_column':
          arrangements = [
            { position: 'left_third' },
            { position: 'center_third' },
            { position: 'right_third' }
          ];
          break;

        case 'grid_2x2':
          arrangements = [
            { position: 'top_left' },
            { position: 'top_right' },
            { position: 'bottom_left' },
            { position: 'bottom_right' }
          ];
          break;

        case 'main_and_stack':
          arrangements = [
            { position: 'left_two_thirds' },
            { position: 'top_right' },
            { position: 'bottom_right' }
          ];
          break;

        case 'minimize_all':
          const minimizeScript = `
            tell application "System Events"
              repeat with proc in (every application process whose visible is true)
                repeat with win in (every window of proc)
                  click (button 1 of win)
                end repeat
              end repeat
            end tell
          `;
          execCommand(`osascript -e '${minimizeScript}'`);
          return {
            success: true,
            message: 'All windows minimized',
            layout: layout
          };

        default:
          throw new Error(`Unknown layout: ${layout}`);
      }

      // Apply arrangements
      const targetApps = apps && apps.length > 0 ? apps : null;
      let appIndex = 0;

      for (const arrangement of arrangements) {
        if (targetApps && appIndex < targetApps.length) {
          await tools.snap_window({ 
            position: arrangement.position, 
            app: targetApps[appIndex],
            display: display 
          });
          appIndex++;
        } else {
          // Arrange visible windows in order
          break;
        }
      }
      
      return {
        success: true,
        message: `Applied ${layout} arrangement${targetApps ? ` to ${targetApps.length} apps` : ''}`,
        layout: layout,
        apps: targetApps,
        arrangements: arrangements.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Window arrangement failed: ${error.message}`,
        layout: layout
      };
    }
  },

  workspace_save: async ({ name, description }) => {
    try {
      ensureWorkspaceDir();
      
      let windows = [];
      
      if (isWindows()) {
        // Windows: get list of visible windows with main window titles
        const ps = `Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object ProcessName, MainWindowTitle, Id | ConvertTo-Json -Compress`;
        const out = execPowerShell(ps);
        let procs = [];
        try {
          procs = JSON.parse(out);
          if (!Array.isArray(procs)) procs = [procs];
        } catch { procs = []; }
        
        windows = procs.map(p => ({
          app: p.ProcessName,
          title: p.MainWindowTitle,
          pid: p.Id
        }));
      } else if (isMacOS()) {
        // Get current window information
        const windowInfo = await tools.get_window_info({ type: 'all' });
        if (!windowInfo.success) {
          throw new Error('Failed to get current window information');
        }
        windows = windowInfo.data.windows;
      } else {
        throw new Error('Workspace save not supported on this platform');
      }

      const workspace = {
        name: name,
        description: description || '',
        created: new Date().toISOString(),
        windows: windows,
        platform: isWindows() ? 'windows' : 'macos'
      };

      const workspacePath = path.join(WORKSPACE_DIR, `${name}.json`);
      fs.writeFileSync(workspacePath, JSON.stringify(workspace, null, 2));
      
      return {
        success: true,
        message: `Workspace "${name}" saved with ${workspace.windows.length} windows`,
        name: name,
        windowCount: workspace.windows.length,
        apps: [...new Set(windows.map(w => w.app))],
        path: workspacePath,
        platform: workspace.platform
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to save workspace: ${error.message}`,
        name: name
      };
    }
  },

  workspace_restore: async ({ name, launchApps = true }) => {
    try {
      ensureWorkspaceDir();
      
      const workspacePath = path.join(WORKSPACE_DIR, `${name}.json`);
      
      if (!fs.existsSync(workspacePath)) {
        throw new Error(`Workspace "${name}" not found`);
      }

      const workspace = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
      const requiredApps = [...new Set(workspace.windows.map(w => w.app))];
      let launchedApps = [];
      let failedApps = [];
      
      if (launchApps) {
        for (const app of requiredApps) {
          try {
            if (isWindows()) {
              // Windows: use Start-Process
              execPowerShell(`Start-Process -FilePath "${app}" -ErrorAction SilentlyContinue`);
              launchedApps.push(app);
            } else if (isMacOS()) {
              await tools.window_focus({ app });
              launchedApps.push(app);
            }
          } catch (error) {
            failedApps.push(app);
            console.log(`Could not launch ${app}: ${error.message}`);
          }
        }
      }

      // Wait a moment for apps to launch
      await new Promise(resolve => setTimeout(resolve, 2000));

      // On Windows, we can't easily restore exact window positions without additional tools
      // Just report which apps were launched
      const restoredCount = launchedApps.length;
      
      return {
        success: true,
        message: `Workspace "${name}" restored: launched ${restoredCount}/${requiredApps.length} apps`,
        name: name,
        launchedApps: launchedApps,
        failedApps: failedApps,
        totalApps: requiredApps.length,
        platform: isWindows() ? 'windows' : 'macos',
        note: isWindows() 
          ? 'Windows tip: Use Win+Arrow to snap windows after restore.' 
          : null
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restore workspace: ${error.message}`,
        name: name
      };
    }
  },

  workspace_list: async () => {
    try {
      ensureWorkspaceDir();
      
      const workspaceFiles = fs.readdirSync(WORKSPACE_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          try {
            const content = JSON.parse(fs.readFileSync(path.join(WORKSPACE_DIR, file), 'utf8'));
            return {
              name: content.name,
              description: content.description,
              created: content.created,
              windowCount: content.windows ? content.windows.length : 0
            };
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean);
      
      return {
        success: true,
        workspaces: workspaceFiles,
        count: workspaceFiles.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list workspaces: ${error.message}`
      };
    }
  }
};

module.exports = { tools };