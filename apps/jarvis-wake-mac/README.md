# JARVIS Wake — "Hey JARVIS" on macOS

Native menu bar app for **macOS Tahoe (26.x)** and later. Listens for **"Hey JARVIS"** (or **"JARVIS"**), captures your command via speech-to-text, sends it to the JARVIS gateway or Edge, and speaks the reply.

Part of the [JARVIS Wake Word roadmap](../../docs/JARVIS_WAKE_WORD_ROADMAP.md) — **Approach B: Native macOS**.

---

**If this app has been unreliable for you** (crashes, connection errors, permissions, menu bar): see **[Better ways to invoke JARVIS](../../docs/JARVIS_BETTER_INVOKE.md)** — e.g. **Cursor MCP** (Cmd+I → "Ask JARVIS …") or **Web UI + voice** with an optional keyboard shortcut.

---

## Requirements

- **macOS 13+** (Ventura or later; Speech framework, on-device optional)
- **Xcode 15+** (or Xcode 16 for Tahoe)
- **JARVIS gateway** running (e.g. `http://127.0.0.1:18789`) or **JARVIS Edge** URL

---

## Build in Xcode

**Option A — XcodeGen (if installed)**  
From the repo root or from `apps/jarvis-wake-mac`:
```bash
cd apps/jarvis-wake-mac
xcodegen
open JarvisWakeMac.xcodeproj
```
Then build and run (⌘R).

**Option B — Create project manually**

1. **Create a new macOS App project**
   - Open Xcode → File → New → Project
   - Choose **macOS** → **App**
   - Product Name: `JarvisWakeMac`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Uncheck "Include Tests" if you want a minimal project
   - Save into this folder: `apps/jarvis-wake-mac/` (so the new project is `JarvisWakeMac.xcodeproj` next to the `JarvisWakeMac` source folder)

2. **Replace / add source files**
   - Remove the default `ContentView.swift` and `JarvisWakeMacApp.swift` that Xcode generated if they conflict.
   - Add all Swift files from the `JarvisWakeMac/` folder to the app target:
     - `JarvisWakeMacApp.swift`
     - `WakeWordEngine.swift`
     - `JarvisClient.swift`
     - `TTSManager.swift`
     - `WakeConfig.swift`
     - `SettingsView.swift`
   - Add **Info.plist** to the project and set the target’s **Info** to use it (or merge the keys into the target’s Info tab):
     - `NSMicrophoneUsageDescription`
     - `NSSpeechRecognitionUsageDescription`
     - `LSUIElement` = `true` (menu bar only, no dock icon)

3. **Capabilities**
   - In the target’s **Signing & Capabilities**, enable **App Sandbox** if you want; for localhost gateway you may need to allow **Outgoing Connections (Client)**.
   - **Hardened Runtime** (default): allow **Disable Library Validation** only if you need to load unsigned libs; otherwise leave as-is.

4. **Build and run**
   - Select **My Mac** as destination and run (⌘R).
   - Grant **Microphone** and **Speech Recognition** when prompted (System Settings → Privacy & Security).

---

## Where the app appears

When it’s running you’ll see it in two places:

- **Dock** — The app has a **dock icon**. Use it to confirm the app is running; **click it** to open the main menu (same as the menu bar).
- **Menu bar** — Top-right of the screen (next to the clock/Wi‑Fi/battery), an **ear** icon. If you don’t see it, click the **»** (overflow) in the menu bar. Click the ear to open the menu: **Go live**, **Test: Send "What time is it?"**, **Settings…**, **Quit**.

---

## First run

1. **Start the JARVIS gateway** (so the app can reach it):
   ```bash
   cd /path/to/JARVIS
   node scripts/start-gateway-with-vault.js
   ```
   Or use your Edge URL (see Settings below).

2. **Run the app** from Xcode (⌘R) or open the built **JarvisWakeMac.app** (e.g. from **Product → Show Build Folder** → open the app).
3. **Look at the menu bar** (top-right). Click the **ear icon** → choose **Go live** (or press ⌘⇧J).
4. Say: **"Hey JARVIS, what time is it?"** — the app should send the command to JARVIS and speak the reply.

---

## Settings

- **JARVIS Wake** menu → **Settings…**
  - **Base URL**
    - **Local gateway:** `http://127.0.0.1:18789`
    - **Edge:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis`
  - **Token:** Optional for local gateway; required for Edge (use same `JARVIS_AUTH_TOKEN` as the UI).

Optional config file (overrides are applied at launch):

- **`~/.jarvis/wake.conf`**
  ```
  baseURL=http://127.0.0.1:18789
  token=your-token-if-using-edge
  ```

---

## Contract (for gateway / Edge)

- **Gateway:** `POST {baseURL}/v1/chat/completions` with header `x-openclaw-agent-id: main` and body:
  `{ "model": "openclaw:main", "messages": [ { "role": "user", "content": "<command>" } ], "stream": false }`
  Response: OpenAI-style; app parses `choices[0].message.content` or top-level `content` / `message` / `text`.
- **Edge:** `POST {baseURL}` with body:
  `{ "message": "<command>", "session_id": "wake-word" }`
  Response: `{ "content": "..." }`. Header: `Authorization: Bearer <token>` if set.

See [JARVIS_WAKE_WORD_ROADMAP.md](../../docs/JARVIS_WAKE_WORD_ROADMAP.md) and [GATEWAY_IMPLEMENTER.md](../../docs/GATEWAY_IMPLEMENTER.md).

---

## E2E API test

To test the same API the app uses (no mic or app required), run the script in `e2e/` with the gateway (or Edge) running:

```bash
cd apps/jarvis-wake-mac/e2e
python3 e2e_api_test.py
```

See [e2e/README.md](e2e/README.md) for options and CI use.

---

## Run at login

- **System Settings** → **General** → **Login Items** → add **JarvisWakeMac.app** so it starts at login.
- Or duplicate the app (or an alias) into `~/Library/LaunchAgents` and use a plist that runs `open -a JarvisWakeMac` at login (optional; Login Items is simpler).

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| "Speech recognition denied" | System Settings → Privacy & Security → Speech Recognition → enable for JarvisWakeMac (or turn on "Recognize Speech" and allow the app). |
| "Microphone access denied" | System Settings → Privacy & Security → Microphone → enable for JarvisWakeMac. |
| "JARVIS error 401" | Wrong or missing token for Edge; set token in Settings or `~/.jarvis/wake.conf`. |
| "JARVIS error 0" or no reply | Gateway not running or wrong URL. Start gateway and set Base URL to `http://127.0.0.1:18789` (or your Edge URL). |
| Wake phrase not detected | Say **"Hey JARVIS"** clearly; ensure Listening is On in the menu. Reduce background noise. |

---

## Files in this app

| File | Purpose |
|------|--------|
| `JarvisWakeMacApp.swift` | App entry, menu bar, AppDelegate; starts WakeWordEngine. |
| `WakeWordEngine.swift` | AVAudioEngine + SFSpeechRecognizer; continuous recognition; substring match "hey jarvis" / "jarvis"; extracts command and calls `onCommand`. |
| `JarvisClient.swift` | POST to gateway or Edge; parses reply content. |
| `TTSManager.swift` | NSSpeechSynthesizer (or `say`) for speaking JARVIS’s reply. |
| `WakeConfig.swift` | Base URL and token (UserDefaults + optional `~/.jarvis/wake.conf`). |
| `SettingsView.swift` | SwiftUI settings: Base URL, Token. |
| `Info.plist` | Microphone and Speech Recognition usage descriptions; LSUIElement. |

---

**Docs:** [JARVIS_WAKE_WORD_ROADMAP.md](../../docs/JARVIS_WAKE_WORD_ROADMAP.md) · [JARVIS_INSTEAD_OF_SIRI_MACOS.md](../../docs/JARVIS_INSTEAD_OF_SIRI_MACOS.md)
