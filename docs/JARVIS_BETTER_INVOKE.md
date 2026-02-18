# Better Ways to Invoke JARVIS

The native **JARVIS Wake** menu-bar app (“Hey JARVIS”) can be fragile (permissions, connection, menu bar, macOS version). These options are more reliable and often faster to use.

---

## 1. **Cursor + MCP (best when you’re already coding)**

Use JARVIS as a tool inside Cursor. No separate app, no wake word, no mic permissions.

1. **Add JARVIS as an MCP server** (once):
   - **Cursor Settings** → **Tools & Integrations** → **MCP Servers**
   - Add: **URL** = your Edge URL, e.g. `https://YOUR_PROJECT.supabase.co/functions/v1/jarvis`
   - If Edge uses auth: set **Authorization: Bearer &lt;token&gt;** (per Cursor’s UI)
   - See [JARVIS_MCP_CURSOR.md](./JARVIS_MCP_CURSOR.md) for details.

2. **Invoke JARVIS:**
   - **Cmd+I** (Mac) or **Ctrl+I** (Windows) to open the **Agent** / Ask AI panel.
   - Type: *“Ask JARVIS what time it is”* or *“Use jarvis_chat to search the web for X.”*
   - The agent calls JARVIS and shows the reply in the thread.

**Pros:** No extra app, no voice/mic setup, works with your current workflow.  
**Cons:** Only available when Cursor is open.

---

## 2. **Web UI + voice (best for “talk to JARVIS”)**

The JARVIS web UI supports voice input and spoken replies. Use it instead of the native wake-word app.

1. **Run the UI** (gateway must be running):
   ```bash
   cd apps/jarvis-ui && npm run dev
   ```
   Open **http://localhost:3001** (or your deployed URL).

2. **Turn on voice:**
   - Enable **Voice** (speak replies).
   - Enable **Conversation mode** so you can reply by voice after each answer.

3. **Use the mic** in the composer to dictate; no “Hey JARVIS” needed.

4. **Optional — one-key open (like Siri):**
   - **Shortcuts app** → New shortcut → **Open URL** → `http://localhost:3001`
   - **Add to Menu Bar** and/or set a **global keyboard shortcut** (e.g. Option+Space) in Shortcuts → Settings → Keyboard Shortcuts.

**Pros:** Reliable, same contract as the wake app (gateway or Edge), no native app issues.  
**Cons:** Requires browser (or PWA) and optionally gateway/UI running.

---

## 3. **Terminal (CLI)**

For quick one-off questions from the terminal:

```bash
clawdbot chat "What time is it in Denver?"
```

Requires gateway running and `clawdbot` installed (`npm install -g clawdbot`). You can wrap this in a launcher (Raycast, Alfred) or a shell alias.

**Pros:** Fast, scriptable, no UI.  
**Cons:** Text only; no voice.

---

## 4. **Native “Hey JARVIS” app (optional)**

The **JARVIS Wake** menu-bar app (`apps/jarvis-wake-mac`) is still available if you want hands-free “Hey JARVIS” on macOS. It has more moving parts (Speech framework, mic, menu bar, connection to gateway/Edge), so if you hit crashes or “could not connect,” prefer **Web UI + voice** or **Cursor MCP** above.

See [apps/jarvis-wake-mac/README.md](../apps/jarvis-wake-mac/README.md) for build and setup.

---

## Summary

| Goal                         | Recommended approach                    |
|-----------------------------|----------------------------------------|
| Use JARVIS while in Cursor | **Cursor MCP** — Cmd+I, “Ask JARVIS …” |
| Talk to JARVIS (voice)      | **Web UI** + voice + optional shortcut |
| Quick terminal one-liner    | **clawdbot chat**                      |
| Hands-free “Hey JARVIS”     | **JARVIS Wake** app (optional)        |
