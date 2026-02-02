# JARVIS-first: use our own tools

**TL;DR:** Talk to JARVIS via **our** interfaces (JARVIS UI, Discord, CLI, Edge REST). Use Cursor for code; use JARVIS where JARVIS lives. Cursor MCP is optional — nice when it works, not required.

---

## Why

- **Cursor MCP is finicky:** Composer/Agent naming changes, tools hide in panels, approval flow adds friction. Fighting the IDE to “find JARVIS” is a bad default.
- **We already have better surfaces:** JARVIS UI (dedicated chat), Discord (always there), CLI, and a stable Edge URL. They’re built for JARVIS; Cursor is built for code.
- **Clear split:** Cursor = edit code, run terminal, rules, repo context. JARVIS = chat, skills, real-time, Kroger, web search. Use the right tool for the job.

---

## Primary ways to talk to JARVIS (our tools)

| Surface | How | When |
|--------|-----|------|
| **JARVIS UI** | `cd apps/jarvis-ui && npm run dev` → http://localhost:3001. Set `NEXT_PUBLIC_JARVIS_EDGE_URL` + `JARVIS_AUTH_TOKEN` in `.env.local` to use Edge (no local gateway). | Dedicated chat, streaming, same UX every time. |
| **Discord** | JARVIS bot in your server / DMs. | Already open, mobile, no Cursor needed. |
| **Edge REST** | `curl -X POST https://.../functions/v1/jarvis -H "Authorization: Bearer $TOKEN" -d '{"message":"..."}'` or any HTTP client. | Scripts, cron, other apps, CI. |
| **CLI** | `npx clawdbot agent --message "..."` (with gateway running). | One-off from terminal. |

Use these as the default. No Cursor required.

---

## Cursor: optional MCP

- **If you want JARVIS inside Cursor:** MCP is already configured (`~/.cursor/mcp.json` + project `.cursor/mcp.json`). Open the Agent panel (**Cmd+I** / **Ctrl+I**) and say e.g. *“Ask JARVIS …”* — the agent can use `jarvis_chat`.
- **If it’s clunky or broken:** Ignore it. Use JARVIS UI or Discord instead. Cursor stays your code editor; JARVIS stays in JARVIS’s home.

---

## Making it better (concrete)

1. **Default recommendation:** “Talk to JARVIS → open JARVIS UI or Discord.” Onboarding and docs lead with that; MCP is “optional, in Cursor.”
2. **JARVIS UI as home base:** One URL (Edge) or local gateway; same token; bookmark or quick launcher. No hunting in Cursor.
3. **Cursor for code only:** Rules and context stay about the repo. When a session needs real-time or JARVIS skills, we point to JARVIS UI / Discord / curl, not “press Cmd+I and hope MCP shows up.”
4. **Dropping Cursor as main way to talk to JARVIS:** Yes. Cursor is the main **IDE**; JARVIS UI (or Discord) is the main **JARVIS** interface. Clean separation, less frustration.

---

## One-line stance

**Use our tools for JARVIS (UI, Discord, Edge, CLI). Use Cursor for code. MCP in Cursor is optional.**
