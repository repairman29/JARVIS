# How to Use the JARVIS Web UI (Best Experience)

The **JARVIS UI** (e.g. https://jarvis-ui-xi.vercel.app) is the main way to talk to JARVIS from a browser. This guide gets you to a great experience quickly.

---

## 1. Open the app and log in

- **Deployed:** Open your JARVIS URL (e.g. jarvis-ui-xi.vercel.app). Log in with your password if it’s enabled. You’ll stay logged in for 30 days.
- **Local:** Run `npm run dev` in `apps/jarvis-ui` and open http://localhost:3001.

---

## 2. First thing to do

- **Check the header** — You should see a green dot and **Farm**, **Edge**, or **Gateway: local**. That’s which backend is answering. If it says **Disconnected**, click **Recheck** or fix the backend (see [RUNBOOK](../../RUNBOOK.md) for gateway/farm).
- **Send a message** — Type in the box at the bottom and press **Enter**. Try: *“What can you do?”* or *“Give me a daily brief.”* Replies stream as they’re generated.

---

## 3. Slash commands (power user)

Type these in the message box and then send (or complete the line and send):

| Command | What it does |
|--------|----------------|
| **/tools** | Opens the Skills panel so you can see what JARVIS can do. |
| **/clear** | Clears the current thread (start a fresh conversation in this tab). |
| **/session** *name* | Switch or create a named session (e.g. `/session work`). |
| **/fast** | Prefer a faster, lighter model for this session. |
| **/best** | Prefer a higher-quality model for this session. |
| **/model** | Clear the fast/best hint. |

You can also click **Skills** in the header instead of typing `/tools`.

---

## 4. Sessions

- **Session** in the header shows the current conversation thread. Each session has its own history.
- Use the dropdown to **switch** to another session or **+ New session**.
- When using **Edge** or **Farm**, your session is stored in the cloud so you can continue the same thread from another device or after closing the tab.

---

## 5. Farm vs Edge (backends)

- **Farm** — Your own JARVIS (e.g. Pixel or relay). Used when the UI can reach it; lowest latency, full skills.
- **Edge** — Hosted JARVIS (Supabase). Used when Farm isn’t reachable (e.g. away from home). Same session can continue.
- **Gateway: local** — Local gateway on your machine (e.g. `http://127.0.0.1:18789`).

The UI tries Farm first when both Farm and Edge are configured; if Farm is unreachable, it falls back to Edge. The **Dashboard** (link in header) shows reachability of each backend.

---

## 6. Header actions (quick reference)

| Action | Use it for |
|--------|------------|
| **Session** (dropdown) | Switch or create sessions. |
| **Copy thread** | Copy the current conversation as markdown (only when there are messages). |
| **Save transcript** | Download the thread as a file. |
| **Run and copy result** | Send the current composer (or last message) once and copy the reply to the clipboard. |
| **Skills** | See what JARVIS can do (Launcher, Web Search, Repo, etc.). |
| **Theme** | Dark / Light / System. |
| **Voice** | Turn on “JARVIS speaks replies” (and optional conversation mode). |
| **Dashboard** | See Farm/Edge/local status and which backend is in use. |
| **Settings** | Session ID, gateway URL (read-only in deployed app), voice options. |
| **Recheck** | Retry connection when the status dot is red (Disconnected). |

---

## 7. Keyboard and input

- **Enter** — Send message. **Shift+Enter** — New line.
- **Esc** — Clear the input (or close modals).
- **Cmd+J** (Mac) / **Ctrl+J** (Windows) — Focus the composer from anywhere on the page.
- **Paste an image** into the composer to attach it (vision-capable backends can use it).
- **Voice** — If your browser supports it, use the mic button: click to toggle, or **hold** to talk and **release** to send.

---

## 8. Getting the best results

1. **Be specific** — “Summarize the last three commits in JARVIS” works better than “Summarize commits.”
2. **Use skills by name when it helps** — “Use launcher to open VS Code” or “Search the web for Next.js 15 release notes.”
3. **Use /fast** when you want a quick answer and **/best** when you care more about quality.
4. **If replies are slow or timeout** — You may be on Farm with a heavy model. Try **/fast** or check the **Dashboard** to see if Edge would be used if Farm is down.
5. **If you see “Disconnected”** — Click **Recheck**. If you’re on the deployed app, Farm might be unreachable from the internet (use Edge), or start your local gateway if you’re on localhost.

---

## 9. Where to get help

- **In the app** — Click **Help** (or **How to use**) in the header for a short in-app reference.
- **Repo** — [RUNBOOK.md](../../RUNBOOK.md) for gateway, Edge, Farm, and auth. [JARVIS_UI_DEVELOPER_SPEC.md](./JARVIS_UI_DEVELOPER_SPEC.md) for the full UX spec.
- **Dashboard** — Use it to confirm which backend is active and whether Farm/Edge are reachable.

---

**TL;DR:** Open the UI → check the green dot (Farm/Edge/local) → send a message. Use **/tools** to see skills, **Session** to switch threads, **Dashboard** to see backend status. Use **Help** in the header for a quick reference anytime.
