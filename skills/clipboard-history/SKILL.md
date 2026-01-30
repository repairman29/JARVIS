# Clipboard History — Intelligent Copy & Paste Management

Use this skill for **clipboard history**, **smart paste operations**, **content search**, and **cross-device clipboard sync**. Provides advanced clipboard management that surpasses Raycast with AI-powered categorization and privacy controls.

## Setup

1. Install the skill: `clawdbot skills install ./skills/clipboard-history` or copy to `~/jarvis/skills/clipboard-history`.
2. **Environment variables** (optional):
   - `JARVIS_CLIPBOARD_MAX_ITEMS` - Maximum items to store (default 1000)
   - `JARVIS_CLIPBOARD_SYNC_ENABLED` - Enable cross-device sync (true/false)
   - `JARVIS_CLIPBOARD_EXCLUDE_PATTERNS` - Patterns to exclude from history (e.g., "password,secret,key")
3. **Permissions**: JARVIS will request clipboard access on first use
4. Restart gateway: `clawdbot gateway restart`

## When to use

- **Search clipboard**: "find that API key I copied", "search clipboard for email addresses"
- **Paste history**: "paste the second thing I copied", "paste that URL from yesterday"
- **Content management**: "pin this clipboard item", "delete sensitive items", "show recent images"
- **Smart filtering**: "show only code snippets", "clipboard items from VS Code", "URLs from today"
- **Cross-device**: "sync clipboard to my phone", "get clipboard from my laptop"

## Tools

| Tool | Use for |
|------|---------|
| `search_clipboard` | Search clipboard history by content, type, app, or date |
| `get_clipboard_history` | Get recent clipboard items with filtering |
| `paste_clipboard_item` | Paste specific item to active app or location |
| `clipboard_operations` | Pin, delete, categorize, mark private items |
| `monitor_clipboard` | Start/stop clipboard monitoring |
| `clear_clipboard_history` | Clear history with selective filtering |
| `export_clipboard_items` | Export clipboard data to files |
| `analyze_clipboard_patterns` | Usage analytics and insights |
| `setup_clipboard_sync` | Cross-device synchronization |

## Examples

### Search Clipboard History
- **"Find that API key I copied"** → `search_clipboard({ query: "API key", type: "text" })`
- **"Search for email addresses in clipboard"** → `search_clipboard({ query: "@", type: "email" })`
- **"Show URLs from today"** → `search_clipboard({ type: "url", dateRange: "today" })`
- **"Find code I copied from VS Code"** → `search_clipboard({ type: "code", app: "VS Code" })`

### Recent Clipboard Items
- **"What's in my clipboard history?"** → `get_clipboard_history({ limit: 10 })`
- **"Show recent images I copied"** → `get_clipboard_history({ type: "image", limit: 5 })`
- **"Last 5 things I copied"** → `get_clipboard_history({ limit: 5 })`

### Smart Paste Operations  
- **"Paste the second thing I copied"** → Search history + paste by position
- **"Paste that URL into Chrome"** → `paste_clipboard_item({ itemId: "url123", targetApp: "Chrome" })`
- **"Paste the API key"** → Find by content + paste to active app

### Clipboard Management
- **"Pin this clipboard item"** → `clipboard_operations({ action: "pin", itemId: "item123" })`
- **"Delete sensitive clipboard items"** → `clipboard_operations({ action: "delete", itemId: "sensitive123" })`
- **"Mark this as private"** → `clipboard_operations({ action: "mark_private", itemId: "private123" })`

### Content Analysis
- **"What do I copy most often?"** → `analyze_clipboard_patterns({ timeframe: "week" })`
- **"Show my clipboard usage from VS Code"** → Analysis with app filtering
- **"Clear old clipboard items"** → `clear_clipboard_history({ type: "older_than_week", confirm: true })`

## Smart Features

### Intelligent Content Detection
Automatically categorizes clipboard content:
- **Text**: Plain text, rich text, formatted content
- **URLs**: Web links, deep links, file URLs
- **Email**: Email addresses and full email content
- **Phone**: Phone numbers in various formats
- **Code**: Programming code snippets with syntax detection
- **Files**: File paths and file references
- **Images**: Screenshots, copied images, image data
- **Passwords**: Detects and marks potential sensitive data

### Privacy & Security
- **Sensitive Data Detection**: Automatically identifies passwords, keys, tokens
- **Private Marking**: Manual and automatic marking of sensitive items
- **Exclusion Patterns**: Filter out specific content patterns
- **Secure Storage**: Encrypted local storage for sensitive items
- **Auto-Expiry**: Automatic deletion of sensitive items after time limit

### Smart Search Algorithm  
1. **Exact content matches** get highest priority
2. **Fuzzy text matching** for partial queries
3. **Type-aware search** (URLs, emails, code, etc.)
4. **App context** boosts relevance
5. **Recency scoring** for time-based relevance
6. **Usage frequency** influences ranking

### Cross-Device Synchronization
- **Secure Sync**: End-to-end encrypted clipboard sync
- **Selective Sync**: Choose what content types sync
- **Device Management**: Pair/unpair devices easily
- **Conflict Resolution**: Smart handling of simultaneous copies
- **Privacy Controls**: Exclude sensitive data from sync

## Natural Language Intelligence

JARVIS understands complex clipboard operations:

### Contextual Understanding
- **"That thing I copied earlier"** → Searches recent items with context
- **"The API key from the documentation"** → Combines content + source context  
- **"Paste the long URL"** → Finds URLs sorted by length
- **"The code snippet with React"** → Content + technology matching

### Smart Paste Commands
- **"Paste without formatting"** → Plain text paste of rich content
- **"Paste as code"** → Format as code block for current app
- **"Paste the email to compose window"** → Smart app targeting
- **"Paste and go"** → Paste URL and trigger navigation

### Batch Operations
- **"Delete all passwords from clipboard"** → Find + delete sensitive items
- **"Pin all URLs from today"** → Filter + bulk operations
- **"Export my code snippets"** → Filter + export specific types

## Integration with Other Skills

### File Search Integration
- **"Find the file path I copied and open it"** → Clipboard search + file operations
- **"Copy this file path and add to clipboard history"** → File operations + clipboard

### Launcher Integration
- **"Paste this URL and open it in Chrome"** → Clipboard + app launching
- **"Copy output and launch email app"** → Command execution + clipboard + app launch

### AI Workflow Integration
- **"Process the JSON I copied and format it"** → Clipboard + data processing
- **"Translate the text I copied"** → Clipboard + translation service

## Configuration Examples

### Environment Variables

```bash
# Maximum clipboard items to store
export JARVIS_CLIPBOARD_MAX_ITEMS=2000

# Enable cross-device sync
export JARVIS_CLIPBOARD_SYNC_ENABLED=true

# Exclude patterns (comma-separated)
export JARVIS_CLIPBOARD_EXCLUDE_PATTERNS="password,secret,token,key,credential"
```

### Custom Categories

Create smart categories based on patterns:
- **Work**: Items copied during work hours from specific apps
- **Personal**: Items from personal apps and time periods
- **Code**: Programming-related content with syntax highlighting
- **Research**: URLs, documents, notes from research sessions

## Advanced Usage

### Clipboard Workflows

**Daily Standup Preparation**:
1. "Show clipboard items from yesterday with 'ticket' or 'bug'"
2. Organize into standup format
3. Paste formatted summary to communication app

**Code Review Process**:
1. "Find all code snippets from last week"
2. Categorize by programming language
3. Export as formatted document for review

**Research Session**:
1. "Show all URLs from research apps today"
2. Categorize by topic/source
3. Export as bookmark file or research notes

### Keyboard Shortcuts Integration

When used with global hotkeys:
- `⌘⇧V` → "Show clipboard history"
- `⌘⇧C` → "Search clipboard"
- `⌘⇧X` → "Clear recent clipboard"
- `⌘⌥V` → "Paste without formatting"

### API Integration

Connect with external services:
- **Note Apps**: Sync important clipboard items to notes
- **Password Managers**: Integrate with 1Password, Bitwarden
- **Cloud Storage**: Auto-save clipboard images to cloud
- **Translation**: Auto-translate foreign language clipboard content

## Performance & Storage

### Intelligent Storage Management
- **Compression**: Text content compressed for efficiency
- **Deduplication**: Identical items merged automatically
- **Smart Cleanup**: Old, unused items removed automatically
- **Priority Storage**: Pinned and frequently used items preserved

### Memory Optimization
- **Lazy Loading**: Only load visible clipboard items
- **Image Handling**: Thumbnails for large images
- **File References**: Store paths instead of file content
- **Streaming**: Large content streamed on demand

## Privacy & Security Features

### Data Protection
- **Local Storage**: All data stored locally by default
- **Encryption**: Sensitive items encrypted at rest
- **Access Control**: App-specific clipboard access permissions
- **Audit Trail**: Track which apps access clipboard data

### Privacy Controls
- **Incognito Mode**: Disable clipboard monitoring temporarily
- **App Blacklist**: Exclude specific apps from monitoring
- **Content Filtering**: Automatic detection and handling of sensitive data
- **Retention Policies**: Configurable data retention periods

## Comparison with Alternatives

| Feature | macOS Universal Clipboard | Raycast | JARVIS Clipboard History |
|---------|---------------------------|---------|-------------------------|
| **History Length** | 1 item | 50-100 items | 1000+ items |
| **Search** | None | Basic text search | AI-powered fuzzy search |
| **Content Types** | Basic | Text + images | All content types + smart detection |
| **Privacy Controls** | None | Basic | Advanced with encryption |
| **Cross-Device Sync** | Apple devices only | None | All platforms with E2E encryption |
| **Smart Categories** | None | Basic | AI-powered categorization |
| **App Integration** | Basic | Good | Deep JARVIS integration |
| **Analytics** | None | None | Usage patterns and insights |
| **Bulk Operations** | None | Limited | Comprehensive management |

## Tips for Power Users

1. **Set up exclusion patterns** for sensitive data types
2. **Use pinning** for frequently accessed items  
3. **Configure cross-device sync** for seamless workflow
4. **Regular cleanup** of old items to maintain performance
5. **Export important clipboard collections** as backups
6. **Use categories** to organize work vs personal content

This skill transforms JARVIS into the most intelligent clipboard manager available, combining powerful search, privacy protection, and seamless workflow integration with natural language control.