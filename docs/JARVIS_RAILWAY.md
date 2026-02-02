# Running JARVIS on Railway

Yes — you can run the Clawdbot gateway on Railway so JARVIS is fully in the cloud. Your machine can be off; the Supabase Edge Function will proxy to the Railway URL.

---

## What you get

| Before | After (Railway) |
|--------|------------------|
| Gateway on your Mac; Edge Function proxies to ngrok/local | Gateway on Railway; Edge Function proxies to Railway URL |
| Your machine must be on (+ tunnel) | Your machine can be off |

Same JARVIS (model + skills). Same Edge Function. Only the **gateway** moves to Railway.

---

## High-level steps

1. **Deploy the repo to Railway**  
   - Connect the CLAWDBOT repo.  
   - Use a **Node** service.  
   - Root directory: repo root (where `scripts/start-gateway-with-vault.js` and `package.json` live).  
   - Build: `npm install` (or leave default).  
   - Start command: `node scripts/start-gateway-with-vault.js`  
   - Railway will run `npx clawdbot gateway run` via that script (same as locally).

2. **Secrets: use Vault (recommended)**  
   In Railway, set only the two Vault credentials (same project as your Edge Function / app):  
   - `SUPABASE_URL` = your Supabase project URL  
   - `SUPABASE_SERVICE_ROLE_KEY` = service role key  

   The script pulls all `env/clawdbot/*` secrets from Supabase Vault at startup, so you don’t need to copy every API key into Railway.

   **Optional:** If you use a separate “Vault” project, set `VAULT_SUPABASE_URL` and `VAULT_SUPABASE_SERVICE_ROLE_KEY` instead (script uses these when present).

3. **Expose the gateway port**  
   The Clawdbot gateway listens on a port (e.g. 3000 or as configured). In Railway, add a **public HTTP** (or TCP) exposure for that port so the service gets a URL like `https://your-service.up.railway.app`.

4. **Point the Edge Function at Railway**  
   In Supabase, set the Edge Function secret:  
   - `JARVIS_GATEWAY_URL` = `https://your-service.up.railway.app`  
   (no trailing slash; use the exact URL Railway gives you.)

5. **Health check**  
   Call the Edge Function (e.g. `GET .../jarvis` or your JARVIS UI with Edge backend). If the gateway is up on Railway, the Edge Function will proxy and JARVIS will respond.

---

## Caveats

- **Node / `clawdbot`:** The start script runs `npx clawdbot gateway run` from the repo root. Railway must have Node and npm; `clawdbot` must be installable (e.g. from npm). If your setup uses a local path or private package, adjust the start command or add a dependency in `package.json`.
- **Skills that need your machine:** Launcher, clipboard, window-manager, etc. run on the **gateway** host. On Railway that’s the server, not your laptop — so those skills won’t control your local machine. Web search, clock, Kroger, repo-knowledge, etc. work from the cloud.
- **Cold starts:** Railway may spin down the service when idle; first request after that can be slower until the process is back up.

---

## Railway CLI setup (done in this repo)

The repo is configured for Railway:

- **`package.json`** — includes `clawdbot` so `npx clawdbot gateway run` works after `npm install`.
- **`railway.json`** — start command: `node scripts/start-gateway-with-vault.js`; Nixpacks builder.

**Already done via CLI:**

1. `railway init --name jarvis-gateway` — created project **jarvis-gateway**.
2. `railway add --service jarvis-gateway` — added service **jarvis-gateway** (Empty Service).
3. `railway domain` — generated public URL: **https://jarvis-gateway-production.up.railway.app**.

**You still need to:**

1. **Set Vault credentials** (so the start script can pull all other secrets from Supabase Vault):

   ```bash
   railway variables --set "SUPABASE_URL=https://YOUR_PROJECT.supabase.co" --set "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
   ```

   Replace with your Supabase project URL and service role key (same project where you have the Vault / `env/clawdbot/*` secrets).

2. **Deploy:**

   ```bash
   railway up
   ```

3. **Point the Edge Function at Railway:** In Supabase Dashboard → Edge Function **jarvis** → Secrets, set:
   - `JARVIS_GATEWAY_URL` = `https://jarvis-gateway-production.up.railway.app`

**Current setup (cloud):** On Railway the start script (1) copies `config/railway-openclaw.json` to `~/.openclaw/openclaw.json` (enables HTTP chat completions), (2) starts the gateway on port **18789** with `--bind lan` and `--allow-unconfigured`, (3) starts a **proxy** on `PORT` (set to **3000** in Railway variables) that forwards all requests to the gateway. Railway’s public domain routes to port 3000, so the proxy accepts immediately and forwards to the gateway.

---

## Troubleshooting

- **Gateway crashes: `ERR_MODULE_NOT_FOUND` (e.g. `link-understanding/apply.js`, `tts/tts.js`)** — The **clawdbot** npm package has had packaging bugs (missing files in the published tarball). The gateway never starts, so the proxy never listens and Railway returns 502. **Workaround:** Use the [official Railway template](https://docs.clawd.bot/railway) (one-click deploy, port 8080, `/setup` wizard) until the package is fixed, or pin to a clawdbot version that works (e.g. try `npm view clawdbot versions` and test older versions).
- **502 "Application failed to respond"** — Railway’s proxy got no response (or late response) from the service. Check:
  1. **Railway → jarvis-gateway → Deployments → latest → View logs** — look for "Proxy listening on 3000" and any gateway startup errors (Vault, config, port).
  2. **Variables:** `PORT=3000`, `VAULT_SUPABASE_URL` and `VAULT_SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) must be set so the gateway can pull secrets.
  3. **Domain port:** In Railway → Settings → Networking, ensure the public domain is routed to port **3000** (the proxy), not 18789.
- **Gateway never ready** — The script waits up to ~3 minutes for the gateway to respond to `GET /` on 18789. If the gateway crashes or doesn’t enable HTTP, the proxy never starts. Fix config (e.g. `config/railway-openclaw.json`) or check gateway logs.

---

## TL;DR

1. New Railway service → Node, root = repo, start = `node scripts/start-gateway-with-vault.js`.  
2. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in Railway (so Vault can fill the rest).  
3. Expose the gateway port → get `https://your-service.up.railway.app`.  
4. Set `JARVIS_GATEWAY_URL` in Supabase to that URL.  
5. JARVIS then runs in the cloud; your machine doesn’t need to be on.
