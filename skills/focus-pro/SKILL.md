# Focus Pro — Focus sessions & deep work

Use for focus blocks, Pomodoro timers, and "deep work" sessions. Starts a timer; when it ends, you get a notification: **macOS** `say`, **Linux** `notify-send`, **Windows** toast. Duration 1–180 minutes.

---

## Setup

No env vars required for the stub. For a full implementation you might add:

- Optional: path to a Pomodoro app or system notification script.
- Optional: webhook or calendar API for logging sessions.

---

## When to use

| User says… | Tool | Notes |
|-------------|------|--------|
| "Start a focus session", "I need to focus for 25 minutes" | `start_focus_session` | Use 25 min default for Pomodoro. |
| "Focus for 50 minutes on writing" | `start_focus_session` | Pass `duration_minutes: 50`, `label: "writing"`. |
| "Start a Pomodoro" | `start_focus_session` | 25 min, optional label "Pomodoro". |

---

## Tool reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `start_focus_session` | Start a focus block; when time is up, system notifies (macOS say, Linux notify-send, Windows toast). | `duration_minutes` (number, 1–180, default 25), `label` (optional string) |

---

## Natural language examples

- "Start a 25 minute focus session."
- "I'm going to focus on code review for 45 minutes."
- "Start my Pomodoro."

---

## Integration

- **Clock skill:** Use for "focus until 3 PM" (compute duration from current time).
- **Reminders:** Optional: "Remind me when this focus block ends."
