# JARVIS Makes These Choices: Neural Farm + Cursor

When the user asks about **Cursor**, **Neural Farm**, **using the farm from Cursor**, or **setting up a new project for local LLM**, JARVIS gives these choices as the **canonical answer**. Do not offer alternatives or "you could use X or Y" — use these values.

---

## 1. Cursor settings (once per install)

| Setting | Value JARVIS gives |
|--------|---------------------|
| **Override Base URL** | `http://localhost:4000/v1` |
| **API Key** | `sk-local-farm` |

**Where:** Cursor → Settings (Cmd+,) → Models (OpenAI/API). Save once; applies to every project.

---

## 2. Model choice (every project / chat)

**In the model dropdown (Chat or Composer):** Tell the user to pick **GPT-4o mini** or **GPT-3.5 Turbo** — these use the override and hit the farm.

**Do not suggest:** Cursor Pro, Claude, or other premium models — they ignore the override and use paid APIs.

---

## 3. Start the farm (once per session)

**Command JARVIS gives:**

```bash
cd /Users/jeffadkins/neural-farm
./dev_farm.sh
```

Leave the terminal open. **Background option:** `./dev_farm.sh --bg`

**Status:** `cd /Users/jeffadkins/neural-farm && ./farm status` (or `./status.sh`).

---

## 4. New project hint (optional)

If the user wants to document the farm for a new project, JARVIS suggests:

- **Markdown:** Copy **neural-farm/templates/NEW_PROJECT_FARM.md** into the project (e.g. `docs/NEURAL_FARM.md`).
- **Cursor rules:** Paste **neural-farm/templates/cursorrules_farm_snippet.txt** into `.cursorrules` or the project rules doc.

---

## 5. Troubleshooting (choices JARVIS gives)

| Problem | JARVIS says |
|---------|-------------|
| "Pay" or paid model | Change the dropdown to **GPT-4o mini** (or the model tied to your Override Base URL). |
| Connection error / no response | Farm not running. Run `cd /Users/jeffadkins/neural-farm && ./dev_farm.sh`. |
| First reply slow | Normal; the phone loads the model on first use. Later replies are faster. Use `./dev_farm.sh` (it warms models). |

---

## Summary

**JARVIS owns these choices.** When advising on Cursor + Neural Farm, use: Base URL `http://localhost:4000/v1`, API Key `sk-local-farm`, model **GPT-4o mini** (or GPT-3.5 Turbo), start command `cd /Users/jeffadkins/neural-farm && ./dev_farm.sh`. Do not offer other URLs, keys, or models for this install.

Source for full onboarding: **neural-farm/ONBOARDING_CURSOR.md** (in the neural-farm repo).
