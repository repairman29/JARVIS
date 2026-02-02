# JARVIS — Talk to Everything and Anything (Scale)

**Goal:** JARVIS can be reached from **everything and anything** — Cursor, UI, Discord, CLI, Slack, API, webhooks, mobile, future clients — through **one interface** that scales.

**You’re set up to scale.** You don’t need to do anything until you see timeouts or lots of concurrent traffic. When you do: see **[JARVIS_SCALE_WHEN_NEEDED.md](./JARVIS_SCALE_WHEN_NEEDED.md)** — short runbook: “when do I need to scale?” and “what to do” (Railway vs self-host).

---

## 1. One interface, one URL

| Entry point | Contract | Who uses it |
|-------------|----------|-------------|
| **Edge Function** | `POST https://<project>.supabase.co/functions/v1/jarvis` | All clients. Same URL for REST chat, MCP (JSON-RPC), and any future protocol. |
| **REST** | Body: `{ "message": "...", "session_id?": "...", "speaker?": "..." }` or `{ "messages": [...], "session_id?": "..." }`. Optional header: `Authorization: Bearer <token>`, `X-Stream: true` for streaming. | UI, scripts, Slack, Zapier, webhooks, mobile — anything that can HTTP POST. |
| **MCP (Cursor)** | Same URL; body is JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`). Tool `jarvis_chat` args: `message`, optional `session_id`, optional `speaker`. | Cursor Agent, other MCP-capable clients. |

**Rule:** Any client that can send an HTTP POST to the Edge URL can talk to JARVIS. Same skills, same memory, same session model. Use `session_id` to stitch into one conversation or isolate; use `speaker` so JARVIS knows which client/bot said what.

---

## 2. How to add a new client (everything and anything)

To let a **new** surface talk to JARVIS (Slack, email bridge, API, webhook, mobile app):

1. **Endpoint:** POST to the JARVIS Edge URL (see above). No new code in JARVIS — the Edge already accepts REST.
2. **Body (minimal):** `{ "message": "<user message>", "session_id": "<optional, default jarvis-edge>", "speaker": "<optional, e.g. slack or email-inbox>" }`.
3. **Auth:** If the Edge has `JARVIS_AUTH_TOKEN` set, send `Authorization: Bearer <that token>`.
4. **Response:** JSON `{ "content": "<assistant reply>" }` or stream if you send `X-Stream: true` and parse SSE.

So: **anything that can HTTP POST can talk to JARVIS.** Stitch everyone into one session with a shared `session_id`, or give each client its own `session_id`. Use `speaker` so JARVIS is aware of the source (e.g. `speaker: "slack"`, `speaker: "api-mobile"`).

---

## 3. Scaling the setup

| Layer | How it scales | Notes |
|-------|----------------|-------|
| **Edge (Supabase)** | Stateless; Supabase runs many instances. Concurrency grows with traffic. | No single bottleneck. |
| **DB (Supabase)** | `session_messages` keyed by `session_id`; indexed. One row per turn; many sessions = many rows. | Add retention or summarization for very long threads (see JARVIS_MEMORY.md). Supabase/Postgres scales. |
| **Gateway** | Today: single process. To scale "everything and anything": run **multiple gateway instances** behind a **load balancer**; set `JARVIS_GATEWAY_URL` to the LB URL. Or move to a serverless/auto-scaling gateway when available. | This is the usual bottleneck under heavy traffic. Scale horizontally when needed. |

**TL;DR:** Edge and DB scale with the platform. Gateway is the part to scale when you have many concurrent clients: add more gateway instances and point Edge at a load balancer.

---

## 4. Summary

- **One URL, one contract:** Everything talks to JARVIS via the Edge (REST or MCP). No per-client backend — add clients by POSTing to the same URL with `message`, optional `session_id`, optional `speaker`.
- **Scale:** Edge and DB scale; scale the gateway (multiple instances + LB) when traffic grows.
- **Everything and anything:** Cursor, UI, Discord, CLI, Slack, API, webhooks, mobile — same interface. JARVIS can talk to everything that can POST.
