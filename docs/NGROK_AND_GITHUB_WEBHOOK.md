# Get a public URL for the GitHub webhook (ngrok)

Your webhook server runs on **port 18791** on your Mac. GitHub needs a **public HTTPS URL** to send events to. **ngrok** gives you that in one command.

---

## 1. Get an ngrok account (free)

1. Open: **https://dashboard.ngrok.com/signup**
2. Sign up (email or Google/GitHub).
3. After signup, go to: **https://dashboard.ngrok.com/get-started/your-authtoken**
4. Copy your **authtoken** (long string).

---

## 2. Install the authtoken (one time)

In a terminal:

```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with the token you copied. This is saved so you don’t need to do it again.

---

## 3. Start the tunnel (when you want GitHub to reach your Mac)

```bash
ngrok http 18791
```

Leave this terminal open. You’ll see something like:

```
Forwarding   https://abc123def.ngrok-free.app -> http://localhost:18791
```

**Copy that `https://...ngrok-free.app` URL** (or the one ngrok shows you).

---

## 4. Add the webhook in GitHub

1. Open your repo on GitHub → **Settings** → **Webhooks** → **Add webhook**.
2. **Payload URL:** `https://YOUR-NGROK-URL/webhook/github`  
   Example: `https://abc123def.ngrok-free.app/webhook/github`
3. **Content type:** `application/json`
4. **Secret:** paste the value of **GITHUB_WEBHOOK_SECRET** from `~/.clawdbot/.env`
5. **Which events:** “Just the push event” or add “Pull requests” if you want.
6. Click **Add webhook**.

After that, every push to main (and PR events if you chose them) will trigger JARVIS plan-execute. Reports go to ntfy and `~/.jarvis/reports/latest.txt`.

---

## 5. Keep the tunnel running

- **At login:** Run `node scripts/install-ngrok-launchagent.js` from JARVIS. ngrok will start at login and tunnel port 18791. Logs: `~/.jarvis/logs/ngrok.log`.
- **Free ngrok:** The URL changes each time ngrok restarts. After reboot (or any ngrok restart), run **`node scripts/sync-webhook-url-all-repos.js`** — it reads the current URL from ngrok’s local API (http://127.0.0.1:4040) and updates all 60+ GitHub repo webhooks to the new URL in one go.
- **Manual:** Or leave `ngrok http 18791` running in a terminal when you want GitHub to reach your Mac.

---

## Summary

| Step | What to do |
|------|------------|
| 1 | Sign up at https://dashboard.ngrok.com/signup |
| 2 | Copy authtoken from https://dashboard.ngrok.com/get-started/your-authtoken |
| 3 | Run `ngrok config add-authtoken YOUR_TOKEN` |
| 4 | Run `ngrok http 18791` and copy the https URL |
| 5 | GitHub → Settings → Webhooks → Payload URL = `https://YOUR-NGROK-URL/webhook/github`, Secret = GITHUB_WEBHOOK_SECRET from .env |
