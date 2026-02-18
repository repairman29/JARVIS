# Focus Pro

Focus sessions, Pomodoro-style timers, and deep-work blocks. Starts a timer; when it ends, **macOS** uses `say` to announce "Focus session complete." (Windows/Linux: timer runs but no voice yet—add toast/notify-send if desired.)

## Installation

The skill is loaded by the gateway when present under `skills/focus-pro/`. No env vars required. On macOS, `say` is built-in.

## Quick usage

- **"Start a 25 minute focus session"** → 25 min timer; you'll hear a notification when it ends.
- **"Focus for 50 minutes on writing"** → 50 min, label "writing"; announcement includes the label.

## Limits

- Duration capped at 180 minutes (3 hours). Minimum 1 minute.

See [SKILL.md](./SKILL.md) for full docs.
