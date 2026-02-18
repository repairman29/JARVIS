# Unleash JARVIS

JARVIS can feel limited when exec (and thus beast-mode, code-roach, scripts, repo tools) is blocked from the channel you’re using. Here’s how to remove the main limits.

---

## 1. Web UI: allow exec from the browser

By default the gateway **blocks exec** for requests from the web UI (security). So JARVIS can chat but won’t run commands, beast-mode, or code-roach from the browser.

**Unleash it (local gateway):**

```bash
cd /path/to/JARVIS
node scripts/enable-web-exec.js
```

Then **restart the gateway** (e.g. stop and run `node scripts/start-gateway-with-vault.js` again, or `launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway` if you use the LaunchAgent).

After that, the **same web UI** can ask JARVIS to run scripts, quality checks, and tools; the gateway will allow it for the `webchat` channel.

**Security:** This sets `allowFrom.webchat = ["*"]`. Use only if your gateway is not publicly open or is behind auth (e.g. Edge + token). See [JARVIS_WEB_EXEC.md](./JARVIS_WEB_EXEC.md).

---

## 2. Cursor: full power via MCP

In Cursor you get the full agent (workspace, tools, exec). To **also** call JARVIS (e.g. for orchestration, BEAST MODE, or long-running tasks):

1. Add JARVIS as an **MCP server** (Edge URL + token if needed). See [JARVIS_MCP_CURSOR.md](./JARVIS_MCP_CURSOR.md).
2. **Cmd+I** (Agent) → ask: *“Ask JARVIS to run a quality check on BEAST-MODE”* or *“Use jarvis_chat: what should I work on next?”*

JARVIS in Cursor (MCP) uses the same gateway; if exec is allowed for the channel the gateway assigns to MCP, JARVIS can run tools from there too.

---

## 3. Gateway must be running and healthy

- **Local:** `node scripts/start-gateway-with-vault.js` (or your LaunchAgent). UI and MCP talk to it directly or via Edge.
- **Chat API:** Gateway needs chat completions enabled. If the UI says “Chat API not enabled,” add `gateway.http.endpoints.chatCompletions.enabled: true` and restart. See [apps/jarvis-ui/README.md](../apps/jarvis-ui/README.md).

---

## 4. Optional: allow Discord exec

If you use JARVIS from **Discord** and want exec there (e.g. “restart the gateway”, “run beast-mode”):

```bash
node scripts/enable-gateway-restart.js YOUR_DISCORD_USER_ID
```

Restart the gateway once after that. See RUNBOOK.md.

---

## Summary

| Where you use JARVIS | What to do to unleash |
|----------------------|------------------------|
| **Web UI**           | `node scripts/enable-web-exec.js` → restart gateway |
| **Cursor (MCP)**     | Add JARVIS MCP server; use Cmd+I and “Ask JARVIS …” |
| **Discord**          | `node scripts/enable-gateway-restart.js <DISCORD_ID>` → restart gateway |

All of this is about **allowing** the gateway to run exec (and elevated tools) for that channel. The model and tools are the same; the allowlist is the limiter.
