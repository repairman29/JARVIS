# What Changes When You Run JARVIS via the Edge Function?

Short answer: **nothing changes about how JARVIS thinks or what skills it has.** What changes is **how and where you can call him** — you get a stable, public API that any app or service can use.

---

## Before: How You Run JARVIS Today

| How you talk to JARVIS | Where it runs | Who can use it |
|------------------------|---------------|----------------|
| **JARVIS UI** (localhost:3001) | Gateway on your machine | You, on that machine (or same LAN if you expose it). |
| **Discord** | Gateway on your machine or a server | Anyone in your Discord server. |
| **CLI / scripts** | Gateway must be running locally | Only from the machine (or network) where the gateway is. |

**Constraint:** The gateway has to be running, and the client has to be able to reach it (same machine, same network, or you run the gateway on a public host). If you’re not at your desk or the gateway isn’t up, you can’t call JARVIS from somewhere else.

---

## After: JARVIS Behind the Edge Function

| What you get | What it means |
|--------------|----------------|
| **One public URL** | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis` — same endpoint from anywhere on the internet. |
| **Standard HTTP** | `POST` with `{ "message": "..." }` → `{ "content": "..." }`. No special protocol; any app can call it. |
| **Auth you control** | Optional `JARVIS_AUTH_TOKEN`: only clients that have the token can call. You can rotate it, give it to specific apps, revoke it. |
| **Always-on front door** | The Edge Function is hosted by Supabase (uptime on their side). Your gateway can still be local + tunnel or deployed; the *API* is stable. |

**What stays the same:** The Edge Function is a **proxy**. It forwards each request to your Clawdbot gateway. So JARVIS’s brain (model + skills: web search, clock, launcher, Kroger, etc.) is unchanged. Same gateway, same config, same Vault secrets — you just added a public HTTP front door in front of it.

---

## What This Opens Up

| Use case | Before | After (Edge Function) |
|----------|--------|------------------------|
| **Call from a script or cron** | Script must run where the gateway is, or you SSH and run there. | Script runs anywhere (CI, server, your laptop); it just `POST`s to the URL with the token. |
| **Call from another app or service** | That app must talk to your gateway (same network or you expose the gateway). | App calls the Supabase URL; no need to be on your network. |
| **Mobile / web app** | You’d host the gateway publicly and point the app at it. | App calls the Edge URL; you can keep the gateway private (e.g. local + ngrok) or deploy it; the app doesn’t care. |
| **Cursor / MCP** | Cursor can’t talk to a local gateway. | We can wire MCP to this URL so Cursor gets “Ask JARVIS” as a tool. |
| **Share with a teammate or device** | They need access to your machine or Discord. | Give them the URL + token (or a token you create); they call JARVIS from their own scripts/apps. |
| **One endpoint for many clients** | Each client needs to reach the gateway. | One URL; many clients (scripts, UIs, cron, MCP) share it. Auth via token(s). |

So: **same JARVIS, same skills, same gateway** — but now **anyone or any system with the URL (and optional token) can call him from anywhere**, without being on your machine or Discord.

---

## Is JARVIS in the cloud or does my machine have to run?

**The Edge Function is in the cloud** (Supabase). It’s always on and is just a **proxy**: it receives your request and forwards it to the **Clawdbot gateway**. It does not run the LLM or skills itself.

**The gateway is where JARVIS actually runs** (LLM + skills). So:

| Gateway runs… | Your machine must be on? | Edge Function can reach it? |
|---------------|--------------------------|-----------------------------|
| **Locally** (your Mac/PC) | **Yes** — gateway must be running. | Only if you expose it (e.g. ngrok, cloudflared). |
| **In the cloud** (Railway, Fly, etc.) | **No** — nothing has to run on your machine. | Yes — set `JARVIS_GATEWAY_URL` to the deployed gateway URL. |

**TL;DR:**  
- **Edge Function** = in the cloud (Supabase), always on, proxy only.  
- **Gateway** = can be local (then your machine + optional tunnel) or **deployed** (then JARVIS is fully in the cloud and your machine doesn’t need to run).

---

## What Doesn’t Change

- **Gateway:** Still runs your Clawdbot gateway (local or deployed). All skills and config are unchanged.
- **Vault / secrets:** Still in Supabase Vault; gateway (and optionally the Edge Function) use them as before.
- **Discord / JARVIS UI:** Still work as they do today; they talk to the gateway. The Edge Function is an *additional* way to call JARVIS, not a replacement for those.
- **Skills:** Web search, clock, launcher, Kroger, etc. — all unchanged; they run on the gateway.

---

## TL;DR

| Question | Answer |
|----------|--------|
| What changes about *running* JARVIS? | You add a **public HTTP API** (Supabase Edge Function) that proxies to your existing gateway. |
| What changes about JARVIS himself? | **Nothing** — same model, same skills, same gateway. |
| What does this open up? | **Call JARVIS from anywhere:** scripts, cron, other apps, mobile, Cursor (MCP), teammates — one URL, optional token. |
| What do we get? | A stable “JARVIS as a service” endpoint without having to expose your gateway directly; you control access with a token and can add MCP or other clients on top. |
