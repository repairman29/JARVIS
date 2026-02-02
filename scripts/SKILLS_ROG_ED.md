# Adding Skills — JARVIS ROG Ed.

How to add and manage skills so JARVIS can do more (launch apps, calculate, search files, etc.). Based on [OpenClaw skills config](https://docs.clawd.bot/tools/skills-config), [CLI skills](https://docs.clawd.bot/cli/skills), and best practices for AI assistant plugins.

---

## How skills work here

- **Config:** `%USERPROFILE%\.clawdbot\clawdbot.json` (or `~/.openclaw/openclaw.json`) under `skills.load`:
  - **extraDirs** — list of folders that contain skill subfolders (each with `skill.json` + `index.js`).
  - **watch** — when `true`, the gateway reloads skills when files change (no restart needed for edits).
- **This repo:** The gateway already loads two directories:
  1. `jarvis/skills` (workspace skills)
  2. `skills` (repo-wide skills)
- **Eligibility:** The LLM only sees skills whose tools are well-described and whose requirements (e.g. env vars) are met. Use **actionable descriptions** so the model knows when to call a tool.

---

## Valuable ways to add skills

### 1. Use existing repo skills (no install)

Skills in `skills/` and `jarvis/skills/` are already loaded. Just **restart the gateway** (or rely on `watch: true`) and use natural language:

| Skill | Example prompts |
|-------|------------------|
| **Web Search** | "What's the date today?", "Search for latest news", "weather 80202", "current time Denver" |
| **Clock** | "What time is it?", "What's the date?", "Current time in London" |
| **Launcher** | "Launch Chrome", "Open github.com", "Take a screenshot", "Lock screen" |
| **Calculator** | "15% of 240", "Convert 5 miles to km", "What's 2^10?" |
| **File search** | "Find PDFs from last week", "Search for 'API key' in my docs" |
| **Clipboard history** | "Show clipboard history", "Paste item 3" |
| **Snippets** | "Insert my email signature" |
| **Performance monitor** | "What's using the most RAM?", "Summarize system health" |
| **Skill marketplace** | "Discover skills", "Manage installed skills" |

On **Windows (ROG Ally)** Launcher supports: launch app, quit app, list running apps, open URL, process manager, system info, screenshot (fullscreen), lock/sleep. Volume/brightness/Wi‑Fi may report "not yet implemented on Windows" — see each skill’s README.

### 2. Add another directory of skills

Edit `clawdbot.json` (or `openclaw.json`):

```json
"skills": {
  "load": {
    "extraDirs": [
      "C:\\path\\to\\repo\\jarvis\\skills",
      "C:\\path\\to\\repo\\skills",
      "C:\\path\\to\\your\\skill-pack\\skills"
    ],
    "watch": true
  }
}
```

Replace `C:\\path\\to\\repo` with your actual repo path (e.g. `C:\\Users\\YourName\\JARVIS`).

Restart the gateway (or wait for the watcher to pick up changes). New skills in that folder (each with `skill.json` + `index.js`) will be loaded.

### 3. Enable/disable or configure a skill (entries)

To disable a skill or inject env vars, add **skills.entries** in config:

```json
"skills": {
  "load": { "extraDirs": [...], "watch": true },
  "entries": {
    "kroger": { "enabled": false },
    "calculator": { "enabled": true, "env": { "JARVIS_CALC_PRECISION": "6" } }
  }
}
```

- **enabled: false** — skill is not offered to the model.
- **env** — environment variables for that skill (only if not already set).
- **apiKey** — some skills use this as a shortcut for their primary env var.

Keys under `entries` match the skill **name** in its `skill.json` (or `metadata.openclaw.skillKey` if set).

### 4. Inspect what’s loaded (CLI)

From the JARVIS repo folder:

```powershell
npx clawdbot skills list
npx clawdbot skills list --eligible
npx clawdbot skills info launcher
npx clawdbot skills check
```

(If you use `openclaw` instead of `clawdbot`, use `openclaw skills list` etc.)  
**list** shows all skills from extraDirs + bundled; **list --eligible** filters to those that meet requirements; **info &lt;name&gt;** shows one skill; **check** validates setup.

### 5. Add a new skill from scratch

1. **Create a folder** under one of your `extraDirs`, e.g. `skills/my-skill/`.
2. **skill.json** — `name`, `version`, `description`, `env` (optional), and **tools** array. Each tool: `name`, `description`, `parameters` (JSON Schema). Clear descriptions help the model choose the right tool.
3. **index.js** — Node script that receives tool name + args, runs the logic, returns a result (or error). Must be invokable by the gateway (Node).
4. **README.md** / **SKILL.md** — for humans and for TOOLS.md in the workspace.
5. Restart the gateway (or rely on watch). Optionally add `skills.entries.<name>` to disable or set env.

**Best practices (from plugin guidelines):**

- **Support common searches** — anticipate how users will ask ("launch Chrome", "15% tip").
- **Actionable results** — return clear, structured output or instructions.
- **Safety** — avoid exposing raw exec in tool descriptions; use narrow parameters.
- **Manifest** — keep `skill.json` valid and descriptions concise.

---

## Quick reference — repo skills

| Skill | Path | Best for |
|-------|------|----------|
| Launcher | `skills/launcher` | Launch app, open URL, screenshot, system control |
| Calculator | `skills/calculator` | Math, units, currency, date/time |
| File search | `skills/file-search` | Find files by name, content, date |
| Clipboard history | `skills/clipboard-history` | Recent clipboard items |
| Snippets | `skills/snippets` | Text templates |
| Performance monitor | `skills/performance-monitor` | CPU, memory, disk, cleanup |
| Skill marketplace | `skills/skill-marketplace` | Discover, install, manage skills |
| Kroger | `skills/kroger` | Shopping list, cart (needs OAuth) |
| Voice control | `skills/voice-control` | Voice commands (experimental on Ally) |
| Window manager | `skills/window-manager` | Window layout (platform-dependent) |
| Workflow automation | `skills/workflow-automation` | Automations |

---

## ClawHub, marketplace & forums

Ways to discover, install, and share skills beyond this repo.

### ClawHub (OpenClaw skill registry)

**ClawHub** is the public skill registry for OpenClaw/clawdbot. Browse skills, search by plain language (vector search), install with one command, and publish your own.

| What | Where |
|------|--------|
| **Browse skills** | [clawhub.ai](https://clawhub.ai/) / [clawhub.com](https://clawhub.com) |
| **Docs** | [ClawHub (OpenClaw)](https://docs.clawd.bot/clawdhub) |
| **Install CLI** | `npm i -g clawhub` or `pnpm add -g clawhub` |
| **Search** | `clawhub search "calendar"` (or `npx clawhub@latest search "query"`) |
| **Install a skill** | `clawhub install <slug>` or `npx clawhub@latest install <slug>` (e.g. `npx clawhub@latest install sonoscli`) |
| **Update skills** | `clawhub update --all` |
| **Publish your skill** | `clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0` or `clawhub sync --all` |
| **Login** | `clawhub login` (browser) or `clawhub login --token <token>` |

Skills are versioned (semver), have stars/comments, and can be tagged (e.g. `latest`). By default the CLI installs into `./skills` under your workdir; OpenClaw loads workspace skills from `<workspace>/skills`. Start a new session after installing so the gateway picks up the skill.

### ClawdBot Hub / Community Skills & Plugins

Community-driven marketplace for ClawdBot skills: browse by category, install, and submit your own (review within 48 hours).

| What | Where |
|------|--------|
| **Community marketplace** | [Community Skills & Plugins (howtouseclawdbot.com)](https://howtouseclawdbot.com/community.html) |
| **Categories** | Productivity, Communication, Smart Home, Development, Finance, Travel, Media, Utilities |
| **Submit a skill** | Form on the community page (name, GitHub URL, category, description, tags); review within 48 hours |
| **Developer Discord** | [discord.gg/clawdbot](https://discord.gg/clawdbot) — get help and share skills |
| **Official skill docs** | [docs.clawd.bot](https://docs.clawd.bot/) (skills, tools) |
| **Skill template** | [GitHub: clawdbot/skill-template](https://github.com/clawdbot/skill-template) — start from a template |

Example community skills (from the hub): Inbox Zero Pro, Home Assistant Bridge, Calendar Wizard, GitHub Manager, Travel Companion, Spotify Controller, Expense Tracker, Notion Sync.

### JARVIS skill marketplace (this repo)

This repo includes a **skill-marketplace** skill that discovers, installs, and manages skills. It can point at a JARVIS marketplace URL (env: `JARVIS_MARKETPLACE_URL`, default `https://marketplace.jarvis.ai`). Premium/curated JARVIS skills are also listed at:

| What | Where |
|------|--------|
| **JARVIS showcase / premium** | [repairman29.github.io/JARVIS](https://repairman29.github.io/JARVIS/) |
| **Skill-marketplace skill** | Use in chat: "Discover skills", "Install skill X", "Manage installed skills" (see `skills/skill-marketplace/` and `SKILL.md`) |

---

## Troubleshooting

- **Skill not found** — Check `extraDirs` in config; path must be absolute or resolve from the process. Restart gateway after changing config.
- **Tool not called** — Improve the tool’s `description` in `skill.json` so the model knows when to use it. Use **skills list --eligible** to see if the skill is eligible.
- **Env / API key** — Put keys in `%USERPROFILE%\.clawdbot\.env` or in `skills.entries.<skill>.env`. For sandboxed runs, use sandbox docker env (see [Skills config](https://docs.clawd.bot/tools/skills-config)).
- **Slow startup** — Disable unused skills with `skills.entries.<name>.enabled: false` or remove them from extraDirs.

For full schema and options, see [Skills config](https://docs.clawd.bot/tools/skills-config) and [OpenClaw Skills](https://docs.clawd.bot/tools/skills).
