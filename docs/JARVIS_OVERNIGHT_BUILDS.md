# JARVIS Overnight Builds — Program JARVIS to Build Products at Night

Run JARVIS **autonomously overnight** so it plans, builds, runs quality, and (optionally) deploys while you sleep. No human in the loop.

---

## 1. What runs overnight

| Run | What it does | When |
|-----|----------------|------|
| **Plan-execute** | JARVIS creates a plan (focus repo, PRs, issues) and executes it with tools: `github_status`, `build_server_pipeline`, quality, triage, draft PRs. Writes summary to `~/.jarvis/reports/` and optionally ntfy/Discord. | e.g. **2 AM** daily |
| **Heartbeat** | Short agent check-in: HEARTBEAT_OK or HEARTBEAT_REPORT. Good for “is everything green?” every few hours. | e.g. **every 6 hours** |
| **Autonomous release** (optional) | One product: **build** (build server) → **quality** (BEAST MODE) → **deploy** (workflow_dispatch or `JARVIS_DEPLOY_CMD`). Use when you want a **full ship** on a schedule. | e.g. **3 AM** daily (after plan-execute) |

---

## 2. One-time setup (so overnight runs work)

### 2.1 Gateway + farm running when cron fires

The autonomous scripts **call the gateway**; they don’t start it. So the Mac must have:

- **Gateway** (18789) — e.g. LaunchAgent: `node scripts/install-gateway-launchagent.js`
- **Neural Farm** (4000) — so the gateway has an LLM. Start at login: in `neural-farm` run `node install-farm-launchagent.js`, or ensure `dev_farm.sh --bg` is running before you leave the Mac.

If the Mac **sleeps**, cron may not run (unless you use **caffeinate** or disable sleep for “Power Adapter”). For overnight, either:

- Keep the Mac awake (Energy Saver: “Prevent automatic sleeping when the display is off” when plugged in), or  
- Use a machine that doesn’t sleep (e.g. headless Mac, Linux server, or run these in a cloud job).

### 2.2 JARVIS can use exec (builds, gh, deploy)

So plan-execute and release can run builds and deploy:

```bash
cd ~/JARVIS
node scripts/enable-web-exec.js
```

Restart the gateway after that.

### 2.3 Multi-day goal (optional but recommended)

Tell JARVIS what to work toward across runs:

```bash
mkdir -p ~/.jarvis
echo "Ship focus product; run quality and deploy when main is green. Prefer build and test overnight." > ~/.jarvis/autonomous-goal.txt
```

Plan-execute reads this and biases the plan toward that goal.

### 2.4 Notifications (optional)

- **ntfy (push):** `NTFY_TOPIC=jarvis-reports` in `~/.clawdbot/.env` (or `node scripts/set-ntfy-topic.js jarvis-reports`). Reports from plan-execute/heartbeat get pushed to that topic.
- **Discord:** `JARVIS_ALERT_WEBHOOK_URL` or `DISCORD_WEBHOOK_URL` in `~/.clawdbot/.env` so summaries go to a channel.

---

## 3. Add overnight cron jobs

### Option A: Use the helper script (recommended)

From the JARVIS repo:

```bash
cd ~/JARVIS
node scripts/add-overnight-autonomous-cron.js --add
```

This adds:

- **Plan-execute** daily at **2 AM**
- **Heartbeat** every **6 hours**

Optional flags:

- `--plan-time 3` — run plan-execute at 3 AM instead of 2.
- `--heartbeat-interval 6` — heartbeat every 6 hours (default).
- `--release` — also add **run-autonomous-release.js** at 3:30 AM (set `JARVIS_RELEASE_PRODUCT` and optionally `JARVIS_DEPLOY_CMD` in env or crontab).

To only **print** the cron lines (no crontab change):

```bash
node scripts/add-overnight-autonomous-cron.js
```

### Option B: Add cron lines manually

Edit crontab: `crontab -e`, then add (adjust paths and times):

```cron
# JARVIS overnight: plan-execute daily at 2 AM
0 2 * * * HOME=$HOME cd /Users/jeffadkins/JARVIS && node scripts/jarvis-autonomous-plan-execute.js >> ~/.jarvis/plan-execute.log 2>&1

# JARVIS heartbeat every 6 hours
0 */6 * * * HOME=$HOME cd /Users/jeffadkins/JARVIS && node scripts/jarvis-autonomous-heartbeat.js >> ~/.jarvis/heartbeat.log 2>&1

# Optional: autonomous release for one product at 3:30 AM
30 3 * * * HOME=$HOME JARVIS_RELEASE_PRODUCT=your-repo cd /Users/jeffadkins/JARVIS && node scripts/run-autonomous-release.js >> ~/.jarvis/autonomous-release.log 2>&1
```

Use your real JARVIS path and, for release, set `JARVIS_RELEASE_PRODUCT` (and `JARVIS_DEPLOY_CMD` if needed). See **run-autonomous-release.js** and **AUTONOMOUS_RELEASES.md**.

---

## 4. Autonomous release (build → quality → deploy) overnight

To have JARVIS **build and ship one product** every night:

1. **Pick the product** — repo name (e.g. `olive`, `JARVIS`). Must have `shipAccess` in `products.json` or set `JARVIS_RELEASE_PRODUCT`.
2. **Deploy command (if not workflow_dispatch):** Set `JARVIS_DEPLOY_CMD` in `~/.clawdbot/.env` or in the cron line, e.g. `gh workflow run deploy.yml -R owner/repo`.
3. **Add the cron line** (or use `--release` with the helper script):

   ```bash
   30 3 * * * HOME=$HOME JARVIS_RELEASE_PRODUCT=olive cd /path/to/JARVIS && node scripts/run-autonomous-release.js >> ~/.jarvis/autonomous-release.log 2>&1
   ```

4. **Build server** must be up (18790). Use `node scripts/install-build-server-launchagent.js` so it starts at login.

Flags for `run-autonomous-release.js`: `--no-quality` (skip BEAST), `--no-deploy` (build + quality only), `--tag` (create git tag after deploy). See script header and **AUTONOMOUS_RELEASES.md**.

---

## 5. Timeout and fallback

- **Plan-execute** can run a while. Default max is 10 minutes (`JARVIS_AUTONOMOUS_TIMEOUT_MS=600000`). For heavier overnight runs, increase in `~/.clawdbot/.env`, e.g. `JARVIS_AUTONOMOUS_TIMEOUT_MS=1800000` (30 min).
- If the gateway or farm is down, set **`JARVIS_AUTONOMOUS_FALLBACK_URL`** to a backup gateway (e.g. Groq) so the script still gets a reply; the report will be prefixed with `[Fallback LLM; gateway/farm was unavailable.]`.

---

## 6. Summary checklist

| Step | Command / action |
|------|-------------------|
| 1 | Gateway at login: `node scripts/install-gateway-launchagent.js` |
| 2 | Farm at login: in neural-farm run `node install-farm-launchagent.js` |
| 3 | Build server at login (for releases): `node scripts/install-build-server-launchagent.js` |
| 4 | Allow exec: `node scripts/enable-web-exec.js` then restart gateway |
| 5 | Multi-day goal: `echo "your goal" > ~/.jarvis/autonomous-goal.txt` |
| 6 | Add overnight cron: `node scripts/add-overnight-autonomous-cron.js --add` (optionally `--release`) |
| 7 | Keep Mac awake overnight (Energy Saver) or use a machine that doesn’t sleep |
| 8 | Optional: set `NTFY_TOPIC` or `JARVIS_ALERT_WEBHOOK_URL` for notifications |

After this, JARVIS is programmed to build (and optionally ship) products overnight.
