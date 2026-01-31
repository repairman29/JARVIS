# File Search — Intelligent File Discovery

Use this skill for **finding files**, **content search**, **recent file access**, and **smart file operations**. Provides lightning-fast search that surpasses Raycast's file search with AI-powered suggestions and content indexing.

## Setup

1. Install the skill: `clawdbot skills install ./skills/file-search` or copy to `~/jarvis/skills/file-search`.
2. **Environment variables** (optional):
   - `JARVIS_FILE_SEARCH_PATHS` - Comma-separated paths to index (e.g., "/Users/you/Documents,/Users/you/Projects")
   - `JARVIS_FILE_SEARCH_EXCLUDE` - Patterns to exclude (e.g., "node_modules,.git,.DS_Store")
3. **Initial indexing**: JARVIS will automatically index your files on first use
4. Restart gateway: `clawdbot gateway restart`

## When to use

- **Find files**: "find my React project", "search for the budget spreadsheet", "where's that design file?"
- **Content search**: "find files containing 'API key'", "search code for 'useEffect'", "what files mention Python?"
- **Recent files**: "what did I work on yesterday?", "show recent PDFs", "files I opened this morning"
- **File operations**: "open that file", "reveal in Finder", "copy file path", "preview this document"
- **Duplicate finder**: "find duplicate images", "show duplicate files in Downloads"

## Tools

| Tool | Use for |
|------|---------|
| `search_files` | Primary file search by name, path, type, or metadata |
| `recent_files` | Recently accessed, modified, or opened files |
| `file_operations` | Open, reveal, copy path, preview, rename, delete files |
| `search_content` | Search text within files (grep-like functionality) |
| `find_duplicates` | Locate duplicate files by hash, name, or size |
| `smart_suggestions` | Context-aware file suggestions based on usage patterns |
| `index_files` | Manually trigger or refresh file indexing |
| `get_index_stats` | View indexing statistics and health |

## Examples

### File Search by Name
- **"Find my React project files"** → `search_files({ query: "React project", type: "code" })`
- **"Search for budget spreadsheets"** → `search_files({ query: "budget", type: "spreadsheet" })`
- **"Where's that PDF about machine learning?"** → `search_files({ query: "machine learning", type: "pdf" })`
- **"Show me all Python files in my projects folder"** → `search_files({ query: "*.py", directory: "~/projects" })`

### Content Search
- **"Find files containing 'API key'"** → `search_content({ query: "API key", fileTypes: ["js", "py", "md"] })`
- **"Search my code for useEffect"** → `search_content({ query: "useEffect", directory: "~/projects", fileTypes: ["js", "jsx", "ts", "tsx"] })`
- **"What files mention Docker?"** → `search_content({ query: "Docker", fileTypes: ["md", "txt", "yaml", "yml"] })`

### Recent Files
- **"What did I work on yesterday?"** → `recent_files({ type: "modified", hours: 24 })`
- **"Show me recent PDFs"** → `recent_files({ fileTypes: ["pdf"], hours: 48 })`
- **"Files I opened this morning"** → `recent_files({ type: "accessed", hours: 8 })`
- **"Recently modified code files"** → `recent_files({ type: "modified", fileTypes: ["js", "py", "java", "cpp"] })`

### File Operations  
- **"Open that design file in Figma"** → `file_operations({ action: "open", filePath: "/path/to/design.fig", openWith: "Figma" })`
- **"Reveal the project folder"** → `file_operations({ action: "reveal", filePath: "/path/to/project" })`
- **"Copy the path to that config file"** → `file_operations({ action: "copy_path", filePath: "/path/to/config.json" })`
- **"Preview this document"** → `file_operations({ action: "preview", filePath: "/path/to/doc.pdf" })`

### Advanced Search
- **"Find large video files in Downloads"** → `search_files({ query: "*", type: "video", directory: "~/Downloads", sortBy: "size" })`
- **"Show recently modified images"** → `search_files({ type: "image", sortBy: "modified", limit: 10 })`
- **"Find my presentation files"** → `search_files({ query: "presentation", type: "presentation" })`

### Duplicate Management
- **"Find duplicate photos in my Pictures folder"** → `find_duplicates({ method: "hash", directory: "~/Pictures", extensions: ["jpg", "png", "heic"] })`
- **"Show duplicate downloads"** → `find_duplicates({ method: "name", directory: "~/Downloads" })`
- **"Find files with similar names"** → `find_duplicates({ method: "fuzzy_name", directory: "~/Documents" })`

## Smart Features

### Intelligent File Categorization
Files are automatically categorized:
- **Documents**: .pdf, .doc, .docx, .pages, .txt, .rtf
- **Spreadsheets**: .xls, .xlsx, .numbers, .csv
- **Presentations**: .ppt, .pptx, .key
- **Images**: .jpg, .png, .gif, .svg, .psd, .sketch
- **Videos**: .mp4, .mov, .avi, .mkv, .webm
- **Audio**: .mp3, .wav, .aac, .flac, .m4a
- **Code**: .js, .py, .java, .cpp, .swift, .go, .rs, .php
- **Archives**: .zip, .tar, .gz, .rar, .7z

### Smart Search Algorithm
1. **Exact name matches** get highest priority
2. **Partial name matches** with fuzzy matching
3. **Path component matches** (folder names)
4. **Content matches** (when enabled)
5. **Usage frequency** boosts relevant files
6. **Recent access** increases relevance

### Context-Aware Suggestions
- **Morning**: Recently accessed work files
- **Coding context**: Project files, documentation, recent commits
- **Writing context**: Documents, research files, templates
- **Design context**: Design files, assets, inspiration folders

### Performance Optimizations
- **Incremental indexing**: Only indexes changed files
- **Smart caching**: Frequently accessed files cached in memory
- **Background processing**: Indexing doesn't block search
- **Selective content indexing**: Only indexes text-based files for content

## Natural Language Intelligence

JARVIS understands complex file search requests:

### Fuzzy Understanding
- **"That React thing I was working on"** → Finds React projects in recently accessed files
- **"The PDF about taxes"** → Content search + PDF filter + tax-related terms
- **"Images from last week's meeting"** → Image files modified in date range

### Contextual Search
- **"My current project files"** → Uses git context + recent files + active directory
- **"Documentation for this app"** → Finds README, docs, wiki files in current project
- **"Config files I need to update"** → Finds configuration files in active projects

### Multi-Step Queries
- **"Find my Python scripts and open the most recent one"** → Search + sort + file operation
- **"Show duplicates in Downloads and delete the older copies"** → Duplicate detection + smart deletion
- **"Find that design file and copy its path to clipboard"** → Search + copy path operation

## Integration with Other Skills

### Launcher Skill Integration
- **"Find VS Code project and launch it"** → File search + app launching
- **"Open the folder containing my React app"** → Search + reveal + app launch

### Window Manager Integration  
- **"Find my design files and arrange Figma windows"** → File search + window management
- **"Open project files in split screen"** → Search + file operations + window snapping

### AI Workflow Integration
- **"Set up coding environment for React project"** → Find project + launch apps + arrange windows
- **"Prepare for presentation"** → Find presentation + supporting files + arrange display

## Environment Configuration

### Search Paths (`JARVIS_FILE_SEARCH_PATHS`)
```bash
export JARVIS_FILE_SEARCH_PATHS="/Users/you/Documents,/Users/you/Projects,/Users/you/Desktop,/Users/you/Downloads"
```

### Exclude Patterns (`JARVIS_FILE_SEARCH_EXCLUDE`)
```bash
export JARVIS_FILE_SEARCH_EXCLUDE="node_modules,.git,.svn,.DS_Store,*.tmp,*.log,Thumbs.db,.cache"
```

## Advanced Usage

### Regular Expression Search
- **Content search with regex**: `search_content({ query: "function\\s+\\w+\\(", regex: true })`
- **Find files matching pattern**: `search_files({ query: "test.*\\.js$" })`

### Bulk Operations
- **Find and process multiple files**: Chain search results with file operations
- **Batch rename**: Search + rename operations for file organization
- **Mass file moves**: Find files + move to organized folders

### Git Integration  
- **Find uncommitted files**: Integration with git status
- **Search in specific branch**: Context-aware project file search
- **Find files modified in recent commits**: Git history + file search

## Performance Tips

1. **Configure search paths** to avoid indexing unnecessary directories
2. **Use file type filters** for faster, more relevant results  
3. **Content search** is slower - use for specific needs
4. **Regular indexing** keeps search results fresh and fast
5. **Exclude large binary directories** (node_modules, .git, build folders)

## Comparison with Raycast

| Feature | Raycast | JARVIS File Search |
|---------|---------|-------------------|
| **Name search** | Basic fuzzy | AI-powered fuzzy + context |
| **Content search** | Limited | Full-text with context |
| **Recent files** | System recent items | Custom tracking + intelligence |
| **File operations** | Basic open/reveal | Comprehensive operations |
| **Categorization** | Basic type detection | Smart categorization |
| **Duplicates** | Not available | Advanced duplicate detection |
| **Suggestions** | Static | Context-aware + learning |
| **Integration** | Limited | Full JARVIS skill ecosystem |

This skill makes JARVIS the most intelligent file search system available, combining traditional file search with AI understanding, content awareness, and seamless integration with your complete workflow.