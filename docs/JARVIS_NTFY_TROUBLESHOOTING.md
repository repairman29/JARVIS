# Not seeing ntfy updates — troubleshooting

If JARVIS reports aren’t showing up on your phone (or desktop) via ntfy, check the following.

---

## 1. Confirm topic and server

**Same topic everywhere:** The scripts send to the topic in `NTFY_TOPIC` (e.g. `jarvis-reports`). Your ntfy app must be **subscribed to that exact topic** (case-sensitive, no spaces).

**Same server:**  
- If you use the **ntfy.sh app** (public server), we send to **https://ntfy.sh** by default. Don’t set `NTFY_URL` unless you use your own server.  
- If you **self-host** ntfy, set **`NTFY_URL`** in `~/.clawdbot/.env` to your server (e.g. `https://ntfy.yourdomain.com`). Then run:  
  `node scripts/set-ntfy-topic.js jarvis-reports https://ntfy.yourdomain.com`  
  so we POST to the same server your app is subscribed to.

**Check what we’re using:**

```bash
cd /path/to/JARVIS && node scripts/set-ntfy-topic.js
```

Shows current `NTFY_TOPIC` and (if set) `NTFY_URL`.

**Send a test message:**

```bash
node scripts/test-ntfy.js
```

If it prints “Test notification sent” but you still don’t get it on your device: the POST is succeeding; the issue is app/server/topic on the receiving side (see below).

---

## 2. App subscription

- Open the **ntfy app** (or web UI).
- **Subscribe** to the topic: e.g. **`jarvis-reports`** (same as in `NTFY_TOPIC`).
- If you use a **custom server**, add the server first, then subscribe to the topic on that server.
- Check for **Do Not Disturb** or app **notification permissions** so notifications aren’t blocked.

---

## 3. Cron and env (no updates from scheduled runs)

When the **autonomous heartbeat** (or plan-execute) runs from **cron**, it might not see `NTFY_TOPIC` if cron’s environment doesn’t load your `.env`.

**Fix: set `HOME` in the cron line** so the script finds `~/.clawdbot/.env`:

```bash
crontab -e
```

Use something like (replace with your username and path):

```
0 */6 * * * HOME=/Users/YOUR_USERNAME cd /Users/YOUR_USERNAME/JARVIS && node scripts/jarvis-autonomous-heartbeat.js
```

Then the script will read `NTFY_TOPIC` from `/Users/YOUR_USERNAME/.clawdbot/.env`.

**Verify from cron’s perspective:** Run the same command by hand (with the same `HOME` and path) and see if you get an ntfy notification and “Report sent to ntfy topic” in the output.

---

## 4. Only when running scripts by hand

- If **manual** runs send to ntfy but **cron** runs don’t, the issue is almost always **cron env** (see §3).
- If **neither** manual nor cron show up on the device, the issue is **topic / server / app** (see §1 and §2).

---

## 5. Quick checklist

| Check | Action |
|-------|--------|
| Topic set? | `node scripts/set-ntfy-topic.js` → shows NTFY_TOPIC |
| Test send | `node scripts/test-ntfy.js` → “Test notification sent” |
| App subscribed? | Same topic (e.g. `jarvis-reports`) on same server as NTFY_URL / ntfy.sh |
| Self-hosted? | Set NTFY_URL and use that server in the app |
| Cron not sending? | Add `HOME=/Users/you` (and full path) to the cron line |

---

## 6. Still not seeing updates

- Check **reports on disk**: `cat ~/.jarvis/reports/latest.txt`. If that updates but ntfy doesn’t, the scripts are running and the failure is between our POST and your device (server, topic, app, or network).
- Run **heartbeat once** and watch the script output:  
  `node scripts/jarvis-autonomous-heartbeat.js --no-webhook`  
  Look for “Report sent to ntfy topic” or “ntfy post failed”. If you see “No webhook set” and no ntfy line, `NTFY_TOPIC` wasn’t set when the script ran (env / HOME / cron).
