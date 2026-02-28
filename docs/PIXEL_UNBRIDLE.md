# Unbridle the Pixel

**Unbridle** = remove Android’s limits so the Pixel can run JARVIS 24/7 as the brain without the system killing Termux or the stack. One-time setup from your Mac (ADB).

**Tested on:** Android 16 (Pixel). Wireless debugging uses the same pair-then-connect flow as Android 11+; use the latest [SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) (e.g. `adb version` 35+). On Mac: `brew upgrade android-platform-tools` if needed.

---

## What it does

- **Phantom Process Killer (PPK) bypass** — Android 12+ caps “phantom” processes (e.g. 32) and can kill Termux when the stack spawns many processes. The bypass raises the limit and disables the monitor so the stack can run without being killed.
- **Optional: deviceidle whitelist** — Tells Android not to deep-sleep Termux so cron and the stack keep running when the screen is off.

---

## Steps (from your Mac)

### 1. Connect the Pixel

- **USB:** Plug the Pixel in and enable **USB debugging** (Settings → Developer options). When “Allow USB debugging?” appears, tap **Allow** (and optionally “Always allow from this computer”).
- **Wireless (legacy):** After one USB connection, run `adb tcpip 5555` then `adb connect <pixel-ip>:5555`. Use the same Wi‑Fi as the Mac.
- **Wireless debugging (Android 11+):** There are **two different ports** — use the right one for each step:
  | Step | Where on Pixel | Use for |
  |------|----------------|---------|
  | **Pair port** | Tap **“Pair device with pairing code”** → dialog shows IP:port + 6-digit code | `adb pair <ip>:<pair-port> <code>` (one-time) |
  | **Connect port** | Main **Wireless debugging** screen → “IP address & port” | `adb connect <ip>:<connect-port>` (every time; port changes after reboot) |
  The pair port and connect port are **not** the same. Using the connect port in `adb pair` causes “protocol fault”.
  **Or** use the script (it will prompt for pair port, code, connect port):
  ```bash
  cd ~/JARVIS && bash scripts/pixel-adb-pair-and-connect.sh 100.75.3.115 <pair_port> <code> <connect_port>
  ```
  (Replace with your IP; get pair_port/code from the pairing dialog, connect_port from the main screen. Tailscale example: `... 36775 446966 39457`.)
  **The port(s) change after every reboot.** After reboot, run `adb connect <ip>:<new-connect-port>` (no need to pair again unless you revoked authorizations).

  **Multiple devices or one target:** Use the serial so ADB targets the Pixel:
  ```bash
  ADB_SERIAL=192.168.86.209:40113 bash scripts/adb-pixel-ppk-bypass.sh
  ```
  (Replace with your current IP and port from the phone.)

### 2. Run the PPK bypass script

```bash
cd ~/JARVIS
bash scripts/adb-pixel-ppk-bypass.sh
```

This runs:

- `device_config set_sync_disabled_for_tests persistent` — so nightly sync doesn’t reset the limit  
- `device_config put activity_manager max_phantom_processes 2147483647` — raise phantom process limit  
- `settings put global settings_enable_monitor_phantom_procs false` — disable phantom-process monitor  

**Multiple devices?** Set the serial: `ADB_SERIAL=<id> bash scripts/adb-pixel-ppk-bypass.sh` (get `<id>` from `adb devices`).

### 3. Reboot the Pixel

Reboot the phone so the changes take effect. After reboot, the stack and cron are much less likely to be killed.

**After reboot (wireless debugging):** The port will be different. On the Pixel, open **Settings → Developer options → Wireless debugging** and note the new **IP address & port** (e.g. `192.168.86.209:40113`). On the Mac:
```bash
adb connect 192.168.86.209:40113
```
(Use the IP and port shown on your phone.)

**If the phantom-process monitor re-enables after reboot:** On some devices `settings_enable_monitor_phantom_procs` resets. Re-apply:
```bash
adb -s 192.168.86.209:40113 shell settings put global settings_enable_monitor_phantom_procs false
```
(Use your current wireless debugging address if the port changed.)

### 4. Optional — deviceidle whitelist (keep Termux out of doze)

So the CPU doesn’t deep-sleep Termux when the screen is off:

```bash
adb shell dumpsys deviceidle whitelist +com.termux
```

(Or with a serial: `ADB_SERIAL=<id> adb shell dumpsys deviceidle whitelist +com.termux`.)

You can also use **Wake lock** in Termux settings (see **PIXEL_AS_BRAIN.md**).

### 5. Battery: Unrestricted for Termux (stops Android from killing it)

Even with PPK bypass, Android can still kill Termux if the app is “optimized” for battery. On the **Pixel**:

1. **Settings → Apps → Termux** (or **See all apps** → Termux).
2. **Battery** → set to **Unrestricted** (or **Don’t optimize** / **Not optimized** depending on Android version).

If Termux is set to **Optimized** or **Restricted**, the system may kill it in the background. Unrestricted keeps it running so the gateway and cron stay up.

### 6. Wake lock (in Termux)

In **Termux** → **Settings** (or long-press terminal) → enable **Wake lock**. So the device doesn’t deep-sleep Termux when the screen is off.

---

## Verify

After reboot, reconnect with the **new** wireless debugging port (see “After reboot” above), then from the Mac:

```bash
cd ~/JARVIS
ADB_SERIAL=192.168.86.209:40113 bash scripts/pixel-phase-tests.sh 1
```

(Use the IP and port currently shown on the Pixel under Wireless debugging.)

You should see **PASS** for `max_phantom_processes` and **PASS** for `monitor_phantom_procs disabled`. Optional whitelist shows **PASS: Termux in wakelock whitelist** if you ran the deviceidle command. If monitor shows FAIL, re-run the `settings put global settings_enable_monitor_phantom_procs false` command from the “After reboot” section.

---

## Summary

| Step | Command / action |
|------|-------------------|
| 1 | Connect Pixel: USB, or **Wireless debugging** — get IP:port from phone (e.g. `192.168.86.209:40113`), then `adb connect <ip>:<port>`. Use `ADB_SERIAL=<ip>:<port>` if you have multiple devices. |
| 2 | `bash scripts/adb-pixel-ppk-bypass.sh` (or `ADB_SERIAL=<ip>:<port> bash scripts/adb-pixel-ppk-bypass.sh`) |
| 3 | **Reboot the Pixel** |
| 4 | (Optional) `adb shell dumpsys deviceidle whitelist +com.termux` (or with `-s <ip>:<port>`) |
| 5 | **Battery:** On the Pixel, **Settings → Apps → Termux → Battery → Unrestricted** (so Android doesn’t kill Termux for battery). |
| 6 | **Wake lock:** In Termux, **Settings → Wake lock** ON. |
| 7 | **After reboot:** Wireless debugging port changes — get new IP:port from phone, run `adb connect <ip>:<new-port>`. If monitor re-enabled, run `adb -s <ip>:<port> shell settings put global settings_enable_monitor_phantom_procs false`. |

**Verify:** From the Mac run `bash scripts/verify-pixel-unbridle.sh` to confirm PPK and whitelist. Then double-check Battery = Unrestricted and Wake lock ON on the device.

After this, the Pixel is unbridled: PPK won’t kill the JARVIS stack, and Battery Unrestricted + Wake lock keep it running. Use **PIXEL_AS_BRAIN.md** so it stays the brain 24/7. If the gateway still dies, the **watchdog** (cron every 5 min) will restart the stack; see **PIXEL_SERVICES_RUNBOOK.md**.

**References:** [PIXEL_VOICE_RUNBOOK.md §1](./PIXEL_VOICE_RUNBOOK.md#1-adb-phantom-process-limit), [SOVEREIGN_MOBILE_NEXUS.md §2.2](./SOVEREIGN_MOBILE_NEXUS.md#22-phantom-process-killer-ppk--full-bypass).

---

## Troubleshooting ADB connection

### “protocol fault” on `adb pair`

Android uses **two different ports**:

- **Pairing port** — Shown only when you tap **“Pair device with pairing code”** (a different dialog). Use this port for `adb pair <ip>:<pair-port> <code>`.
- **Connect port** — Shown on the main **Wireless debugging** screen (e.g. `100.75.3.115:39457`). Use this for `adb connect <ip>:<connect-port>` after pairing.

If you use the connect port in `adb pair`, you can get `protocol fault (couldn't read status message)`. On the Pixel: open **Wireless debugging** → tap **“Pair device with pairing code”** → use the **IP:port** from that dialog in `adb pair`, and the **port** from the main screen in `adb connect`.

**If you still get “protocol fault” with the correct pair port and code:**

1. **Pixel:** Enable **both** **USB debugging** and **Wireless debugging** (pairing can fail if only one is on).
2. **Pixel:** **Wi‑Fi → tap your network → Privacy** (or similar) and **disable “Random MAC address”** (or “Private Wi‑Fi address”); then reconnect to Wi‑Fi.
3. **Mac:** Restart ADB: `adb kill-server && adb start-server`, then run `adb pair <ip>:<pair_port> <code>` again.
4. **Tailscale:** If you're pairing over Tailscale (e.g. 100.75.x.x), try the same steps on **local Wi‑Fi** first (Mac and Pixel on same LAN, use the phone’s 192.168.x.x address). If pairing works on LAN but not over Tailscale, use the **USB workaround** below for remote access.

### “Operation not permitted” on `adb connect`

Often **macOS Firewall** blocking outbound ADB. Try:

- **System Settings → Network → Firewall** (or **Security & Privacy → Firewall**): allow **adb** or **Android Debug Bridge**, or allow **Terminal**. Or temporarily turn the firewall off to confirm.
- If you use a VPN or Tailscale, try with the Mac and Pixel on the same Wi‑Fi (no VPN) to rule out routing issues.

### Reliable workaround: USB once, then wireless

You can avoid pairing entirely:

1. Connect the Pixel to the Mac with a **USB cable**. Enable **USB debugging** and tap **Allow** on the phone.
2. In Terminal: `adb tcpip 5555` then unplug the cable.
3. On the Pixel, note its **Tailscale IP** (e.g. **100.75.3.115**). Then on the Mac: `adb connect 100.75.3.115:5555`.
4. Run unbridle: `cd ~/JARVIS && ADB_SERIAL=100.75.3.115:5555 bash scripts/adb-pixel-ppk-bypass.sh` then **reboot** the Pixel.

After reboot, the phone will listen on 5555 again (until the next reboot). Reconnect with `adb connect 100.75.3.115:5555` and run `ADB_SERIAL=100.75.3.115:5555 bash scripts/verify-pixel-unbridle.sh`.
