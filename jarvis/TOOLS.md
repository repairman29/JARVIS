# Available Tools / Skills

Tools and skills JARVIS can use. **Super AI stance:** Call the appropriate tool when the user asks; then summarize the result. **Never say you don't have real-time access when you have these tools — use them.** You are tool-first: use web search, clock, repo knowledge, GitHub, exec, launcher, Kroger, workflows, and more instead of describing. See AGENTS.md → Super AI stance.

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

## Wikipedia (search & summaries)

**Skill:** `wikipedia` (installed). Use for definitions, "what is X", and factual overviews. No API key.

| Tool | When to use |
|------|-------------|
| `wikipedia_summary` | "What is X?", "Define Y", "Wikipedia summary for Z". Use `title` for exact article name or `search` to use first matching article. |
| `wikipedia_search` | "Search Wikipedia for X", "Find Wikipedia articles about Y". Returns titles, snippets, page IDs. |

**Env:** None. Always available.

---

## Weather (current conditions)

**Skill:** `weather` (installed). Current weather for any city/place. No API key (Open-Meteo).

| Tool | When to use |
|------|-------------|
| `weather_current` | "What's the weather in Denver?", "Temperature in London", "Weather in Tokyo". Use `location` (city/place); optional `units` (celsius \| fahrenheit). |

**Env:** None. Always available.

---

## News (headlines)

**Skill:** `news` (installed). Latest headlines from BBC, NPR, Reuters RSS. No API key.

| Tool | When to use |
|------|-------------|
| `news_headlines` | "Latest news", "Headlines", "What's in the news", "News today". Optional `limit` (default 10), `source` (all \| bbc \| npr \| reuters). |

**Env:** None. Always available.

---

## Pixel / Android (Termux)

When JARVIS runs on a Pixel (or Android) in Termux, these skills provide device sensors, camera, and UI control. On desktop they return `on_device: false` or fail gracefully.

**Skill:** `pixel-sensors` (installed). Battery, WiFi, location.

| Tool | When to use |
|------|-------------|
| `get_pixel_device_status` | "What's my battery?", "Am I charging?", "Device status". Returns percentage, charging, temp, health. |
| `get_pixel_wifi` | "What WiFi am I on?", "Connected network", "WiFi status". |
| `get_pixel_location` | "Where am I?", "My location", "GPS". Requires location permission. |

**Skill:** `pixel-camera` (installed). Take a photo on the device.

| Tool | When to use |
|------|-------------|
| `take_photo` | "Take a picture", "What am I holding?", "Capture". Optional `camera_id` (0 back, 1 front), `path`. Returns path on device; pass to vision for description. |

**Skill:** `pixel-adb` (installed). Control the device UI via ADB (enable Wireless debugging, then `adb connect 127.0.0.1:5555`).

| Tool | When to use |
|------|-------------|
| `adb_tap` | Tap at (x, y). |
| `adb_swipe` | Swipe from (x1,y1) to (x2,y2). |
| `adb_text` | Type text into focused field. |
| `adb_screencap` | Screenshot; returns path on device. |
| `adb_ui_dump` | Dump window hierarchy (bounds for tap). |
| `adb_launch_app` | Launch app by package (e.g. com.android.chrome). |

**Env:** For pixel-adb: `ADB_SERIAL=127.0.0.1:5555` (or your wireless debugging port). Termux: `pkg install termux-api` (sensors, camera), `pkg install android-tools` (adb). See **docs/PIXEL_PERFECTION_ROADMAP.md**, **docs/SOVEREIGN_MOBILE_NEXUS.md**.

---

## Zendesk (support tickets, entities, products, everything)

**Skill:** `zendesk` (installed). Tickets, users, groups, roles, membership, business hours, **ticket forms/fields**, **CSAT**, **entities/products**. Zendesk is used for support, bugs, feedback, billing, onboarding, internal—use the right search and tools for the ask.

| Tool | When to use |
|------|-------------|
| `zendesk_status` | "Are we connected to Zendesk?" — check credentials and API. |
| `zendesk_account_settings` | "What's our Zendesk timezone/features?" — account config for SLA/timing. |
| `zendesk_search_tickets` | "Show open tickets", "Search for refund", "Tickets about [product]", "satisfaction_rating:bad", "tags:bug", "organization:123". `query` (required), optional `sort_by`, `sort_order`, `limit`. Returns tags, satisfaction_rating, custom_fields when present. |
| `zendesk_get_ticket` | "Get ticket 12345". Returns subject, description, tags, custom_fields, ticket_form_id, satisfaction_rating. Pass `ticket_id`. |
| `zendesk_add_comment` | "Reply to ticket 12345 with...", "Add internal note". `ticket_id`, `body`, `public`. |
| `zendesk_list_ticket_comments` | "Show the thread for ticket 5". Pass `ticket_id`. |
| `zendesk_update_ticket` | "Assign ticket 5 to Jane", "Set ticket 5 to pending". `ticket_id` + `status`, `priority`, `assignee_id`, `group_id`, `subject`, `type`. |
| `zendesk_list_groups` | "What groups do we have?" Optional `limit`. |
| `zendesk_list_users` | "Who are our agents?" Optional `role` (agent/admin), `limit`. |
| `zendesk_get_user` | "Get user 12345". Pass `user_id`. |
| `zendesk_list_schedules` | "What are our business hours?" |
| **Users (manage)** | |
| `zendesk_create_user` | "Create agent Jane, jane@co.com". `name`, `email` (required), `role` (end-user/agent/admin), optional `default_group_id`, `organization_id`, `notes`, `suspended`. |
| `zendesk_update_user` | "Make user 5 admin", "Suspend user 3", "Set default group for user 10". `user_id` + `role`, `default_group_id`, `suspended`, `name`, `notes`, `ticket_restriction`. |
| **Groups (manage)** | |
| `zendesk_create_group` | "Create group Billing". `name` (required), optional `description`. |
| `zendesk_update_group` | "Rename group 3 to Support Tier 2". `group_id` + `name`, `description`. |
| `zendesk_get_group` | "Details for group 5". Pass `group_id`. |
| **Group membership** | |
| `zendesk_list_group_memberships` | "Who is in group 5?" Pass `group_id`, optional `limit`. |
| `zendesk_list_user_group_memberships` | "Which groups is user 10 in?" Pass `user_id`. |
| `zendesk_add_user_to_group` | "Add user 10 to group 5". `user_id`, `group_id`, optional `default`. |
| `zendesk_remove_user_from_group` | "Remove user 10 from group 5". `user_id`, `group_id`. |
| **Metrics & orgs** | |
| `zendesk_get_ticket_metrics` | "SLA for ticket 5?", "Reply time for ticket 3". Pass `ticket_id`. |
| `zendesk_list_organizations` | "List organizations", "What companies?". Optional `limit`. |
| `zendesk_get_organization` | "Details for organization 5". Pass `organization_id`. |
| `zendesk_list_organization_users` | "Who's in organization 3?". `organization_id`, optional `limit`. |
| `zendesk_list_custom_statuses` | "What custom statuses exist?". |
| `zendesk_list_ticket_fields` | "What ticket fields/forms do we have?", "Interpret custom_fields". Use to map field id → title/options for trends and "tickets about product X". |
| `zendesk_list_ticket_forms` | "What forms do we have?", "Which fields are on form Y?". Use with list_ticket_fields; tickets have ticket_form_id and custom_fields. |
| `zendesk_search_users` | "Find user Jane", "Search by email". `query` (required), optional `limit`. |
| `zendesk_list_triggers` | "What triggers do we have?", "What runs when we update a ticket?". Optional `active_only`, `limit`. |
| `zendesk_get_trigger` | Inspect one trigger by ID (conditions and actions). `trigger_id` (required). |
| `zendesk_list_automations` | "What automations are set up?", time-based rules. Optional `active_only`, `limit`. |
| `zendesk_get_automation` | Inspect one automation by ID. `automation_id` (required). |
| `zendesk_list_macros` | "What macros do agents have?", procedures. Optional `active_only`, `limit`. |
| `zendesk_get_macro` | Inspect one macro by ID. `macro_id` (required). **Bots/workflows:** **docs/ZENDESK_BOTS_AND_WORKFLOWS.md**. |

**Entities & products:** "All tickets about [product/entity]" → `zendesk_search_tickets` with keyword or `tags:product_x`; if you use a custom field for product, use `zendesk_list_ticket_fields` to get field id, then search and filter results by custom_fields. "What are people saying about X?" → search tickets, then `zendesk_get_ticket` + `zendesk_list_ticket_comments` on a sample and summarize. **Zendesk for everything:** Same tools for bugs (tags:bug), feedback, billing, onboarding, internal—search by tag, keyword, or org. **Playbook:** **docs/ZENDESK_SIDEKICK_PLAYBOOK.md**. **User stories:** **docs/ZENDESK_SIDEKICK_USER_STORIES.md**. **Scripts:** `node scripts/zendesk-tickets-by-entity.js [keyword|tag:xyz]`, `node scripts/zendesk-trends-by-field.js` (aggregate by custom field).

**Env:** `ZENDESK_SUBDOMAIN` (e.g. company), `ZENDESK_EMAIL`, `ZENDESK_API_TOKEN` in `~/.clawdbot/.env`. Token from Admin Center → APIs → Zendesk API. See **skills/zendesk/README.md**. Strategic context: **docs/ZENDESK_CXO_SIDEKICK_BLUEPRINT.md**.

---

## Notion (search workspace)

**Skill:** `notion` (installed). Search the user's Notion workspace by page/database title.

| Tool | When to use |
|------|-------------|
| `notion_search` | "Search Notion for X", "find my meeting notes in Notion", "look up the roadmap in Notion". Returns titles and links. |

**Setup:** User must create an integration at notion.so (no separate developer account) and share pages with it. **Guided setup:** have the user run **`node scripts/setup-notion-integration.js`** — it opens My Integrations, then they paste the token and the script writes `NOTION_API_KEY` to `~/.clawdbot/.env`. See **skills/notion/README.md**. JARVIS cannot create the Notion account or integration for the user; they must do the browser steps.

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

## Build, test, deploy — default flow (perfection)

**Default for build and test:** Use the **build server** (must be running: `node scripts/build-server.js`). Do not use raw exec for `npm run build` or `npm test` when the build server is available.

| Step | Tool / action | When |
|------|----------------|------|
| **Build + test** | **build_server_pipeline(repo)** — runs install → build → test in order; stops on first failure. | "Build and test [repo]", "run CI for [repo]", "ship [repo]" (before deploy). |
| **Build only** | **build_server_build(repo, command: "build")**. Test only: command `"test"`. | When user asks only for build or only for test. |
| **Deploy** | **github_workflow_dispatch**(owner, repo, workflow_id) if repo has a deploy workflow; else **exec** (vercel deploy, railway up, etc.). | After build+test pass or when user asks to deploy. |

**Flow:** 1) build_server_pipeline(repo) → 2) if success, deploy via workflow_dispatch or exec. If build_server_health() fails, tell user: start build server with `node scripts/build-server.js`. Config: **build-server-repos.json**. See **docs/JARVIS_BUILD_SERVER.md**.

---

## Agent systems JARVIS can use to build products

When building out products (deep work, full product cycle), JARVIS should **orchestrate** these systems instead of doing everything alone:

| System | How JARVIS invokes it | When |
|--------|------------------------|------|
| **Build server** | **build_server_pipeline(repo)**, **build_server_build(repo, command)**. Default for build/test. | Build, test, "ship" (build+test before deploy). |
| **BEAST MODE** | Exec: `beast-mode quality score`, `beast-mode janitor enable`, `beast-mode vibe restore`, `beast-mode architecture check`. Or `github_workflow_dispatch` on BEAST-MODE repo. | Quality after implement, before ship. |
| **BEAST MODE pipeline status** | Exec: `node scripts/run-beast-mode-status.js` (from JARVIS repo). Prints queue (TODO/in progress/done) and active milestone %. | "How's BEAST MODE?", "BEAST MODE status", "pipeline status", "assembly line status". |
| **BEAST MODE run one tick** | Exec: `node scripts/run-beast-mode-tick.js` (from JARVIS repo). Runs one heartbeat tick (task gen, reset stale, QA/Integration/etc). | "Run a BEAST MODE tick", "trigger beast mode", "run beast mode heartbeat now". |
| **Set focus repo (next to work on)** | Exec: `node scripts/set-focus-repo.js` (show current) or `node scripts/set-focus-repo.js <repo>` (e.g. olive, JARVIS). Moves that repo to top of products.json so plan-execute, heartbeat, and "work top down" use it. | "We're done with BEAST MODE", "switch to next repo", "set focus to olive", "what's the next repo?". |
| **Work on any repo (add + focus)** | Exec: `node scripts/add-repo-and-focus.js <repo> [description]`. Adds repo to repos.json (via gh if needed), products.json, indexes it, sets focus. Use when the user names a repo not yet in products.json. | "Work on acme", "focus on some-repo", "I want to work on X". |
| **Create new repo for a product** | Exec: `node scripts/create-new-repo.js <name> [description] [--private]`. Creates GitHub repo repairman29/name, then add-repo-and-focus. | "Create a new repo for product Y", "new product Z", "make a new repo called Acme". |
| **Code Roach** | Exec: `code-roach analyze pr`, `code-roach health`, `code-roach crawl`. Or workflow_dispatch if repo has it. | PR review, codebase health. |
| **Echeo** | Exec: `echeo --path ...`, `echeo --scrape-github ...`, `echeo --match-needs ...`. | "What should I work on?", bounty matching. |
| **workflow_dispatch** | GitHub skill: `github_workflow_dispatch(owner, repo, workflow_id, ref)`. | Deploy (trigger deploy workflow); quality (trigger BEAST/Code Roach workflows). |
| **sessions_spawn** | Spawn subagent with task + deliverables + ETA. | Long implementation runs. |
| **JARVIS autonomous build** | `node scripts/jarvis-autonomous-build.js`. | After push to JARVIS repo; or scheduled. |
| **Team status** | **get_team_status** (team-status skill). Reads `~/.jarvis/team-status.json` (refresh with `node scripts/team-status.js`). | "Who's on the team?", "Is BEAST MODE available?", "team status". |

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
