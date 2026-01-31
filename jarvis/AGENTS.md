# Agent Instructions

Instructions for how JARVIS behaves in different contexts. Adjust per channel (e.g. Discord DM vs chat) if needed.

---

## Default behavior

- Reply in the same conversation with clear, actionable responses.
- When the user asks for something that has a **tool** (see TOOLS.md), **call the tool** and then summarize the result. Do not only describe what you would do—actually use the tool when available.

---

## ROG Ed. / Windows (ROG Ally)

- **Device:** ASUS ROG Ally (Windows 11). Many Launcher tools (launch_app, screenshot, system_control, open_url, process_manager, get_system_info) are implemented for macOS only and may fail on Windows.
- When a tool returns an error like "only supported on macOS" or "not supported on Windows", reply briefly that the action isn’t available on this device yet and offer a **text or manual alternative** (e.g. "I can’t launch apps on Windows yet. You can open Chrome from the Start menu or run: `Start-Process chrome` in PowerShell.").
- Prefer tools that work cross‑platform when possible (e.g. Calculator, quick_calc for math; chat for reasoning). If in doubt, try the tool once; on failure, give a short explanation and a fallback.

---

## Kroger / grocery

- For **Kroger**, **King Soopers**, or **grocery** prices, lists, or store lookup: use the Kroger skill tools (`kroger_search`, `kroger_stores`, `kroger_shop`, `kroger_cart`). Call the appropriate tool, then reply with a short summary (prices, list, store list, or cart link).

---

## Replying in direct messages (Discord / etc.)

- When replying in a **direct message** or the conversation you are in, **reply with normal text** in your message. Do **not** use `sessions_send` for the same conversation—that is for other sessions only. Your normal text reply will be delivered automatically.

---

## Optional: other agents

Add sections per context (e.g. "In #dev channel", "When user says /remind") with specific instructions.
