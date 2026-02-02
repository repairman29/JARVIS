# Available Tools / Skills

Tools and skills JARVIS can use. Call the appropriate tool when the user asks; then summarize the result. **Never say you don't have real-time access when you have these tools — use them.**

---

## Web Search (Brave)

**Skill:** `web-search` (installed). Use for current information, news, facts, and anything that requires live data.

| Tool | When to use |
|------|-------------|
| `web_search` | User asks for real-time info: "what's the date today?", "current time Denver", "latest news", "weather 80202", "search the web for X". **Prefer calling this over saying you don't have access to real-time information.** |

**Env:** `BRAVE_API_KEY` (or `BRAVE_SEARCH_API_KEY`) in `~/.clawdbot/.env`. Start gateway with `node scripts/start-gateway-with-vault.js`.

---

## Clock (current date/time)

**Skill:** `clock` (installed). Use so you never say you don't have real-time access for date/time.

| Tool | When to use |
|------|-------------|
| `get_current_time` | "what time is it?", "what's the date?", "current time in Denver", "time in London", "what day is it?" Use timezone (e.g. America/Denver) when user mentions a place. |

**Env:** None. Always available.

---

## Kroger / King Soopers (grocery)

**Skill:** `kroger` (installed). Use for any Kroger/King Soopers product search, prices, shopping lists, or store lookup.

| Tool | When to use |
|------|--------------|
| `kroger_search` | User asks for price or search: "price of milk at Kroger", "search Kroger for eggs" |
| `kroger_stores` | User asks for stores: "Kroger near 80202", "King Soopers stores 80123" |
| `kroger_shop` | User wants a list with prices: "shopping list for tacos", "Kroger shop milk eggs bread". Supports quantities and fulfillment (curbside/delivery). Reply with orderSummary, total, cartUrl, and product links for a flawless handoff. |
| `kroger_cart` | User wants to open cart: "open my Kroger cart", "Kroger cart" |
| `kroger_add_to_cart` | Add items by UPC to user's Kroger cart. Requires `KROGER_REFRESH_TOKEN` (run oauth-helper.js once). |
| `kroger_shop_and_add` | Build list by search terms **and** add those items to user's Kroger cart. Requires `KROGER_REFRESH_TOKEN`. Prefer this when user says "add X to my Kroger cart" or "order X from Kroger". |

**Env:** `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `KROGER_LOCATION_ID` (required for prices). For add-to-cart: `KROGER_REFRESH_TOKEN` (one-time OAuth; see `skills/kroger/CART_API.md`).

---

## Launcher / Productivity

**Skill:** `launcher` (installed). Use for app launching, system controls, calculations, screenshots.

| Tool | When to use |
|------|-------------|
| `launch_app` | "launch Chrome", "open VS Code", "new Safari window" |
| `quit_app` | "quit Slack", "close Spotify", "force quit Chrome" |
| `system_control` | "turn up volume", "lock screen", "toggle dark mode" |
| `quick_calc` | "15% of 240", "5 miles to km", "sqrt(144)" |
| `process_manager` | "what's using CPU", "kill Chrome process" |
| `screenshot` | "take screenshot", "screenshot Chrome window" |
| `open_url` | "open github.com", "open reddit in incognito Chrome" |

---

## Window Manager

**Skill:** `window-manager` (installed). Advanced window management and workspace control.

| Tool | When to use |
|------|-------------|
| `snap_window` | "snap Chrome left half", "maximize VS Code", "center window" |
| `move_window` | "move to second monitor", "put on main display" |
| `window_arrangement` | "arrange in two columns", "create 2x2 grid" |
| `workspace_save` | "save my coding workspace", "remember this layout" |
| `workspace_restore` | "restore design workspace", "load coding setup" |

---

## File Search

**Skill:** `file-search` (installed). Intelligent file discovery and content search.

| Tool | When to use |
|------|-------------|
| `search_files` | "find my React project", "search for PDF about taxes" |
| `recent_files` | "what did I work on yesterday?", "show recent images" |
| `file_operations` | "open that file", "copy file path", "preview document" |
| `search_content` | "find files containing API key", "search code for useEffect" |
| `find_duplicates` | "find duplicate photos", "show duplicate downloads" |

---

## Repo Knowledge (Cross-Repo RAG)

**Skill:** `repo-knowledge` (installed). Semantic search and summaries across repairman29 repos.

| Tool | When to use |
|------|--------------|
| `repo_search` | "search all repos for OAuth refresh", "find embedding code in echeo" |
| `repo_summary` | "summarize BEAST-MODE", "what is smuggler?" |
| `repo_file` | "show me file chunks from repo X path Y" |
| `repo_map` | "repo map for JARVIS" |

**Product capabilities (what products CAN do):** When answering "what can [product] do?" or "what does [product] support?", use **repo_summary(repo)** and **repo_search** in that product's repo (from products.json) to get **code-grounded** capabilities — not only products.json description. See **docs/PRODUCT_CAPABILITIES.md**.

**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_ANON_KEY`. Resolved from `~/.clawdbot/.env` or **Supabase Vault** (app_secrets + `get_vault_secret_by_name`). Keep the index fresh with `node scripts/index-repos.js` (see Repo index & Vault below).

---

## Clipboard History

**Skill:** `clipboard-history` (installed). Intelligent clipboard management.

| Tool | When to use |
|------|-------------|
| `search_clipboard` | "find that API key", "search clipboard for URLs" |
| `get_clipboard_history` | "show clipboard history", "recent clipboard items" |
| `paste_clipboard_item` | "paste the second thing I copied", "paste URL to Chrome" |
| `clipboard_operations` | "pin this item", "delete sensitive clipboard data" |

---

## Snippets / Text Expansion

**Skill:** `snippets` (installed). Intelligent text expansion with dynamic templates.

| Tool | When to use |
|------|-------------|
| `create_snippet` | "create email signature snippet", "make meeting template" |
| `expand_snippet` | "expand my signature", "use meeting template" |
| `search_snippets` | "find email snippets", "show code templates" |
| `snippet_analytics` | "what snippets do I use most?", "optimize my snippets" |

---

## Calculator / Mathematical Computing

**Skill:** `calculator` (installed). Advanced mathematics with units, currency, programming.

| Tool | When to use |
|------|-------------|
| `calculate` | "calculate 15% of 240", "sqrt(144)", "sin(45 degrees)" |
| `convert_units` | "convert 5 miles to km", "100 fahrenheit to celsius" |
| `convert_currency` | "convert 100 USD to EUR", "exchange rate GBP to JPY" |
| `programming_calc` | "convert FF hex to binary", "bitwise AND 1010 and 1100" |
| `financial_calc` | "compound interest 1000 at 5% for 10 years" |
| `statistics_calc` | "mean and standard deviation of [1,2,3,4,5]" |

---

## Workflow Automation / AI Orchestration

**Skill:** `workflow-automation` (installed). AI-powered workflow creation and command chaining.

| Tool | When to use |
|------|-------------|
| `create_workflow` | "create morning routine workflow", "automate project setup" |
| `execute_workflow` | "run my morning routine", "execute project setup workflow" |
| `chain_commands` | "find React files, open in VS Code, snap left" |
| `workflow_templates` | "show productivity templates", "install focus mode template" |
| `ai_suggestions` | "suggest workflows for my routine", "optimize my workflow" |
| `learn_patterns` | "analyze my usage", "suggest automation opportunities" |

---

## Voice Control

**Skill:** `voice-control` (installed). Hands-free operation with wake word detection.

| Tool | When to use |
|------|-------------|
| `start_voice_recognition` | "start listening", "enable voice control" |
| `voice_command` | "Hey JARVIS, launch Chrome", "JARVIS, what time is it?" |
| `voice_shortcuts` | "create voice shortcut", "focus time runs focus mode" |
| `voice_training` | "train my wake word", "improve voice recognition" |

---

## Performance Monitor

**Skill:** `performance-monitor` (installed). System health monitoring and optimization.

| Tool | When to use |
|------|-------------|
| `system_health` | "check system health", "JARVIS performance report" |
| `optimize_performance` | "optimize JARVIS", "clean up and speed up system" |
| `performance_benchmark` | "benchmark JARVIS performance", "test system speed" |
| `monitor_realtime` | "start performance monitoring", "alert on high CPU usage" |

---

## Skill Marketplace

**Skill:** `skill-marketplace` (installed). Community skill ecosystem and management.

| Tool | When to use |
|------|-------------|
| `discover_skills` | "find productivity skills", "search for Spotify integration" |
| `install_skill` | "install the GitHub skill", "add weather skill" |
| `manage_skills` | "list my skills", "update all skills", "disable music skill" |
| `skill_analytics` | "what skills are trending?", "skill recommendations" |

---

## GitHub (PAT — Repos, Issues, PRs, Workers)

**Skill:** `github` (installed). Connect with GITHUB_TOKEN to list repos, manage issues/PRs, and trigger workflow_dispatch (workers/subagents).

**Env:** `GITHUB_TOKEN` in `~/.clawdbot/.env` or `%USERPROFILE%\.clawdbot\.env` (do not commit).

| Tool | When to use |
|------|--------------|
| `github_status` | "Is GitHub connected?", "check GitHub token" |
| `github_repos` | "list my repos", "repos for org X" |
| `github_issues` | "create issue in owner/repo", "comment on issue #5", "list open issues" |
| `github_pulls` | "list open PRs", "create PR from branch X", "get PR #3" |
| `github_workflow_dispatch` | "trigger deploy workflow", "run the worker on main", drive workers/subagents |
| `github_branches` | "branches in owner/repo" |
| `github_workflows` | "what workflows exist in this repo?" (to find workflow_id for dispatch) |

---

## Pull requests (GitHub)

**Skill:** `pull-request` (installed). GitHub PR workflow: list, create, get, merge, comment, submit review, request reviewers. Uses same GITHUB_TOKEN as GitHub skill.

**Env:** `GITHUB_TOKEN` in `~/.clawdbot/.env` or `%USERPROFILE%\.clawdbot\.env` (do not commit).

| Tool | When to use |
|------|--------------|
| `list_prs` | "list open PRs in owner/repo", "PRs for branch X", "show PRs" |
| `get_pr` | "get PR #5", "details of PR 12", "what's in PR #3?" |
| `create_pr` | "create a PR from feature to main", "open a PR for branch X" |
| `merge_pr` | "merge PR #7", "squash and merge PR #3", "merge the open PR" |
| `pr_comment` | "comment on PR #5: LGTM", "add a comment to PR #3" |
| `pr_review` | "approve PR #5", "request changes on PR #3", "submit review on PR #7" |
| `request_review` | "request alice and bob to review PR #5", "add reviewers to PR #2" |

**Path:** `skills/pull-request/` — distinct from PR (Public Relations). Prefer for merge, review, request-review; use GitHub skill for issues, workflow_dispatch, branches.

---

## PR (Public Relations / comms)

**Skill:** `pr` (installed). Public Relations and communications: key messages, press release outline, social post templates, media pitch, comms brief. Use for comms strategy and drafting.

**Env:** None.

| Tool | When to use |
|------|--------------|
| `key_messages` | "key messages for [product] for press", "talking points for [audience]" |
| `press_release_outline` | "press release outline for [announcement]", "press release structure" |
| `social_post_templates` | "social post for [topic] for Twitter/LinkedIn", "tweet ideas for launch" |
| `media_pitch_outline` | "media pitch for [story angle]", "pitch outline for tech press" |
| `comms_brief` | "comms brief for [launch]", "comms playbook for [announcement]" |

**Path:** `skills/pr/` — SKILL.md for examples. Tools return outlines/templates; agent or user fills in copy.

---

## Master product list (work top-down)

**products.json** (repo root) is the ordered list of products; **array order = priority** (top = work first). See **PRODUCTS.md**.

- When the user says “work top down”, “what should I work on?”, or “next product” — read `products.json` and use the first active product(s) in order.
- Each entry: `name`, `repo` (GitHub repo name), `description`, optional `status` (`active` / `paused` / `archived`), optional **`shipAccess`** (`true` = JARVIS can ship: commit, push, deploy, run ops), optional **`deepWorkAccess`** (`true` = JARVIS can do full-cycle planning, development, execution). See **docs/JARVIS_FULL_ACCESS_ONE_PRODUCT.md** and **jarvis/DEEP_WORK_PRODUCT.md**.
- For products with **`shipAccess: true`**, when the user says “ship [product],” “you have full access to [product],” or “run the operation for [product]” — JARVIS may commit, push, and run deploy/scripts for that repo (within guardrails: no destructive without explicit ask, never commit secrets). Ensure elevated exec is allowed for the channel and GITHUB_TOKEN (and deploy tokens) are available to the gateway.
- For products with **`deepWorkAccess: true`**, when the user says "deep work on [product]," "full product cycle for [product]," or "plan, develop, and execute [product]" — JARVIS does **deep work**: planning (PRD, roadmap, metrics), development (issues, PRs, implementation, tests), and execution (ship, run operation). See **jarvis/DEEP_WORK_PRODUCT.md**. Ship access is still required for JARVIS to push/deploy; deepWorkAccess grants sustained full-cycle focus.
- Edit the file to reorder, add, remove products, or grant/revoke shipAccess / deepWorkAccess.

---

## Agent systems JARVIS can use to build products

When building out products (deep work, full product cycle), JARVIS should **orchestrate** these systems instead of doing everything alone:

| System | How JARVIS invokes it | When |
|--------|------------------------|------|
| **BEAST MODE** | Exec: `beast-mode quality score`, `beast-mode janitor enable`, `beast-mode vibe restore`, `beast-mode architecture check`. Or `github_workflow_dispatch` on BEAST-MODE repo. | Quality after implement, before ship. |
| **Code Roach** | Exec: `code-roach analyze pr`, `code-roach health`, `code-roach crawl`. Or workflow_dispatch if repo has it. | PR review, codebase health. |
| **Echeo** | Exec: `echeo --path ...`, `echeo --scrape-github ...`, `echeo --match-needs ...`. | "What should I work on?", bounty matching. |
| **workflow_dispatch** | GitHub skill: `github_workflow_dispatch(owner, repo, workflow_id, ref)`. | Ship (deploy/build); quality (trigger BEAST/Code Roach workflows). |
| **sessions_spawn** | Spawn subagent with task + deliverables + ETA. | Long implementation runs. |
| **JARVIS autonomous build** | `node scripts/jarvis-autonomous-build.js`. | After push to JARVIS repo; or scheduled. |

Full build flow and table: **docs/JARVIS_AGENT_ORCHESTRATION.md**. AGENTS.md → "Agent orchestration" instructs JARVIS to use these when doing deep work or building out a product.

---

## Repairman29 Repo Automation (CLI / Scripts)

Use these **repo scripts** for operations, deployment, and background work. Prefer these over ad‑hoc commands when the task matches.

### Repo index & Supabase Vault

Secrets for indexer and Supabase come from `~/.clawdbot/.env` or **Supabase Vault** (app_secrets + RPC `get_vault_secret_by_name`). See `docs/VAULT_MIGRATION.md` and `docs/sql/002_vault_helpers.sql`.

| Command / Script | When to use |
|------|-------------|
| `node scripts/index-repos.js` | Index all repos from repos.json into Supabase (chunks + embeddings). Needs `GITHUB_TOKEN` (or SSH) and Ollama `nomic-embed-text`. |
| `node scripts/index-repos.js --repo JARVIS --limit 1` | Index a single repo (e.g. JARVIS). Use after adding a repo or for a quick refresh. |
| `node scripts/jarvis-safety-net.js` | Health checks: system, gateway, GitHub, Discord, **repo index freshness**, website. Writes snapshot to `~/.jarvis/health/`. |
| `node scripts/jarvis-safety-net.js --repair` | Run safety net and attempt safe recovery actions. |
| `node scripts/vault-healthcheck.js` | Verify Vault access (app_secrets + decrypted secrets via RPC). |
| `powershell -ExecutionPolicy Bypass -File scripts\\add-repo-index-schedule.ps1` | Schedule daily repo index at 3 AM (Windows Task Scheduler). Run once. |

**Ollama:** Indexer uses `nomic-embed-text`. Run `ollama pull nomic-embed-text` once.

### Autonomous build (JARVIS building for you)

| Command / Script | When to use |
|------|-------------|
| `node scripts/jarvis-autonomous-build.js` | **Autonomous build**: pull latest, validate all skills (JSON + JS), run optimize-jarvis --quick, build any in-repo subprojects that have a `build` script (discovered automatically). Non-interactive; for scheduled or scripted use. |
| `scripts\run-autonomous-build.bat` | Run autonomous build from repo root (pass-through args: e.g. `--dry-run`, `--skip-pull`, `--skip-build`, `--log path`). |
| `powershell -ExecutionPolicy Bypass -File scripts\\add-autonomous-build-schedule.ps1` | Schedule daily autonomous build at 4 AM (Windows Task Scheduler). Remove via Task Scheduler → "JARVIS Autonomous Build" → Delete. |

See **docs/REPAIRMAN29_OPERATIONS.md** → "Autonomous Build (scheduled)".

### Other repo scripts

| Command / Script | When to use |
|------|-------------|
| `node scripts/jarvis-admin.js` | Full deployment, repo configuration, releases, community setup, health checks. |
| `node scripts/manage-website.js` | GitHub Pages status, build health, site metrics, content refresh. |
| `node scripts/optimize-jarvis.js` | Performance cleanup, cache cleanup, workflow optimization. |
| `node scripts/setup-wizard.js` | Guided setup for new machines or clean installs. |
| `bash scripts/deploy-jarvis.sh` | End‑to‑end deploy to GitHub + Pages (Linux/macOS). |
| `powershell -ExecutionPolicy Bypass -File scripts\\test-3-questions.ps1` | Quick CLI sanity check (agent responsiveness). |
| `powershell -ExecutionPolicy Bypass -File scripts\\test-pm-beast-mode.ps1` | JARVIS as PM for Beast-Mode (3 prompts: mission, PRD outline, next action). See scripts/PM_BEAST_MODE_CLI.md. |
| `npx clawdbot agent --session-id "beast-mode-pm" --message \"...\" --local` | Run JARVIS as product manager for Beast-Mode; use same session for context. |
| `npx clawdbot gateway run` | Run gateway locally for interactive ops. |
| `npx clawdbot agent --session-id <id> --message \"...\" --local` | Run a single agent turn in CLI. |
| `npx clawdbot message send --channel discord --target user:<id> --message \"...\"` | Send a message to Discord via CLI (delivery check). |

### Video creation / Olive promo

| Command / Script | When to use |
|------|-------------|
| `./scripts/olive-promo-video.sh` | **Olive (shopolive.xyz) promo**: record demo → MP4 + GIF. Use when user asks for “videos for Olive,” “promo for shopolive.xyz,” “MP4 and GIF for Olive.” Output: `scripts/olive-promo-output/olive-hero.mp4`, `olive-hero.gif`, `olive-micro.gif`. |
| `./scripts/olive-promo-video.sh --skip-record` | Regenerate GIFs from existing recording (e.g. after re-running record and having a new .webm in output/recordings). |
| `skills/video-creation/create-website-demo.sh olive https://shopolive.xyz [script.txt] [voice-id]` | Full website demo with optional ElevenLabs voiceover. Then run olive-promo-video.sh or ffmpeg to produce GIFs. |

**Video-creation skill:** `skills/video-creation/` — Playwright browser recording, ffmpeg (MP4, GIF), optional voiceover. See **skills/video-creation/SKILL.md** and **docs/JARVIS_OLIVE_VIDEO_PROMO.md** for Olive promo scope and JARVIS instructions.

---

## Tool keeper (keep CLIs sharp)

**Skill:** `keep-clis-sharp` (Cursor project skill: `.cursor/skills/keep-clis-sharp/`). Use when the user says CLIs are outdated, "keep our knives sharp", tool maintenance, or periodic tool updates.

- **Audit:** npm (root, apps/jarvis-ui, olive-e2e), platform CLIs (Vercel, Railway, Stripe, Supabase, Fly, Netlify, Wrangler), repo scripts.
- **Update safely:** Prefer `npm update` and non-breaking bumps; document major changes in jarvis/TOOLS.md and RUNBOOK.md.

---

## Platform CLIs (Maestro)

JARVIS **conducts** these CLIs like a maestro: choose the right tool, run the right subcommand, interpret output, chain when needed, summarize. Use **exec** (or **bash** when elevated) when the user asks for deployments, payments, platform ops, or IDE/editor control. Require **elevated** or **exec** allowlist when configured.

| CLI | When to use | Example commands |
|-----|--------------|-------------------|
| **Vercel** | Deploy frontends, env, previews, logs | `vercel deploy`, `vercel env pull`, `vercel logs`, `vercel link` |
| **Railway** | Deploy backends, services, logs, vars | `railway up`, `railway logs`, `railway variables`, `railway link` |
| **Stripe** | Webhooks, triggers, products, customers | `stripe listen`, `stripe trigger payment_intent.succeeded`, `stripe products list`, `stripe customers list` |
| **Fly.io** | Deploy apps, scale, logs, secrets | `fly deploy`, `fly scale count 2`, `fly logs`, `fly secrets set KEY=val` |
| **Cursor** | IDE/editor from terminal (when available) | `cursor .`, `cursor path/to/file` — open project or file in Cursor |
| **Netlify** | Deploy sites, env, functions | `netlify deploy`, `netlify env:pull`, `netlify functions:list` |
| **Cloudflare (Wrangler)** | Workers, pages, KV | `wrangler deploy`, `wrangler pages deploy`, `wrangler kv:key list` |

**Conducting rules:**

- **Pick the right instrument:** Deploy frontend → Vercel/Netlify. Deploy backend/service → Railway/Fly. Payments/webhooks → Stripe. Open IDE → Cursor.
- **One command, then summarize:** Run the CLI command; report success, failure, or next step. Don’t guess—run it.
- **Chain when asked:** "Deploy to Vercel and then trigger a Stripe sync" → run `vercel deploy`, then the Stripe command; report both.
- **Env/auth:** These CLIs use their own login (e.g. `vercel login`, `railway login`, `stripe login`) or env vars (`VERCEL_TOKEN`, `RAILWAY_API_KEY`, `STRIPE_API_KEY`). If a command fails with auth, say what to run or set.
- **Destructive commands:** For `fly apps destroy`, `railway delete`, or similar, confirm with the user before running.

**Config:** Elevated/exec must be allowed for the channel (e.g. Discord user in `tools.elevated.allowFrom.discord`). See gateway config and TOOLS.md → repo scripts for repo-specific automation.
