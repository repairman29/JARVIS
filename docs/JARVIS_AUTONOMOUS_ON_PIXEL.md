# Make JARVIS autonomous on the Pixel

JARVIS is "running" when the stack is up (adapter, proxy, gateway, webhook). It's **autonomous** when plan-execute and heartbeat run on a schedule without you opening Termux, and (optionally) you get notifications and the stack survives reboots.

---

## Already in place (from setup)

- **Cron** runs **plan-execute** at **8:00, 14:00, 20:00** and **heartbeat** every **6 hours**.
- Logs: `~/plan-execute.log`, `~/heartbeat.log`.

For cron to actually fire, **crond** must be running and Termux must not be killed when the screen is off.

---

## 1. Wake lock (required for schedule)

So Android doesn’t kill Termux when the screen is off and cron can run:

- Open **Termux** → **Settings** (or long-press terminal) → enable **Wake lock**.

Without this, scheduled plan-execute and heartbeat may not run when the phone is idle.

---

## 2. Start after reboot (optional but recommended)

After a reboot, crond and the JARVIS stack are not running until you open Termux and run something. To start them automatically:

1. **Install Termux:Boot** from F-Droid. Open the app once so it’s allowed to run at boot.
2. In **Termux** (not Boot), create the boot directory and copy the start script:
   ```bash
   mkdir -p ~/.termux/boot
   cp ~/JARVIS/scripts/termux-boot-start-jarvis ~/.termux/boot/
   chmod +x ~/.termux/boot/termux-boot-start-jarvis
   ```
3. Reboot the Pixel. Termux:Boot will run the script: it enables wake lock, starts crond, and runs `start-jarvis-pixel.sh`. Check `~/jarvis-boot.log` if something fails.

**Result:** After every reboot, JARVIS stack and cron start without opening Termux.

---

## 3. Notifications + one-tap (optional)

Get a push when plan-execute or heartbeat finish, and run them from a home-screen widget:

- **On the Pixel (Termux):**
  ```bash
  bash ~/JARVIS/scripts/setup-unlock-pixel.sh
  ```
- **On the phone:** Install **ntfy** (Play Store or ntfy.sh), subscribe to the topic (e.g. `jarvis-pixel`). Install **Termux:Widget** (F-Droid), add a widget → choose "plan-execute" or "heartbeat".

**Result:** You see "JARVIS plan-execute" / "JARVIS heartbeat" when each run finishes, and you can tap the widget to run one now.

---

## 4. Give JARVIS a goal (optional)

So plan-execute works toward something concrete instead of generic "focus repo / open PRs":

**On the Pixel (Termux), or from Mac via SSH:**

```bash
cd ~/JARVIS
node scripts/set-autonomous-goal.js "Your one-line goal, e.g. Ship Olive v2 by Friday"
```

Goal is stored in `~/.jarvis/autonomous-goal.txt` and injected into every plan-execute. Change or clear it anytime with the same script (`--clear` to remove).

---

## 5. Fallback LLM when farm is down (optional)

If the gateway or InferrLM is down, plan-execute and heartbeat will fail. To keep them running using a cloud LLM:

- In **~/.clawdbot/.env** on the Pixel add (replace with your API base and key if needed):
  ```bash
  JARVIS_AUTONOMOUS_FALLBACK_URL=https://api.groq.com/openai/v1
  # and set the key in your env or in a way the gateway/script can use it
  ```
- The autonomous scripts will use this when the primary gateway/farm is unavailable (see JARVIS docs for exact env names and behavior).

---

## Checklist

| Step | Action | Purpose |
|------|--------|--------|
| ☐ | Termux → **Wake lock** on | Cron runs when screen is off |
| ☐ | Copy `termux-boot-start-jarvis` to `~/.termux/boot/`, install **Termux:Boot** | Stack + cron start after reboot |
| ☐ | Run **setup-unlock-pixel.sh** | ntfy topic + widget scripts |
| ☐ | Install **ntfy** app, subscribe to topic | Push when plan-execute/heartbeat finish |
| ☐ | Install **Termux:Widget**, add widget | One-tap plan-execute or heartbeat |
| ☐ | **set-autonomous-goal.js** "Your goal" | Plan-execute works toward a goal |
| ☐ | (Optional) **JARVIS_AUTONOMOUS_FALLBACK_URL** in `.env` | Plan-execute keeps running if farm is down |

---

## Verify autonomy

- **From Mac (no Pixel password):** `./scripts/test-autonomous-mac.sh` — checks script syntax, dry-runs plan-execute/heartbeat, Pixel port reachability.
- **On Pixel (Termux or after SSH):** `bash ~/JARVIS/scripts/test-autonomous-pixel.sh` — checks crontab, gateway/proxy HTTP, boot script, and dry-runs both autonomous scripts.
- **Cron schedule:** In Termux run `crontab -l` — you should see 4 lines (3× plan-execute, 1× heartbeat).
- **Last run:** `tail -30 ~/plan-execute.log` and `tail -20 ~/heartbeat.log` — next scheduled run will append there.
- **Run one now:** `cd ~/JARVIS && node scripts/jarvis-autonomous-plan-execute.js` — you should get a report and, if ntfy is set up, a notification.
