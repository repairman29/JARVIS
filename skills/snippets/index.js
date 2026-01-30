const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Snippets configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const SNIPPETS_DIR = path.join(JARVIS_DIR, 'snippets');
const SNIPPETS_FILE = path.join(SNIPPETS_DIR, 'snippets.json');
const USAGE_FILE = path.join(SNIPPETS_DIR, 'usage.json');
const SETTINGS_FILE = path.join(SNIPPETS_DIR, 'settings.json');

// Configuration constants
const TRIGGER_PREFIX = process.env.JARVIS_SNIPPETS_TRIGGER_PREFIX || '';
const AUTO_EXPAND = process.env.JARVIS_SNIPPETS_AUTO_EXPAND === 'true';
const SYNC_ENABLED = process.env.JARVIS_SNIPPETS_SYNC_ENABLED === 'true';

// Built-in variable resolvers
const VARIABLE_RESOLVERS = {
  date: (format) => {
    const now = new Date();
    if (format) {
      // Simple date formatting - would use a proper library in production
      return format
        .replace('YYYY', now.getFullYear())
        .replace('MM', String(now.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(now.getDate()).padStart(2, '0'))
        .replace('MMM', now.toLocaleDateString('en', { month: 'short' }));
    }
    return now.toLocaleDateString();
  },
  
  time: (format) => {
    const now = new Date();
    if (format) {
      return format
        .replace('HH', String(now.getHours()).padStart(2, '0'))
        .replace('mm', String(now.getMinutes()).padStart(2, '0'))
        .replace('ss', String(now.getSeconds()).padStart(2, '0'));
    }
    return now.toLocaleTimeString();
  },
  
  timestamp: () => new Date().toISOString(),
  username: () => os.userInfo().username,
  hostname: () => os.hostname(),
  os: () => os.platform(),
  
  clipboard: () => {
    try {
      if (process.platform === 'darwin') {
        return execSync('pbpaste', { encoding: 'utf8' });
      } else if (process.platform === 'win32') {
        return execSync('powershell Get-Clipboard', { encoding: 'utf8' });
      } else {
        return execSync('xclip -o -selection clipboard', { encoding: 'utf8' });
      }
    } catch (error) {
      return '';
    }
  }
};

// Helper functions
function ensureDirectories() {
  if (!fs.existsSync(JARVIS_DIR)) {
    fs.mkdirSync(JARVIS_DIR, { recursive: true });
  }
  if (!fs.existsSync(SNIPPETS_DIR)) {
    fs.mkdirSync(SNIPPETS_DIR, { recursive: true });
  }
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
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

function loadSnippets() {
  try {
    if (fs.existsSync(SNIPPETS_FILE)) {
      const data = fs.readFileSync(SNIPPETS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load snippets:', error.message);
  }
  return { snippets: [], lastUpdate: null };
}

function saveSnippets(data) {
  try {
    ensureDirectories();
    fs.writeFileSync(SNIPPETS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save snippets:', error.message);
  }
}

function loadUsage() {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    }
  } catch (error) {
    // Silently fail
  }
  return {};
}

function saveUsage(usage) {
  try {
    ensureDirectories();
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
  } catch (error) {
    // Silently fail
  }
}

function trackUsage(snippetId) {
  const usage = loadUsage();
  if (!usage[snippetId]) {
    usage[snippetId] = { count: 0, lastUsed: null };
  }
  usage[snippetId].count++;
  usage[snippetId].lastUsed = new Date().toISOString();
  saveUsage(usage);
}

function processVariables(content, variables = {}, customVariables = []) {
  let processed = content;
  
  // Replace built-in variables
  processed = processed.replace(/\{(\w+)(?::([^}]+))?\}/g, (match, varName, format) => {
    if (VARIABLE_RESOLVERS[varName]) {
      return VARIABLE_RESOLVERS[varName](format);
    }
    
    // Check custom variables
    if (variables[varName] !== undefined) {
      return variables[varName];
    }
    
    // Check for variable definitions
    const customVar = customVariables.find(v => v.name === varName);
    if (customVar && variables[varName] === undefined) {
      // Variable needs to be prompted for
      return `{${varName}}`;  // Keep placeholder for prompt
    }
    
    return match; // Keep original if not found
  });
  
  return processed;
}

function insertText(text, targetApp) {
  try {
    // Set clipboard first
    if (process.platform === 'darwin') {
      const proc = spawn('pbcopy');
      proc.stdin.write(text);
      proc.stdin.end();
    } else if (process.platform === 'win32') {
      execSync(`echo '${text}' | clip`, { shell: true });
    } else {
      const proc = spawn('xclip', ['-selection', 'clipboard']);
      proc.stdin.write(text);
      proc.stdin.end();
    }
    
    // Focus target app if specified
    if (targetApp && process.platform === 'darwin') {
      execSync(`osascript -e 'tell application "${targetApp}" to activate'`);
    }
    
    // Trigger paste
    setTimeout(() => {
      if (process.platform === 'darwin') {
        execSync(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`);
      } else if (process.platform === 'win32') {
        execSync('powershell Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")');
      }
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Failed to insert text:', error.message);
    return false;
  }
}

function fuzzyMatch(query, text, threshold = 0.3) {
  if (!query || !text) return 0;
  
  query = query.toLowerCase();
  text = text.toLowerCase();
  
  if (text.includes(query)) {
    return 1.0;
  }
  
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

function categorizeSnippet(content, name = '', description = '') {
  const text = `${name} ${description} ${content}`.toLowerCase();
  
  const categories = {
    email: ['email', 'signature', 'regards', 'sincerely', 'hello', 'greeting'],
    code: ['function', 'class', 'import', 'const', 'let', 'var', 'return', 'component'],
    personal: ['address', 'phone', 'contact', 'personal', 'bio'],
    work: ['meeting', 'report', 'project', 'task', 'agenda'],
    social: ['post', 'tweet', 'hashtag', 'social', 'share']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

// Tool implementations
const tools = {
  create_snippet: async ({ trigger, content, name, description, category, tags = [], appScope = [], variables = [] }) => {
    try {
      const data = loadSnippets();
      
      // Check for existing trigger
      const existingSnippet = data.snippets.find(s => s.trigger === trigger);
      if (existingSnippet) {
        return {
          success: false,
          message: `Snippet with trigger "${trigger}" already exists`,
          existingSnippet: existingSnippet
        };
      }
      
      const snippet = {
        id: generateId(),
        trigger: trigger,
        content: content,
        name: name,
        description: description || '',
        category: category || categorizeSnippet(content, name, description),
        tags: tags,
        appScope: appScope,
        variables: variables,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: os.userInfo().username
      };
      
      data.snippets.push(snippet);
      data.lastUpdate = new Date().toISOString();
      saveSnippets(data);
      
      return {
        success: true,
        message: `Created snippet "${name}" with trigger "${trigger}"`,
        snippet: snippet
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create snippet: ${error.message}`,
        trigger: trigger
      };
    }
  },

  search_snippets: async ({ query, category, tags, appScope, limit = 20, includeContent = true }) => {
    try {
      const data = loadSnippets();
      let snippets = data.snippets;
      
      // Apply filters
      if (category) {
        snippets = snippets.filter(s => s.category === category);
      }
      
      if (tags && tags.length > 0) {
        snippets = snippets.filter(s => 
          tags.some(tag => s.tags && s.tags.includes(tag))
        );
      }
      
      if (appScope) {
        snippets = snippets.filter(s => 
          !s.appScope || s.appScope.length === 0 || s.appScope.includes(appScope)
        );
      }
      
      // Search and score
      if (query) {
        const results = snippets.map(snippet => {
          let score = 0;
          
          // Name matching (highest weight)
          score += fuzzyMatch(query, snippet.name) * 10;
          
          // Trigger matching
          score += fuzzyMatch(query, snippet.trigger) * 8;
          
          // Content matching
          score += fuzzyMatch(query, snippet.content) * 5;
          
          // Description matching
          score += fuzzyMatch(query, snippet.description || '') * 3;
          
          // Tag matching
          if (snippet.tags) {
            score += snippet.tags.reduce((tagScore, tag) => 
              tagScore + fuzzyMatch(query, tag) * 6, 0
            );
          }
          
          return { ...snippet, score };
        }).filter(s => s.score > 0);
        
        results.sort((a, b) => b.score - a.score);
        snippets = results.slice(0, limit);
      } else {
        snippets = snippets.slice(0, limit);
      }
      
      // Remove content if not requested
      if (!includeContent) {
        snippets = snippets.map(({ content, ...snippet }) => snippet);
      }
      
      return {
        success: true,
        results: snippets,
        total: snippets.length,
        query: query
      };
    } catch (error) {
      return {
        success: false,
        message: `Search failed: ${error.message}`,
        query: query
      };
    }
  },

  expand_snippet: async ({ trigger, snippetId, variables = {}, targetApp, insertMode = 'replace' }) => {
    try {
      const data = loadSnippets();
      let snippet;
      
      if (snippetId) {
        snippet = data.snippets.find(s => s.id === snippetId);
      } else if (trigger) {
        snippet = data.snippets.find(s => s.trigger === trigger);
      }
      
      if (!snippet) {
        return {
          success: false,
          message: `Snippet not found: ${snippetId || trigger}`
        };
      }
      
      // Check if snippet has custom variables that need values
      const missingVariables = [];
      if (snippet.variables) {
        for (const variable of snippet.variables) {
          if (variables[variable.name] === undefined && !variable.defaultValue) {
            missingVariables.push(variable);
          }
        }
      }
      
      if (missingVariables.length > 0) {
        return {
          success: false,
          message: 'Missing variable values',
          missingVariables: missingVariables,
          needsInput: true
        };
      }
      
      // Fill in default values for missing variables
      if (snippet.variables) {
        for (const variable of snippet.variables) {
          if (variables[variable.name] === undefined && variable.defaultValue) {
            variables[variable.name] = variable.defaultValue;
          }
        }
      }
      
      // Process content with variables
      let processedContent = processVariables(snippet.content, variables, snippet.variables);
      
      // Track usage
      trackUsage(snippet.id);
      
      // Handle cursor positioning
      let cursorOffset = -1;
      if (processedContent.includes('{cursor}')) {
        cursorOffset = processedContent.indexOf('{cursor}');
        processedContent = processedContent.replace('{cursor}', '');
      }
      
      // Insert text based on mode
      switch (insertMode) {
        case 'replace':
        case 'append':
          const success = insertText(processedContent, targetApp);
          if (!success) {
            throw new Error('Failed to insert text');
          }
          break;
          
        case 'clipboard':
          // Just copy to clipboard
          if (process.platform === 'darwin') {
            const proc = spawn('pbcopy');
            proc.stdin.write(processedContent);
            proc.stdin.end();
          }
          break;
          
        case 'return_only':
          // Just return the content
          break;
      }
      
      return {
        success: true,
        message: `Expanded snippet "${snippet.name}"`,
        content: processedContent,
        snippet: snippet,
        insertMode: insertMode,
        cursorOffset: cursorOffset
      };
    } catch (error) {
      return {
        success: false,
        message: `Snippet expansion failed: ${error.message}`,
        trigger: trigger,
        snippetId: snippetId
      };
    }
  },

  list_snippets: async ({ category, sortBy = 'name', limit = 50, includeUsageStats = false }) => {
    try {
      const data = loadSnippets();
      let snippets = data.snippets;
      
      // Filter by category
      if (category) {
        snippets = snippets.filter(s => s.category === category);
      }
      
      // Add usage stats if requested
      if (includeUsageStats) {
        const usage = loadUsage();
        snippets = snippets.map(snippet => ({
          ...snippet,
          usageCount: usage[snippet.id]?.count || 0,
          lastUsed: usage[snippet.id]?.lastUsed || null
        }));
      }
      
      // Sort snippets
      snippets.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'trigger':
            return a.trigger.localeCompare(b.trigger);
          case 'created':
            return new Date(b.created) - new Date(a.created);
          case 'modified':
            return new Date(b.modified) - new Date(a.modified);
          case 'usage':
            const aUsage = includeUsageStats ? a.usageCount : 0;
            const bUsage = includeUsageStats ? b.usageCount : 0;
            return bUsage - aUsage;
          case 'category':
            return a.category.localeCompare(b.category);
          default:
            return a.name.localeCompare(b.name);
        }
      });
      
      // Limit results
      snippets = snippets.slice(0, limit);
      
      return {
        success: true,
        snippets: snippets,
        total: data.snippets.length,
        filtered: snippets.length,
        sortBy: sortBy
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list snippets: ${error.message}`
      };
    }
  },

  update_snippet: async ({ snippetId, trigger, content, name, description, category, tags, appScope, variables }) => {
    try {
      const data = loadSnippets();
      const snippetIndex = data.snippets.findIndex(s => s.id === snippetId);
      
      if (snippetIndex === -1) {
        return {
          success: false,
          message: `Snippet not found: ${snippetId}`
        };
      }
      
      const snippet = data.snippets[snippetIndex];
      
      // Check for trigger conflicts if changing trigger
      if (trigger && trigger !== snippet.trigger) {
        const existingSnippet = data.snippets.find(s => s.trigger === trigger && s.id !== snippetId);
        if (existingSnippet) {
          return {
            success: false,
            message: `Snippet with trigger "${trigger}" already exists`
          };
        }
      }
      
      // Update fields
      if (trigger !== undefined) snippet.trigger = trigger;
      if (content !== undefined) snippet.content = content;
      if (name !== undefined) snippet.name = name;
      if (description !== undefined) snippet.description = description;
      if (category !== undefined) snippet.category = category;
      if (tags !== undefined) snippet.tags = tags;
      if (appScope !== undefined) snippet.appScope = appScope;
      if (variables !== undefined) snippet.variables = variables;
      
      snippet.modified = new Date().toISOString();
      
      data.lastUpdate = new Date().toISOString();
      saveSnippets(data);
      
      return {
        success: true,
        message: `Updated snippet "${snippet.name}"`,
        snippet: snippet
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update snippet: ${error.message}`,
        snippetId: snippetId
      };
    }
  },

  delete_snippet: async ({ snippetId, trigger, confirm = false }) => {
    if (!confirm) {
      return {
        success: false,
        message: 'Confirmation required to delete snippet',
        requiresConfirmation: true
      };
    }
    
    try {
      const data = loadSnippets();
      let snippetIndex = -1;
      
      if (snippetId) {
        snippetIndex = data.snippets.findIndex(s => s.id === snippetId);
      } else if (trigger) {
        snippetIndex = data.snippets.findIndex(s => s.trigger === trigger);
      }
      
      if (snippetIndex === -1) {
        return {
          success: false,
          message: `Snippet not found: ${snippetId || trigger}`
        };
      }
      
      const snippet = data.snippets[snippetIndex];
      data.snippets.splice(snippetIndex, 1);
      
      data.lastUpdate = new Date().toISOString();
      saveSnippets(data);
      
      return {
        success: true,
        message: `Deleted snippet "${snippet.name}"`,
        deletedSnippet: snippet
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete snippet: ${error.message}`,
        snippetId: snippetId,
        trigger: trigger
      };
    }
  },

  import_snippets: async ({ source, filePath, merge = true, conflictResolution = 'prompt' }) => {
    try {
      let importData = [];
      
      switch (source) {
        case 'json_file':
          if (!fs.existsSync(filePath)) {
            throw new Error('Import file not found');
          }
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(fileContent);
          importData = parsed.snippets || parsed; // Handle both formats
          break;
          
        case 'clipboard':
          const clipboardContent = VARIABLE_RESOLVERS.clipboard();
          try {
            const parsed = JSON.parse(clipboardContent);
            importData = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            // Treat as simple text snippet
            importData = [{
              trigger: 'imported',
              content: clipboardContent,
              name: 'Imported from Clipboard',
              category: 'imported'
            }];
          }
          break;
          
        default:
          throw new Error(`Import source "${source}" not yet implemented`);
      }
      
      const data = loadSnippets();
      
      if (!merge) {
        data.snippets = [];
      }
      
      let importedCount = 0;
      let conflictCount = 0;
      const conflicts = [];
      
      for (const item of importData) {
        if (!item.trigger || !item.content) {
          continue; // Skip invalid items
        }
        
        // Check for conflicts
        const existingIndex = data.snippets.findIndex(s => s.trigger === item.trigger);
        
        if (existingIndex !== -1) {
          conflictCount++;
          
          switch (conflictResolution) {
            case 'skip':
              continue;
            case 'replace':
              data.snippets[existingIndex] = {
                ...item,
                id: data.snippets[existingIndex].id, // Keep original ID
                created: data.snippets[existingIndex].created,
                modified: new Date().toISOString()
              };
              importedCount++;
              break;
            case 'rename':
              item.trigger = `${item.trigger}_imported`;
              // Fall through to add
            case 'prompt':
            default:
              conflicts.push({
                existing: data.snippets[existingIndex],
                imported: item
              });
              break;
          }
        } else {
          // No conflict, add new snippet
          const snippet = {
            ...item,
            id: generateId(),
            created: new Date().toISOString(),
            modified: new Date().toISOString()
          };
          
          data.snippets.push(snippet);
          importedCount++;
        }
      }
      
      data.lastUpdate = new Date().toISOString();
      saveSnippets(data);
      
      return {
        success: true,
        message: `Imported ${importedCount} snippets`,
        importedCount: importedCount,
        conflictCount: conflictCount,
        conflicts: conflicts,
        source: source
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error.message}`,
        source: source
      };
    }
  },

  export_snippets: async ({ format = 'json', filePath, category, includeUsageStats = false }) => {
    try {
      const data = loadSnippets();
      let snippets = data.snippets;
      
      // Filter by category if specified
      if (category) {
        snippets = snippets.filter(s => s.category === category);
      }
      
      // Add usage stats if requested
      if (includeUsageStats) {
        const usage = loadUsage();
        snippets = snippets.map(snippet => ({
          ...snippet,
          usageCount: usage[snippet.id]?.count || 0,
          lastUsed: usage[snippet.id]?.lastUsed || null
        }));
      }
      
      const exportPath = filePath || path.join(os.homedir(), `jarvis-snippets-${Date.now()}.${format}`);
      let content = '';
      
      switch (format) {
        case 'json':
          content = JSON.stringify({ snippets }, null, 2);
          break;
          
        case 'csv':
          content = 'Trigger,Name,Category,Content,Description,Tags\n';
          content += snippets.map(s => 
            `"${s.trigger}","${s.name}","${s.category}","${s.content.replace(/"/g, '""')}","${s.description || ''}","${(s.tags || []).join(', ')}"`
          ).join('\n');
          break;
          
        case 'txt':
          content = snippets.map(s => 
            `Trigger: ${s.trigger}\nName: ${s.name}\nCategory: ${s.category}\nContent:\n${s.content}\n\n---\n\n`
          ).join('');
          break;
          
        default:
          throw new Error(`Export format "${format}" not supported`);
      }
      
      fs.writeFileSync(exportPath, content, 'utf8');
      
      return {
        success: true,
        message: `Exported ${snippets.length} snippets`,
        filePath: exportPath,
        format: format,
        snippetCount: snippets.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Export failed: ${error.message}`,
        format: format
      };
    }
  },

  snippet_analytics: async ({ timeframe = 'week', includeRecommendations = true }) => {
    try {
      const data = loadSnippets();
      const usage = loadUsage();
      
      // Calculate date range
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
      
      // Analyze usage patterns
      const analysis = {
        totalSnippets: data.snippets.length,
        timeframe: timeframe,
        categories: {},
        mostUsed: [],
        leastUsed: [],
        averageUsage: 0,
        recommendations: []
      };
      
      // Category distribution
      data.snippets.forEach(snippet => {
        analysis.categories[snippet.category] = (analysis.categories[snippet.category] || 0) + 1;
      });
      
      // Usage analysis
      const snippetsWithUsage = data.snippets.map(snippet => ({
        ...snippet,
        usageCount: usage[snippet.id]?.count || 0,
        lastUsed: usage[snippet.id]?.lastUsed
      }));
      
      // Filter by timeframe if specified
      let filteredSnippets = snippetsWithUsage;
      if (cutoffDate) {
        filteredSnippets = snippetsWithUsage.filter(snippet => 
          snippet.lastUsed && new Date(snippet.lastUsed) >= cutoffDate
        );
      }
      
      // Most and least used
      snippetsWithUsage.sort((a, b) => b.usageCount - a.usageCount);
      analysis.mostUsed = snippetsWithUsage.slice(0, 10);
      analysis.leastUsed = snippetsWithUsage.filter(s => s.usageCount === 0).slice(0, 10);
      
      // Average usage
      if (snippetsWithUsage.length > 0) {
        analysis.averageUsage = snippetsWithUsage.reduce((sum, s) => sum + s.usageCount, 0) / snippetsWithUsage.length;
      }
      
      // Recommendations
      if (includeRecommendations) {
        // Find unused snippets
        if (analysis.leastUsed.length > 5) {
          analysis.recommendations.push({
            type: 'cleanup',
            message: `Consider removing ${analysis.leastUsed.length} unused snippets`,
            action: 'delete_unused'
          });
        }
        
        // Find long triggers
        const longTriggers = data.snippets.filter(s => s.trigger.length > 8);
        if (longTriggers.length > 0) {
          analysis.recommendations.push({
            type: 'optimization',
            message: `${longTriggers.length} snippets have long triggers that could be shortened`,
            action: 'optimize_triggers'
          });
        }
        
        // Find missing categories
        const uncategorized = data.snippets.filter(s => !s.category || s.category === 'general');
        if (uncategorized.length > data.snippets.length * 0.3) {
          analysis.recommendations.push({
            type: 'organization',
            message: 'Many snippets lack specific categories',
            action: 'categorize_snippets'
          });
        }
      }
      
      return {
        success: true,
        analysis: analysis
      };
    } catch (error) {
      return {
        success: false,
        message: `Analytics failed: ${error.message}`,
        timeframe: timeframe
      };
    }
  },

  create_snippet_template: async ({ templateType, name, fields = [] }) => {
    try {
      const templates = {
        email_signature: {
          content: `Best regards,\n{full_name}\n{job_title} | {company}\n{email} | {phone}\n{website}`,
          variables: [
            { name: 'full_name', prompt: 'Your full name:' },
            { name: 'job_title', prompt: 'Job title:' },
            { name: 'company', prompt: 'Company name:' },
            { name: 'email', prompt: 'Email address:' },
            { name: 'phone', prompt: 'Phone number:' },
            { name: 'website', prompt: 'Website URL:' }
          ]
        },
        
        meeting_template: {
          content: `# {meeting_title}\nDate: {date}\nTime: {time}\nAttendees: {attendees}\n\n## Agenda\n{agenda_items}\n\n## Notes\n{cursor}\n\n## Action Items\n- [ ] \n\n## Next Steps`,
          variables: [
            { name: 'meeting_title', prompt: 'Meeting title:' },
            { name: 'attendees', prompt: 'Attendees:' },
            { name: 'agenda_items', prompt: 'Agenda items:' }
          ]
        },
        
        code_boilerplate: {
          content: `// {description}\n// Created: {date}\n// Author: {author}\n\n{cursor}`,
          variables: [
            { name: 'description', prompt: 'Code description:' },
            { name: 'author', prompt: 'Author name:', defaultValue: os.userInfo().username }
          ]
        }
      };
      
      let template;
      if (templateType === 'custom') {
        // Build custom template from fields
        const content = fields.map(field => `{${field.name}}`).join('\n');
        template = { content, variables: fields };
      } else {
        template = templates[templateType];
        if (!template) {
          throw new Error(`Unknown template type: ${templateType}`);
        }
      }
      
      // Create the snippet
      const result = await tools.create_snippet({
        trigger: name.toLowerCase().replace(/\s+/g, '_'),
        content: template.content,
        name: name,
        description: `Template: ${templateType}`,
        category: 'template',
        variables: template.variables,
        tags: ['template', templateType]
      });
      
      return {
        success: result.success,
        message: result.success ? `Created template "${name}"` : result.message,
        template: template,
        snippet: result.snippet
      };
    } catch (error) {
      return {
        success: false,
        message: `Template creation failed: ${error.message}`,
        templateType: templateType
      };
    }
  },

  suggest_snippets: async ({ context = 'general', currentApp, textContext, limit = 5 }) => {
    try {
      const data = loadSnippets();
      const usage = loadUsage();
      
      let suggestions = data.snippets.map(snippet => ({
        ...snippet,
        usageCount: usage[snippet.id]?.count || 0,
        relevanceScore: 0
      }));
      
      // Score based on context
      suggestions.forEach(snippet => {
        let score = 0;
        
        // Usage frequency
        score += Math.min(snippet.usageCount * 2, 20);
        
        // Context matching
        if (context !== 'general') {
          if (snippet.category === context) {
            score += 15;
          }
          if (snippet.tags && snippet.tags.includes(context)) {
            score += 10;
          }
        }
        
        // App compatibility
        if (currentApp) {
          if (!snippet.appScope || snippet.appScope.length === 0 || 
              snippet.appScope.includes(currentApp)) {
            score += 5;
          } else {
            score -= 10; // Penalize incompatible snippets
          }
        }
        
        // Text context matching
        if (textContext) {
          const contextWords = textContext.toLowerCase().split(/\s+/);
          const snippetWords = `${snippet.name} ${snippet.description} ${snippet.content}`.toLowerCase();
          
          contextWords.forEach(word => {
            if (snippetWords.includes(word)) {
              score += 3;
            }
          });
        }
        
        // Recency boost
        if (usage[snippet.id]?.lastUsed) {
          const daysSinceUse = (Date.now() - new Date(usage[snippet.id].lastUsed).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceUse < 7) {
            score += Math.max(5 - daysSinceUse, 0);
          }
        }
        
        snippet.relevanceScore = score;
      });
      
      // Sort by relevance score
      suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Filter out zero-score suggestions and limit
      suggestions = suggestions.filter(s => s.relevanceScore > 0).slice(0, limit);
      
      return {
        success: true,
        suggestions: suggestions,
        context: context,
        currentApp: currentApp,
        total: suggestions.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Suggestion failed: ${error.message}`,
        context: context
      };
    }
  },

  setup_auto_expansion: async ({ action = 'status', triggerPrefix, expandDelay = 500, excludeApps = [] }) => {
    try {
      // This would integrate with system text replacement in production
      switch (action) {
        case 'enable':
          return {
            success: true,
            message: 'Auto-expansion enabled (mock implementation)',
            settings: {
              enabled: true,
              triggerPrefix: triggerPrefix || TRIGGER_PREFIX,
              expandDelay: expandDelay,
              excludeApps: excludeApps
            }
          };
          
        case 'disable':
          return {
            success: true,
            message: 'Auto-expansion disabled',
            settings: { enabled: false }
          };
          
        case 'status':
          return {
            success: true,
            enabled: AUTO_EXPAND,
            settings: {
              enabled: AUTO_EXPAND,
              triggerPrefix: TRIGGER_PREFIX,
              expandDelay: 500,
              excludeApps: []
            }
          };
          
        case 'configure':
          return {
            success: true,
            message: 'Auto-expansion configured',
            settings: {
              enabled: true,
              triggerPrefix: triggerPrefix || TRIGGER_PREFIX,
              expandDelay: expandDelay,
              excludeApps: excludeApps
            }
          };
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Auto-expansion setup failed: ${error.message}`,
        action: action
      };
    }
  }
};

module.exports = { tools };