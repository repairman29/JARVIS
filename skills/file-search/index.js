const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// File search configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const INDEX_DIR = path.join(JARVIS_DIR, 'file-index');
const INDEX_FILE = path.join(INDEX_DIR, 'files.json');
const USAGE_FILE = path.join(INDEX_DIR, 'usage.json');
const RECENT_FILE = path.join(INDEX_DIR, 'recent.json');

// Default search paths
const DEFAULT_SEARCH_PATHS = [
  path.join(os.homedir(), 'Documents'),
  path.join(os.homedir(), 'Desktop'), 
  path.join(os.homedir(), 'Downloads'),
  path.join(os.homedir(), 'Projects')
].filter(p => fs.existsSync(p));

// Default exclude patterns
const DEFAULT_EXCLUDE = [
  'node_modules', '.git', '.svn', '.DS_Store', '*.tmp', '*.log', 
  'Thumbs.db', '.cache', '.npm', '.yarn', 'build', 'dist'
];

// File type categories
const FILE_CATEGORIES = {
  document: ['.pdf', '.doc', '.docx', '.pages', '.txt', '.rtf', '.md'],
  spreadsheet: ['.xls', '.xlsx', '.numbers', '.csv'],
  presentation: ['.ppt', '.pptx', '.key'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.psd', '.sketch', '.fig', '.webp', '.heic'],
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'],
  audio: ['.mp3', '.wav', '.aac', '.flac', '.m4a', '.ogg'],
  code: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.swift', '.go', '.rs', '.php', '.rb', '.scala', '.kt'],
  archive: ['.zip', '.tar', '.gz', '.rar', '.7z', '.bz2'],
  text: ['.txt', '.md', '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg']
};

// Helper functions
function ensureDirectories() {
  if (!fs.existsSync(JARVIS_DIR)) {
    fs.mkdirSync(JARVIS_DIR, { recursive: true });
  }
  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
  }
}

function getSearchPaths() {
  const envPaths = process.env.JARVIS_FILE_SEARCH_PATHS;
  if (envPaths) {
    return envPaths.split(',').map(p => p.trim()).filter(p => fs.existsSync(p));
  }
  return DEFAULT_SEARCH_PATHS;
}

function getExcludePatterns() {
  const envExclude = process.env.JARVIS_FILE_SEARCH_EXCLUDE;
  if (envExclude) {
    return envExclude.split(',').map(p => p.trim());
  }
  return DEFAULT_EXCLUDE;
}

function getFileCategory(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }
  return 'other';
}

function shouldExcludeFile(filePath, excludePatterns) {
  const basename = path.basename(filePath);
  const dirname = path.dirname(filePath);
  
  return excludePatterns.some(pattern => {
    // Simple glob pattern matching
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(basename);
    }
    // Directory name matching
    return basename === pattern || dirname.includes(pattern);
  });
}

function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      ext: path.extname(filePath),
      size: stats.size,
      modified: stats.mtime,
      accessed: stats.atime,
      created: stats.birthtime,
      isDirectory: stats.isDirectory(),
      category: getFileCategory(filePath)
    };
  } catch (error) {
    return null;
  }
}

function fuzzyMatch(query, text, threshold = 0.3) {
  query = query.toLowerCase();
  text = text.toLowerCase();
  
  // Exact match gets highest score
  if (text.includes(query)) {
    return 1.0;
  }
  
  // Simple fuzzy matching algorithm
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      score += 1;
      queryIndex++;
    }
  }
  
  const matchRatio = queryIndex / query.length;
  const lengthRatio = query.length / text.length;
  
  return matchRatio > threshold ? matchRatio * lengthRatio : 0;
}

function searchInContent(filePath, query, options = {}) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 1024 * 1024) return null; // Skip files > 1MB
    
    const ext = path.extname(filePath).toLowerCase();
    const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.json', '.xml', '.yaml', '.yml', '.css', '.html', '.htm'];
    
    if (!textExtensions.includes(ext)) return null;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const matches = [];
    
    const searchRegex = options.regex 
      ? new RegExp(query, options.caseSensitive ? 'g' : 'gi')
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.caseSensitive ? 'g' : 'gi');
    
    lines.forEach((line, index) => {
      if (searchRegex.test(line)) {
        const contextStart = Math.max(0, index - (options.contextLines || 2));
        const contextEnd = Math.min(lines.length, index + (options.contextLines || 2) + 1);
        
        matches.push({
          lineNumber: index + 1,
          line: line,
          context: lines.slice(contextStart, contextEnd)
        });
      }
    });
    
    return matches.length > 0 ? matches : null;
  } catch (error) {
    return null;
  }
}

async function indexDirectory(dirPath, excludePatterns, includeContent = false) {
  const files = [];
  
  function walkDirectory(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        
        if (shouldExcludeFile(fullPath, excludePatterns)) {
          continue;
        }
        
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          walkDirectory(fullPath);
        } else {
          const fileInfo = getFileInfo(fullPath);
          if (fileInfo) {
            files.push(fileInfo);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  walkDirectory(dirPath);
  return files;
}

function loadIndex() {
  try {
    if (fs.existsSync(INDEX_FILE)) {
      return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    }
  } catch (error) {
    // Return empty index on error
  }
  return { files: [], lastUpdate: null };
}

function saveIndex(index) {
  try {
    ensureDirectories();
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  } catch (error) {
    console.error('Failed to save index:', error.message);
  }
}

function trackFileUsage(filePath, action = 'accessed') {
  try {
    ensureDirectories();
    let usage = {};
    if (fs.existsSync(USAGE_FILE)) {
      usage = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    }
    
    if (!usage[filePath]) {
      usage[filePath] = { count: 0, lastAccessed: null, actions: [] };
    }
    
    usage[filePath].count++;
    usage[filePath].lastAccessed = new Date().toISOString();
    usage[filePath].actions.push({ action, timestamp: new Date().toISOString() });
    
    // Keep only last 50 actions per file
    usage[filePath].actions = usage[filePath].actions.slice(-50);
    
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
  } catch (error) {
    // Silently fail usage tracking
  }
}

function trackRecentFile(filePath, action = 'accessed') {
  try {
    ensureDirectories();
    let recent = [];
    if (fs.existsSync(RECENT_FILE)) {
      recent = JSON.parse(fs.readFileSync(RECENT_FILE, 'utf8'));
    }
    
    // Remove existing entry for this file
    recent = recent.filter(item => item.path !== filePath);
    
    // Add to beginning
    recent.unshift({
      path: filePath,
      action: action,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 recent files
    recent = recent.slice(0, 1000);
    
    fs.writeFileSync(RECENT_FILE, JSON.stringify(recent, null, 2));
  } catch (error) {
    // Silently fail recent tracking
  }
}

// Tool implementations
const tools = {
  search_files: async ({ query, type = 'all', limit = 20, includeContent = false, sortBy = 'relevance', directory }) => {
    try {
      let index = loadIndex();
      
      // If index is empty or old, trigger indexing
      if (!index.files || index.files.length === 0 || 
          !index.lastUpdate || Date.now() - new Date(index.lastUpdate).getTime() > 24 * 60 * 60 * 1000) {
        await tools.index_files({ includeContent: false });
        index = loadIndex();
      }
      
      let files = index.files;
      
      // Filter by directory if specified
      if (directory) {
        const normalizedDir = path.resolve(directory);
        files = files.filter(file => file.path.startsWith(normalizedDir));
      }
      
      // Filter by type
      if (type !== 'all') {
        files = files.filter(file => file.category === type);
      }
      
      // Search and score files
      const results = files.map(file => {
        let score = 0;
        
        // Name matching (highest weight)
        const nameScore = fuzzyMatch(query, file.name);
        score += nameScore * 10;
        
        // Path matching
        const pathScore = fuzzyMatch(query, file.path);
        score += pathScore * 5;
        
        // Extension matching
        if (query.startsWith('.') && file.ext === query) {
          score += 15;
        }
        
        return {
          ...file,
          score: score,
          relevance: nameScore > 0 ? 'high' : pathScore > 0 ? 'medium' : 'low'
        };
      }).filter(file => file.score > 0);
      
      // Sort results
      results.sort((a, b) => {
        switch (sortBy) {
          case 'relevance':
            return b.score - a.score;
          case 'modified':
            return new Date(b.modified) - new Date(a.modified);
          case 'size':
            return b.size - a.size;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'accessed':
            return new Date(b.accessed) - new Date(a.accessed);
          default:
            return b.score - a.score;
        }
      });
      
      const limitedResults = results.slice(0, limit);
      
      return {
        success: true,
        results: limitedResults,
        total: results.length,
        query: query,
        type: type,
        sortBy: sortBy
      };
    } catch (error) {
      return {
        success: false,
        message: `File search failed: ${error.message}`,
        query: query
      };
    }
  },

  recent_files: async ({ type = 'accessed', limit = 20, hours = 24, fileTypes }) => {
    try {
      ensureDirectories();
      let recent = [];
      
      if (fs.existsSync(RECENT_FILE)) {
        recent = JSON.parse(fs.readFileSync(RECENT_FILE, 'utf8'));
      }
      
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      // Filter by time and type
      const filtered = recent.filter(item => {
        const itemTime = new Date(item.timestamp);
        if (itemTime < cutoffTime) return false;
        
        if (type !== 'all' && item.action !== type) return false;
        
        if (fileTypes && fileTypes.length > 0) {
          const ext = path.extname(item.path).toLowerCase().replace('.', '');
          if (!fileTypes.includes(ext)) return false;
        }
        
        // Verify file still exists
        return fs.existsSync(item.path);
      });
      
      // Add file info
      const results = filtered.slice(0, limit).map(item => {
        const fileInfo = getFileInfo(item.path);
        return {
          ...fileInfo,
          recentAction: item.action,
          recentTimestamp: item.timestamp
        };
      }).filter(Boolean);
      
      return {
        success: true,
        results: results,
        total: filtered.length,
        type: type,
        hours: hours
      };
    } catch (error) {
      return {
        success: false,
        message: `Recent files query failed: ${error.message}`,
        type: type
      };
    }
  },

  file_operations: async ({ action, filePath, openWith, newName }) => {
    try {
      const normalizedPath = path.resolve(filePath);
      
      if (!fs.existsSync(normalizedPath)) {
        throw new Error(`File not found: ${normalizedPath}`);
      }
      
      trackFileUsage(normalizedPath, action);
      trackRecentFile(normalizedPath, action);
      
      let result = {};
      
      switch (action) {
        case 'open':
          if (process.platform === 'darwin') {
            const command = openWith 
              ? `open -a "${openWith}" "${normalizedPath}"`
              : `open "${normalizedPath}"`;
            execSync(command);
          } else {
            // Cross-platform open (would need more implementation)
            throw new Error('Open not implemented for this platform');
          }
          result.message = `Opened ${path.basename(normalizedPath)}${openWith ? ` with ${openWith}` : ''}`;
          break;
          
        case 'reveal':
          if (process.platform === 'darwin') {
            execSync(`open -R "${normalizedPath}"`);
          } else {
            throw new Error('Reveal not implemented for this platform');
          }
          result.message = `Revealed ${path.basename(normalizedPath)} in Finder`;
          break;
          
        case 'copy_path':
          if (process.platform === 'darwin') {
            execSync(`echo '${normalizedPath}' | pbcopy`);
          } else {
            throw new Error('Copy path not implemented for this platform');
          }
          result.message = `Copied path to clipboard: ${normalizedPath}`;
          result.path = normalizedPath;
          break;
          
        case 'info':
          const stats = fs.statSync(normalizedPath);
          result = {
            path: normalizedPath,
            size: stats.size,
            sizeFormatted: `${Math.round(stats.size / 1024)} KB`,
            modified: stats.mtime,
            accessed: stats.atime,
            created: stats.birthtime,
            permissions: stats.mode,
            isDirectory: stats.isDirectory()
          };
          break;
          
        case 'preview':
          if (process.platform === 'darwin') {
            execSync(`qlmanage -p "${normalizedPath}" >/dev/null 2>&1 &`);
          }
          result.message = `Previewing ${path.basename(normalizedPath)}`;
          break;
          
        case 'delete':
          fs.unlinkSync(normalizedPath);
          result.message = `Deleted ${path.basename(normalizedPath)}`;
          break;
          
        case 'duplicate':
          const ext = path.extname(normalizedPath);
          const basename = path.basename(normalizedPath, ext);
          const dirname = path.dirname(normalizedPath);
          const duplicatePath = path.join(dirname, `${basename} copy${ext}`);
          
          fs.copyFileSync(normalizedPath, duplicatePath);
          result.message = `Created duplicate: ${path.basename(duplicatePath)}`;
          result.newPath = duplicatePath;
          break;
          
        case 'rename':
          if (!newName) {
            throw new Error('New name required for rename operation');
          }
          const newPath = path.join(path.dirname(normalizedPath), newName);
          fs.renameSync(normalizedPath, newPath);
          result.message = `Renamed to ${newName}`;
          result.newPath = newPath;
          break;
          
        default:
          throw new Error(`Unknown file operation: ${action}`);
      }
      
      return {
        success: true,
        action: action,
        filePath: normalizedPath,
        ...result
      };
    } catch (error) {
      return {
        success: false,
        message: `File operation failed: ${error.message}`,
        action: action,
        filePath: filePath
      };
    }
  },

  index_files: async ({ directories, includeContent = true, force = false }) => {
    try {
      ensureDirectories();
      
      const searchPaths = directories && directories.length > 0 ? directories : getSearchPaths();
      const excludePatterns = getExcludePatterns();
      
      let allFiles = [];
      
      for (const searchPath of searchPaths) {
        if (fs.existsSync(searchPath)) {
          const files = await indexDirectory(searchPath, excludePatterns, includeContent);
          allFiles = allFiles.concat(files);
        }
      }
      
      const index = {
        files: allFiles,
        lastUpdate: new Date().toISOString(),
        searchPaths: searchPaths,
        excludePatterns: excludePatterns,
        includeContent: includeContent
      };
      
      saveIndex(index);
      
      return {
        success: true,
        message: `Indexed ${allFiles.length} files from ${searchPaths.length} directories`,
        fileCount: allFiles.length,
        directories: searchPaths.length,
        lastUpdate: index.lastUpdate
      };
    } catch (error) {
      return {
        success: false,
        message: `File indexing failed: ${error.message}`
      };
    }
  },

  search_content: async ({ query, directory, fileTypes, caseSensitive = false, regex = false, contextLines = 2 }) => {
    try {
      const searchDir = directory || process.cwd();
      const results = [];
      
      function searchDirectory(dir) {
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              if (!shouldExcludeFile(fullPath, getExcludePatterns())) {
                searchDirectory(fullPath);
              }
            } else {
              if (fileTypes && fileTypes.length > 0) {
                const ext = path.extname(fullPath).toLowerCase().replace('.', '');
                if (!fileTypes.includes(ext)) continue;
              }
              
              const matches = searchInContent(fullPath, query, { 
                caseSensitive, 
                regex, 
                contextLines 
              });
              
              if (matches) {
                results.push({
                  file: fullPath,
                  matches: matches,
                  matchCount: matches.length
                });
              }
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      }
      
      searchDirectory(searchDir);
      
      return {
        success: true,
        results: results,
        totalFiles: results.length,
        totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
        query: query,
        directory: searchDir
      };
    } catch (error) {
      return {
        success: false,
        message: `Content search failed: ${error.message}`,
        query: query
      };
    }
  },

  find_duplicates: async ({ method = 'hash', directory, minSize, extensions }) => {
    try {
      const searchDir = directory || os.homedir();
      const files = [];
      const duplicates = [];
      
      // Collect files
      function collectFiles(dir) {
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              if (!shouldExcludeFile(fullPath, getExcludePatterns())) {
                collectFiles(fullPath);
              }
            } else {
              if (minSize && stats.size < minSize) continue;
              
              if (extensions && extensions.length > 0) {
                const ext = path.extname(fullPath).toLowerCase().replace('.', '');
                if (!extensions.includes(ext)) continue;
              }
              
              files.push({
                path: fullPath,
                name: path.basename(fullPath),
                size: stats.size,
                modified: stats.mtime
              });
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      }
      
      collectFiles(searchDir);
      
      // Find duplicates based on method
      const groupBy = {};
      
      for (const file of files) {
        let key;
        
        switch (method) {
          case 'hash':
            key = getFileHash(file.path);
            break;
          case 'name':
            key = file.name;
            break;
          case 'size':
            key = file.size.toString();
            break;
          case 'fuzzy_name':
            key = file.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            break;
          default:
            key = file.name;
        }
        
        if (key) {
          if (!groupBy[key]) {
            groupBy[key] = [];
          }
          groupBy[key].push(file);
        }
      }
      
      // Extract duplicate groups
      for (const [key, group] of Object.entries(groupBy)) {
        if (group.length > 1) {
          duplicates.push({
            key: key,
            method: method,
            files: group,
            count: group.length,
            totalSize: group.reduce((sum, f) => sum + f.size, 0)
          });
        }
      }
      
      // Sort by total size (largest first)
      duplicates.sort((a, b) => b.totalSize - a.totalSize);
      
      return {
        success: true,
        duplicates: duplicates,
        totalGroups: duplicates.length,
        totalFiles: duplicates.reduce((sum, d) => sum + d.count, 0),
        method: method,
        directory: searchDir
      };
    } catch (error) {
      return {
        success: false,
        message: `Duplicate search failed: ${error.message}`,
        method: method
      };
    }
  },

  smart_suggestions: async ({ context = 'general', limit = 10 }) => {
    try {
      // This would be enhanced with ML in production
      const suggestions = [];
      
      // Get recent files as base suggestions
      const recentResult = await tools.recent_files({ limit: limit * 2 });
      if (recentResult.success) {
        suggestions.push(...recentResult.results.map(f => ({
          ...f,
          reason: 'recently_accessed',
          score: 10
        })));
      }
      
      // Add context-specific suggestions
      const contextBoosts = {
        coding: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java'],
        writing: ['.md', '.txt', '.doc', '.docx'],
        designing: ['.fig', '.sketch', '.psd', '.ai']
      };
      
      if (contextBoosts[context]) {
        const index = loadIndex();
        const contextFiles = index.files.filter(f => 
          contextBoosts[context].includes(f.ext)
        ).slice(0, 5);
        
        suggestions.push(...contextFiles.map(f => ({
          ...f,
          reason: `${context}_context`,
          score: 8
        })));
      }
      
      // Remove duplicates and sort by score
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
        index === self.findIndex(s => s.path === suggestion.path)
      );
      
      uniqueSuggestions.sort((a, b) => b.score - a.score);
      
      return {
        success: true,
        suggestions: uniqueSuggestions.slice(0, limit),
        context: context,
        total: uniqueSuggestions.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Smart suggestions failed: ${error.message}`,
        context: context
      };
    }
  },

  get_index_stats: async () => {
    try {
      ensureDirectories();
      const index = loadIndex();
      
      const stats = {
        totalFiles: index.files ? index.files.length : 0,
        lastUpdate: index.lastUpdate,
        searchPaths: index.searchPaths || [],
        excludePatterns: index.excludePatterns || [],
        categories: {}
      };
      
      // Count files by category
      if (index.files) {
        for (const file of index.files) {
          stats.categories[file.category] = (stats.categories[file.category] || 0) + 1;
        }
      }
      
      // Get usage stats
      if (fs.existsSync(USAGE_FILE)) {
        const usage = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
        stats.trackedFiles = Object.keys(usage).length;
        stats.totalAccesses = Object.values(usage).reduce((sum, u) => sum + u.count, 0);
      }
      
      // Get recent files count
      if (fs.existsSync(RECENT_FILE)) {
        const recent = JSON.parse(fs.readFileSync(RECENT_FILE, 'utf8'));
        stats.recentFiles = recent.length;
      }
      
      return {
        success: true,
        stats: stats
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get index stats: ${error.message}`
      };
    }
  }
};

module.exports = { tools };