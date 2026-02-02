# JARVIS MCP (Supabase-backed)

We can use **Supabase** to build an MCP server so JARVIS is available inside Cursor (and other MCP clients) as tools. This doc outlines the idea and a minimal spec.

---

## JARVIS as an Edge Function you can call from anywhere

**Yes.** The same Supabase Edge Function can do both:

1. **MCP** — Cursor (and other MCP clients) connect to the function URL and get MCP tools like `jarvis_chat`. So “from anywhere” = any MCP-capable client.
2. **Simple REST** — The function can also expose a plain HTTP endpoint, e.g. `POST /functions/v1/jarvis/chat` with body `{ "message": "What time is it in Denver?" }` → returns `{ "content": "..." }`. Then **any** HTTP client (web app, mobile, cron, curl, another service) can call JARVIS without speaking MCP.

So you effectively get **JARVIS as an Edge Function**: one URL, callable from Cursor (via MCP), from scripts, from other apps, or from the browser. The function proxies to your Clawdbot gateway (or, in a fully serverless setup, could call the LLM and skills directly with secrets from Vault). Recommendation: implement the **REST chat route** in addition to MCP so it’s truly “call from anywhere.”

---

## Why a JARVIS MCP?

- **Cursor today:** Uses Supabase MCP (DB, SQL) and browser MCP. The Clawdbot gateway runs separately; Cursor doesn’t talk to JARVIS via MCP.
- **With a JARVIS MCP:** Cursor could call tools like “ask JARVIS”, “JARVIS web search”, “JARVIS current time” and get answers without leaving the IDE. Same MCP server could be used by other clients (CLI, other IDEs).

---

## Supabase’s role

| Piece | Use |
|-------|-----|
| **Vault** | Store secrets the MCP server needs: gateway URL, `CLAWDBOT_GATEWAY_TOKEN`, optional API keys if the server runs skills directly. Same `env/clawdbot/<KEY>` pattern; server uses Vault RPC or service role. |
| **Edge Function** | Host the MCP HTTP endpoint. MCP speaks JSON-RPC over HTTP (SSE or Streamable HTTP). One Edge Function can handle the MCP protocol and proxy to the Clawdbot gateway. |
| **DB (optional)** | Session store, audit log, or rate limits per client. Not required for a minimal “proxy to gateway” MCP. |

So: **Supabase Edge Function = MCP server**; **Supabase Vault = secrets**; optional DB for sessions/audit.

---

## What the MCP server would expose

**Option A — Single chat tool (simplest)**  
- **`jarvis_chat`** — `message: string`, optional `session_id`. Server forwards to gateway `POST /v1/chat/completions`, returns the assistant reply.  
- Cursor (or any client) sends a user message and gets JARVIS’s reply. All skills (web search, clock, launcher, etc.) are used by the gateway as today.

**Option B — Chat + convenience tools**  
- **`jarvis_chat`** — Same as above.  
- **`jarvis_web_search`** — `query: string`. Server calls gateway (or runs the web-search skill with Vault-backed `BRAVE_API_KEY`) and returns results.  
- **`jarvis_current_time`** — Optional `timezone`. Server runs clock skill or calls gateway.  
- Reduces round-trips when the client only needs search or time.

**Option C — Full tool surface**  
- Expose every JARVIS skill as an MCP tool (e.g. `jarvis_launch_app`, `jarvis_calculate`, …).  
- More work to keep in sync with skills; Option A or B is enough to start.

**Recommendation:** Start with **Option A**. One Edge Function, one tool `jarvis_chat`, proxy to the gateway. Use existing Vault for gateway URL and token. Add Option B tools later if needed.

---

## Minimal spec (Option A)

1. **Supabase project**  
   Use the same project as the Vault (e.g. `YOUR_PROJECT_REF`). Vault already has `env/clawdbot/CLAWDBOT_GATEWAY_TOKEN`, etc.

2. **Edge Function: `jarvis-mcp`**  
   - **Trigger:** HTTP (e.g. `POST /functions/v1/jarvis-mcp`).  
   - **Protocol:** MCP over HTTP (SSE or Streamable HTTP per [MCP spec](https://modelcontextprotocol.io/specification/2024-11-05)); JSON-RPC 2.0 for requests/responses.  
   - **Auth:** Validate `Authorization` (e.g. Supabase anon key or a dedicated MCP key stored in Vault). For Cursor, you can use a project-scoped key or service role only server-side.  
   - **Tool:** `jarvis_chat`  
     - Input: `{ "message": "user message", "session_id?": "optional-session" }`.  
     - Implementation: Read gateway URL and token from Vault (or env set from Vault at deploy). `POST` to `{gateway}/v1/chat/completions` with `model: "openclaw:main"`, `messages: [{ role: "user", content: message }]`, `user: session_id`.  
     - Output: `{ "content": "assistant reply" }` (or stream if you add streaming later).

3. **Cursor MCP config**  
   Add a second MCP server in `.cursor/mcp.json` (or Cursor settings) that points at the Edge Function URL. Cursor will then have both “Supabase” (DB) and “JARVIS” (chat) tools.

4. **Secrets**  
   - In Vault: `env/clawdbot/CLAWDBOT_GATEWAY_TOKEN`, and optionally `env/clawdbot/JARVIS_GATEWAY_URL` (default `http://127.0.0.1:18789` or your deployed gateway).  
   - Edge Function: use Supabase `createClient` with service role and call your existing `get_vault_secret_by_name` RPC, or set env at deploy from Vault so the function has gateway URL and token.

---

## Implemented: REST (host and call on Supabase)

The **jarvis** Edge Function is in this repo and ready to deploy:

- **Location:** `supabase/functions/jarvis/index.ts`
- **REST:** `POST https://<project>.supabase.co/functions/v1/jarvis` — body `{ "message": string }` or `{ "messages": [...] }`, optional `session_id`. Returns `{ "content": string }`. Auth: set `JARVIS_AUTH_TOKEN` in Edge Function secrets and send `Authorization: Bearer <token>`.
- **Secrets:** `JARVIS_GATEWAY_URL`, `CLAWDBOT_GATEWAY_TOKEN`, optional `JARVIS_AUTH_TOKEN`.
- **Deploy:** `supabase link --project-ref YOUR_REF` then `supabase secrets set ...` and `supabase functions deploy jarvis`.

Full steps: **supabase/README.md**.

## Implementation checklist (optional next steps)

- [x] **REST route** — Done in `supabase/functions/jarvis/index.ts`.
- [ ] **MCP (optional):** Implement MCP HTTP transport (SSE or Streamable HTTP) and JSON-RPC handler in the same function; expose `jarvis_chat` tool so Cursor can use it.
- [ ] (Optional) Add `jarvis_web_search` and `jarvis_current_time` as separate tools or REST routes.

---

## References

- [MCP specification](https://modelcontextprotocol.io/specification/2024-11-05) (transports, JSON-RPC).
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions).
- [VAULT_ONE_PROJECT_FOR_ALL.md](./VAULT_ONE_PROJECT_FOR_ALL.md) — same Vault for gateway and MCP.
- [SUPABASE_MCP_SETUP.md](../SUPABASE_MCP_SETUP.md) — existing Supabase MCP (DB) in Cursor.

**Doc location:** `docs/JARVIS_MCP_SUPABASE.md`. Use this when you’re ready to implement the JARVIS MCP on Supabase.
