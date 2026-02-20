# Unbridle the Pixel

**Unbridle** = remove Android’s limits so the Pixel can run JARVIS 24/7 as the brain without the system killing Termux or the stack. One-time setup from your Mac (ADB).

---

## What it does

- **Phantom Process Killer (PPK) bypass** — Android 12+ caps “phantom” processes (e.g. 32) and can kill Termux when the stack spawns many processes. The bypass raises the limit and disables the monitor so the stack can run without being killed.
- **Optional: deviceidle whitelist** — Tells Android not to deep-sleep Termux so cron and the stack keep running when the screen is off.

---

## Steps (from your Mac)

### 1. Connect the Pixel

- **USB:** Plug the Pixel in and enable **USB debugging** (Settings → Developer options). When “Allow USB debugging?” appears, tap **Allow** (and optionally “Always allow from this computer”).
- **Wireless (legacy):** After one USB connection, run `adb tcpip 5555` then `adb connect <pixel-ip>:5555`. Use the same Wi‑Fi as the Mac.
- **Wireless debugging (Android 11+):** On the Pixel: **Settings → Developer options → Wireless debugging** → turn **On**, then tap **Wireless debugging**. The screen shows **IP address & port** (e.g. `192.168.86.209:40113` or, on Tailscale, `100.75.3.115:37603`). From the Mac:
  ```bash
  adb connect <pixel-ip>:<port>
  ```
  **The port changes after every reboot.** If you reboot the Pixel, open Wireless debugging again, note the new port, and run `adb connect <pixel-ip>:<new-port>`.

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
| 5 | **After reboot:** Wireless debugging port changes — get new IP:port from phone, run `adb connect <ip>:<new-port>`. If monitor re-enabled, run `adb -s <ip>:<port> shell settings put global settings_enable_monitor_phantom_procs false`. |

After this, the Pixel is unbridled: PPK won’t kill the JARVIS stack. Keep **Wake lock** ON in Termux and use **PIXEL_AS_BRAIN.md** so it stays the brain 24/7.

**References:** [PIXEL_VOICE_RUNBOOK.md §1](./PIXEL_VOICE_RUNBOOK.md#1-adb-phantom-process-limit), [SOVEREIGN_MOBILE_NEXUS.md §2.2](./SOVEREIGN_MOBILE_NEXUS.md#22-phantom-process-killer-ppk--full-bypass).
