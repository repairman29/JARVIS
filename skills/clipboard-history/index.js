const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Clipboard configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const CLIPBOARD_DIR = path.join(JARVIS_DIR, 'clipboard');
const CLIPBOARD_FILE = path.join(CLIPBOARD_DIR, 'history.json');
const USAGE_FILE = path.join(CLIPBOARD_DIR, 'usage.json');
const SETTINGS_FILE = path.join(CLIPBOARD_DIR, 'settings.json');

// Configuration constants
const MAX_ITEMS = parseInt(process.env.JARVIS_CLIPBOARD_MAX_ITEMS) || 1000;
const SYNC_ENABLED = process.env.JARVIS_CLIPBOARD_SYNC_ENABLED === 'true';
const EXCLUDE_PATTERNS = process.env.JARVIS_CLIPBOARD_EXCLUDE_PATTERNS?.split(',') || [
  'password', 'secret', 'token', 'key', 'credential', 'private'
];

// Content type detection patterns
const CONTENT_PATTERNS = {
  url: /^https?:\/\/[^\s]+$/i,
  email: /^[^\s]+@[^\s]+\.[^\s]+$/,
  phone: /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/,
  code: /^(function|class|def|public|private|const|let|var|\{|\}|;|\[|\])/m,
  json: /^\s*[\{\[][\s\S]*[\}\]]\s*$/,
  base64: /^[A-Za-z0-9+\/]+=*$/,
  hex: /^[0-9a-fA-F]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Sensitive data patterns
const SENSITIVE_PATTERNS = [
  /password/i, /secret/i, /token/i, /key/i, /credential/i, /private/i,
  /ssh-rsa/, /BEGIN.*PRIVATE.*KEY/, /api[_-]?key/i, /auth[_-]?token/i
];

let monitoringProcess = null;
let isMonitoring = false;

// Helper functions
function ensureDirectories() {
  if (!fs.existsSync(JARVIS_DIR)) {
    fs.mkdirSync(JARVIS_DIR, { recursive: true });
  }
  if (!fs.existsSync(CLIPBOARD_DIR)) {
    fs.mkdirSync(CLIPBOARD_DIR, { recursive: true });
  }
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function detectContentType(content) {
  if (!content || typeof content !== 'string') {
    return 'unknown';
  }

  // Check for specific patterns
  for (const [type, pattern] of Object.entries(CONTENT_PATTERNS)) {
    if (pattern.test(content.trim())) {
      return type;
    }
  }

  // File path detection
  if (content.includes('/') || content.includes('\\')) {
    return 'file';
  }

  // Default to text
  return 'text';
}

function detectSensitiveContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  return SENSITIVE_PATTERNS.some(pattern => pattern.test(content));
}

function getActiveApp() {
  try {
    if (process.platform === 'darwin') {
      const result = execSync(`osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`, { encoding: 'utf8' });
      return result.trim();
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

function getCurrentClipboard() {
  try {
    if (process.platform === 'darwin') {
      return execSync('pbpaste', { encoding: 'utf8' });
    } else if (process.platform === 'win32') {
      return execSync('powershell Get-Clipboard', { encoding: 'utf8' });
    } else {
      // Linux - requires xclip
      return execSync('xclip -o -selection clipboard', { encoding: 'utf8' });
    }
  } catch (error) {
    return null;
  }
}

function setClipboard(content) {
  try {
    if (process.platform === 'darwin') {
      const proc = spawn('pbcopy');
      proc.stdin.write(content);
      proc.stdin.end();
    } else if (process.platform === 'win32') {
      execSync(`echo '${content}' | clip`, { shell: true });
    } else {
      // Linux - requires xclip
      const proc = spawn('xclip', ['-selection', 'clipboard']);
      proc.stdin.write(content);
      proc.stdin.end();
    }
    return true;
  } catch (error) {
    return false;
  }
}

function loadClipboardHistory() {
  try {
    if (fs.existsSync(CLIPBOARD_FILE)) {
      const data = fs.readFileSync(CLIPBOARD_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load clipboard history:', error.message);
  }
  return { items: [], lastUpdate: null };
}

function saveClipboardHistory(history) {
  try {
    ensureDirectories();
    fs.writeFileSync(CLIPBOARD_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to save clipboard history:', error.message);
  }
}

function addClipboardItem(content, type = 'paste') {
  try {
    const history = loadClipboardHistory();
    
    // Skip empty content
    if (!content || content.trim().length === 0) {
      return null;
    }

    // Check exclusion patterns
    const shouldExclude = EXCLUDE_PATTERNS.some(pattern => 
      content.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (shouldExclude) {
      console.log('Clipboard content excluded due to pattern match');
      return null;
    }

    // Check if identical to last item
    if (history.items.length > 0 && history.items[0].content === content) {
      return null;
    }

    const item = {
      id: generateId(),
      content: content,
      preview: content.length > 100 ? content.substring(0, 100) + '...' : content,
      contentType: detectContentType(content),
      sensitive: detectSensitiveContent(content),
      sourceApp: getActiveApp(),
      timestamp: new Date().toISOString(),
      type: type, // 'paste', 'copy', 'cut'
      size: content.length,
      pinned: false,
      category: null,
      note: null,
      accessCount: 0,
      lastAccessed: null
    };

    // Add to beginning of array
    history.items.unshift(item);

    // Maintain size limit
    if (history.items.length > MAX_ITEMS) {
      // Keep pinned items, remove oldest unpinned items
      const pinned = history.items.filter(item => item.pinned);
      const unpinned = history.items.filter(item => !item.pinned).slice(0, MAX_ITEMS - pinned.length);
      history.items = [...unpinned, ...pinned];
    }

    history.lastUpdate = new Date().toISOString();
    saveClipboardHistory(history);
    
    return item;
  } catch (error) {
    console.error('Failed to add clipboard item:', error.message);
    return null;
  }
}

function fuzzySearch(query, text, threshold = 0.3) {
  if (!query || !text) return 0;
  
  query = query.toLowerCase();
  text = text.toLowerCase();
  
  // Exact match gets highest score
  if (text.includes(query)) {
    return 1.0;
  }
  
  // Fuzzy matching
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      score += 1;
      queryIndex++;
    }
  }
  
  const matchRatio = queryIndex / query.length;
  return matchRatio >= threshold ? matchRatio : 0;
}

function startClipboardMonitoring() {
  if (isMonitoring) {
    return { success: true, message: 'Clipboard monitoring already active' };
  }

  let lastClipboard = getCurrentClipboard();
  
  const monitor = setInterval(() => {
    const currentClipboard = getCurrentClipboard();
    
    if (currentClipboard && currentClipboard !== lastClipboard) {
      addClipboardItem(currentClipboard, 'copy');
      lastClipboard = currentClipboard;
    }
  }, 1000); // Check every second

  monitoringProcess = monitor;
  isMonitoring = true;
  
  return { success: true, message: 'Clipboard monitoring started' };
}

function stopClipboardMonitoring() {
  if (monitoringProcess) {
    clearInterval(monitoringProcess);
    monitoringProcess = null;
  }
  isMonitoring = false;
  
  return { success: true, message: 'Clipboard monitoring stopped' };
}

function trackUsage(itemId) {
  try {
    ensureDirectories();
    let usage = {};
    
    if (fs.existsSync(USAGE_FILE)) {
      usage = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    }
    
    if (!usage[itemId]) {
      usage[itemId] = { count: 0, lastAccessed: null };
    }
    
    usage[itemId].count++;
    usage[itemId].lastAccessed = new Date().toISOString();
    
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
  } catch (error) {
    // Silently fail usage tracking
  }
}

// Tool implementations
const tools = {
  search_clipboard: async ({ query, type = 'all', app, limit = 20, dateRange = 'all', includePrivate = false }) => {
    try {
      const history = loadClipboardHistory();
      let items = history.items;

      // Filter by type
      if (type !== 'all') {
        items = items.filter(item => item.contentType === type);
      }

      // Filter by app
      if (app) {
        items = items.filter(item => 
          item.sourceApp && item.sourceApp.toLowerCase().includes(app.toLowerCase())
        );
      }

      // Filter by date range
      if (dateRange !== 'all') {
        const now = new Date();
        let cutoffDate;
        
        switch (dateRange) {
          case 'today':
            cutoffDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'yesterday':
            cutoffDate = new Date(now.setDate(now.getDate() - 1));
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'this_week':
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'this_month':
            cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        }
        
        if (cutoffDate) {
          items = items.filter(item => new Date(item.timestamp) >= cutoffDate);
        }
      }

      // Filter sensitive items
      if (!includePrivate) {
        items = items.filter(item => !item.sensitive);
      }

      // Search and score items
      if (query) {
        const results = items.map(item => {
          const contentScore = fuzzySearch(query, item.content);
          const previewScore = fuzzySearch(query, item.preview);
          const score = Math.max(contentScore, previewScore);
          
          return {
            ...item,
            score: score
          };
        }).filter(item => item.score > 0);

        results.sort((a, b) => b.score - a.score);
        
        return {
          success: true,
          results: results.slice(0, limit),
          total: results.length,
          query: query
        };
      } else {
        // Return recent items without search
        return {
          success: true,
          results: items.slice(0, limit),
          total: items.length,
          query: null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Clipboard search failed: ${error.message}`,
        query: query
      };
    }
  },

  get_clipboard_history: async ({ limit = 20, type = 'all', includePreview = true }) => {
    try {
      const history = loadClipboardHistory();
      let items = history.items;

      // Filter by type
      if (type !== 'all') {
        items = items.filter(item => item.contentType === type);
      }

      // Limit results
      items = items.slice(0, limit);

      // Include or exclude preview based on setting
      if (!includePreview) {
        items = items.map(item => {
          const { preview, ...itemWithoutPreview } = item;
          return itemWithoutPreview;
        });
      }

      return {
        success: true,
        items: items,
        total: history.items.length,
        lastUpdate: history.lastUpdate
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get clipboard history: ${error.message}`
      };
    }
  },

  paste_clipboard_item: async ({ itemId, targetApp, position }) => {
    try {
      const history = loadClipboardHistory();
      const item = history.items.find(i => i.id === itemId);
      
      if (!item) {
        throw new Error(`Clipboard item not found: ${itemId}`);
      }

      // Set clipboard to the item content
      const success = setClipboard(item.content);
      
      if (!success) {
        throw new Error('Failed to set clipboard content');
      }

      // Track usage
      trackUsage(itemId);
      
      // Update item access info
      item.accessCount++;
      item.lastAccessed = new Date().toISOString();
      saveClipboardHistory(history);

      // If target app specified, activate it first
      if (targetApp) {
        try {
          if (process.platform === 'darwin') {
            execSync(`osascript -e 'tell application "${targetApp}" to activate'`);
          }
        } catch (error) {
          // Continue even if app activation fails
        }
      }

      // Trigger paste command
      if (process.platform === 'darwin') {
        execSync(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`);
      } else if (process.platform === 'win32') {
        execSync('powershell Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")');
      }

      return {
        success: true,
        message: `Pasted clipboard item${targetApp ? ` to ${targetApp}` : ''}`,
        itemId: itemId,
        content: item.preview,
        targetApp: targetApp
      };
    } catch (error) {
      return {
        success: false,
        message: `Paste operation failed: ${error.message}`,
        itemId: itemId
      };
    }
  },

  clipboard_operations: async ({ action, itemId, category, note }) => {
    try {
      const history = loadClipboardHistory();
      const itemIndex = history.items.findIndex(i => i.id === itemId);
      
      if (itemIndex === -1) {
        throw new Error(`Clipboard item not found: ${itemId}`);
      }

      const item = history.items[itemIndex];
      let message;

      switch (action) {
        case 'pin':
          item.pinned = true;
          message = 'Item pinned';
          break;
        case 'unpin':
          item.pinned = false;
          message = 'Item unpinned';
          break;
        case 'delete':
          history.items.splice(itemIndex, 1);
          message = 'Item deleted';
          break;
        case 'mark_private':
          item.sensitive = true;
          message = 'Item marked as private';
          break;
        case 'unmark_private':
          item.sensitive = false;
          message = 'Item unmarked as private';
          break;
        case 'categorize':
          item.category = category;
          message = `Item categorized as ${category}`;
          break;
        case 'favorite':
          item.favorite = true;
          message = 'Item added to favorites';
          break;
        case 'unfavorite':
          item.favorite = false;
          message = 'Item removed from favorites';
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      if (note) {
        item.note = note;
      }

      history.lastUpdate = new Date().toISOString();
      saveClipboardHistory(history);

      return {
        success: true,
        message: message,
        action: action,
        itemId: itemId
      };
    } catch (error) {
      return {
        success: false,
        message: `Clipboard operation failed: ${error.message}`,
        action: action,
        itemId: itemId
      };
    }
  },

  monitor_clipboard: async ({ action = 'status' }) => {
    try {
      switch (action) {
        case 'start':
          return startClipboardMonitoring();
        case 'stop':
          return stopClipboardMonitoring();
        case 'pause':
          // Temporary pause - would implement with a flag
          return { success: true, message: 'Clipboard monitoring paused' };
        case 'resume':
          // Resume from pause
          return { success: true, message: 'Clipboard monitoring resumed' };
        case 'status':
        default:
          return {
            success: true,
            monitoring: isMonitoring,
            message: isMonitoring ? 'Clipboard monitoring is active' : 'Clipboard monitoring is inactive'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Monitor operation failed: ${error.message}`,
        action: action
      };
    }
  },

  clear_clipboard_history: async ({ type, confirm }) => {
    if (!confirm) {
      return {
        success: false,
        message: 'Confirmation required to clear clipboard history',
        requiresConfirmation: true
      };
    }

    try {
      const history = loadClipboardHistory();
      let originalCount = history.items.length;
      let newItems = [];

      switch (type) {
        case 'all':
          newItems = [];
          break;
        case 'text':
          newItems = history.items.filter(item => item.contentType !== 'text');
          break;
        case 'images':
          newItems = history.items.filter(item => item.contentType !== 'image');
          break;
        case 'files':
          newItems = history.items.filter(item => item.contentType !== 'file');
          break;
        case 'older_than_week':
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          newItems = history.items.filter(item => new Date(item.timestamp) > weekAgo);
          break;
        case 'older_than_month':
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          newItems = history.items.filter(item => new Date(item.timestamp) > monthAgo);
          break;
        case 'unpinned':
          newItems = history.items.filter(item => item.pinned);
          break;
        default:
          throw new Error(`Unknown clear type: ${type}`);
      }

      history.items = newItems;
      history.lastUpdate = new Date().toISOString();
      saveClipboardHistory(history);

      const removedCount = originalCount - newItems.length;

      return {
        success: true,
        message: `Cleared ${removedCount} clipboard items`,
        type: type,
        removedCount: removedCount,
        remainingCount: newItems.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Clear operation failed: ${error.message}`,
        type: type
      };
    }
  },

  export_clipboard_items: async ({ format = 'txt', filePath, filter }) => {
    try {
      const history = loadClipboardHistory();
      let items = history.items;

      // Apply filters if provided
      if (filter) {
        if (filter.type) {
          items = items.filter(item => item.contentType === filter.type);
        }
        if (filter.pinned !== undefined) {
          items = items.filter(item => item.pinned === filter.pinned);
        }
        if (filter.dateRange) {
          // Similar date filtering as in search
        }
      }

      const exportPath = filePath || path.join(os.homedir(), `clipboard-export-${Date.now()}.${format}`);
      let content = '';

      switch (format) {
        case 'txt':
          content = items.map(item => 
            `[${item.timestamp}] ${item.sourceApp || 'Unknown'}\n${item.content}\n\n---\n\n`
          ).join('');
          break;
        
        case 'json':
          content = JSON.stringify(items, null, 2);
          break;
        
        case 'html':
          content = `<!DOCTYPE html>
<html><head><title>Clipboard History Export</title></head><body>
<h1>Clipboard History Export</h1>
${items.map(item => `
<div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc;">
  <h3>${item.contentType} - ${item.sourceApp || 'Unknown'}</h3>
  <p><small>${item.timestamp}</small></p>
  <pre>${item.content}</pre>
</div>
`).join('')}
</body></html>`;
          break;
        
        case 'csv':
          content = 'Timestamp,App,Type,Content,Pinned,Sensitive\n';
          content += items.map(item => 
            `"${item.timestamp}","${item.sourceApp || ''}","${item.contentType}","${item.content.replace(/"/g, '""')}","${item.pinned}","${item.sensitive}"`
          ).join('\n');
          break;
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      fs.writeFileSync(exportPath, content, 'utf8');

      return {
        success: true,
        message: `Exported ${items.length} clipboard items`,
        filePath: exportPath,
        format: format,
        itemCount: items.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Export failed: ${error.message}`,
        format: format
      };
    }
  },

  import_clipboard_items: async ({ source, filePath, merge = true }) => {
    try {
      let importData = [];
      
      switch (source) {
        case 'file':
          if (!filePath || !fs.existsSync(filePath)) {
            throw new Error('Import file not found');
          }
          
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const ext = path.extname(filePath).toLowerCase();
          
          if (ext === '.json') {
            importData = JSON.parse(fileContent);
          } else {
            throw new Error('Only JSON import currently supported');
          }
          break;
        
        default:
          throw new Error(`Unsupported import source: ${source}`);
      }

      const history = loadClipboardHistory();
      
      if (!merge) {
        history.items = [];
      }

      // Add imported items with new IDs
      const importedItems = importData.map(item => ({
        ...item,
        id: generateId(), // Generate new ID to avoid conflicts
        imported: true,
        importTimestamp: new Date().toISOString()
      }));

      history.items = [...importedItems, ...history.items];
      
      // Maintain size limit
      if (history.items.length > MAX_ITEMS) {
        history.items = history.items.slice(0, MAX_ITEMS);
      }

      history.lastUpdate = new Date().toISOString();
      saveClipboardHistory(history);

      return {
        success: true,
        message: `Imported ${importedItems.length} clipboard items`,
        source: source,
        filePath: filePath,
        importedCount: importedItems.length,
        totalCount: history.items.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error.message}`,
        source: source
      };
    }
  },

  analyze_clipboard_patterns: async ({ timeframe = 'week', includeApps = true }) => {
    try {
      const history = loadClipboardHistory();
      let items = history.items;

      // Filter by timeframe
      const now = new Date();
      let cutoffDate;
      
      switch (timeframe) {
        case 'day':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          cutoffDate = null;
          break;
      }

      if (cutoffDate) {
        items = items.filter(item => new Date(item.timestamp) >= cutoffDate);
      }

      // Analyze patterns
      const analysis = {
        totalItems: items.length,
        timeframe: timeframe,
        contentTypes: {},
        averageSize: 0,
        mostActiveHours: {},
        apps: {},
        sensitiveItems: items.filter(item => item.sensitive).length,
        pinnedItems: items.filter(item => item.pinned).length
      };

      // Content type distribution
      items.forEach(item => {
        analysis.contentTypes[item.contentType] = (analysis.contentTypes[item.contentType] || 0) + 1;
      });

      // Average content size
      if (items.length > 0) {
        analysis.averageSize = Math.round(items.reduce((sum, item) => sum + item.size, 0) / items.length);
      }

      // Most active hours
      items.forEach(item => {
        const hour = new Date(item.timestamp).getHours();
        analysis.mostActiveHours[hour] = (analysis.mostActiveHours[hour] || 0) + 1;
      });

      // App usage analysis
      if (includeApps) {
        items.forEach(item => {
          if (item.sourceApp) {
            analysis.apps[item.sourceApp] = (analysis.apps[item.sourceApp] || 0) + 1;
          }
        });
      }

      return {
        success: true,
        analysis: analysis,
        insights: [
          `Most used content type: ${Object.keys(analysis.contentTypes).reduce((a, b) => 
            analysis.contentTypes[a] > analysis.contentTypes[b] ? a : b, 'none')}`,
          `Peak activity hour: ${Object.keys(analysis.mostActiveHours).reduce((a, b) => 
            analysis.mostActiveHours[a] > analysis.mostActiveHours[b] ? a : b, 'none')}:00`,
          `Average item size: ${analysis.averageSize} characters`
        ]
      };
    } catch (error) {
      return {
        success: false,
        message: `Pattern analysis failed: ${error.message}`,
        timeframe: timeframe
      };
    }
  },

  setup_clipboard_sync: async ({ action = 'status', deviceName }) => {
    try {
      // This would integrate with a sync service in production
      switch (action) {
        case 'enable':
          return {
            success: true,
            message: 'Clipboard sync enabled (mock implementation)',
            action: action
          };
        
        case 'disable':
          return {
            success: true,
            message: 'Clipboard sync disabled',
            action: action
          };
        
        case 'status':
          return {
            success: true,
            syncEnabled: SYNC_ENABLED,
            message: SYNC_ENABLED ? 'Clipboard sync is enabled' : 'Clipboard sync is disabled',
            action: action
          };
        
        case 'pair_device':
          if (!deviceName) {
            throw new Error('Device name required for pairing');
          }
          return {
            success: true,
            message: `Device ${deviceName} paired (mock implementation)`,
            deviceName: deviceName,
            action: action
          };
        
        case 'unpair_device':
          if (!deviceName) {
            throw new Error('Device name required for unpairing');
          }
          return {
            success: true,
            message: `Device ${deviceName} unpaired`,
            deviceName: deviceName,
            action: action
          };
        
        default:
          throw new Error(`Unknown sync action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Sync setup failed: ${error.message}`,
        action: action
      };
    }
  }
};

// Auto-start clipboard monitoring when skill loads
if (process.env.NODE_ENV !== 'test') {
  startClipboardMonitoring();
}

module.exports = { tools };