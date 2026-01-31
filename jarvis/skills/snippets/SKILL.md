# Snippets — Intelligent Text Expansion & Template Management

Use this skill for **text expansion**, **snippet management**, **dynamic templates**, and **smart text suggestions**. Provides advanced snippet capabilities that surpass Raycast with AI-powered suggestions, dynamic variables, and cross-platform compatibility.

## Setup

1. Install the skill: `clawdbot skills install ./skills/snippets` or copy to `~/jarvis/skills/snippets`.
2. **Environment variables** (optional):
   - `JARVIS_SNIPPETS_TRIGGER_PREFIX` - Prefix for triggers (default none, e.g., ';', '/')
   - `JARVIS_SNIPPETS_AUTO_EXPAND` - Enable automatic expansion (true/false)
   - `JARVIS_SNIPPETS_SYNC_ENABLED` - Enable cross-device sync (true/false)
3. **Permissions**: JARVIS will request text insertion permissions on first use
4. Restart gateway: `clawdbot gateway restart`

## When to use

- **Create snippets**: "create snippet for my email signature", "make snippet for meeting template"
- **Text expansion**: "expand my signature", "insert address snippet", "use meeting template"
- **Snippet management**: "show my snippets", "find email snippets", "update signature snippet"
- **Dynamic content**: "create snippet with today's date", "snippet with clipboard content"
- **Templates**: "create email template", "make code boilerplate", "design form response"

## Tools

| Tool | Use for |
|------|---------|
| `create_snippet` | Create new snippets with triggers and dynamic variables |
| `search_snippets` | Find snippets by name, trigger, content, or category |
| `expand_snippet` | Insert snippet content with variable processing |
| `list_snippets` | Browse all snippets with filtering and sorting |
| `update_snippet` | Modify existing snippet properties |
| `delete_snippet` | Remove snippets by ID or trigger |
| `import_snippets` | Import from other snippet managers |
| `export_snippets` | Export snippets to various formats |
| `snippet_analytics` | Usage patterns and optimization suggestions |
| `create_snippet_template` | Generate reusable templates |
| `suggest_snippets` | Context-aware snippet recommendations |
| `setup_auto_expansion` | Configure automatic text expansion |

## Examples

### Creating Snippets
- **"Create snippet for my email signature"**
  ```
  Trigger: "sig"
  Content: "Best regards,\n{name}\n{title}\n{email}\n{phone}"
  ```

- **"Make snippet for meeting template"**
  ```
  Trigger: "meet"
  Content: "Meeting: {topic}\nDate: {date}\nAttendees: {attendees}\n\nAgenda:\n- {agenda_item1}\n- {cursor}"
  ```

- **"Create address snippet"** 
  ```
  Trigger: "addr"  
  Content: "{name}\n{address}\n{city}, {state} {zip}"
  ```

### Using Snippets
- **"Expand my signature"** → `expand_snippet({ trigger: "sig" })`
- **"Insert meeting template"** → `expand_snippet({ trigger: "meet" })`
- **"Use address snippet"** → `expand_snippet({ trigger: "addr" })`

### Searching & Managing
- **"Find email snippets"** → `search_snippets({ category: "email" })`
- **"Show all my snippets"** → `list_snippets({ sortBy: "usage" })`
- **"Update signature snippet"** → `update_snippet({ trigger: "sig", content: "new content" })`

### Dynamic Snippets
- **"Create snippet with today's date"**
  ```
  Content: "Report generated on {date:YYYY-MM-DD} at {time:HH:mm}"
  ```

- **"Snippet with clipboard content"**
  ```
  Content: "Ref: {clipboard}\nNotes: {cursor}"
  ```

## Smart Features

### Dynamic Variables
Built-in variables for dynamic content:
- **Date/Time**: `{date}`, `{time}`, `{date:format}`, `{timestamp}`
- **System**: `{clipboard}`, `{username}`, `{hostname}`, `{os}`
- **Cursor**: `{cursor}` - places cursor after expansion
- **Custom**: User-defined variables with prompts

### Variable Formats
- **Date formats**: `{date:YYYY-MM-DD}`, `{date:MMM D, YYYY}`, `{date:DD/MM/YY}`
- **Time formats**: `{time:HH:mm}`, `{time:h:mm A}`, `{time:HH:mm:ss}`
- **Custom prompts**: `{name:Enter your name}`, `{project:Project name}`

### Context-Aware Suggestions
- **Email context**: Suggests signatures, greetings, closings
- **Coding context**: Code templates, boilerplate, common patterns
- **Writing context**: Article templates, formatting snippets
- **Support context**: Response templates, troubleshooting steps

### Smart Categorization
Automatically categorizes snippets:
- **Email**: Signatures, templates, responses
- **Code**: Functions, classes, boilerplate
- **Personal**: Addresses, contact info, bio
- **Work**: Meeting templates, reports, forms
- **Social**: Posts, responses, hashtags

## Natural Language Intelligence

JARVIS understands complex snippet operations:

### Contextual Creation
- **"Create a snippet for responding to support emails"** → Generates template with common variables
- **"Make a code snippet for React components"** → Creates boilerplate with proper structure
- **"Snippet for my contact information"** → Prompts for details and creates formatted snippet

### Smart Expansion
- **"Insert my standard meeting agenda"** → Finds meeting-related snippet
- **"Use the email template with client info"** → Expands with dynamic client variables
- **"Add signature but make it casual"** → Modifies expansion based on context

### Intelligent Search
- **"Find that snippet about API responses"** → Content and category search
- **"Show snippets I use for GitHub"** → App-specific filtering
- **"My most used email templates"** → Usage-based ranking

## Advanced Usage

### Template System

**Email Signature Template**:
```
Name: Professional Email Signature
Trigger: sig
Content: 
Best regards,
{full_name}
{job_title} | {company}
{email} | {phone}
{website}
```

**Code Template**:
```
Name: React Functional Component
Trigger: rfc
Content:
import React from 'react';

const {component_name} = () => {
  return (
    <div>
      {cursor}
    </div>
  );
};

export default {component_name};
```

**Meeting Template**:
```
Name: Meeting Notes
Trigger: meeting
Content:
# {meeting_title}
Date: {date:YYYY-MM-DD}
Time: {time:HH:mm}
Attendees: {attendees}

## Agenda
{agenda_items}

## Notes
{cursor}

## Action Items
- [ ] 

## Next Steps
```

### Variable Prompts

**Custom Variables with Prompts**:
```javascript
variables: [
  { name: "client_name", prompt: "Client name:", defaultValue: "" },
  { name: "project_code", prompt: "Project code:", defaultValue: "PROJ" },
  { name: "deadline", prompt: "Deadline (YYYY-MM-DD):", defaultValue: "{date:YYYY-MM-DD}" }
]
```

### Conditional Logic

**Smart Content Based on Context**:
```
Content: "Hello {name},{if:time>17:00} Good evening{else} Good morning{endif}"
```

### Snippet Chaining

**Link Snippets Together**:
```
Trigger: fullsig
Content: "{sig}\n\n{disclaimer}\n\n{social_links}"
```

## Integration with Other Skills

### Clipboard History Integration
- **"Create snippet from clipboard"** → Uses clipboard history
- **"Save this as a snippet"** → Current clipboard → snippet
- **"Expand snippet with clipboard data"** → Dynamic clipboard variables

### File Search Integration  
- **"Create snippet from file template"** → Import from template files
- **"Save snippet to file"** → Export specific snippets
- **"Load snippets from project folder"** → Import project-specific snippets

### AI Workflow Integration
- **"Generate snippet from this text"** → AI-powered snippet creation
- **"Optimize my snippet content"** → AI suggestions for improvement
- **"Create snippets for this workflow"** → Multi-step snippet generation

## Import/Export Capabilities

### Import Sources
- **TextExpander**: `.textexpander` files
- **Alfred**: Alfred snippet files
- **Raycast**: Raycast snippet JSON
- **Espanso**: YAML configuration files
- **CSV/JSON**: Custom formats

### Export Formats
- **JSON**: Full feature export with variables
- **CSV**: Simple spreadsheet format
- **TextExpander**: Compatible with TextExpander
- **Plain Text**: Simple trigger/content pairs

### Migration Examples

**From TextExpander**:
```bash
# Export from TextExpander to CSV
# Import: "Import snippets from TextExpander file"
```

**From Alfred**:
```bash
# Export Alfred snippets
# Import: "Import Alfred snippets from file"
```

## Usage Analytics & Optimization

### Analytics Insights
- **Most used snippets**: Frequency analysis
- **Unused snippets**: Candidates for deletion
- **Time-based patterns**: Usage by time of day/week
- **App-specific usage**: Which snippets work best in which apps

### Optimization Suggestions
- **Trigger optimization**: Suggest shorter triggers for frequent snippets
- **Content improvement**: Identify missing variables or outdated content
- **Category reorganization**: Better organization recommendations
- **Duplicate detection**: Find similar snippets for consolidation

## Cross-Platform Support

### Platform Features
- **macOS**: Full integration with system text replacement
- **Windows**: PowerShell-based text insertion
- **Linux**: X11/Wayland clipboard and input simulation

### Synchronization
- **Device sync**: Encrypted sync across devices
- **Conflict resolution**: Smart handling of concurrent edits
- **Selective sync**: Choose which categories sync
- **Version control**: Track snippet changes over time

## Configuration Examples

### Environment Variables
```bash
# Trigger prefix (makes all triggers start with ';')
export JARVIS_SNIPPETS_TRIGGER_PREFIX=";"

# Enable automatic expansion
export JARVIS_SNIPPETS_AUTO_EXPAND=true  

# Enable cross-device sync
export JARVIS_SNIPPETS_SYNC_ENABLED=true
```

### Auto-Expansion Settings
```javascript
{
  "triggerPrefix": ";",
  "expandDelay": 500,
  "excludeApps": ["Terminal", "iTerm", "password managers"],
  "caseSensitive": false,
  "requireWordBoundary": true
}
```

## Security & Privacy

### Sensitive Content Protection
- **Password detection**: Avoid storing sensitive data
- **Encryption**: Sensitive snippets encrypted at rest
- **App restrictions**: Limit expansion in password fields
- **Audit logging**: Track snippet usage for security

### Data Management
- **Local storage**: All snippets stored locally by default
- **Backup**: Automatic local backups with versioning
- **Export control**: Choose what data to include in exports
- **Privacy mode**: Disable logging and analytics

## Performance Optimization

### Fast Expansion
- **Instant triggers**: Sub-100ms expansion time
- **Smart caching**: Frequently used snippets cached
- **Background processing**: Variable resolution in background
- **Efficient storage**: Optimized database structure

### Memory Management
- **Lazy loading**: Only load visible snippets
- **Compression**: Compress large snippet content
- **Cleanup**: Automatic removal of unused snippets
- **Indexing**: Fast search with proper indexing

## Troubleshooting

### Common Issues

**Snippets not expanding**:
- Check auto-expansion settings: *"snippet expansion status"*
- Verify app permissions for text insertion
- Test trigger conflicts: *"find snippet conflicts"*

**Variables not working**:
- Verify variable syntax: `{variable_name}`
- Check for typos in variable names
- Test with simple variables first: `{date}`, `{time}`

**Import/export problems**:
- Verify file format compatibility
- Check file permissions and paths
- Test with small sample files first

## Comparison with Alternatives

| Feature | TextExpander | Raycast | Alfred | JARVIS Snippets |
|---------|--------------|---------|--------|-----------------|
| **Snippet Count** | Unlimited | 50-100 | 100s | Unlimited |
| **Dynamic Variables** | Advanced | Basic | Limited | AI-powered |
| **Cross-Platform** | macOS/Windows | macOS/Windows | macOS only | All platforms |
| **Natural Language** | None | Limited | None | Full conversation |
| **Template System** | Basic | None | Basic | Advanced with AI |
| **Analytics** | Basic | None | None | Comprehensive |
| **Import/Export** | Limited | Basic | Good | Extensive |
| **Context Awareness** | None | Basic | None | AI-powered |
| **Variable Prompts** | Yes | No | Limited | Advanced |
| **Integration** | App-specific | Limited | Good | Full JARVIS ecosystem |

## Tips for Power Users

1. **Use descriptive triggers** that are memorable and unlikely to conflict
2. **Leverage dynamic variables** to reduce snippet proliferation
3. **Organize with categories** and tags for easy discovery
4. **Regular analytics review** to optimize your snippet collection
5. **Export backups regularly** to prevent data loss
6. **Create templates** for common patterns in your work
7. **Use app scoping** to prevent conflicts in specific applications

This skill transforms JARVIS into the most intelligent text expansion system available, combining powerful templating, dynamic variables, and AI-powered suggestions with natural language control and seamless workflow integration.