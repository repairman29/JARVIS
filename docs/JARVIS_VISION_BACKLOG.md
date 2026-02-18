# JARVIS vision / screen — backlog

**Goal:** When we have a clear use case, JARVIS could “see” the user’s screen (or camera) for grounded reasoning — debugging, UI automation, or “what’s on my screen?” This doc captures **use cases, options, and when to implement**. See [JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) §3 item 7.

---

## Use cases (implement when one is clear)

| Use case | Value | Notes |
|----------|--------|-------|
| **“What’s on my screen?”** | User asks “what do you see?” and JARVIS describes the current window or screenshot. | Good for accessibility or quick context. |
| **Debugging / error on screen** | User shares a screenshot or grants screen capture; JARVIS reads the error message, stack trace, or UI state and suggests a fix. | High value for dev workflow; can start with “paste screenshot” before live capture. |
| **UI automation** | “Click the Submit button” or “fill the form with X” — JARVIS drives the browser or app via coordinates or accessibility tree. | Heavier; needs safe control layer and possibly Cursor browser MCP or Playwright. |
| **Manufacturing / quality (future)** | Camera feed or screen from a line; JARVIS detects defects or anomalies. | From [AGENTIC_AUTONOMY_2026_ECOSYSTEM.md](./AGENTIC_AUTONOMY_2026_ECOSYSTEM.md); out of scope for JARVIS UI for now. |

---

## Options (how to implement)

| Option | Pros | Cons |
|--------|------|------|
| **Paste screenshot / image in chat** | No new infra; user uploads or pastes; we send image to a vision-capable model (e.g. GPT-4o, Claude with image). | Not “live” screen; user must capture and paste. |
| **Browser screen capture (getDisplayMedia)** | Live tab or window in the browser; capture frame and send to vision model. | Needs user permission each time (or persisted); only what’s in the browser. |
| **MCP server: screen capture** | Local MCP server that captures screen (e.g. via native lib or Electron); JARVIS (Cursor or gateway) calls MCP tool “capture_screen” and gets image. | One implementation works for Cursor and JARVIS; requires running an MCP server and granting screen access. |
| **Local VLM (Ollama, etc.)** | Run a vision model locally; send screenshot to it for description or analysis. | Privacy-preserving; needs local GPU/resources and wiring. |
| **Cursor browser MCP** | Use Cursor’s browser MCP to snapshot or interact with a page. | Only in Cursor; not in standalone JARVIS UI. |

---

## Recommended path

1. **Short term** — Support **paste image / screenshot in chat** so the user can send a screenshot and JARVIS can reason over it (vision-capable model required). No new “screen capture” yet; just image-in-message and model that accepts it.
2. **Next** — If “what’s on my screen” is requested often, add an **MCP server** that exposes `capture_screen` (or similar); JARVIS and Cursor can both call it. Implement the server in a separate repo or in CLAWDBOT as a small Node script that uses a native capture lib.
3. **Later** — UI automation (“click Submit”) is a bigger surface; consider Cursor browser MCP or a dedicated automation MCP that can drive the browser safely.

---

## Implementation checklist: paste image in chat

| Step | Status | Notes |
|------|--------|-------|
| 1. UI | ✅ Done | Composer: paste image → preview + clear; submit sends imageDataUrl. Footer: "Paste image to attach." |
| 2. Chat API | ✅ Done | api/chat/route.ts accepts imageDataUrl; forwards to Edge and gateway. |
| 3. Edge | ✅ Done | Edge accepts image_data_url, forwards as imageDataUrl to gateway. |
| 4. Gateway | ✅ Done (Edge merge) | Edge merges image into the last user message as OpenAI-style multimodal content (`content: [{ type: "text", text: "..." }, { type: "image_url", image_url: { url } }]`) before calling the gateway. Gateway receives standard messages; use a vision-capable model (e.g. GPT-4o, Claude) for replies. |

When the user pastes an image, the Edge sends the request with the image in the last user message. The gateway must forward that message shape to a vision-capable model to get image reasoning.

---

## References

- [AGENTIC_AUTONOMY_2026_ECOSYSTEM.md](./AGENTIC_AUTONOMY_2026_ECOSYSTEM.md) — § Real-Time Vision and Screen Analysis, VLMs.
- [JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) — §3 item 7 (Multimodal: vision/screen).
- [JARVIS_VOICE.md](./JARVIS_VOICE.md) — Voice in/out (parallel multimodal track).
