# Make JARVIS on Pixel work — one path

Do these in order. Nothing else.

---

## On the Pixel (once)

1. **Termux + Termux:API from same source**  
   Uninstall any existing Termux and Termux:API. In **Chrome** open:
   - https://f-droid.org/en/packages/com.termux/ → scroll down → **Download APK** → install.
   - https://f-droid.org/en/packages/com.termux.api/ → **Download APK** → install.  
   Then **Settings → Apps → Termux:API → Permissions → Location** ON.

2. **Open Termux.** Run:
   ```bash
   pkg update && pkg install openssh nodejs python pulseaudio sox alsa-utils termux-api termux-exec git -y
   whoami
   passwd
   sshd
   ```
   **whoami** shows your SSH username (e.g. `u0_a310`). **passwd** sets the password you’ll type when the Mac connects. Leave Termux open. Same Wi‑Fi as your Mac.

3. **InferrLM app:** open it and turn **Server** **ON** (port 8889).

---

## On the Mac (every time you want to sync and start)

4. **Same Wi‑Fi** as the Pixel. (USB connected once helps the script find the Pixel’s IP.)

5. **One-time: make it automatic (no password)**  
   Run once (you’ll be asked for your Termux password one time):
   ```bash
   cd ~/JARVIS && ./scripts/setup-ssh-keys-to-pixel.sh
   ```
   After that, sync and start never ask for a password.

6. **Run sync and start** (use your Termux username if it’s not `u0_a310`):
   ```bash
   cd ~/JARVIS && ./scripts/pixel-auto-sync-and-start.sh
   ```
   If you didn’t run the one-time step above, use the older script and enter your password when asked:
   ```bash
   cd ~/JARVIS && TERMUX_USER=u0_a310 bash scripts/pixel-sync-and-start.sh
   ```
   If it says “SSH not reachable”: on the Pixel run **`sshd`**, then try again.  
   If it says “Permission denied”: run **setup-ssh-keys-to-pixel.sh** once, or use the correct **whoami** value and the password you set with **passwd**.

---

## Use JARVIS

7. On the Pixel, open **Chrome** and go to: **http://127.0.0.1:18888**  
   Chat works. Voice: **http://127.0.0.1:18888/voice**

---

If SSH says “cannot reach”: open Termux on the Pixel, run **`sshd`**, same Wi‑Fi, then run the Mac script again.  
If WiFi/location still fail in JARVIS: use battery and camera; the rest works.
