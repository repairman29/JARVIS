# Clawd and JARVIS — Master Repo

**JARVIS is the master repo** for all Clawd/JARVIS product work. This repo is the single source of truth for the assistant, skills, gateway, and docs.

## What lives here (JARVIS)

- **This repo** (`repairman29/JARVIS`): Main assistant codebase, agent instructions, core skills, web UI, gateway, Supabase, Discord bot.
- **Canonical paths on your machine:** `~/JARVIS` (or `~/jarvis` on case-insensitive macOS — same folder). Agent/skills content: `~/JARVIS/jarvis/`.

## Separate repos (intentionally different)

- **jarvis-rog-ed** (`repairman29/jarvis-rog-ed`): Windows/ROG Ally edition. You dev on the ROG to test; keep this repo and folder separate.
- **JARVIS-Premium** (`repairman29/JARVIS-Premium`): Premium skills and marketplace content. Sibling to this repo.

## Clawd = the umbrella

“Clawd” is the umbrella name for the ecosystem. JARVIS is the primary product. Other products in the ecosystem (BEAST MODE, Echeo, Code Roach, Olive, etc.) are separate repos; JARVIS orchestrates them (see AGENTS.md and docs on agent orchestration).

## Where the old “clawd” folder went

The standalone `~/clawd` folder (identity docs, product skills like echeo/beast-mode) was folded into this repo. Identity and soul are in **jarvis/IDENTITY.md** and **jarvis/SOUL.md**. If you had local-only content in `~/clawd`, it was archived; the canonical home for Clawd/JARVIS is **this repo**.
