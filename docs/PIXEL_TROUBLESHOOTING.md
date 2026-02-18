# Pixel / JARVIS troubleshooting

Quick fixes for common issues.

---

## "No such file or directory" when running a script

If you see that when running something like `bash ~/JARVIS/scripts/...`, JARVIS may not be on the Pixel yet (or it’s in a different folder). **Fix:** Push from Mac so the script exists on the device: `cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh`, then run the script again in Termux.

**Workaround** — no script file needed: use the **inline** commands below instead.

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

## 0. termux-setup-storage "did nothing" / "No such file" for setup script

**Cause:** `~/storage/downloads` doesn't exist (storage not linked or permission not granted), so `bash ~/storage/downloads/setup-jarvis-termux.sh` fails.

**Fix (no termux-setup-storage needed):**

1. **From Mac (USB):** Push files and get the exact command:
   ```bash
   cd ~/JARVIS && bash scripts/adb-push-and-setup-command.sh
   ```
2. **On Pixel:** Android **Settings → Apps → Termux → Permissions** → turn **ON** "Files and media" (or "Storage").
3. **In Termux**, run this one line (the script is told where the tarballs are):
   ```bash
   bash /storage/emulated/0/Download/setup-jarvis-termux.sh /storage/emulated/0/Download
   ```

If you get "Permission denied" or "No such file" on that path, grant the permission in step 2 and try again. The setup script also accepts the download directory as the first argument so you can point it at any path where the tarballs already are.

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

## 3a. Hundreds of "tar: Ignoring unknown extended header keyword" during setup

**Cause:** Tarballs created on macOS can include extended-attribute metadata that Termux’s tar doesn’t recognize. Extraction still succeeds.

**Fix:** Safe to ignore. The setup script now suppresses these messages. If you create tarballs on the Mac, use the push script (it sets `COPYFILE_DISABLE=1`).

---

## 3b. "litellm not installed" or other packages you already installed

**Cause:** `pip` may have installed into a different Python than the one that runs the stack (e.g. different PATH or a venv you’re not activating).

**Fix (on the Pixel in Termux):**

1. Install using the **same** Python the start script uses:
   ```bash
   bash ~/JARVIS/scripts/install-litellm-termux.sh
   ```
   That script uses `python3 -m pip` so litellm is installed for the `python3` that runs the proxy.

2. Restart the stack:
   ```bash
   bash ~/JARVIS/scripts/start-jarvis-pixel.sh
   ```

If you still see "not installed", the start script will try a one-time `python3 -m pip install` when you run it. Chat works without the proxy (gateway uses adapter at 8888); the proxy (port 4000) is optional.

---

## 4. Chat or gateway returns 000 / not loading

**Check:**

- **InferrLM app** on the Pixel: **Server** must be **ON** (port 8889).
- In Termux: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789` → should be **200**.
- Logs: `tail -30 ~/gateway.log` and `tail -30 ~/adapter.log`.

---

## 4b. Chat (18888) won’t load in browser on the Pixel

**Do this in Termux on the Pixel.**

1. **Is the chat server running?**
   ```bash
   nc -z 127.0.0.1 18888 && echo "18888 open" || echo "18888 closed"
   ```
   If **closed**, the chat server didn’t start or crashed.

2. **Check the chat server log:**
   ```bash
   tail -50 ~/chat-server.log
   ```
   Look for `Error:`, `Cannot find module`, or `EADDRINUSE`. If the file is missing or empty, the process may have exited immediately.

3. **Is the script on the device?**
   ```bash
   ls -la ~/JARVIS/scripts/pixel-chat-server.js
   ```
   If **No such file**: the file wasn’t pushed. From the Mac run `cd ~/JARVIS && bash scripts/push-jarvis-to-pixel-ssh.sh` (ensure `pixel-chat-server.js` exists in `~/JARVIS/scripts/` on the Mac), then on the Pixel run `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` again.

4. **Start the chat server in the foreground** (to see errors):
   ```bash
   cd ~/JARVIS && node scripts/pixel-chat-server.js
   ```
   Leave it running. On the Pixel open Chrome → **http://127.0.0.1:18888**. If you see an error in Termux (e.g. module not found, port in use), that’s the cause. Press Ctrl+C when done.

5. **URL in Chrome:** Use **http** (not https), and **127.0.0.1:18888** or **localhost:18888**. Some devices are picky; try both.

6. **Restart the full stack** and watch for “Chat UI (18888): 200”:
   ```bash
   bash ~/JARVIS/scripts/start-jarvis-pixel.sh
   ```
   If it prints `Chat UI (18888): 000`, the chat server failed to start — use step 4 to see why.

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
