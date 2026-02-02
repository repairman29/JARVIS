# Olive — Notes for Transfer (to Olive repo or team)

Notes to carry over when you open the Olive repo or hand off. Everything below lives in CLAWDBOT docs; this file is a single place to copy from.

---

## 1. List parsing: parser, not AI

- **Requirement:** List decoupling / Smart Paste (“milk, eggs, sourdough” → items) must use an **intelligent, deterministic parser** — **not AI/LLM** — to save cost and prevent abuse.
- **In Olive repo, verify:**
  - [ ] “Paste → list of items” uses a **rule-based parser** (split on commas/newlines/“and”, trim, normalize). No LLM call for that step.
  - [ ] **Rate limits** on paste / “Add list” (per user, session, or IP for anonymous “Try the command flow”).
  - [ ] **Input limits:** max paste length, max items per list; reject or truncate with clear message.
  - [ ] Optional: reject or cap obvious garbage (no valid tokens, single huge token).
- **Full spec:** `docs/OLIVE_LIST_PARSING_SPEC.md` in this repo.

---

## 2. Repo swap / working in Olive

- Olive app code lives in **repairman29/olive**; CLAWDBOT only has docs.
- To work in Olive: **File → Add Folder to Workspace** and add your Olive clone, or **File → Open Folder** and open Olive. Then you can edit Olive code and still have these notes in CLAWDBOT.
- Transfer these notes (or links) into the Olive repo when you open it (e.g. `docs/NOTES_FROM_CLAWDBOT.md` or paste into existing product manual).

---

## 3. Olive docs in CLAWDBOT (reference)

| Doc | Use |
|-----|-----|
| **docs/OLIVE_PROJECT_README.md** | Overview, try it, feedback, beta testers, expansion. |
| **docs/OLIVE_LIST_PARSING_SPEC.md** | Parser-not-AI requirement, rate limits, abuse controls. |
| **docs/OLIVE_FEEDBACK.md** | Short “how to give feedback” (in-app, direct, GitHub). |
| **docs/OLIVE_READY_FOR_EXPANSION.md** | Checklist: docs done, Olive repo to-dos, feedback channels. |
| **docs/JARVIS_OLIVE_VIDEO_PROMO.md** | Video promo: MP4, GIFs, pipeline; run `./scripts/olive-promo-video.sh`. |

---

## 4. One-line summary

**Olive:** Your kitchen list → Kroger cart. List parsing = deterministic parser (not AI); add rate limits and input caps. Video promo assets from CLAWDBOT script; feedback and expansion checklists in docs above.
