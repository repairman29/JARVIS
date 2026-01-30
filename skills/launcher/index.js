const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Helper function to get app bundle ID from name
function getAppBundleId(appName) {
  const commonApps = {
    'chrome': 'com.google.Chrome',
    'firefox': 'org.mozilla.firefox',
    'safari': 'com.apple.Safari',
    'vs code': 'com.microsoft.VSCode',
    'cursor': 'com.todesktop.230313mzl4w4u92',
    'slack': 'com.tinyspeck.slackmacgap',
    'spotify': 'com.spotify.client',
    'discord': 'com.hnc.Discord',
    'notion': 'notion.id',
    'figma': 'com.figma.Desktop'
  };
  
  const normalizedName = appName.toLowerCase();
  return commonApps[normalizedName] || appName;
}

// Tool implementations
const tools = {
  launch_app: async ({ app, newInstance = false }) => {
    if (!isMacOS()) {
      throw new Error('App launching currently only supported on macOS');
    }

    try {
      const bundleId = getAppBundleId(app);
      const command = newInstance 
        ? `open -n -a "${bundleId}"`
        : `open -a "${bundleId}"`;
      
      execCommand(command);
      return {
        success: true,
        message: `Launched ${app}${newInstance ? ' (new instance)' : ''}`,
        app: app,
        bundleId: bundleId
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to launch ${app}: ${error.message}`,
        app: app
      };
    }
  },

  quit_app: async ({ app, force = false }) => {
    if (!isMacOS()) {
      throw new Error('App quitting currently only supported on macOS');
    }

    try {
      const bundleId = getAppBundleId(app);
      const command = force 
        ? `pkill -f "${bundleId}" || killall "${app}"`
        : `osascript -e 'quit app "${app}"'`;
      
      execCommand(command);
      return {
        success: true,
        message: `${force ? 'Force ' : ''}Quit ${app}`,
        app: app,
        force: force
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to quit ${app}: ${error.message}`,
        app: app
      };
    }
  },

  list_running_apps: async ({ sortBy = 'name' }) => {
    if (!isMacOS()) {
      throw new Error('App listing currently only supported on macOS');
    }

    try {
      // Get running applications with memory usage
      const psOutput = execCommand(`ps axo pid,comm,%mem,rss -r`);
      const lines = psOutput.split('\n').slice(1); // Skip header
      
      const apps = lines
        .filter(line => line.trim() && line.includes('.app'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[0];
          const memPercent = parts[2];
          const memKB = parts[3];
          const comm = parts.slice(1, -2).join(' ');
          const appName = comm.split('/').pop().replace('.app', '');
          
          return {
            pid: parseInt(pid),
            name: appName,
            memoryPercent: parseFloat(memPercent),
            memoryMB: Math.round(parseInt(memKB) / 1024),
            command: comm
          };
        });

      // Sort based on preference
      apps.sort((a, b) => {
        switch (sortBy) {
          case 'memory':
            return b.memoryMB - a.memoryMB;
          case 'cpu':
            return b.memoryPercent - a.memoryPercent; // Using memory % as proxy
          default:
            return a.name.localeCompare(b.name);
        }
      });

      return {
        success: true,
        apps: apps.slice(0, 20), // Limit to top 20
        totalApps: apps.length,
        sortedBy: sortBy
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list running apps: ${error.message}`
      };
    }
  },

  system_control: async ({ action, value }) => {
    if (!isMacOS()) {
      throw new Error('System control currently only supported on macOS');
    }

    try {
      let command;
      let message;

      switch (action) {
        case 'volume_up':
          command = value ? `osascript -e "set volume output volume ${value}"` 
                          : `osascript -e "set volume output volume (output volume of (get volume settings) + 10)"`;
          message = value ? `Set volume to ${value}%` : 'Volume increased';
          break;
        
        case 'volume_down':
          command = value ? `osascript -e "set volume output volume ${value}"` 
                          : `osascript -e "set volume output volume (output volume of (get volume settings) - 10)"`;
          message = value ? `Set volume to ${value}%` : 'Volume decreased';
          break;
        
        case 'volume_mute':
          command = `osascript -e "set volume with output muted"`;
          message = 'Volume muted';
          break;
        
        case 'brightness_up':
          command = `brightness 1`; // Increase brightness (requires brightness CLI tool)
          message = 'Brightness increased';
          break;
        
        case 'brightness_down':
          command = `brightness 0.1`; // Decrease brightness
          message = 'Brightness decreased';
          break;
        
        case 'wifi_on':
          command = `networksetup -setairportpower en0 on`;
          message = 'WiFi enabled';
          break;
        
        case 'wifi_off':
          command = `networksetup -setairportpower en0 off`;
          message = 'WiFi disabled';
          break;
        
        case 'bluetooth_on':
          command = `blueutil -p 1`; // Requires blueutil
          message = 'Bluetooth enabled';
          break;
        
        case 'bluetooth_off':
          command = `blueutil -p 0`; // Requires blueutil
          message = 'Bluetooth disabled';
          break;
        
        case 'sleep':
          command = `pmset sleepnow`;
          message = 'System going to sleep';
          break;
        
        case 'lock':
          command = `osascript -e 'tell application "System Events" to keystroke "q" using {control down, command down}'`;
          message = 'Screen locked';
          break;
        
        case 'restart':
          command = `sudo shutdown -r now`;
          message = 'System restarting (requires sudo)';
          break;
        
        case 'shutdown':
          command = `sudo shutdown -h now`;
          message = 'System shutting down (requires sudo)';
          break;
        
        case 'empty_trash':
          command = `osascript -e 'tell application "Finder" to empty trash'`;
          message = 'Trash emptied';
          break;
        
        case 'toggle_dark_mode':
          command = `osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to not dark mode'`;
          message = 'Dark mode toggled';
          break;
        
        default:
          throw new Error(`Unknown system action: ${action}`);
      }

      execCommand(command);
      return {
        success: true,
        message: message,
        action: action,
        value: value
      };
    } catch (error) {
      return {
        success: false,
        message: `System control failed: ${error.message}`,
        action: action
      };
    }
  },

  quick_calc: async ({ expression }) => {
    try {
      // Handle unit conversions first
      if (expression.includes(' to ') || expression.includes('convert')) {
        return handleUnitConversion(expression);
      }
      
      // Handle timezone conversions
      if (expression.match(/(EST|PST|GMT|UTC|CST|MST|EDT|PDT)/i)) {
        return handleTimezoneConversion(expression);
      }
      
      // Handle percentage calculations
      if (expression.includes('% of') || expression.includes('percent of')) {
        const match = expression.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:percent)?\s*of\s*(\d+(?:\.\d+)?)/i);
        if (match) {
          const percentage = parseFloat(match[1]);
          const number = parseFloat(match[2]);
          const result = (percentage / 100) * number;
          return {
            success: true,
            result: result,
            expression: expression,
            formatted: `${percentage}% of ${number} = ${result}`
          };
        }
      }
      
      // Basic math evaluation (safe)
      const sanitized = expression.replace(/[^0-9+\-*/().,\s]/g, '');
      const result = eval(sanitized);
      
      return {
        success: true,
        result: result,
        expression: expression,
        formatted: `${expression} = ${result}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Calculation failed: ${error.message}`,
        expression: expression
      };
    }
  },

  open_url: async ({ url, browser, incognito = false }) => {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      let command;
      if (browser) {
        const browserCommands = {
          chrome: incognito ? `open -a "Google Chrome" --args --incognito "${url}"` 
                            : `open -a "Google Chrome" "${url}"`,
          firefox: `open -a "Firefox" "${url}"`,
          safari: `open -a "Safari" "${url}"`,
          edge: `open -a "Microsoft Edge" "${url}"`
        };
        command = browserCommands[browser.toLowerCase()];
        if (!command) {
          throw new Error(`Unknown browser: ${browser}`);
        }
      } else {
        command = `open "${url}"`;
      }

      execCommand(command);
      return {
        success: true,
        message: `Opened ${url}${browser ? ` in ${browser}` : ''}${incognito ? ' (incognito)' : ''}`,
        url: url,
        browser: browser
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to open URL: ${error.message}`,
        url: url
      };
    }
  },

  process_manager: async ({ action, query, pid, limit = 10 }) => {
    try {
      let command;
      let processes = [];

      switch (action) {
        case 'list':
          command = `ps axo pid,ppid,comm,%cpu,%mem,rss`;
          break;
        case 'top_cpu':
          command = `ps axo pid,comm,%cpu,%mem -r | head -${limit + 1}`;
          break;
        case 'top_memory':
          command = `ps axo pid,comm,%cpu,%mem -m | head -${limit + 1}`;
          break;
        case 'search':
          command = `ps axo pid,comm,%cpu,%mem | grep -i "${query}"`;
          break;
        case 'kill':
          if (pid) {
            command = `kill ${pid}`;
            execCommand(command);
            return {
              success: true,
              message: `Killed process ${pid}`,
              pid: pid
            };
          } else if (query) {
            command = `pkill -f "${query}"`;
            execCommand(command);
            return {
              success: true,
              message: `Killed processes matching "${query}"`,
              query: query
            };
          } else {
            throw new Error('Either pid or query required for kill action');
          }
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const output = execCommand(command);
      const lines = output.split('\n').slice(1); // Skip header

      processes = lines.slice(0, limit).map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          return {
            pid: parseInt(parts[0]),
            command: parts[1],
            cpu: parseFloat(parts[2]) || 0,
            memory: parseFloat(parts[3]) || 0
          };
        }
        return null;
      }).filter(Boolean);

      return {
        success: true,
        processes: processes,
        action: action,
        query: query,
        count: processes.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Process management failed: ${error.message}`,
        action: action
      };
    }
  },

  get_system_info: async ({ info = 'all' }) => {
    try {
      const systemInfo = {};

      if (info === 'all' || info === 'cpu') {
        const cpuInfo = execCommand(`sysctl -n hw.ncpu hw.logicalcpu`);
        const [physical, logical] = cpuInfo.split('\n');
        systemInfo.cpu = {
          physicalCores: parseInt(physical),
          logicalCores: parseInt(logical),
          usage: parseFloat(execCommand(`ps -A -o %cpu | awk '{s+=$1} END {print s}'`) || '0')
        };
      }

      if (info === 'all' || info === 'memory') {
        const memInfo = execCommand(`vm_stat`);
        const pageSize = parseInt(execCommand(`vm_stat | head -1 | grep -o '[0-9]\\+'`));
        const freePages = parseInt(memInfo.match(/Pages free:\s+(\d+)/)?.[1] || '0');
        const totalMem = parseInt(execCommand(`sysctl -n hw.memsize`));
        
        systemInfo.memory = {
          total: Math.round(totalMem / 1024 / 1024 / 1024), // GB
          free: Math.round((freePages * pageSize) / 1024 / 1024), // MB
          used: Math.round((totalMem - (freePages * pageSize)) / 1024 / 1024 / 1024) // GB
        };
      }

      if (info === 'all' || info === 'disk') {
        const diskInfo = execCommand(`df -h /`);
        const diskLine = diskInfo.split('\n')[1];
        const [, total, used, available] = diskLine.split(/\s+/);
        
        systemInfo.disk = {
          total: total,
          used: used,
          available: available,
          mountPoint: '/'
        };
      }

      if (info === 'all' || info === 'battery') {
        try {
          const batteryInfo = execCommand(`pmset -g batt`);
          const batteryMatch = batteryInfo.match(/(\d+)%.*?(\w+)/);
          if (batteryMatch) {
            systemInfo.battery = {
              percentage: parseInt(batteryMatch[1]),
              status: batteryMatch[2].toLowerCase(),
              isCharging: batteryMatch[2].toLowerCase().includes('charging')
            };
          }
        } catch {
          systemInfo.battery = { error: 'Battery info not available' };
        }
      }

      return {
        success: true,
        systemInfo: systemInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get system info: ${error.message}`,
        requestedInfo: info
      };
    }
  },

  screenshot: async ({ type = 'fullscreen', app, save = false, path: savePath }) => {
    if (!isMacOS()) {
      throw new Error('Screenshots currently only supported on macOS');
    }

    try {
      let command;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultPath = savePath || `${require('os').homedir()}/Desktop/Screenshot-${timestamp}.png`;

      switch (type) {
        case 'fullscreen':
          command = save ? `screencapture "${defaultPath}"` : `screencapture -c`;
          break;
        case 'window':
          if (app) {
            command = save ? `screencapture -l $(GetWindowID "${app}") "${defaultPath}"` 
                           : `screencapture -l $(GetWindowID "${app}") -c`;
          } else {
            command = save ? `screencapture -w "${defaultPath}"` : `screencapture -w -c`;
          }
          break;
        case 'selection':
          command = save ? `screencapture -s "${defaultPath}"` : `screencapture -s -c`;
          break;
        case 'clipboard':
          command = `screencapture -c`;
          break;
        default:
          throw new Error(`Unknown screenshot type: ${type}`);
      }

      execCommand(command);
      
      return {
        success: true,
        message: save ? `Screenshot saved to ${defaultPath}` : 'Screenshot copied to clipboard',
        type: type,
        path: save ? defaultPath : null,
        app: app
      };
    } catch (error) {
      return {
        success: false,
        message: `Screenshot failed: ${error.message}`,
        type: type
      };
    }
  }
};

// Helper functions for calculations
function handleUnitConversion(expression) {
  // Basic unit conversion - would be expanded with a proper conversion library
  const conversions = {
    // Length
    'miles to km': (val) => val * 1.60934,
    'km to miles': (val) => val * 0.621371,
    'feet to meters': (val) => val * 0.3048,
    'meters to feet': (val) => val * 3.28084,
    // Weight
    'lbs to kg': (val) => val * 0.453592,
    'kg to lbs': (val) => val * 2.20462,
    // Temperature
    'fahrenheit to celsius': (val) => (val - 32) * 5/9,
    'celsius to fahrenheit': (val) => (val * 9/5) + 32
  };

  const match = expression.match(/(\d+(?:\.\d+)?)\s*(.+)/);
  if (match) {
    const value = parseFloat(match[1]);
    const conversionType = match[2].toLowerCase().trim();
    
    if (conversions[conversionType]) {
      const result = conversions[conversionType](value);
      return {
        success: true,
        result: result,
        expression: expression,
        formatted: `${value} ${conversionType.replace(' to ', ' = ')} ${result.toFixed(2)}`
      };
    }
  }

  return {
    success: false,
    message: `Unit conversion not supported: ${expression}`
  };
}

function handleTimezoneConversion(expression) {
  // Basic timezone conversion - would use a proper timezone library in production
  return {
    success: false,
    message: 'Timezone conversion not yet implemented - would use moment.js or date-fns-tz'
  };
}

module.exports = { tools };