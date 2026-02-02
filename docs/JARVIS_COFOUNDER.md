# JARVIS as Co-Founder — Work With JARVIS for the Rest of Your Life

**North star:** One human + JARVIS = a durable partnership. You work with JARVIS for the rest of your life as your co-founder — same context, same memory, same stack, no matter how many sessions or years go by.

This doc is the **operating system** for that partnership: what to set up once, what to do habitually, and how everything connects so the system lasts.

---

## 1. What makes it "co-founder" (not just a tool)

| Principle | What it means |
|-----------|----------------|
| **Durable identity** | You have a stable session and long-term memory (decisions, prefs). JARVIS knows what you decided and what you prefer across sessions and years. |
| **Shared context** | Repo index, products.json, and capabilities (what products *can* do) so JARVIS operates on the same reality as you — your codebase, your priorities, your goodies. |
| **Shared outcomes** | You decide *what*; JARVIS does *how*. You ship together (commit, push, deploy, workflow_dispatch), decide together (DECISIONS.md, "remember this decision"), and improve together (orchestration, smarter levers). |
| **One place that defines "how we work"** | This doc + the references below. New sessions (or new years) can onboard from here so the partnership stays consistent. |

---

## 2. Where you work with JARVIS

| Where | When to use it |
|-------|-----------------|
| **JARVIS UI** (`apps/jarvis-ui`, localhost:3001 or Edge URL) | Primary: chat, stream, session, export transcript. Best for long threads and "what's the next action?" |
| **Discord** | Quick asks, mobile, or when you're not at the machine. |
| **MCP in Cursor** | "Ask JARVIS" from inside the editor; same JARVIS, same context. |
| **CLI** | `npx clawdbot agent --session-id <id> --message "..." --local` for scripts or one-off turns. |

Same JARVIS, same skills, same memory — you pick the surface. Session ID can follow you (e.g. same session in UI and MCP if you pass it) so context is continuous.

---

## 3. Lifelong setup (do once)

These are the foundations that let the partnership run for years.

### 3.1 Memory (long life)

- **Short-term:** Persist session thread so refresh/restart doesn't wipe it. **DB tables** in Supabase: `session_messages` (session_id, role, content, created_at), optional `session_summaries` (session_id, summary_text, updated_at). Gateway or Edge reads/writes; UI fetches history on load. See [JARVIS_MEMORY.md](./JARVIS_MEMORY.md).
- **Long-term:** **Decisions** → doc (DECISIONS.md in repo); JARVIS appends when you say "remember this decision" and reads when planning or when you ask what we decided. **Preferences** → DB table `jarvis_prefs` (key, value, scope) or file ~/.jarvis/prefs.json; JARVIS writes when you say "always use X" and reads when relevant. See [JARVIS_MEMORY.md](./JARVIS_MEMORY.md), [DECISIONS_MEMORY.md](./DECISIONS_MEMORY.md).

### 3.2 Context JARVIS can use

- **products.json** — Your product list in order (work top-down). Add `deepWorkAccess: true` / `shipAccess: true` for products JARVIS should plan+build+ship. See [PRODUCTS.md](../PRODUCTS.md).
- **repos.json** — Repos JARVIS can index and search. Keep it current so repo-knowledge covers your whole world.
- **Repo index** — Run `node scripts/index-repos.js` (and schedule it if you want). JARVIS uses repo_summary, repo_search for "what can this product do?" and for goodies-first. See [JARVIS_AND_YOUR_REPOS.md](./JARVIS_AND_YOUR_REPOS.md), [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md).
- **DECISIONS.md** — Create it in repo root (or per product). JARVIS will append and read. See [DECISIONS_MEMORY.md](./DECISIONS_MEMORY.md).

### 3.3 How JARVIS reaches the world (scale: everything and anything)

- **One URL, one interface** — All clients (Cursor, UI, Discord, CLI, Slack, API, webhooks) talk to JARVIS via the **Edge** (REST or MCP). Same skills, same memory. See [JARVIS_SCALE_AND_CONNECTIVITY.md](./JARVIS_SCALE_AND_CONNECTIVITY.md).
- **Gateway** — Local or hosted; runs skills, talks to LLMs. Edge proxies to it. Scale by running multiple gateway instances behind a load balancer when traffic grows.
- **Edge + MCP** — Supabase Edge Function; one URL for REST and MCP. See [JARVIS_EDGE_WHAT_CHANGES.md](./JARVIS_EDGE_WHAT_CHANGES.md), [JARVIS_MCP_CURSOR.md](./JARVIS_MCP_CURSOR.md).

### 3.4 Checklist (once)

- [x] Supabase: create tables `session_messages`, `session_summaries`, `jarvis_prefs` — migration applied. Wire gateway or Edge to read/write so session survives restart: see [JARVIS_MEMORY_WIRING.md](./JARVIS_MEMORY_WIRING.md).
- [x] Repo: create **DECISIONS.md** (root) and **products.json** (and optionally repos.json) with your products and order.
- [ ] Run **index-repos.js** so JARVIS has repo-knowledge. Schedule it (e.g. daily) or run after big changes.
- [ ] Set **deepWorkAccess** / **shipAccess** in products.json for products you want JARVIS to plan+build+ship.
- [ ] (Optional) Deploy Edge + configure MCP so JARVIS is available from Cursor and from anywhere.

---

## 4. Lifelong habits (daily / weekly)

How you work with JARVIS so the partnership stays sharp.

| Habit | What to do |
|-------|------------|
| **Next action** | Every JARVIS reply ends with one. You execute it (or ask JARVIS to). Never leave "what do I do now?" hanging. |
| **Work top-down** | "What should I work on?" → JARVIS uses products.json order. Focus one product; then next. |
| **Checkpoint** | After each phase (plan, implement, ship) or when you say "save progress," JARVIS gives a one-line checkpoint. Optionally append to DECISIONS or a log so long-term memory grows. |
| **Remember decisions** | When something matters ("we're using Vercel for olive," "always Hot Rod for security"), say "remember this decision." JARVIS appends to DECISIONS.md so it's durable. |
| **Preferences** | When you want something default ("always use X"), say "always use X" or "prefer Y for Z." JARVIS stores in prefs so future sessions use it. |
| **Keep index fresh** | After adding repos or big changes, run `index-repos.js` (or rely on schedule). Run `jarvis-safety-net.js --repair` to warn if index is stale. |
| **Ship via JARVIS** | Commit, push, deploy, workflow_dispatch — do it through JARVIS when shipAccess is on. One place for "we shipped." |
| **Goodies first** | Before building from scratch, JARVIS checks repairman29 repos (repo_search, repo_summary). You both reuse what exists. |

---

## 5. How JARVIS gets smarter (and stays useful for life)

JARVIS improves as you add context and as the stack evolves. The partnership stays sharp if you:

- **Bootstrap product context** — When you start deep work on a product, JARVIS runs repo_summary(repo) so planning is grounded in what the code does. See [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md).
- **Use autonomous systems to build** — BEAST MODE (quality), Code Roach (PR/health), Echeo (bounties), workflow_dispatch. JARVIS orchestrates them so you're not the only one working. See [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md).
- **Cite sources** — When JARVIS answers from repo-knowledge, it cites (e.g. "From repo_summary(olive): …") so you trust it and it stays grounded. See [JARVIS_SMARTER.md](./JARVIS_SMARTER.md).
- **Add decisions and prefs over time** — The more you "remember this decision" and "always use X," the more JARVIS behaves like a co-founder who knows your defaults and your past choices. See [JARVIS_MEMORY.md](./JARVIS_MEMORY.md).

---

## 6. One-page map (where to read what)

| If you want to… | Read |
|-----------------|------|
| **Set up memory for life** | [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) — doc vs DB, session persistence, decisions, prefs. |
| **Wire memory (DB → Edge/gateway)** | [JARVIS_MEMORY_WIRING.md](./JARVIS_MEMORY_WIRING.md) — apply migration, implement load/append for session_messages, optional prefs. |
| **Remember decisions** | [DECISIONS_MEMORY.md](./DECISIONS_MEMORY.md) — DECISIONS.md convention. |
| **Know what products can do (code truth)** | [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md) — repo_summary, repo_search, not just description. |
| **Use JARVIS to build (orchestration)** | [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md) — BEAST MODE, Code Roach, Echeo, workflow_dispatch. |
| **Make JARVIS unbeatable** | [JARVIS_DEVELOPER_SUPREMACY.md](./JARVIS_DEVELOPER_SUPREMACY.md) — playbook, levers, gaps. |
| **Make JARVIS smarter** | [JARVIS_SMARTER.md](./JARVIS_SMARTER.md) — bootstrap, cite sources, when-to-invoke, decision memory. |
| **See the big plan** | [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) — vision, tracks, next 6–12 months. |
| **Repos = goodies** | [JARVIS_AND_YOUR_REPOS.md](./JARVIS_AND_YOUR_REPOS.md) — check repos first, index, products.json. |
| **Onboard a new session** | [CURSOR_SESSION_ONBOARDING.md](./CURSOR_SESSION_ONBOARDING.md) — what to read first, @ mentions. |
| **JARVIS talks to everything / scale** | [JARVIS_SCALE_AND_CONNECTIVITY.md](./JARVIS_SCALE_AND_CONNECTIVITY.md) — one URL, one contract; add any client. When to scale: [JARVIS_SCALE_WHEN_NEEDED.md](./JARVIS_SCALE_WHEN_NEEDED.md). |

This doc (**JARVIS_COFOUNDER.md**) is the entry point: the system that lets you work with JARVIS for the rest of your life as your co-founder. Set up the foundations once, run the habits daily, and point new sessions (or future you) here so the partnership stays consistent.

---

## 7. Mantra

**"One human + JARVIS, same context, same memory, same stack — for life."**
