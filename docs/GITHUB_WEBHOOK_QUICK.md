# GitHub webhook — quick steps (secret already set)

**Secret is in `~/.clawdbot/.env` as `GITHUB_WEBHOOK_SECRET`.** Use that same value in GitHub.

1. **Get a public URL for port 18791** — Use ngrok (free). **Don’t have ngrok set up yet?** See **docs/NGROK_AND_GITHUB_WEBHOOK.md** for signup, authtoken, and `ngrok http 18791`. Then copy the HTTPS URL ngrok gives you.

2. **GitHub** → repo → **Settings** → **Webhooks** → **Add webhook**
   - **Payload URL:** `https://YOUR_NGROK_URL/webhook/github`
   - **Content type:** `application/json`
   - **Secret:** paste the value of `GITHUB_WEBHOOK_SECRET` from `~/.clawdbot/.env`
   - **Events:** Push and Pull requests (or “Just the push event”)
   - Save

3. Webhook server is already running (LaunchAgent). After you add the webhook, push to main or open a PR to test; plan-execute will run and report to ntfy.

**After ngrok restarts (e.g. reboot):** The free ngrok URL changes. Run **`node scripts/sync-webhook-url-all-repos.js`** from JARVIS (with ngrok running); it reads the new URL from http://127.0.0.1:4040 and updates all repo webhooks.

**ngrok at login:** Run **`node scripts/install-ngrok-launchagent.js`** so the tunnel starts at login. Then after each reboot run `sync-webhook-url-all-repos.js` once to point webhooks at the new URL.

Full details: **docs/GITHUB_WEBHOOK_SETUP.md**, **docs/NGROK_AND_GITHUB_WEBHOOK.md**.
