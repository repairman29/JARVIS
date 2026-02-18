# GitHub Webhook → JARVIS Plan-Execute

Trigger JARVIS plan-execute when you push to main or open/update/close a PR.

---

## 1. Run the webhook server

The server listens on **port 18791**.

- **At login:** `node scripts/install-webhook-trigger-launchagent.js` (starts at login).
- **With other services:** `node scripts/start-jarvis-services.js` starts it if not running.
- **Manual:** `node scripts/webhook-trigger-server.js` (foreground).

---

## 2. Expose the server to the internet (for GitHub to reach it)

GitHub must POST to your server. Options:

- **ngrok:** `ngrok http 18791` → use the HTTPS URL (e.g. `https://abc123.ngrok.io`) as the webhook URL.
- **Cloudflare Tunnel,** **Tailscale Funnel,** or a VPS with a public IP and reverse proxy.

Your webhook URL will be: **`https://<your-host>/webhook/github`** (no trailing slash).

---

## 3. Create a secret (recommended)

Generate a random string (e.g. `openssl rand -hex 24`) and:

1. Add to `~/.clawdbot/.env`:
   ```bash
   GITHUB_WEBHOOK_SECRET=your_secret_here
   ```
2. Restart the webhook server so it picks up the env (e.g. `launchctl kickstart -k gui/$(id -u)/com.jarvis.webhook-trigger`).

---

## 4. Add the webhook in GitHub

1. Repo → **Settings** → **Webhooks** → **Add webhook**.
2. **Payload URL:** `https://<your-host>/webhook/github` (the URL from step 2).
3. **Content type:** `application/json`.
4. **Secret:** the same value as `GITHUB_WEBHOOK_SECRET`.
5. **Which events:** either “Just the push event” or “Let me select individual events” and choose **Push** and **Pull requests**.
6. Save.

---

## 5. What happens

- **Push to main:** Server receives the event, verifies the signature (if `GITHUB_WEBHOOK_SECRET` is set), and runs `jarvis-autonomous-plan-execute.js` in the background. Response **202 Accepted**.
- **PR opened / synchronized / closed:** Same — plan-execute is triggered.

Reports go to ntfy and `~/.jarvis/reports/latest.txt` as usual.

---

## Optional: trigger without GitHub (e.g. from CI)

- **POST** to `http://127.0.0.1:18791/trigger-plan` (or your public URL + `/trigger-plan`).
- To protect it, set `JARVIS_WEBHOOK_TRIGGER_SECRET` in env and pass it as:
  - **Query:** `?secret=<secret>`
  - **Header:** `Authorization: Bearer <secret>`
