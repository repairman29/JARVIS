# JARVIS MCP in Cursor

Use the JARVIS Edge Function as an MCP server so Cursor can call **Ask JARVIS** (tool: `jarvis_chat`).

---

## How to talk to JARVIS via Cursor

1. **Open Agent (the AI chat panel)** — MCP tools like JARVIS are available in **Agent**, not in inline edit. You may see it labeled **Agent**, **Ask AI**, or **Chat** in the UI.
   - **Shortcut:** **Cmd+I** (Mac) or **Ctrl+I** (Windows) — opens the Agent side panel.
   - **Or:** **Cmd+Shift+P** (Command Palette) → type *“Agent”* or *“Ask AI”* or *“Chat”* → choose the command to open the AI chat panel.
   - **Or:** Click the **chat / AI** icon in the left sidebar or top bar (exact location can vary by Cursor version).

2. **Ask in natural language** — In the Agent prompt, ask the AI to talk to JARVIS. Examples:
   - *"Ask JARVIS what time it is in Denver."*
   - *"Use JARVIS to search the web for the latest news on [topic]."*
   - *"Call the jarvis_chat tool and ask: what’s on my Kroger list?"*

3. **What happens** — The agent will use the `jarvis_chat` tool (if it’s available from your MCP config). Cursor may show a tool-call step for approval; approve it. JARVIS’s reply will appear in the thread.

4. **If you don’t see an “Agent” or “Composer” option** — Cursor may call it **Ask AI** or **Chat**. Use **Cmd+I** / **Ctrl+I** to open the panel where you type messages to the AI; that’s where MCP tools (including JARVIS) are available.

5. **If JARVIS doesn’t show up** — Confirm JARVIS is in **Cursor Settings → Features → MCP** (or in `~/.cursor/mcp.json`) with the Edge URL and Bearer token. Reload the window or restart Cursor so it picks up the config.

**TL;DR:** Press **Cmd+I** (Mac) or **Ctrl+I** (Windows) to open the AI chat panel (Agent / Ask AI), then ask things like *"Ask JARVIS …"* or *"Use jarvis_chat to …"*; the agent will call JARVIS and show the reply.

---

## Edge Function MCP support

The JARVIS Edge Function accepts **JSON-RPC 2.0** over POST (MCP-compatible):

- **initialize** — returns server capabilities and `tools`.
- **tools/list** — returns one tool: `jarvis_chat` (arguments: `message`, optional `session_id`).
- **tools/call** — for `jarvis_chat`, forwards `arguments.message` (and optional `arguments.session_id`) to the gateway; returns the reply as text content. By default all Cursor bots **stitch into one session** (`"mcp"`): history is loaded and each turn is appended so JARVIS sees one continuous conversation. Pass `session_id` only if you want that bot in a separate thread. See [JARVIS_MANY_SESSIONS.md](./JARVIS_MANY_SESSIONS.md).

So the same URL works for REST chat and for MCP tool calls.

## Cursor config

Add JARVIS as an MCP server so Cursor can use the `jarvis_chat` tool.

### Option 1: Cursor Settings (recommended)

1. Open **Cursor Settings** (Cmd+, / Ctrl+,).
2. Go to **Tools & Integrations → MCP Servers**.
3. Add a new server:
   - **Name:** `jarvis` (or any label).
   - **URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis`
4. If your Edge Function uses `JARVIS_AUTH_TOKEN`, add an env or header (per Cursor’s UI) with `Authorization: Bearer <your_token>`.
5. Restart Cursor if needed.

### Option 2: Config file

Edit **`~/.cursor/mcp.json`** (or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "jarvis": {
      "url": "https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis"
    }
  }
}
```

If the Edge Function requires auth, Cursor may need to send the Bearer token; check Cursor’s docs for “MCP server headers” or “env” for the server and set `Authorization: Bearer <JARVIS_AUTH_TOKEN>` if supported.

## Transport note

The Edge Function uses **request-response JSON-RPC** (one POST per request, response in body). Some MCP clients expect **HTTP + SSE** (long-lived connection + events). If Cursor does not list tools or call them after adding the URL, it may require SSE. In that case we’d add an SSE endpoint to the function later; for now you can still call JARVIS via REST (e.g. curl or the JARVIS UI with Edge URL).

## Test MCP manually

```bash
# tools/list
curl -s -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JARVIS_AUTH_TOKEN' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq .

# tools/call
curl -s -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JARVIS_AUTH_TOKEN' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"jarvis_chat","arguments":{"message":"What time is it in Denver?"}}}' | jq .
```

Replace `YOUR_JARVIS_AUTH_TOKEN` if you set that secret; otherwise omit the header.

## Summary

| What | Value |
|------|--------|
| MCP URL | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis` |
| Tool | `jarvis_chat` — argument: `message` (string) |
| Auth | Optional: `Authorization: Bearer <JARVIS_AUTH_TOKEN>` |

Doc: `docs/JARVIS_MCP_CURSOR.md`.
