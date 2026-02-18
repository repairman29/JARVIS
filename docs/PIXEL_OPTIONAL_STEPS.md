# Pixel optional steps — Wakelock, Tailscale, SOUL

Do these in any order after the main phases.

---

## 1. Wakelock (keep CPU from deep-sleep)

So Termux and the JARVIS stack don’t get suspended when the screen is off.

**From your Mac** (Pixel on USB or wireless ADB):

```bash
adb shell dumpsys deviceidle whitelist +com.termux
```

Multiple devices: `ADB_SERIAL=<pixel-id> adb shell dumpsys deviceidle whitelist +com.termux`

**Verify:** `adb shell dumpsys deviceidle whitelist` should list `com.termux`.

---

## 2. Tailscale (remote access to JARVIS)

Stable IP so you can open chat/gateway from your Mac (or anywhere on your Tailscale network) without relying on Wi‑Fi IP.

**On the Pixel — install Tailscale**

- **Official download (use this):** Open on the Pixel in Chrome: **https://tailscale.com/download/android** — then install the APK or use “Get from Play Store” there.
- **Play Store:** Search for “Tailscale” in the Play Store app and install.
- **F-Droid:** Search “Tailscale” in F-Droid if you prefer.

Then open the Tailscale app on the Pixel, sign in (same account as your Mac), approve the device. In the app you’ll see **this device’s Tailscale IP** (e.g. `100.64.1.2`). Write it down.

**On your Mac**

1. Install Tailscale if you haven’t: **https://tailscale.com/download** (pick macOS).
2. Sign in with the **same Tailscale account** as the Pixel.
3. **JARVIS must be running on the Pixel** (e.g. `bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice` in Termux).
4. In the browser on your Mac, open (use the real IP from the Pixel’s Tailscale app, not the literal text):
   - **Chat:** http://100.95.114.35:18888
   - **Gateway:** http://100.95.114.35:18789

**If the link doesn’t load**

- Replace the example IP with the **exact** IP shown in the Tailscale app on the Pixel (Settings or the device list in the app).
- Confirm JARVIS is running on the Pixel (in Termux you should see the processes; or on the Pixel open Chrome → `http://127.0.0.1:18888` and confirm chat works there first).
- Mac and Pixel must both be signed into the **same** Tailscale account / network.
- Try from Mac terminal: `curl -s http://100.95.114.35:18888 | head -1` — you should get HTML back.

**No other devices show on the Mac in the Tailscale app**

If the Mac’s Tailscale app shows no other devices, the Pixel isn’t on the same tailnet yet:

1. **Same account** — On the Pixel, open Tailscale and sign in with the **exact same account** (same Google/Apple/email) as on the Mac. Different accounts = different networks.
2. **Finish sign-in on the Pixel** — Complete the Pixel’s Tailscale login (browser or in-app) until it shows “Connected” and an IP (e.g. 100.x.x.x).
3. **Device approval** — If your tailnet uses approval, open **https://admin.tailscale.com** in a browser, go to **Machines**, and approve the Pixel if it’s “Needs approval”.
4. **Refresh on the Mac** — In the Tailscale app on the Mac, pull to refresh or restart the app; the Pixel should appear once it’s on the same tailnet.

**Use Wi‑Fi IP instead (no Tailscale needed)**  
If both are on the same Wi‑Fi, you can use the Pixel’s local IP from the Mac: **http://192.168.86.209:18888** (chat) and **http://192.168.86.209:18789** (gateway). Replace with the Pixel’s current Wi‑Fi IP if different (check on the Pixel: Settings → Network → Wi‑Fi → your network, or in Termux: `ip addr show wlan0`).

---

## 3. SOUL (personality and voice prompt)

`~/.jarvis/SOUL.md` defines how JARVIS speaks and behaves. The voice node uses the first ~1500 characters for the system prompt.

**On the Pixel (Termux)**

You already have a copy from the phase script. To refresh or edit:

```bash
# Refresh from template (overwrites your edits)
cp ~/JARVIS/docs/SOUL_TEMPLATE.md ~/.jarvis/SOUL.md

# Edit in place (nano or vim)
nano ~/.jarvis/SOUL.md
```

**What to put at the top (voice)**

- Prime directives and boundaries.
- “Reply in one to three short sentences” so voice stays concise.
- Any “never do X” or “always do Y” rules.

**Voice config**

In `~/.jarvis/voice_node.yaml` set (if not already):

```yaml
system_prompt_file: "~/.jarvis/SOUL.md"
```

Restart the voice stack after editing SOUL or the config.

---

## Quick reference

| Step        | Where   | Command / action |
|------------|---------|-------------------|
| Wakelock   | Mac     | `adb shell dumpsys deviceidle whitelist +com.termux` |
| Tailscale  | Pixel   | Install Tailscale app → sign in → note IP |
| Tailscale  | Mac     | Open http://100.95.114.35:18888 (chat) or :18789 (gateway) |
| SOUL       | Pixel   | `cp ~/JARVIS/docs/SOUL_TEMPLATE.md ~/.jarvis/SOUL.md` then `nano ~/.jarvis/SOUL.md` |
