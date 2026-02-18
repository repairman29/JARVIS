# Notion

Search your Notion workspace via the Notion API. JARVIS can find pages and databases by title when you say "Search Notion for X" or "Find in Notion."

## Get your API key (no separate developer account)

1. In Notion (app or notion.so), open **Settings & members** (sidebar) → **Connections** or **Integrations**.
2. Click **"Develop or manage integrations"** → opens [My Integrations](https://www.notion.so/my-integrations).
3. Click **+ New integration**. Name it (e.g. "JARVIS"), select your workspace, create.
4. On the integration page, open the **⋯** menu → **Copy internal integration token**. That’s your `NOTION_API_KEY`.
5. **Share pages with the integration:** For each page or database you want JARVIS to search, open the page → **⋯** → **scroll to the bottom** of the pop-up → **Add connections** → search for your integration → select it → Confirm.  
   **Option B — From Settings (often easier):** **Settings & members** → **Connections** (or **My connections**) → find your integration → **⋯** → **Access selected pages** → select pages → **Update access**.  
   Without this, the API can’t see those pages.
   If you don't see **Add connections** in the **⋯** menu, use Option B (Settings → Connections).

## Installation

**Option A — Guided setup (recommended):** From repo root run  
**`node scripts/setup-notion-integration.js`**  
It opens My Integrations in your browser; you create the integration and paste the token when prompted; the script writes `NOTION_API_KEY` to `~/.clawdbot/.env`.

**Option B — Manual:** Set **`NOTION_API_KEY`** in the gateway env (e.g. `~/.clawdbot/.env`):  
`NOTION_API_KEY=ntn_...` (or `secret_...`). Then restart the gateway.

## Quick usage

- **"Search Notion for project roadmap"** → `notion_search` (query: "project roadmap")
- **"Find my meeting notes in Notion"** → `notion_search` (query: "meeting notes")

Results are returned as a list of page titles and links. Optional: add tools for create page, query database, append blocks (see [Notion API](https://developers.notion.com/)).

**Strategy & roadmap:** For 2026 API ecosystem (MCP, data_source_id, agentic workflows, headless CMS), see [docs/NOTION_AGENTIC_WORKSPACE_2026.md](../../docs/NOTION_AGENTIC_WORKSPACE_2026.md). Use it to align this skill with Notion MCP toolset (notion-search, notion-fetch, notion-update-page, query-data-source, notion-create-pages) and API versioning.

See [SKILL.md](./SKILL.md).
