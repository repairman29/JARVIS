# JARVIS MCP in Cursor

Use the JARVIS Edge Function as an MCP server so Cursor can call **Ask JARVIS** (tool: `jarvis_chat`).

## Edge Function MCP support

The JARVIS Edge Function accepts **JSON-RPC 2.0** over POST (MCP-compatible):

- **initialize** — returns server capabilities and `tools`.
- **tools/list** — returns one tool: `jarvis_chat` (argument: `message`).
- **tools/call** — for `jarvis_chat`, forwards `arguments.message` to the gateway and returns the reply as text content.

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
