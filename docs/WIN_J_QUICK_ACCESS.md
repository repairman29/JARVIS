# Quick Access with Win+J

Open the JARVIS dashboard instantly with a keyboard shortcut.

---

## Option 1: PowerToys (Recommended)

If you have [Microsoft PowerToys](https://aka.ms/getPowertoys) installed:

1. Open **PowerToys Settings** → **Keyboard Manager** → **Remap a shortcut**
2. Click **+ Add shortcut remapping**
3. Set:
   - **Physical Shortcut:** Win + J
   - **Mapped To:** Run Program
   - **App:** `powershell.exe`
   - **Args:** `-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\jeffa\JARVIS\JARVIS\scripts\jarvis-quick-access.ps1"`
4. Click **OK** and close settings

Now **Win+J** opens the JARVIS dashboard (or shows a message if the gateway isn't running).

---

## Option 2: Desktop Shortcut with Hotkey

1. Right-click Desktop → **New** → **Shortcut**
2. Location: `powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\jeffa\JARVIS\JARVIS\scripts\jarvis-quick-access.ps1"`
3. Name: `JARVIS`
4. Right-click the shortcut → **Properties**
5. In **Shortcut key**, press **Ctrl+Alt+J** (Windows doesn't allow Win+key for shortcuts)
6. Click **OK**

Now **Ctrl+Alt+J** opens JARVIS.

---

## Option 3: AutoHotkey Script

If you use [AutoHotkey](https://www.autohotkey.com/):

```ahk
; Win+J opens JARVIS dashboard
#j::Run, http://127.0.0.1:18789/
```

Save as `jarvis-hotkey.ahk` and add to Startup folder.

---

## Option 4: Taskbar Pin

1. Open **http://127.0.0.1:18789/** in Edge or Chrome
2. Click **...** (menu) → **More tools** → **Pin to taskbar** (or **Create shortcut**)
3. Now JARVIS is one click away on your taskbar

---

## What the Script Does

`scripts/jarvis-quick-access.ps1`:

1. Checks if the gateway is running at `http://127.0.0.1:18789/`
2. If running → opens the dashboard in your default browser
3. If not running → shows a message with instructions to start it

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Gateway not running" | Run `npx clawdbot gateway run` or `node scripts/start-gateway-with-vault.js` first |
| Hotkey doesn't work | Check PowerToys is running; try Ctrl+Alt+J instead |
| Script doesn't run | Allow PowerShell scripts: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
