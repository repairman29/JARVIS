# Talk to JARVIS instead of Siri (macOS Tahoe 26+)

Use JARVIS as your primary voice assistant on **macOS Tahoe (26.x)** and later. Siri stays available if you want it, but you can make JARVIS the one you talk to every day.

---

## 1. Reduce or turn off Siri (optional)

So "Hey Siri" doesn’t compete with JARVIS:

1. Open **System Settings** → **Siri & Spotlight** (or **Siri & Apple Intelligence** on Tahoe).
2. **Turn off "Listen for Hey Siri"** if you only want to use JARVIS for voice.
3. Optionally turn off **"Press to use Siri"** (e.g. long-press Globe/Fn) if you’ll use a shortcut for JARVIS instead.
4. You can leave **Spotlight** and other Siri suggestions on; this only affects the voice trigger.

Siri-related processes may still run in the background; the above stops the main voice triggers.

---

## 2. Run JARVIS at login (so it’s always ready)

JARVIS needs the **gateway** running so the UI (and any future wake word) can talk to it.

**One-time setup from the JARVIS repo:**

```bash
cd /path/to/JARVIS
node scripts/install-gateway-launchagent.js
```

- Installs a **LaunchAgent** so the gateway starts at login.
- Restart later: `launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway`
- Logs: `~/.jarvis/logs/gateway-stdout.log` and `gateway-stderr.log`

If you use **Vault** for secrets, either run after each login:

```bash
node scripts/start-gateway-with-vault.js
```

or change the LaunchAgent to run the vault script: edit `~/Library/LaunchAgents/com.clawdbot.gateway.plist` and set `ProgramArguments` to `[node, /path/to/JARVIS/scripts/start-gateway-with-vault.js]` (with your real path), then `launchctl unload` and `launchctl load` the plist. See **docs/JARVIS_AUTO_START_AND_WATCHDOG.md** for the base LaunchAgent setup.

---

## 3. Talk to JARVIS: Web UI + Voice (recommended)

The most reliable way to **talk to JARVIS instead of Siri** on Tahoe is the **JARVIS Web UI** with voice and conversation mode:

1. **Open the JARVIS UI**
   - Local: `cd apps/jarvis-ui && npm run dev` → http://localhost:3001  
   - Or use your deployed URL (e.g. Vercel).

2. **Turn on voice**
   - Enable **🔊 Voice** (Speak replies) so JARVIS speaks answers (browser TTS; on Tahoe this uses the system speech stack).
   - Enable **Conversation mode** so after JARVIS speaks, the mic turns on and you can reply by voice without clicking.

3. **Use the mic**
   - Click the mic in the composer to dictate, or rely on conversation mode after each reply.
   - **Push-to-talk:** Hold the mic button ~250ms, then release to send the transcript.

4. **Keep it handy**
   - Pin the JARVIS UI tab, add it to the Dock (e.g. Chrome “Create shortcut” / “Open in Dock”), or use a **keyboard shortcut** (see below) so it’s as quick as opening Siri.

No API key needed; the browser uses **Speech Recognition** and **Speech Synthesis** (on Tahoe, these use macOS system voice).

---

## 4. Optional: keyboard shortcut to open JARVIS (Siri-style trigger)

You can’t replace the system “Hey Siri” with “Hey JARVIS” at the OS level, but you can add a **keyboard shortcut** that opens JARVIS so you have a single key (or key combo) like you would for Siri.

**Option A — Shortcuts app (macOS)**

1. Open **Shortcuts**.
2. New shortcut: **Actions** → **Scripting** → **Run Script** (or **Open URL** if you only need to open the page).
3. **Open URL:** `http://localhost:3001` (or your JARVIS UI URL).
4. **Add to Menu Bar** and/or **Set global keyboard shortcut** (e.g. Option+Space or a F-key) in Shortcuts → Settings → Keyboard Shortcuts.

**Option B — AppleScript + global shortcut**

1. Script Editor → New → paste:

```applescript
-- Open JARVIS UI in default browser
open location "http://localhost:3001"
```

2. Save as an application (e.g. `Open JARVIS.app`).
3. **System Settings** → **Keyboard** → **Keyboard Shortcuts** → **App Shortcuts** (or **Services**). Add a shortcut that runs this app or script.

Now you can press that shortcut instead of “Hey Siri” when you want to talk to JARVIS.

---

## 5. “Hey JARVIS” wake word (current behavior)

The **voice-control** skill in the gateway has tools for **start_voice_recognition** and a configurable wake word (e.g. “Hey JARVIS”). On the gateway today, wake-word listening is **simulated** (not yet using macOS Speech framework or always-on mic). So:

- **For real “talk to JARVIS instead of Siri” today:** use the **Web UI** with **Voice + conversation mode** (and optional shortcut above).
- **Future:** A small always-on listener (e.g. native helper using macOS Speech, or a minimal browser window with Web Speech API) could provide true “Hey JARVIS” like “Hey Siri”. See **docs/JARVIS_VOICE.md** and **skills/voice-control/SKILL.md**.

---

## 7. Summary (macOS Tahoe 26.2)

| Goal                         | What to do |
|-----------------------------|------------|
| Don’t use Siri for voice    | System Settings → Siri & Spotlight → turn off “Listen for Hey Siri” (and optionally “Press to use Siri”). |
| JARVIS always available      | `node scripts/install-gateway-launchagent.js` so the gateway starts at login. |
| Talk to JARVIS by voice      | Open JARVIS UI → enable **🔊 Voice** and **Conversation mode** → use mic or push-to-talk. |
| Quick access like Siri      | Shortcuts app or AppleScript + keyboard shortcut to open JARVIS UI. |
| True “Hey JARVIS” later      | Build and run **apps/jarvis-wake-mac** (native menu bar app); see [README](../apps/jarvis-wake-mac/README.md). |

---

**See also:** **docs/JARVIS_VOICE.md** (voice overview), **docs/JARVIS_AUTO_START_AND_WATCHDOG.md** (LaunchAgent and watchdog), **docs/JARVIS_UI_VOICE_UAT.md** (voice UAT).
