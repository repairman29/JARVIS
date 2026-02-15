# Termux + Termux:API — official install (for JARVIS on Pixel)

From the [termux/termux-app](https://github.com/termux/termux-app) README. **Termux and Termux:API must be from the same source** (same signature). Do not mix F-Droid and GitHub, or Play and F-Droid.

---

## Option A: F-Droid (recommended — no F-Droid app needed)

You **do not** need to install the F-Droid app. Download the APKs in Chrome and install with the system installer.

1. **Uninstall** any existing Termux and Termux:API (Settings → Apps → search *termux*).
2. **Termux:** On the Pixel, open Chrome → [https://f-droid.org/en/packages/com.termux/](https://f-droid.org/en/packages/com.termux/) → scroll to the latest version → **Download APK** → open file → Install.
3. **Termux:API:** [https://f-droid.org/en/packages/com.termux.api/](https://f-droid.org/en/packages/com.termux.api/) → **Download APK** → open file → Install.
4. **Settings → Apps → Termux:API → Permissions** → **Location** ON.
5. In Termux: `pkg update && pkg install nodejs python pulseaudio sox alsa-utils termux-api termux-exec git -y`

---

## Option B: GitHub (same signature for both)

For Android 7+, use **apt-android-7** variants only. Pixel 8 Pro = **arm64-v8a**.

1. **Uninstall** any existing Termux and Termux:API.
2. **Termux:** [https://github.com/termux/termux-app/releases](https://github.com/termux/termux-app/releases) — download the **arm64-v8a** (or **universal**) APK from the latest release (e.g. **v0.118.3** or newer). Install it.
3. **Termux:API:** [https://github.com/termux/termux-api/releases](https://github.com/termux/termux-api/releases) — download the **github.debug** APK from the latest release. Install it.
4. **Settings → Apps → Termux:API → Permissions** → **Location** ON.
5. In Termux: `pkg update && pkg install nodejs python pulseaudio sox alsa-utils termux-api termux-exec git -y`

---

## After install

- Test: `termux-wifi-connectioninfo` and `termux-location` (location may take 10–30 s).
- Re-push JARVIS from your computer: `cd ~/JARVIS && bash scripts/push-jarvis-to-pixel-ssh.sh` (Pixel on same Wi‑Fi, Termux open, run `sshd`).

See [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) §2 for full context.
