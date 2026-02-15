# ntfy not working on Pixel — checklist

Run these in **Termux** on the Pixel.

## 1. Check if the topic is set

```bash
cd ~/JARVIS
grep NTFY ~/.clawdbot/.env
```

You should see something like:
```
NTFY_TOPIC=jarvis-pixel
NTFY_URL=https://ntfy.sh
```

If you see nothing, add it:

```bash
echo "" >> ~/.clawdbot/.env
echo "NTFY_TOPIC=jarvis-pixel" >> ~/.clawdbot/.env
echo "NTFY_URL=https://ntfy.sh" >> ~/.clawdbot/.env
```

## 2. Send a test notification

```bash
cd ~/JARVIS
node scripts/test-ntfy.js
```

- If it says **"Test notification sent"** and you get a notification on the phone → ntfy is working; plan-execute/heartbeat will notify when they finish (and you’re subscribed).
- If it says **"NTFY_TOPIC is not set"** → do step 1 again.
- If it says **"Request failed"** or **timeout** → check Wi‑Fi; ntfy.sh might be blocked.

## 3. Subscribe in the ntfy app

On the Pixel, open the **ntfy** app and **subscribe** to the **exact** topic you used (e.g. `jarvis-pixel`):

- Tap **"Subscribe to topic"** (or +) and type: `jarvis-pixel`
- No spaces, no `https://` — just the topic name.

You should then get the test message from step 2 (and later, JARVIS reports).

## 4. If plan-execute/heartbeat still don’t notify

- They only send ntfy when they **finish successfully** (and gateway/farm responded). If the run fails or times out, no notification.
- Check the log: `cat ~/plan-execute.log` (or `~/heartbeat.log`) — if you see an error at the end, fix that first; then the next run will send ntfy when it succeeds.
