# iPhone + JARVIS Integration Guide

Two iPhones, two roles:

| Device | Role | Key Features |
|---|---|---|
| **Carry iPhone** | Personal JARVIS interface | Siri voice, ntfy alerts, location triggers |
| **iPhone 15 Pro (desk)** | Compute/vision node | Camera vision, always-on monitor |

## Prerequisites

1. **Tailscale** installed on both iPhones, signed into the same account as Pixel
2. **Pixel gateway** running and accessible at `http://100.75.3.115:18789`
3. **ntfy app** installed on carry iPhone (App Store, free)

---

## 1. Siri → JARVIS (Carry iPhone)

See [SIRI_JARVIS_SHORTCUT.md](./SIRI_JARVIS_SHORTCUT.md) for full step-by-step.

**Quick summary**: Create an iOS Shortcut called "Ask JARVIS" that:
- Dictates your question
- POSTs to `http://100.75.3.115:18789/v1/chat/completions`
- Speaks the response

Trigger: **"Hey Siri, Ask JARVIS"**

---

## 2. Push Notifications (Carry iPhone)

### Setup
1. Install **ntfy** from App Store
2. Open ntfy → Subscribe → Topic: `jarvis-repairman29-alerts`
3. Done. Notifications will appear on your lock screen.

### What sends notifications
- JARVIS heartbeat reports (when something needs attention)
- Location events (arrive/leave)
- Manual: `node scripts/notify-iphone.js "Title" "Message"`

### Customize
```bash
# High priority alert
node scripts/notify-iphone.js --priority high --tags "warning" "Alert" "Gateway down"

# From other scripts
const { notify } = require('./notify-iphone.js');
await notify('JARVIS', 'Task complete', { priority: 'default', tags: 'white_check_mark' });
```

---

## 3. Vision Camera (iPhone 15 Pro — Desk)

The desk iPhone becomes JARVIS's eyes.

### Setup
1. On the iPhone 15 Pro, open Safari
2. Navigate to `http://100.75.3.115:18792/vision`
3. Allow camera access when prompted
4. Tap Share → Add to Home Screen → name it "JARVIS Eye"
5. Open from home screen (runs full-screen, no browser chrome)
6. Keep plugged in, screen on

### Features
- **Manual capture**: Tap "Capture & Analyze" → asks Gemini to describe the scene
- **Continuous monitoring**: Toggle on → captures every 30 seconds
- **Custom questions**: Type "Is anyone at my desk?" and capture
- **API access**: Other JARVIS components can GET `/vision/latest` for the most recent analysis

### API
```bash
# Get latest analysis
curl http://100.75.3.115:18792/vision/latest

# Trigger analysis programmatically
curl -X POST http://100.75.3.115:18792/vision/analyze \
  -H "Content-Type: application/json" \
  -d '{"image":"BASE64_JPEG","question":"What do you see?"}'
```

---

## 4. Location Automations (Carry iPhone)

iOS Shortcuts automations trigger when you arrive/leave locations.

### Setup: "Arrive at Office"
1. Open **Shortcuts** → **Automation** tab → **+**
2. Choose **Arrive** → search for your office address → **Done**
3. Set **Run Immediately** (no confirmation needed)
4. Add action: **Get Contents of URL**
   - URL: `http://100.75.3.115:18791/webhook/location/arrive`
   - Method: POST
   - Headers: Content-Type = application/json
   - Request Body: JSON → `{"location":"Office"}`
5. Save

### Setup: "Leave Office"
Same steps but choose **Leave** and URL ending `/leave`.

### What happens
- JARVIS logs the event
- ntfy notification: "Arrived: Office"
- If arriving at office/home: triggers a plan-execute cycle (JARVIS checks tasks, PRs, etc.)

### Other location ideas
- **Arrive Home**: "Hey JARVIS, what happened today?" summary
- **Leave Office**: Lock/secure checklist
- **Arrive Gym**: Start workout playlist via Shortcut

---

## 5. Smart Routing (Neural Farm)

The LLM router (`scripts/pixel-llm-router.js` on port 18890) already supports:

| Route Mode | Behavior |
|---|---|
| `round-robin` | Alternate between backends |
| `chat-task` | Short chats → fast model, complex tasks → deep model |
| `model` | Route by model name in request |
| `primary` | Always use Pixel |

When iPhone LLM inference is set up (via LM Studio mobile or similar):
- Set `JARVIS_IPHONE_LLM_URL` in `.clawdbot/.env`
- Router auto-includes it as secondary backend
- Failover: if one device is busy, requests cascade to the next

---

## Service Ports

| Port | Service | Accessible From |
|---|---|---|
| 18789 | Gateway (chat, Discord, skills) | All interfaces |
| 18791 | Webhook triggers (location, GitHub) | All interfaces |
| 18792 | Vision bridge (camera UI + API) | All interfaces |
| 18888 | Chat web UI | All interfaces |
| 18890 | LLM router | localhost |
| 8889 | InferLLM | localhost |
| 4000 | LiteLLM proxy | All interfaces |

---

## Troubleshooting

**Can't reach Pixel from iPhone**
- Open Tailscale on iPhone → verify it shows "Connected"
- Try pinging `100.75.3.115` from the Tailscale app

**Vision page shows black screen**
- iOS requires HTTPS for camera access on non-localhost origins
- Workaround: Use the "Add to Home Screen" method (PWA mode allows HTTP camera)
- Alternative: Access via `http://localhost:18792/vision` if running a local tunnel

**ntfy notifications not arriving**
- Check ntfy app → verify subscribed to `jarvis-repairman29-alerts`
- Test: `curl -d "test" ntfy.sh/jarvis-repairman29-alerts`

**Siri Shortcut times out**
- Tailscale may have disconnected → reopen Tailscale app
- Gateway may be down → check via Discord or direct curl
