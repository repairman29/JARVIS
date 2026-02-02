# What to Update / Change — What We Can Enhance

A concise list of **updates and changes** to do now, and **enhancements** we can add next. Prioritized by impact vs effort.

---

## Updates / Changes (do now)

| Item | Status | Action |
|------|--------|--------|
| **JARVIS_GATEWAY_URL** (Edge Function) | Not set | Set in Supabase Dashboard → Edge Functions → jarvis → Secrets (or `supabase secrets set JARVIS_GATEWAY_URL=...`). Use ngrok URL or deployed gateway URL so the Edge Function can reach the gateway. |
| **JARVIS UI → Edge backend** | Not wired | When you want the UI to talk to hosted JARVIS, set `NEXT_PUBLIC_JARVIS_EDGE_URL` and `JARVIS_AUTH_TOKEN` in the UI env; the chat/health API routes will use the Edge Function. (Implemented below.) |
| **Health for Edge mode** | N/A | Edge Function now supports GET / returning `{ ok: true, mode: "edge" }` so the UI health check works when using Edge backend. |

---

## Enhancements (done or next)

| Enhancement | Status | Notes |
|-------------|--------|--------|
| **JARVIS UI can use Edge as backend** | Done | Set `NEXT_PUBLIC_JARVIS_EDGE_URL` (and optional `JARVIS_AUTH_TOKEN`); chat and health use the Edge Function. |
| **Edge Function GET / health** | Done | GET / returns `{ ok: true, mode: "edge" }` so clients can check availability without sending a message. |
| **MCP for Cursor** | Done | Add MCP HTTP transport to the Edge Function so Cursor gets “Ask JARVIS” as a tool. See docs/JARVIS_MCP_SUPABASE.md. |
| **Streaming from Edge** | Later | Edge Function currently returns a single `{ content }`. Could add streaming (chunked response or SSE) for faster first token. |
| **JARVIS_AUTH_TOKEN in UI** | Done | When using Edge backend, the UI server sends the token so the Edge Function accepts the request. |
| **Convenience: web_search, current_time** | Done | Edge Function could expose POST /web-search and POST /current-time for small clients that don’t need full chat. |

---

## Quick reference

- **Local only:** Run gateway + JARVIS UI; set nothing. Defaults: gateway `http://127.0.0.1:18789`, UI talks to it.
- **UI → Hosted JARVIS:** Set `NEXT_PUBLIC_JARVIS_EDGE_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis` and `JARVIS_AUTH_TOKEN=<token>` in `apps/jarvis-ui/.env`. Restart the UI; health and chat use the Edge Function.
- **Call from anywhere:** `curl -X POST <Edge URL> -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"message":"..."}'`

Doc: `docs/JARVIS_UPDATES_AND_ENHANCEMENTS.md`.
