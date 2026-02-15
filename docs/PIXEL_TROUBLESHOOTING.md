# Pixel / JARVIS troubleshooting

Quick fixes for common issues.

---

## "No such file or directory" when running a script

If you see that when running something like `bash ~/JARVIS/scripts/...`, JARVIS may not be on the Pixel yet (or it’s in a different folder). Use the **inline** commands below instead — no script file needed.

**In Termux on the Pixel**, paste this whole block and press Enter:

```bash
echo "=== Ports ==="
for p in 8889 18789 18888; do nc -z 127.0.0.1 $p 2>/dev/null && echo "  $p open" || echo "  $p closed"; done
echo "=== Battery ==="
termux-battery-status 2>&1 | head -5
echo "=== WiFi ==="
termux-wifi-connectioninfo 2>&1
echo "=== Location ==="
termux-location 2>&1 | head -3
```

That runs the same checks. After you’ve pushed JARVIS from your Mac, `~/JARVIS/scripts/diagnose-pixel-on-device.sh` will work.

---

## 1. "Cannot reach 192.168.86.209:8022" (SSH)

**Cause:** Termux isn’t reachable on port 8022.

**Fix:**

- On the **Pixel**, open **Termux** and run:
  ```bash
  pkg install openssh   # if not already installed
  sshd
  ```
- Ensure the Pixel and your Mac are on the **same Wi‑Fi**.
- If the Pixel’s IP changed, run the script with the IP:  
  `bash scripts/ssh-pixel-run-all.sh 192.168.86.XXX`  
  (Find IP on Pixel: Settings → Network → Wi‑Fi → your network, or in Termux: `ip addr show wlan0`.)

---

## 2. WiFi or location still fail ("Termux:API is not yet available on Google Play")

**Cause:** Termux and Termux:API are from different sources (signature mismatch).

**Fix:** Install **both** from the same source. Easiest: F-Droid **website** in Chrome (no F-Droid app):

1. Uninstall **Termux** and **Termux:API** (Settings → Apps).
2. In Chrome on the Pixel: [f-droid.org/en/packages/com.termux/](https://f-droid.org/en/packages/com.termux/) → **Download APK** → install.
3. [f-droid.org/en/packages/com.termux.api/](https://f-droid.org/en/packages/com.termux.api/) → **Download APK** → install.
4. Settings → Apps → **Termux:API** → Permissions → **Location** ON.
5. In Termux: `pkg update && pkg install termux-api -y`. Test: `termux-wifi-connectioninfo` and `termux-location`.

See [TERMUX_INSTALL_OFFICIAL.md](./TERMUX_INSTALL_OFFICIAL.md).

---

## 3. Gateway won’t start (EACCES /tmp/clawdbot)

**Cause:** Termux can’t write to `/tmp`.

**Fix:** Start the stack with the script that sets `TMPDIR`:

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh
```

Or before starting the gateway: `export TMPDIR=$HOME/tmp` and `mkdir -p $TMPDIR`.

---

## 4. Chat or gateway returns 000 / not loading

**Check:**

- **InferrLM app** on the Pixel: **Server** must be **ON** (port 8889).
- In Termux: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789` → should be **200**.
- Logs: `tail -30 ~/gateway.log` and `tail -30 ~/adapter.log`.

---

## 5. Run diagnostics on the Pixel (no SSH)

In **Termux** on the Pixel, run:

```bash
echo "=== Ports ==="
for p in 8889 18789 18888; do nc -z 127.0.0.1 $p 2>/dev/null && echo "  $p open" || echo "  $p closed"; done
echo "=== Battery ==="
termux-battery-status 2>&1 | head -5
echo "=== WiFi ==="
termux-wifi-connectioninfo 2>&1
echo "=== Location ==="
termux-location 2>&1 | head -3
```

That shows what’s working (ports, battery, WiFi, location). If WiFi/location print the "not yet available on Google Play" message, use §2 above.

---

## 6. After fixing Termux/API — re-push JARVIS

From your **Mac** (Pixel on same Wi‑Fi, Termux open with `sshd` running):

```bash
cd ~/JARVIS && bash scripts/push-jarvis-to-pixel-ssh.sh
```

Then start the stack on the Pixel: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`.

---

**See also:** [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md), [PIXEL_TEST_CHECKLIST.md](./PIXEL_TEST_CHECKLIST.md), [TERMUX_INSTALL_OFFICIAL.md](./TERMUX_INSTALL_OFFICIAL.md).
