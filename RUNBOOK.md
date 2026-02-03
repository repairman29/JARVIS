# Clawdbot Runbook

Quick reference for operating your Clawdbot setup.

## Tool keeper (last sharpened)

**2026-02-01** — Sharpening pass: root `npm update` + `npm audit fix` (1 package changed); jarvis-ui and olive-e2e checked. **Deferred (breaking):** Root — 26 vulns in clawdbot transitive deps (fast-xml-parser, hono, tar); fix would require clawdbot@2026.1.15 (breaking). **Track:** Re-run `npm audit` after upgrading clawdbot; see "Root npm vulns" below. **Done:** Jarvis-ui upgraded to Next 16.1.6 + React 19.2.4; build uses `next build --webpack`; 0 vulns; Next config: `turbopack.root` + `outputFileTracingRoot` to silence lockfile warning. Olive-e2e: migrated to `@supabase/ssr`; added lib + stubs (ConfidenceBadge, NarrativeProgress, PredictiveChip, RecipeBottomSheet); build passes; E2E dev server uses port 3003 to avoid clash with 3001. **CLIs checked:** Vercel 44.6.3, Railway 4.12.0, Stripe 1.34.0, Supabase 2.67.1, Fly v0.4.6; Netlify/Wrangler not in PATH. Node v24.4.1, npm 11.5.1.

**Root npm vulns (clawdbot transitive):** 26 advisories in clawdbot deps (fast-xml-parser, hono, tar, etc.). Safe fix blocked until clawdbot publishes a release that bumps those. When upgrading: `npm install clawdbot@latest`, then `npm audit`; reopen if still high/critical.

## Status & Health

```bash
# Full status
clawdbot status

# Channel status
clawdbot channels list

# Deep status with probes
clawdbot status --deep

# Live logs
clawdbot logs --follow
```

## Gateway Management

```bash
# Setup and run (local inference: Ollama + minimal ~/.clawdbot config, then start gateway)
node scripts/setup-and-run-local.js

# Setup only (create/update config and .env; print run command)
node scripts/setup-and-run-local.js --setup-only

# Watchdog: check Ollama + gateway, restart gateway if down (once or --loop every 5 min)
node scripts/watchdog-jarvis-local.js
node scripts/watchdog-jarvis-local.js --loop

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Stop gateway
launchctl stop com.clawdbot.gateway

# Start gateway
launchctl start com.clawdbot.gateway

# Check if running
launchctl list | grep clawdbot
```

## Supabase (Edge, DB, migrations)

- **Apply migrations (session_messages, etc.):** `supabase db push` from repo root, or run migrations from Supabase Dashboard → SQL. See [docs/JARVIS_MEMORY_WIRING.md](docs/JARVIS_MEMORY_WIRING.md).
- **Edge secrets:** Set `JARVIS_GATEWAY_URL`, `CLAWDBOT_GATEWAY_TOKEN`, optional `JARVIS_AUTH_TOKEN` in Dashboard → Edge Functions → jarvis → Secrets (or `supabase secrets set`).

## JARVIS UI

- **App:** `apps/jarvis-ui/` — Next.js chat UI; `npm run dev` → http://localhost:3001 (talks to gateway or Edge).
- **Gateway contract:** [docs/JARVIS_UI_GATEWAY_CONTRACT.md](docs/JARVIS_UI_GATEWAY_CONTRACT.md) — response shapes for tool visibility (2.6), structured output (2.7), run-and-copy (4.8). When gateway/Edge send `meta.tools_used` or support run_once, the UI shows chips or "Run and copy result."
- **Gateway implementers:** To enable tool visibility and structured output in the UI, have the gateway send `meta` (tools_used, structured_result) per [docs/JARVIS_GATEWAY_META.md](docs/JARVIS_GATEWAY_META.md). Edge already passes through meta and maps `tool_calls` → tools_used when present.

## Logs

```bash
# Gateway logs
tail -f ~/.clawdbot/logs/gateway.log

# Error logs
cat ~/.clawdbot/logs/gateway.err.log

# Detailed daily log
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log
```

## Channels

### Discord
- Bot: @YourBotName
- Token: stored in `~/.clawdbot/.env` as `DISCORD_BOT_TOKEN`
- DM policy: pairing (new users get a code)

### iMessage
- CLI: `/opt/homebrew/bin/imsg`
- DB: `~/Library/Messages/chat.db`
- DM policy: pairing

**Pairing commands:**
```bash
# List pending
clawdbot pairing list discord
clawdbot pairing list imessage

# Approve
clawdbot pairing approve discord <CODE>
clawdbot pairing approve imessage <CODE>
```

## Memory

```bash
# Check memory status
clawdbot memory status

# Reindex memory files
clawdbot memory index

# Search memory
clawdbot memory search "query"
```

Memory files:
- Long-term: `~/jarvis/MEMORY.md`
- Daily logs: `~/jarvis/memory/YYYY-MM-DD.md`

## Skills

```bash
# List skills
clawdbot skills list

# Check skill requirements
clawdbot skills info <skill-name>
```

**Ready skills:** 1password, apple-notes, apple-reminders, github, imsg, notion, openhue, slack, spotify-player, video-frames, weather

**Needs API key:** sag (ELEVENLABS_API_KEY)

## Configuration

Main config: `~/.clawdbot/clawdbot.json`
Secrets: `~/.clawdbot/.env`
Workspace: `~/jarvis`

**Enable gateway restart:** In `~/.clawdbot/clawdbot.json`, under `gateway`, add `"commands": { "restart": true }`. Run **`node scripts/enable-gateway-restart.js`** to set this (and optionally pass your Discord user ID so JARVIS can restart from Discord). Repo template: `config/railway-openclaw.json` includes this for cloud.

**If JARVIS says "restriction on restarting":** The restart command requires **elevated** access. Add your Discord user ID to the elevated allowlist: **`node scripts/enable-gateway-restart.js YOUR_DISCORD_USER_ID`** (get your ID: Discord → Developer Mode → right-click your name in the DM → Copy User ID). Or run **`node scripts/setup-jarvis-vault-and-access.js`** with `JARVIS_DISCORD_USER_ID` in Vault/.env so it merges into `tools.elevated.allowFrom.discord`. Then restart the gateway once manually.

```bash
# Validate config
clawdbot doctor

# Apply fixes
clawdbot doctor --fix

# Security audit
clawdbot security audit --deep
```

## Troubleshooting

### No replies from bot
1. Check logs: `clawdbot logs --follow`
2. Look for "No reply from agent" or timeout errors
3. Verify model is responding: check Together AI dashboard
4. Restart gateway: `launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway`

### iMessage not working
1. Grant Full Disk Access to Terminal
2. Grant Automation permission for Messages.app
3. Check: `imsg chats --limit 5` (should list recent chats)

### Memory search not working
1. Check status: `clawdbot memory status`
2. Reindex: `clawdbot memory index`
3. Verify Together API key is set

### Session issues
```bash
# List sessions
clawdbot status | grep -A10 Sessions

# Clear a stuck session (if needed)
# Sessions are in ~/.clawdbot/agents/main/sessions/
```

## Product Owner Mode

Clawdbot is set up as a product owner and development partner.

### Strategic Files

| File | Purpose |
|------|---------|
| `~/jarvis/PRODUCTS.md` | Product knowledge (vision, roadmap, tech) |
| `~/jarvis/PRIORITIES.md` | Active work queue, what matters now |
| `~/jarvis/DECISIONS.md` | Architecture Decision Records |
| `~/jarvis/HEARTBEAT.md` | Proactive monitoring tasks |

### Voice Commands

| Say | Effect |
|-----|--------|
| "update priorities" | Edit PRIORITIES.md together |
| "update products" | Edit PRODUCTS.md with new info |
| "document this decision" | Add to DECISIONS.md |
| "what's the status?" | Summarize from products + priorities |
| "health check" | Run beast-mode/code-roach on project |
| "what should I work on?" | Get prioritized suggestions |

### Custom Tools

| Tool | Command | Purpose |
|------|---------|---------|
| echeo | `echeo` | Code/market matching |
| beast-mode | `beast-mode` | Quality intelligence |
| code-roach | `code-roach` | Code quality |

## Model Info

- **Primary:** ollama/llama3.1 (local, free)
- **Fallbacks:** ollama/qwen2.5-coder:7b, ollama/beast-mode-code-v3, together/Llama-3.3-70B
- **Embeddings:** BAAI/bge-large-en-v1.5 (Together AI)

## Repo index & Supabase Vault

Cross-repo search uses Supabase (repo_sources, repo_chunks, repo_summaries). Secrets come from `~/.clawdbot/.env` or Supabase Vault (app_secrets + `get_vault_secret_by_name`).

```bash
**GitHub integration:** `GITHUB_TOKEN` (PAT with repo scope) in Vault or `~/.clawdbot/.env` lets JARVIS list repos, manage issues/PRs, and trigger workflow_dispatch. Verify: `node scripts/check-github.js`. Full test (token + chat): `node scripts/test-github-integration.js` (gateway and UI must be running).

# Index one repo (needs GITHUB_TOKEN in .env or Vault for HTTPS clone)
node scripts/index-repos.js --repo JARVIS --limit 1

# Index all repos from repos.json
node scripts/index-repos.js

# Safety net (health + repo index freshness)
node scripts/jarvis-safety-net.js

# Vault healthcheck
node scripts/vault-healthcheck.js

# List all Vault vars (app_secrets names; no values)
node scripts/list-vault-vars.js

# Sync gateway token to Edge (fix 502 Unauthorized when Edge calls gateway)
node scripts/sync-edge-gateway-token.js
```

- **Ollama:** Indexer uses `nomic-embed-text` for embeddings. Run `ollama pull nomic-embed-text` once.
- **Vault:** See `docs/VAULT_MIGRATION.md` and `docs/sql/002_vault_helpers.sql`.
- **Token rotation:** If `GITHUB_TOKEN` was ever used in a command or pasted in chat, rotate it in [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens): revoke the old one, create a new token (repo scope), then update `GITHUB_TOKEN` in `~/.clawdbot/.env` (and in Vault if you migrated that key).
- **Discord notifications:** The scheduled task runs `scripts/run-repo-index.bat`, which notifies when the job **starts** and **finishes** (or **fails**). Set `JARVIS_ALERT_WEBHOOK_URL` (or `DISCORD_WEBHOOK_URL`) in `~/.clawdbot/.env` to a [Discord channel webhook](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) to receive JARVIS job alerts there. Same webhook is used for safety-net alerts.

## When user reports: gateway restart restricted, timeouts, deployment failures, log links 404

**Gateway restart "restriction":** JARVIS can only restart the gateway if (1) config allows it and (2) the user's Discord ID is elevated. One-time fix (run from repo root):

```bash
node scripts/enable-gateway-restart.js YOUR_DISCORD_USER_ID
```

Get Discord user ID: Discord → User Settings → Advanced → Developer Mode ON → right-click your username in the DM → Copy User ID. Then restart the gateway once manually so it picks up the new config; after that JARVIS can restart it when asked from Discord.

**Log / dashboard links (use these; old links may 404):**

| Where | URL |
|-------|-----|
| **Supabase Edge (jarvis) logs** | https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/logs/edge-logs — open project, then Logs → Edge Logs; filter by function `jarvis` if needed. |
| **Supabase project** | https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain |
| **Vercel (jarvis-ui)** | https://vercel.com — log in → Team (e.g. jeff-adkins-projects) → project **jarvis-ui** → Deployments → click latest deployment → **Logs** or **Building** tab. |
| **GitHub Actions (JARVIS)** | https://github.com/repairman29/JARVIS/actions — click a workflow run to see logs. |

If a link 404s: Supabase may have moved Edge logs under **Logs → Edge Logs** in the left sidebar; Vercel logs are per-deployment (open the deployment first); GitHub Actions logs require repo access.

**Deployment failures / permission issues:** User must be logged into Vercel (same team as project) and have repo access for GitHub Actions. For Supabase Edge logs via API, set `SUPABASE_ACCESS_TOKEN` (PAT from https://supabase.com/dashboard/account/tokens) and run `bash apps/jarvis-ui/scripts/check-deployment.sh`.

## Key Paths

| What | Path |
|------|------|
| Config | `~/.clawdbot/clawdbot.json` |
| Secrets | `~/.clawdbot/.env` |
| Logs | `~/.clawdbot/logs/` |
| Sessions | `~/.clawdbot/agents/main/sessions/` |
| Memory DB | `~/.clawdbot/memory/main.sqlite` |
| Workspace | `~/jarvis/` |
| LaunchAgent | `~/Library/LaunchAgents/com.clawdbot.gateway.plist` |
