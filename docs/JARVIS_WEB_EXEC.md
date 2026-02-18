# Why exec doesn't run from the web UI (and how to fix it)

When you chat via the **JARVIS web UI** (or the deployed app), requests go: **Browser → Vercel (/api/chat) → Supabase Edge → Gateway**. The gateway decides whether to allow **exec** (and thus `beast-mode`, `code-roach`, etc.) based on **who is sending** the request.

---

## Why it’s blocked

1. **Elevated allowlist is per-channel.**  
   The gateway uses `tools.elevated.allowFrom` with one list per **channel** (e.g. `discord`, `whatsapp`, **`webchat`**). Requests from the web UI are treated as **webchat**. If `allowFrom.webchat` is missing or empty, the gateway does **not** allow elevated exec for those requests, so JARVIS won’t run `beast-mode`, `code-roach`, or other host commands.

2. **Discord is not web.**  
   Adding your Discord user ID to `allowFrom.discord` only allows exec when the request comes **from Discord**. It does not allow exec when the request comes from the web UI.

3. **Optional: gateway runs in the cloud.**  
   If the gateway runs on **Railway** (or another cloud), exec runs **on that server**. Your machine’s CLIs (`beast-mode`, `code-roach`, repos) are not there, so even with exec allowed you may get “command not found” unless you install those CLIs (or use `workflow_dispatch` instead).

---

## How to fix it

### 1. Allow exec from webchat (gateway config)

Add **webchat** to the elevated allowlist so requests from the web UI are allowed to use exec.

**Option A – allow all webchat sessions (simplest for a single-user/single-tenant setup):**

In `~/.clawdbot/clawdbot.json` (or `~/.openclaw/openclaw.json`), set:

```json
{
  "tools": {
    "elevated": {
      "enabled": true,
      "allowFrom": {
        "discord": ["YOUR_DISCORD_USER_ID"],
        "webchat": ["*"]
      }
    }
  }
}
```

**Option B – allow specific session IDs (tighter):**  
If your gateway maps web requests to a session id (e.g. the `user` field sent by Edge), you can list those instead of `["*"]`, e.g. `"webchat": ["jarvis-edge", "jarvis-ui-abc123"]`.

**Security note:** `["*"]` allows any request that the gateway treats as webchat. Use it only if the gateway is not publicly exposed or is protected by auth (e.g. Edge + JARVIS_AUTH_TOKEN). Prefer specific session IDs or a dedicated “web” user if you need stricter control.

### 2. Run the helper script (repo)

From the repo root:

```bash
node scripts/enable-web-exec.js
```

This script sets `tools.elevated.enabled = true` and `tools.elevated.allowFrom.webchat = ["*"]` in `~/.clawdbot/clawdbot.json` (and leaves existing `discord` / other entries intact). Restart the gateway after running it.

### 3. Where the gateway runs (local vs cloud)

- **Local gateway:**  
  If the web UI talks to **Edge → your local gateway** (e.g. via tunnel), exec runs on **your machine**. Once webchat is allowed, JARVIS can run `beast-mode`, `code-roach`, etc., as long as those CLIs are on PATH.

- **Cloud gateway (e.g. Railway):**  
  Exec runs on the **cloud instance**. To have real exec from the web UI you must either:
  - Install the CLIs (echeo, beast-mode, code-roach, etc.) in that environment, or
  - Use **workflow_dispatch** (GitHub Actions) instead of exec for quality/health checks so the work runs in your repo/CI, not on the gateway host.

---

## Summary

| Cause | Fix |
|-------|-----|
| webchat not in elevated allowlist | Add `allowFrom.webchat: ["*"]` (or specific session ids) in gateway config; or run `node scripts/enable-web-exec.js` and restart the gateway. |
| Gateway in cloud, no CLIs | Install CLIs on the cloud image or use workflow_dispatch / GitHub Actions for those steps. |

After the fix, use the same web UI; no need to change the UI or Edge. The gateway will allow exec for webchat-originated requests and JARVIS can run tools when the model asks for them.
