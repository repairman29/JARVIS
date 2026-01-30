# JARVIS File Search Skill

Intelligent file discovery system that surpasses Raycast and macOS Spotlight with AI-powered search, content indexing, and smart suggestions.

## Features

### Core Search Capabilities
- **Lightning-Fast Indexing**: Incremental indexing with smart caching
- **Fuzzy Search**: Intelligent name and path matching with relevance scoring
- **Content Search**: Full-text search within files (grep-like functionality)
- **Category Filtering**: Smart file type categorization and filtering
- **Recent Files**: Track and search recently accessed/modified files

### Advanced Features
- **Smart Suggestions**: Context-aware file recommendations
- **Duplicate Detection**: Find duplicate files by content hash, name, or size
- **Usage Tracking**: Learn from your file access patterns
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Git Integration**: Project-aware file discovery

### File Operations
- **Quick Actions**: Open, reveal, copy path, preview, rename, delete
- **App Integration**: Open files with specific applications
- **Bulk Operations**: Process multiple search results at once

## Installation

### 1. Copy Skill
```bash
cp -r skills/file-search ~/jarvis/skills/
```

### 2. Environment Configuration (Optional)

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
# Search paths (comma-separated)
export JARVIS_FILE_SEARCH_PATHS="/Users/you/Documents,/Users/you/Projects,/Users/you/Desktop,/Users/you/Downloads"

# Exclude patterns (comma-separated)
export JARVIS_FILE_SEARCH_EXCLUDE="node_modules,.git,.svn,.DS_Store,*.tmp,*.log,Thumbs.db,.cache,build,dist"
```

### 3. Update JARVIS Configuration

Add to `~/jarvis/TOOLS.md`:

```markdown
## File Search

**Skill:** `file-search` (installed). Intelligent file discovery and content search.

| Tool | When to use |
|------|-------------|
| `search_files` | "find my React project", "search for PDF about taxes" |
| `recent_files` | "what did I work on yesterday?", "show recent images" |
| `file_operations` | "open that file", "copy file path", "preview document" |
| `search_content` | "find files containing API key", "search code for useEffect" |
| `find_duplicates` | "find duplicate photos", "show duplicate downloads" |
| `smart_suggestions` | Context-aware file recommendations |
```

### 4. Restart JARVIS
```bash
clawdbot gateway restart
```

### 5. Initial Setup

JARVIS will automatically index your files on first use, or you can manually trigger indexing:

**Via JARVIS**: *"Index my files"* or *"Refresh file search"*

## Usage Examples

### Basic File Search
- **"Find my React project files"**
- **"Search for budget spreadsheet"**  
- **"Where's that PDF about machine learning?"**
- **"Show me all Python files"**

### Content Search
- **"Find files containing 'API key'"**
- **"Search my code for useEffect"**
- **"What files mention Docker?"**
- **"Find TODO comments in my project"**

### Recent Files
- **"What did I work on yesterday?"**
- **"Show me recent PDFs"**
- **"Files I opened this morning"**
- **"Recently modified code files"**

### Smart Operations
- **"Find that design file and open it in Figma"**
- **"Show duplicates in Downloads and delete older copies"**
- **"Find my presentation and copy its path"**

### Advanced Queries
- **"Find large video files in Downloads"**
- **"Show recently modified images"**
- **"Find configuration files in my projects"**
- **"Search for files similar to 'project-notes'"**

## Natural Language Understanding

### Context-Aware Search
- **"My current project files"** → Uses git context + recent files
- **"Documentation for this app"** → Finds README, docs in current project
- **"That thing I was working on"** → Searches recent files with fuzzy matching

### Smart File Type Detection
- **"spreadsheets"** → .xls, .xlsx, .numbers, .csv files
- **"images"** → .jpg, .png, .gif, .svg, etc.
- **"code files"** → .js, .py, .java, .cpp, etc.
- **"documents"** → .pdf, .doc, .txt, .md, etc.

### Intelligent Operations
- **"Open the latest version"** → Finds most recent file matching criteria
- **"Show me similar files"** → Fuzzy name matching + same directory
- **"Find the original"** → Excludes copies, backups, duplicates

## Performance Features

### Smart Indexing
- **Incremental Updates**: Only indexes changed files
- **Background Processing**: Non-blocking indexing
- **Memory Efficient**: Optimized for large file collections
- **Selective Content**: Only indexes text files for content search

### Fast Search
- **In-Memory Caching**: Frequently accessed results cached
- **Relevance Scoring**: Smart ranking algorithm
- **Type-Ahead**: Results update as you type
- **Result Limiting**: Configurable result counts

### Storage Optimization
- **Compressed Index**: Efficient storage format
- **Cleanup Tasks**: Removes stale entries automatically
- **Usage Analytics**: Learns from your patterns without privacy invasion

## Configuration

### Default Search Paths
- `~/Documents`
- `~/Desktop`
- `~/Downloads`
- `~/Projects` (if exists)

### Default Exclusions
- `node_modules`, `.git`, `.svn`
- `.DS_Store`, `*.tmp`, `*.log`
- `Thumbs.db`, `.cache`, `build`, `dist`

### File Categories
- **Documents**: PDF, Word, Pages, text files
- **Spreadsheets**: Excel, Numbers, CSV
- **Presentations**: PowerPoint, Keynote
- **Images**: JPG, PNG, GIF, SVG, PSD, Sketch
- **Videos**: MP4, MOV, AVI, MKV
- **Audio**: MP3, WAV, AAC, FLAC
- **Code**: JS, Python, Java, C++, Swift, Go
- **Archives**: ZIP, TAR, RAR, 7Z

## Integration Examples

### With Launcher Skill
- **"Find VS Code project and launch it"**
- **"Open the folder containing my React app"**

### With Window Manager
- **"Find design files and arrange Figma windows"**
- **"Open project files in split screen"**

### With AI Workflow
- **"Set up coding environment for React project"**
- **"Prepare presentation mode with supporting files"**

## Troubleshooting

### Common Issues

**Slow Search Performance**:
- Reduce search paths to essential directories
- Increase exclusion patterns for large directories
- Disable content search for large file collections

**Missing Files in Results**:
- Check if files are in configured search paths
- Verify exclusion patterns aren't too broad
- Manually trigger re-indexing: *"refresh file index"*

**High Memory Usage**:
- Reduce content indexing scope
- Clear old usage tracking data
- Restart JARVIS to reset caches

### Optimization Tips

1. **Configure specific search paths** rather than indexing entire home directory
2. **Use content search selectively** for specific file types
3. **Regular cleanup** of Downloads and Desktop folders
4. **Project-based organization** for better search relevance

## Security & Privacy

### Local-First Architecture
- **No Cloud Data**: All indexing and search data stored locally
- **No Network Calls**: Search operates entirely offline
- **Encrypted Storage**: Index files can be encrypted (optional)

### Privacy Protection
- **No Content Storage**: Only metadata and file paths indexed
- **Usage Analytics**: Anonymous usage patterns, no personal data
- **Permissions**: Respects system file permissions and access controls

### Data Management
- **Clear Data**: `rm -rf ~/.jarvis/file-index` to reset
- **Export Settings**: Index configuration can be backed up/restored
- **Selective Indexing**: Control exactly what gets indexed

## Comparison with Alternatives

| Feature | macOS Spotlight | Raycast | JARVIS File Search |
|---------|----------------|---------|-------------------|
| **Speed** | Fast | Fast | Lightning fast |
| **Content Search** | Basic | Limited | Advanced with context |
| **Customization** | Minimal | Some | Extensive |
| **File Operations** | Basic | Good | Comprehensive |
| **Smart Suggestions** | None | Basic | AI-powered |
| **Duplicate Detection** | None | None | Advanced |
| **Usage Learning** | None | Basic | Intelligent |
| **Cross-Platform** | macOS only | macOS/Windows | macOS/Windows/Linux |
| **Integration** | System only | Limited | Full JARVIS ecosystem |

This skill transforms JARVIS into the most powerful file search system available, combining speed, intelligence, and seamless workflow integration.