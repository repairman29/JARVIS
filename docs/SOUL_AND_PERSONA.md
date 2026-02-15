# SOUL and persona

JARVIS personality and constraints come from **SOUL-style** content in one or more places.

## Where SOUL lives

| Location | Used by | Notes |
|----------|---------|--------|
| **jarvis/SOUL.md** (repo) | Gateway | Part of default workspace. Full identity, boundaries, power-user moves. |
| **~/.jarvis/SOUL.md** | Voice node (optional), you | Copy from [SOUL_TEMPLATE.md](./SOUL_TEMPLATE.md). Set `system_prompt_file: "~/.jarvis/SOUL.md"` in `~/.jarvis/voice_node.yaml` so the voice node loads it. |
| **~/.jarvis/voice_node.yaml** `system_prompt` | Voice node | Inline prompt; overridden if `system_prompt_file` is set and the file exists. |

## Voice node

- **system_prompt** in `voice_node.yaml`: direct string for TTS; keep it short so replies are spoken, not essays.
- **system_prompt_file**: path to a file (e.g. `~/.jarvis/SOUL.md`). If set and the file exists, the voice node uses its content as the system prompt, **truncated to 1500 characters** so the voice context stays small. Put the most important identity and “short replies” at the top of the file.

## Gateway

The gateway loads the **workspace** (e.g. `jarvis/` or `~/jarvis`). Any `SOUL.md` (or `IDENTITY.md`, `AGENTS.md`, etc.) in that workspace is part of the agent context. No separate “SOUL path” is required; the workspace directory is the source of truth for chat.

## Pixel / Sovereign Nexus

For a Pixel-only or minimal setup:

1. Copy [SOUL_TEMPLATE.md](./SOUL_TEMPLATE.md) to `~/.jarvis/SOUL.md` and edit.
2. In `~/.jarvis/voice_node.yaml` add: `system_prompt_file: "~/.jarvis/SOUL.md"` (and optionally comment out or shorten the inline `system_prompt`).
3. If you run the gateway on the same device with a workspace that contains `SOUL.md`, the full SOUL is used for chat; the voice node still uses the first 1500 chars from the file for its system prompt.

See also: [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md) (§6 Soul), [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md).
