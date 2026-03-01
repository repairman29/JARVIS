# Discord channel setup

Clawdbot is configured to use **Discord** (not Telegram). Add your bot token and you’re set.

---

## Using the JARVIS bot (not JARVIS ROG Ed.)

The repo and Vault are already set up: there is one key, **`env/clawdbot/DISCORD_BOT_TOKEN`** (or `DISCORD_BOT_TOKEN` in `~/.clawdbot/.env`). The gateway and all scripts use that single token. **If `DISCORD_BOT_TOKEN` is set in `~/.clawdbot/.env`, it overrides Vault** so you can switch bots without changing Vault. Messages in Discord come from **whichever bot's token value** is in effect. If you have both a "JARVIS" app and a "JARVIS ROG Ed." app in the [Discord Developer Portal](https://discord.com/developers/applications), each has its own Bot Token — only one can be in that slot at a time.

**Check which bot is active**

- Run **`node scripts/check-discord-bot.js`**. It prints the bot's **Username** (and ID). If it says **"JARVIS ROG Ed."**, the token currently in use is the ROG Ed. bot's.
- Gateway logs on startup show e.g. `[discord] [default] starting provider (@JARVIS ROG Ed.)` — that name is the bot you're using.

**Switch to the JARVIS (repo) bot**

1. In the Discord Developer Portal, open the **JARVIS** application (the one for repo JARVIS, not "JARVIS ROG Ed.").
2. Go to **Bot** → copy the **Token** (or reset and copy).
3. Put that token where the gateway and scripts load it. **Recommended (always wins over Vault):** set it in **`~/.clawdbot/.env`**:
   - **Option A:** Run from repo root: **`node scripts/set-discord-token-env.js "<paste_JARVIS_bot_token>"`** (replaces `DISCORD_BOT_TOKEN` in `.env`).
   - **Option B:** Edit **`~/.clawdbot/.env`** and set **`DISCORD_BOT_TOKEN=<JARVIS bot token>`** (replace the existing value).
   - When `DISCORD_BOT_TOKEN` is set in `.env`, it is used instead of Vault, so you don’t need to change Vault.
4. Run **`node scripts/check-discord-bot.js`** — it should show the JARVIS bot’s username (not "JARVIS ROG Ed.").
5. Restart the gateway: **`node scripts/start-gateway-with-vault.js`** (or your usual start command).

After that, replies and `send-discord-message.js` will come from the JARVIS bot, not ROG Ed.

---

## If you see "HTTP 403: permission_error: OAuth authentication is currently not allowed for this organization"

JARVIS (Discord or UI) can show this when the **gateway’s LLM provider** (e.g. Anthropic) returns it. The `request_id` (e.g. `req_...`) is from that provider. It means the **API key’s organization** (e.g. your Anthropic org) has **OAuth disabled**, so the provider rejects the chat request.

**Fix:**

1. **Use a personal API key:** Create and use an API key from a **personal** Anthropic (or other provider) account that is not under an org with OAuth disabled. Put it in `~/.clawdbot/.env` as `ANTHROPIC_API_KEY` (or the key your gateway uses) and restart the gateway.
2. **Keys in Vault:** If your LLM keys are in Supabase Vault (e.g. you start the gateway with `node scripts/start-gateway-with-vault.js`), the same applies: the key in Vault is tied to an org with OAuth disabled. **Update the secret in Vault** to a personal API key (or switch provider and add that key to Vault). See docs/VAULT_MIGRATION.md and scripts that sync Vault (e.g. `vault-migrate-env.js`, `setup-jarvis-vault-and-access.js`).
3. **Or ask your org admin:** If you must use the org’s key, have the org admin enable OAuth for the organization in the provider’s console (e.g. Anthropic).
4. **Or switch provider:** Use a different LLM you already have keys for (e.g. OpenAI, Groq). In **`~/.clawdbot/clawdbot.json`** set the primary model, then restart the gateway (with Vault: `node scripts/start-gateway-with-vault.js`).

   **OpenAI (keys in Vault):** Ensure `OPENAI_API_KEY` is in Supabase Vault. In `clawdbot.json`:

   ```json
   "agents": {
     "defaults": {
       "model": { "primary": "openai/gpt-4o" }
     }
   }
   ```

   **Groq:** `"primary": "groq/llama-3.1-8b-instant"` and `GROQ_API_KEY` in Vault or `.env`.  
   See GETTING_STARTED_MODES.md and scripts/FREE_TIER_FALLBACKS.md for fallbacks and other providers.

5. **Support:** When contacting the LLM provider (e.g. Anthropic), include the full error and the `request_id`.

---

## If you see "Private application cannot have a default authorization link"

Discord shows this when the app is **private** but still has a **Default Authorization Link** set.

**Fix:**

1. In [Discord Developer Portal](https://discord.com/developers/applications) → your app → **OAuth2** (left sidebar).
2. Under **Default Authorization Link**, set it to **None** (not “In-app authorization” or a custom URL).
3. Save.

You can keep the app private. To invite the bot, use **OAuth2 → URL Generator** (see step 3 below) to build an invite URL—that does not use the default link and works for private apps.

---

## If you see "Failed to resolve Discord application id"

The gateway log shows: `[discord] [default] channel exited: Failed to resolve Discord application id`. That means Clawdbot could not get the Discord application id—almost always because **DISCORD_BOT_TOKEN** is missing or invalid.

**Fix:**

1. Open **`%USERPROFILE%\.clawdbot\.env`** (Windows) or **`~/.clawdbot/.env`** (Linux/macOS).
2. Ensure **`DISCORD_BOT_TOKEN=`** is set to your real **Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications) → your app → **Bot** → Token (Copy/Reset). Remove any placeholder like `your_discord_bot_token`.
3. From the JARVIS repo: **`node scripts/check-discord-bot.js`** — if this fails, the token is wrong or revoked; reset the token in the portal and update `.env`.
4. Restart the gateway (e.g. close the Clawdbot window and run **`clawdbot gateway run`** or your start script again).

---

## If the Discord bot seems offline (no reply in Discord)

The bot token is valid (REST API works) but the **Gateway WebSocket** to Discord may be stuck. Logs show: `discord gateway: WebSocket connection closed with code 1005` and `Attempting resume with backoff`.

**Fix:**

1. **Restart the gateway** so Discord gets a fresh WebSocket connection. From repo root: stop the process that runs the gateway (e.g. close its terminal or `pkill -f start-gateway-with-vault`), then run **`node scripts/start-gateway-with-vault.js`** again. You should see `[discord] logged in to discord as …` and no immediate 1005.
2. **Why you get "no response" in Discord:** When the WebSocket is in a 1005 loop, the gateway may still *receive* a message and run the agent (you’ll see `embedded run start` / `run done` in logs), but the **reply cannot be sent** because the connection to Discord is down. Restart helps only until the next 1005.
3. If 1005 or "no HELLO received" keeps happening after restart, check **network**: VPN, firewall, or corporate proxy often close or block Discord’s gateway. Try from another network or **disable VPN temporarily** and restart the gateway.
4. **Verify token:** `node scripts/check-discord-bot.js` — must show your bot and guilds. If that fails, reset the token in the Developer Portal and update Vault or `~/.clawdbot/.env`.
5. **Confirm the gateway works:** Use the JARVIS UI at http://localhost:3001 (or `curl` the gateway’s `/v1/chat/completions` with your token). If the UI gets replies but Discord doesn’t, the issue is Discord connectivity only.

---

## 1. Create the Discord bot

1. Open [Discord Developer Portal](https://discord.com/developers/applications) → **Applications** → **New Application** (name it e.g. “Clawdbot”).
2. In the app: **Bot** → **Add Bot**.
3. Copy the **Bot Token** (under “Token”). You’ll put this in `~/.clawdbot/.env` as `DISCORD_BOT_TOKEN`.

---

## Interactions Endpoint URL (leave blank)

In **Bot** you may see **Interactions Endpoint URL** (e.g. `whatever.local/api/interactions`). **Leave it blank.** JARVIS/Clawdbot connects to Discord via the **Gateway** (WebSocket) to receive messages and reply. The interactions endpoint is for receiving HTTP POSTs (e.g. slash commands) at your own URL and is not used.

---

## 2. Enable intents

In **Bot** → **Privileged Gateway Intents**, turn on:

- **Message Content Intent** (required so the bot can read message text).
- **Server Members Intent** (recommended for DMs and allowlists).

Save.

---

## 3. Invite the bot to a server

**Option A – Use the Discord API (direct URL)**

With your **Application ID** (Developer Portal → your app → **General Information** → Application ID), you can build the invite URL yourself:

```
https://discord.com/api/oauth2/authorize?client_id=APPLICATION_ID&permissions=117824&scope=bot%20applications.commands
```

Replace `APPLICATION_ID` with your app’s ID (e.g. `YOUR_APPLICATION_ID`). The `permissions=117824` value gives: View Channels, Send Messages, Read Message History, Embed Links, Attach Files, Add Reactions. [Permission calculator](https://discordapi.com/permissions.html) if you want a different set.

**For your app (Application ID `YOUR_APPLICATION_ID`):**

[Invite this bot to a server](https://discord.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=117824&scope=bot%20applications.commands)

Open that link in a browser, choose your server, and authorize.

**Option B – URL Generator in the portal**

1. In the app: **OAuth2** → **URL Generator** (in the left sidebar under OAuth2).
2. **Scopes:** check `bot` and `applications.commands`.
3. **Bot Permissions:** check the permissions you want.
4. Copy the **Generated URL** at the bottom and open it in a browser.

---

## App ID vs Public Key vs Bot Token

| What | Where | Used for |
|------|--------|----------|
| **Application ID** | General Information → Application ID | Invite URL (`client_id`), API calls. |
| **Public Key** | General Information → Public Key | Verifying interactions (e.g. slash commands / webhooks). **Not** used by Clawdbot. |
| **Bot Token** | Bot → Token (Reset Token / Copy) | Clawdbot needs this to connect to Discord. Put it in `~/.clawdbot/.env` as `DISCORD_BOT_TOKEN`. |

You **cannot** derive the Bot Token from the Application ID or Public Key. The Bot Token is a separate secret; get it from **Bot** → **Reset Token** (or **Copy**) in the Developer Portal. Keep it secret.

---

## 4. Add the Bot Token to Clawdbot

In `~/.clawdbot/.env`, add:

```bash
DISCORD_BOT_TOKEN=your_bot_token_here
```

Use the **Bot Token** from **Bot** → Token in the Developer Portal (step 1), not the Application ID or Public Key. No quotes needed.

**Optional – Supabase Vault:** You can store `DISCORD_BOT_TOKEN` in Supabase Vault instead of (or in addition to) `.env`. Migrate with `node scripts/vault-migrate-env.js`, then start the gateway with `node scripts/start-gateway-with-vault.js` so Clawdbot gets the token from Vault. See [docs/VAULT_MIGRATION.md](docs/VAULT_MIGRATION.md) for details.

---

## 5. Start the gateway

```bash
clawdbot gateway install   # install as background service (launchd)
clawdbot gateway start     # start it
```

Or run once in the foreground to test:

```bash
clawdbot gateway run
```

---

## 6. Use the bot

- **DMs:** Send a DM to the bot. First time uses **pairing**: the bot will send a pairing code; approve it with:
  ```bash
  clawdbot pairing approve discord <code>
  ```
- **Server:** In any channel the bot can see, mention it (e.g. `@YourBotName hello`). If you didn’t add a guild allowlist, the default may block guild messages until you add `channels.discord.guilds`; see [Discord channel docs](https://docs.clawd.bot/channels/discord) for `guilds` and `groupPolicy`.

---

## If you see "No session found: &lt;user id&gt;" in DMs

This can happen when the agent replies to a Discord DM using your **Discord user ID** as the session key. With the default `dm` policy (`pairing`) and `session.dmScope: "main"`, DMs use the **main** session key (`agent:main:main`), but the agent may infer the user ID from the message and call `sessions_send` with that ID, which the gateway does not store as a key.

**Fix (one-time):** Add a **session-store alias** so the gateway can resolve your user ID to the main session.

1. Open the session store: `~/.clawdbot/agents/main/sessions/sessions.json`
2. Find your main session entry (key `"agent:main:main"`). Note its `sessionId`, `sessionFile`, `deliveryContext`, `origin`, `lastChannel`, `lastTo`, `lastAccountId`.
3. Add a second key `"agent:main:YOUR_DISCORD_USER_ID"` (e.g. `"agent:main:123456789012345678"`) with an object that has the same `sessionId`, `sessionFile`, `deliveryContext`, `origin`, `lastChannel`, `lastTo`, `lastAccountId` (and optionally `updatedAt`). This aliases your Discord user ID to the same session so `sessions_send` with that ID resolves correctly.

After adding the alias, send another DM; the bot should be able to reply. If you add more Discord users (or use another bot account), repeat with their user IDs as needed.

---

## If the bot never replies in DMs (typing dots, then nothing)

Two causes and fixes:

**1. Session key / delivery context (most likely)**  
With the default `session.dmScope: "main"`, all DMs use the session key `agent:main:main`. The gateway may not associate the completed run with the Discord channel (e.g. logs show `sessionKey=unknown`), so the reply is never sent.

**Fix:** Use **per-channel-peer** so each Discord DM gets its own session key (`agent:main:YOUR_DISCORD_USER_ID`) with Discord delivery context. Then link that key to the main session so you keep one conversation.

1. Run: **`node scripts/enable-discord-dm-scope.js`** (sets `session.dmScope: "per-channel-peer"` in `~/.clawdbot/clawdbot.json`).
2. Restart the gateway.
3. Send **one DM** to the bot so the gateway creates the key with Discord delivery context.
4. Run: **`node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID`** so that key shares the main session (same thread). Restart the gateway again.

**2. Agent using sessions_send**  
If the agent uses **sessions_send** to reply in the same conversation, that path can fail and nothing is sent.

**Fix:** In your **workspace** (e.g. `jarvis/`), ensure `AGENTS.md` says to reply with normal text, not `sessions_send`, in the current conversation. Example:

- When replying in a **direct message** or the conversation you are in, **reply with normal text** in your message. Do **not** use the `sessions_send` tool for the same conversation—that is for other sessions only. Your normal text reply will be delivered automatically.

After saving `AGENTS.md`, restart the gateway and try again.

---

## If you see "Session Send: … failed: timeout"

The agent uses **sessions_send** to reply to your DM. By default it waits up to **30 seconds** for that reply run to finish. With a large model (e.g. 70B), the first reply can take longer than 30s, so the tool reports "timeout" even though the run is still going.

- **Check Discord:** The reply often still gets sent. Wait a few more seconds and look for the message in the DM.
- **If timeouts are frequent:** Use a smaller/faster model in `agents.defaults.model` (e.g. a 8B/32B variant) for quicker replies, or accept that the first reply may show up shortly after the timeout message.

There is no config to change the 30s default for `sessions_send`; the run continues in the background and delivery is best-effort.

---

## Optional: restrict to one server or channel

To allow only specific servers/channels, add to `~/.clawdbot/clawdbot.json` under `channels.discord`:

- **Guild ID:** Discord → User Settings → Advanced → Developer Mode → right‑click server name → Copy Server ID.
- **Channel ID:** Right‑click channel → Copy Channel ID.

Example (single server, single channel, mention required):

```json
"channels": {
  "discord": {
    "enabled": true,
    "token": "${DISCORD_BOT_TOKEN}",
    "dm": { "enabled": true, "policy": "pairing" },
    "groupPolicy": "allowlist",
    "guilds": {
      "YOUR_GUILD_ID": {
        "requireMention": true,
        "channels": {
          "YOUR_CHANNEL_ID_OR_SLUG": { "allow": true }
        }
      }
    }
  }
}
```

If you only set `DISCORD_BOT_TOKEN` and don’t add `guilds`, the default is open for guilds; use `groupPolicy` and `guilds` to lock it down.

---

## Do I need to update Discord?

**Discord app (desktop/mobile):** You don't need to update the Discord app for JARVIS's new behavior (Platform CLIs, maestro, etc.). Those live in the repo; restart the gateway and JARVIS uses them. If you want the latest Discord client features, update via **Discord → User Settings → Check for updates** (or your app store)—that's on you.

**JARVIS config:** No Discord Developer Portal change is required. New agent instructions (e.g. `jarvis/AGENTS.md`, `jarvis/TOOLS.md`) are picked up when the gateway loads the workspace; restart the gateway after pulling repo changes.

**Running platform CLIs from Discord (Vercel, Railway, Stripe, etc.):** For JARVIS to run `vercel deploy`, `stripe listen`, etc. when you ask in Discord, the gateway must allow **elevated exec** for your Discord user. Add your **Discord user ID** to the allowlist:

1. Get your Discord user ID: Discord → User Settings → Advanced → Developer Mode → On. Right-click your avatar in any chat → **Copy User ID**.
2. Edit **`%USERPROFILE%\.clawdbot\clawdbot.json`** (or `~/.openclaw/openclaw.json`). Under the top-level `"tools"` (create it if missing), add:

```json
"tools": {
  "elevated": {
    "enabled": true,
    "allowFrom": {
      "discord": ["YOUR_DISCORD_USER_ID"]
    }
  }
}
```

Replace `YOUR_DISCORD_USER_ID` with your numeric ID (e.g. `123456789012345678`). Add more IDs to the array if others should be allowed. Save, then restart the gateway. After that, when you ask in Discord (e.g. "Deploy this to Vercel"), JARVIS can run the CLI and report back.

**If JARVIS says "restriction on restarting the gateway":** The restart command requires **elevated** access and your Discord user ID in the allowlist. Run **`node scripts/enable-gateway-restart.js YOUR_DISCORD_USER_ID`** from the repo root (get your ID: Discord → Developer Mode → right-click your name → Copy User ID). That script sets `gateway.commands.restart = true` and adds your ID to `tools.elevated.allowFrom.discord`. Then restart the gateway once manually so it picks up the config; after that, JARVIS can restart it when you ask from Discord.
