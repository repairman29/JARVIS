# Supabase + MCP Setup

Your app and **Clawdbot** can both use the same Supabase project. This doc ties env and MCP together without touching secrets.

---

## Your Supabase project

| What | Value |
|------|--------|
| **Project ref** | `YOUR_PROJECT_REF` (from [Supabase Dashboard](https://supabase.com/dashboard)) |
| **URL** | `https://YOUR_PROJECT_REF.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/YOUR_PROJECT_REF |

---

## Env vars your code expects

Set these **yourself** (in `.env` or system env). Never commit real values.

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Client-safe public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin; keep secret |
| `SUPABASE_READ_REPLICA_1_URL` | (Optional) Read replica |
| `SUPABASE_READ_REPLICA_2_URL` | (Optional) Read replica |

**Where to set them**

- **Your app:** Copy your app’s `env.example` to `.env` and fill keys from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api).
- **Clawdbot / Cursor:** If a tool needs Supabase env (e.g. a custom skill), use `~/.clawdbot/.env` or your shell profile so one place feeds everything.

---

## Supabase MCP (AI ↔ Supabase)

Supabase’s **hosted MCP server** lets Cursor (and other MCP clients) talk to your project: query DB, list tables, run SQL (with your approval).

- **MCP URL:** `https://mcp.supabase.com/mcp`
- **Auth:** Browser login to Supabase when you first use it (no PAT required).
- **Project scope:** In Cursor MCP config, scope to `YOUR_PROJECT_REF` so only that project is used.

**In Cursor**

1. **Settings → Cursor Settings → Tools & MCP** (or open `.cursor/mcp.json` in this project).
2. Add Supabase MCP (see `.cursor/mcp.json.example` if present).
3. Use the assistant and ask e.g. “What tables are in my Supabase database? Use MCP tools.” Cursor will prompt you to log in to Supabase once; after that, the MCP server can query your project.

**Security (from Supabase docs)**

- Prefer a **dev** Supabase project for MCP, not production.
- Keep **manual approval** for tool calls enabled in Cursor.
- Use **read-only** and **project scoping** where possible.

---

## Clawdbot agent and Supabase

Clawdbot’s gateway uses **skills** and **plugins**; it doesn’t load Cursor’s `mcp.json`. So:

- **Cursor:** Uses Supabase MCP via `.cursor/mcp.json` (this project) → you get “AI + Supabase” in the IDE.
- **Clawdbot (Telegram/local agent):** To have the agent query Supabase you’d add a **skill** or **plugin** that talks to Supabase (e.g. using the same env vars). That’s a separate step; for now, Cursor + MCP gives you AI + Supabase while you code.

**JARVIS MCP (optional):** You can use Supabase to build an MCP server so JARVIS is available inside Cursor as tools (e.g. “ask JARVIS”, “JARVIS web search”). See **docs/JARVIS_MCP_SUPABASE.md** and **docs/JARVIS_MCP_CURSOR.md** for the spec and setup.

---

## Quick checklist

- [ ] Copy your app’s `env.example` → `.env` and fill Supabase keys from the [API settings](https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api).
- [ ] In Cursor, open this project (CLAWDBOT); add Supabase MCP in `.cursor/mcp.json` (see `.cursor/mcp.json.example` if present).
- [ ] Ask Cursor: “What tables are in my Supabase database? Use MCP.” and complete the one-time Supabase login if prompted.

Done. Your env and MCP are scoped to your Supabase project.
