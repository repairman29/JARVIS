# Let the Pixel Sleep

If the Pixel **won’t sleep** (screen stays on or device stays awake), it’s usually due to JARVIS/Termux wake locks and settings. Here’s how to let it sleep again and what changes.

---

## 1. Turn off Termux “Wake lock”

- Open **Termux** → **Settings** (or long-press the terminal title bar).
- Turn **Wake lock** **OFF**.

That stops Termux from keeping the device awake when the app is in use. The screen can turn off and the phone can sleep as normal.

---

## 2. Release wakelock after boot (already done in script)

The **termux-boot-start-jarvis** script calls `termux-wake-lock` during boot so the stack can start, then calls **termux-wake-unlock** when it’s done. So after a reboot, the Pixel can sleep once the script finishes; it no longer holds the wakelock forever.

If you edited the script or use an old copy, ensure it ends with:

```bash
termux-wake-unlock 2>/dev/null || true
```

---

## 3. “Stay awake when charging” (Developer options)

- **Settings** → **System** → **Developer options**.
- If **“Stay awake”** (or “Stay awake when charging”) is **ON**, the screen stays on whenever the device is charging. Turn it **OFF** if you want the screen to turn off while charging.

---

## 4. Tradeoff: sleep vs scheduled runs

| Goal | What to do | Effect |
|------|------------|--------|
| **Pixel can sleep** | Wake lock OFF in Termux; boot script releases wakelock (as above). | Screen and device sleep. **Cron (plan-execute, heartbeat) may not run**, or run less often, when the device is dozing. |
| **Scheduled runs at night** | Wake lock ON in Termux, or use a different host (e.g. Mac) for overnight plan-execute/heartbeat. | Cron is more likely to run when the screen is off; device may not sleep as you want. |

So: **let the Pixel sleep** = better battery and normal screen-off behavior, but don’t rely on the Pixel for overnight cron. Use the **Mac** (or another always-on machine) for overnight JARVIS runs (see **JARVIS_OVERNIGHT_BUILDS.md**).

---

## 5. Quick checklist

| Step | Action |
|------|--------|
| 1 | Termux → **Settings** → **Wake lock** → **OFF** |
| 2 | **Developer options** → **Stay awake when charging** → **OFF** (if you want screen off while charging) |
| 3 | Use updated **termux-boot-start-jarvis** (with `termux-wake-unlock` at the end) so boot doesn’t hold wakelock forever |
| 4 | For overnight builds/plan-execute, use the **Mac** (cron + gateway + farm) instead of the Pixel |

After this, the Pixel should sleep normally. JARVIS chat from the Mac still works when the Pixel is awake and the stack is running; when the Pixel is asleep, wake the phone (or rely on Mac-side JARVIS for scheduled work).
