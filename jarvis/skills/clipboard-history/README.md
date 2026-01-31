# JARVIS Clipboard History Skill

Advanced clipboard management system that surpasses Raycast and system clipboard with intelligent search, privacy controls, and cross-device synchronization.

## Features

### Core Clipboard Management
- **Unlimited History**: Store 1000+ clipboard items with smart cleanup
- **Intelligent Monitoring**: Real-time clipboard change detection
- **Content Categorization**: Auto-detect URLs, emails, code, files, etc.
- **Smart Search**: Fuzzy search with content analysis
- **Privacy Controls**: Automatic sensitive data detection and filtering

### Advanced Features
- **Cross-Device Sync**: Secure clipboard synchronization (planned)
- **Usage Analytics**: Learn from clipboard patterns and preferences
- **Bulk Operations**: Pin, categorize, delete multiple items
- **Export/Import**: Share clipboard collections between devices
- **Smart Suggestions**: Context-aware clipboard recommendations

### Content Types Supported
- **Text**: Plain text, formatted text, rich content
- **URLs**: Web links, deep links, file URLs
- **Code**: Programming snippets with syntax detection
- **Files**: File paths and references
- **Images**: Screenshots and copied images (metadata)
- **Emails**: Email addresses and full email content
- **Phone Numbers**: Various phone number formats
- **Sensitive Data**: Passwords, tokens, keys (with privacy controls)

## Installation

### 1. Copy Skill
```bash
cp -r skills/clipboard-history ~/jarvis/skills/
```

### 2. Environment Configuration (Optional)

Add to your shell profile:

```bash
# Maximum clipboard items to store
export JARVIS_CLIPBOARD_MAX_ITEMS=2000

# Enable cross-device synchronization
export JARVIS_CLIPBOARD_SYNC_ENABLED=true

# Exclude sensitive patterns (comma-separated)
export JARVIS_CLIPBOARD_EXCLUDE_PATTERNS="password,secret,token,key,credential,private"
```

### 3. Platform Dependencies

**macOS**: No additional dependencies (uses `pbcopy`/`pbpaste`)

**Windows**: 
```powershell
# PowerShell clipboard commands (built-in)
# No additional setup required
```

**Linux**:
```bash
# Install clipboard utilities
sudo apt install xclip  # Ubuntu/Debian
# or
sudo yum install xclip  # CentOS/RHEL
```

### 4. Update JARVIS Configuration

Add to `~/jarvis/TOOLS.md`:

```markdown
## Clipboard History

**Skill:** `clipboard-history` (installed). Intelligent clipboard management and history.

| Tool | When to use |
|------|-------------|
| `search_clipboard` | "find that API key", "search clipboard for URLs" |
| `get_clipboard_history` | "show clipboard history", "recent clipboard items" |
| `paste_clipboard_item` | "paste the second thing I copied", "paste URL to Chrome" |
| `clipboard_operations` | "pin this item", "delete sensitive clipboard data" |
| `clear_clipboard_history` | "clear old clipboard items", "delete clipboard history" |
| `analyze_clipboard_patterns` | "what do I copy most?", "clipboard usage stats" |
```

### 5. Restart JARVIS
```bash
clawdbot gateway restart
```

### 6. Grant Permissions

**macOS**: Grant accessibility permissions if prompted
**Windows**: No additional permissions required  
**Linux**: Ensure X11 clipboard access is available

## Usage Examples

### Basic Clipboard Operations
- **"What's in my clipboard history?"**
- **"Find that API key I copied earlier"**
- **"Paste the second thing I copied"**
- **"Show recent URLs I copied"**

### Smart Search
- **"Search clipboard for email addresses"**
- **"Find code snippets from VS Code"**
- **"Show clipboard items from today"**
- **"Find that long URL I copied yesterday"**

### Content Management
- **"Pin this clipboard item"**
- **"Delete all password entries from clipboard"**
- **"Mark this as private"**
- **"Clear old clipboard items"**

### Advanced Operations
- **"Export my clipboard history"**
- **"What do I copy most often?"**
- **"Show clipboard usage patterns"**
- **"Sync clipboard to my other devices"**

## Natural Language Understanding

### Contextual Search
- **"That thing with the API key"** → Searches for items containing "API" or "key"
- **"The long URL from earlier"** → Finds URLs sorted by length, filtered by recency
- **"Code I copied from GitHub"** → Searches code snippets from browser/GitHub apps
- **"Email address for support"** → Finds email addresses with "support" context

### Smart Paste Operations
- **"Paste without formatting"** → Plain text paste of rich content
- **"Paste the email into compose window"** → Smart app targeting + paste
- **"Paste and format as code"** → Content formatting based on target app
- **"Paste the URL and go"** → Paste + trigger browser navigation

### Intelligent Filtering
- **"Show only work-related clipboard items"** → Uses time and app context
- **"Hide sensitive clipboard data"** → Filters out detected private content
- **"Recent images I copied"** → Content type + time filtering
- **"Clipboard from my coding session"** → App context + time range

## Privacy & Security

### Automatic Sensitive Data Detection
- **Password patterns**: Detects password-like content
- **API keys**: Identifies tokens and secret keys  
- **Personal info**: Phone numbers, SSNs, credit cards
- **Custom patterns**: User-defined sensitive content

### Privacy Controls
- **Exclude patterns**: Configure content to never store
- **Private marking**: Manual flagging of sensitive items
- **Auto-expiry**: Automatic deletion of sensitive data
- **Local storage**: All data stored locally by default

### Security Features
- **Encrypted storage**: Sensitive items encrypted at rest
- **Access controls**: App-based clipboard access permissions
- **Audit trail**: Track which apps access clipboard
- **Secure sync**: End-to-end encryption for cross-device sync

## Performance Features

### Intelligent Storage
- **Deduplication**: Identical items automatically merged
- **Compression**: Text content compressed for space efficiency
- **Smart cleanup**: Automatic removal of stale items
- **Priority preservation**: Pinned items never auto-deleted

### Fast Search
- **Indexed content**: Full-text search with relevance scoring
- **Caching**: Frequently accessed items cached in memory
- **Lazy loading**: Large clipboard items loaded on demand
- **Background processing**: Non-blocking operations

## Integration Examples

### With File Search
- **"Find the file path I copied and open it"**
- **"Copy this file path to clipboard history"**

### With Launcher
- **"Paste this URL and open in Chrome"**
- **"Copy command output and launch email"**

### With Window Manager
- **"Paste into split screen window"**
- **"Copy from left window and paste to right"**

### With AI Workflow
- **"Process the JSON I copied"**
- **"Translate clipboard text to Spanish"**
- **"Format the code I copied as documentation"**

## Advanced Usage

### Clipboard Workflows

**Daily Standup**:
1. "Show clipboard items with 'ticket' or 'bug' from yesterday"
2. Pin relevant items for easy access
3. Paste formatted updates to team chat

**Code Review**:
1. "Find all code snippets from last week"  
2. Export as formatted document
3. Share with review team

**Research Session**:
1. "Show all URLs from research today"
2. Categorize by topic
3. Export as bookmark file

### Custom Categories
- **Work**: Business-related content during work hours
- **Personal**: Personal content outside work hours  
- **Code**: Programming-related snippets and commands
- **Research**: URLs and notes from research sessions

### Automation Integration
- **Auto-categorization**: Rules-based content categorization
- **Smart cleanup**: Automatic organization and cleanup
- **Sync triggers**: Event-based synchronization
- **App integration**: Deep integration with productivity apps

## Troubleshooting

### Common Issues

**Clipboard monitoring not working**:
- Check permissions on macOS (Accessibility settings)
- Verify clipboard utilities on Linux (`xclip` installed)
- Restart clipboard monitoring: *"restart clipboard monitoring"*

**Search results incomplete**:
- Check exclusion patterns aren't too broad
- Verify content hasn't been auto-cleaned due to age
- Try including private/sensitive items in search

**Performance issues**:
- Reduce max items limit in environment settings
- Clear old clipboard history: *"clear old clipboard items"*
- Disable content indexing for large text items

### Optimization Tips

1. **Configure exclusion patterns** for noisy applications
2. **Use categories** to organize clipboard content
3. **Regular cleanup** of old or unused items
4. **Pin important items** to prevent auto-deletion
5. **Monitor usage patterns** to optimize workflows

## Comparison with Alternatives

| Feature | System Clipboard | Raycast | Copy 'Em | JARVIS Clipboard |
|---------|------------------|---------|----------|------------------|
| **History Length** | 1 item | 50-100 | 1000+ | 1000+ |
| **Content Search** | None | Basic | Good | AI-powered fuzzy |
| **Privacy Controls** | None | Basic | Basic | Advanced + encryption |
| **Content Detection** | None | Limited | Good | Intelligent categorization |
| **Cross-Device Sync** | iCloud only | None | Limited | Secure E2E encryption |
| **Usage Analytics** | None | None | Basic | Comprehensive insights |
| **Natural Language** | None | None | None | Full conversation support |
| **Integration** | System only | Limited | App-specific | Full JARVIS ecosystem |
| **Export/Import** | None | None | Basic | Multiple formats |

This skill transforms JARVIS into the most intelligent clipboard manager available, combining powerful search, privacy protection, and seamless workflow integration with natural language understanding.