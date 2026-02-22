# Pre-built "Make It So" Workflows

One-word commands for common scenarios. Just say the trigger phrase and JARVIS does the rest.

---

## Available Workflows

### 1. Meeting Mode
**Trigger:** "meeting mode", "I have a meeting", "prep for meeting"

**What it does:**
- Mutes audio (so notifications don't interrupt)
- Enables Focus Assist / Do Not Disturb
- Opens calendar in browser (optional)

**How to use:**
```
You: "Meeting mode"
JARVIS: [mutes audio, enables focus mode] "Meeting mode enabled. Audio muted, Focus Assist on. Say 'meeting over' when done."
```

### 2. Streaming Mode
**Trigger:** "streaming mode", "I'm going live", "prep for stream"

**What it does:**
- Closes distracting apps (Slack, Discord, email)
- Maximizes the main window
- Enables Focus Assist

**How to use:**
```
You: "Streaming mode"
JARVIS: [closes Slack, Discord] "Streaming mode active. Distractions closed, Focus Assist on."
```

### 3. End of Day
**Trigger:** "end of day", "I'm done for today", "wrap up"

**What it does:**
- Takes a screenshot (optional backup of work)
- Lists top memory-using apps
- Suggests which apps to close

**How to use:**
```
You: "End of day"
JARVIS: "Here's your end-of-day summary. [lists top apps] Want me to close any of these?"
```

### 4. Focus Mode
**Trigger:** "focus mode", "help me concentrate", "do not disturb"

**What it does:**
- Mutes system audio
- Enables Windows Focus Assist
- (Optional) Sets a timer for a focus session

**How to use:**
```
You: "Focus mode for 25 minutes"
JARVIS: "Focus mode enabled. Audio muted. Timer set for 25 minutes."
```

### 5. Morning Routine / Daily Brief
**Trigger:** "good morning", "daily brief", "morning routine"

**What it does:**
- Shows time, date, battery, power plan
- Lists top processes by memory
- (If calendar connected) Shows today's events

**How to use:**
```
You: "Good morning"
JARVIS: "**Fri, Jan 31** 11:30 AM
Battery: 85% (plugged in) • Power: Balanced
Memory: 12 GB used / 16 GB total
Top 3 by RAM: Chrome (2.1 GB), Code (1.4 GB), Discord (0.8 GB)"
```

### 6. Coding Mode
**Trigger:** "coding mode", "dev mode", "time to code"

**What it does:**
- Opens VS Code or Cursor
- Closes non-dev apps
- (Optional) Restores a "dev" window layout

**How to use:**
```
You: "Coding mode"
JARVIS: "Launching Cursor... Dev mode active."
```

---

## Creating Custom Workflows

Use the `create_workflow` tool:

```
You: "Create a workflow called 'podcast mode' that quits Spotify, opens Chrome to my podcast notes, and sets a 1-hour timer."
JARVIS: [creates workflow] "Workflow 'podcast_mode' created. Say 'podcast mode' to run it."
```

Or use `workflow_templates`:
- `workflow_templates action: list` — see available templates
- `workflow_templates action: install, templateName: meeting_mode` — install a template

---

## Running Workflows

Just say the trigger phrase naturally:
- "Meeting mode"
- "Focus mode for 30 minutes"
- "Good morning"
- "End of day"

Or explicitly:
- "Run the streaming workflow"
- "Execute end_of_day"

---

## Intent-engineering flows (build and ship)

One-phrase triggers so JARVIS runs the **right agent sequence** without you specifying each step. You guide intent; JARVIS orchestrates BEAST MODE, Code Roach, Echeo, and workflow_dispatch.

| Trigger | What JARVIS does |
|---------|-------------------|
| **"Run a triad on [product]"** / **"Swarm on [product]"** | Product-owner pass: define PRD (or outline), create ~3 issues, propose 2-milestone roadmap. Uses **repo_summary(product.repo)** for context; does not invent domains. See **jarvis/PO_SWARMS.md**. |
| **"Quality gate before ship"** / **"Run quality then ship [product]"** | Runs **BEAST MODE** quality (e.g. `beast-mode quality score`) on the product repo, then if green (or user confirms), runs ship flow: commit, push, workflow_dispatch or platform CLI. See **docs/JARVIS_AGENT_ORCHESTRATION.md** § When-to-invoke. |
| **"Deep work on [product]"** | Full cycle: plan (PRD, roadmap, milestones) → develop (issues, PRs, implementation) → execute (ship, deploy). Scoped to one product; uses **repo_summary** first. See **jarvis/DEEP_WORK_PRODUCT.md**. |
| **"What should I work on?"** | Uses **Echeo** (bounty/capability matching) and optionally repo-knowledge; suggests prioritized work. See **JARVIS_AGENT_ORCHESTRATION.md** § When-to-invoke. |
| **"Health check [repo]"** | Runs **Code Roach** (`code-roach health`, `code-roach analyze pr` if PR exists) and optionally **BEAST MODE** quality; reports status. |
| **"Run knip report"** / **"Knip report for jarvis-ui"** | Triggers **github_workflow_dispatch** for the Knip Bot workflow (JARVIS repo). Report appears in the workflow run logs. On PRs that touch jarvis-ui, the bot also comments with the report. See **docs/DEV_DELIVERY_TOOLS.md**. |

**Ref:** [JARVIS_AGENT_ORCHESTRATION.md](JARVIS_AGENT_ORCHESTRATION.md), [jarvis/AGENTS.md](../jarvis/AGENTS.md) (Deep work, Product Owner Orchestration).

---

## Notes

- **Focus mode** uses `focus_mode` tool in Launcher (mutes + Focus Assist)
- **Daily brief** uses `daily_brief` tool in Launcher
- **Timers** use the `reminders` skill
- Custom workflows are saved to `~/.jarvis/workflows/workflows.json`
