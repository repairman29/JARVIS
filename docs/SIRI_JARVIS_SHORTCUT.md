# Siri Shortcut: Talk to JARVIS from Your iPhone

Use Siri or a home-screen shortcut to ask JARVIS questions from your iPhone. Your request goes to the JARVIS gateway on your Pixel (or other farm node) over **Tailscale**, and the response is spoken back or shown on screen.

---

## Prerequisites

1. **Tailscale on iPhone**
   - Install [Tailscale from the App Store](https://apps.apple.com/app/tailscale/id1470499037).
   - Open Tailscale and sign in with the **same account** as your Pixel/JARVIS node.
   - Ensure the VPN is **connected** (green status in the app). You must be on the tailnet to reach the gateway.

2. **JARVIS gateway reachable**
   - The gateway must be running on your Pixel (or farm node) and bound for network access.
   - Default: `http://100.75.3.115:18789` (Pixel Tailscale IP). Replace with your node’s Tailscale IP if different.

---

## Configuration (copy-paste)

| Setting | Value |
|---------|-------|
| **Gateway URL** | `http://100.75.3.115:18789` |
| **Auth header** | `Bearer 7np03eAY6Qtf73i4lNUf_yZcc6JhhehYryT_crDVRzA` |
| **Endpoint** | `POST /v1/chat/completions` |
| **Content-Type** | `application/json` |

**Request body template:**
```json
{
  "model": "gemini/gemini-2.5-flash",
  "messages": [
    {"role": "system", "content": "You are JARVIS, a personal AI assistant. Be concise and helpful. Reply in 2-3 sentences max."},
    {"role": "user", "content": "USER_INPUT_HERE"}
  ]
}
```

**Response path:** `choices[0].message.content`

---

## Shortcut 1: "Ask JARVIS" (voice via Siri)

Voice input → send to gateway → speak response.

### Step-by-step actions

1. **Open Shortcuts** → tap **+** (New Shortcut).
2. **Add action** → search **Dictate Text** → add it.
   - Leave "Stop listening" as default (e.g. when you pause). This captures your question.
3. **Add action** → search **URL** → add it.
   - Set URL to: `http://100.75.3.115:18789/v1/chat/completions`
4. **Add action** → search **Text** → add it.
   - Paste this exactly (one line):
     ```
     {"model":"gemini/gemini-2.5-flash","messages":[{"role":"system","content":"You are JARVIS, a personal AI assistant. Be concise and helpful. Reply in 2-3 sentences max."},{"role":"user","content":"REPLACE_ME"}]}
     ```
5. **Add action** → search **Replace Text** → add it.
   - **Text to Search:** `REPLACE_ME`
   - **Replace With:** tap and select **Dictated Text** (from step 2).
   - **Get Text From:** select the **Text** output from step 4.
6. **Add action** → search **Get Dictionary from Input** → add it.
   - **Input:** the **Replace Text** output from step 5. (On many iOS versions this parses the JSON string into a dictionary. If you get an error, use the [Dictionary alternative](#alternative-build-body-with-dictionary-if-text--replace-fails) below.)
7. **Add action** → search **Get Contents of URL** → add it.
   - **URL:** select the **URL** variable from step 3.
   - Tap **Show More**.
   - **Method:** `POST`
   - **Headers:** tap **Add new header** twice:
     - `Authorization` = `Bearer 7np03eAY6Qtf73i4lNUf_yZcc6JhhehYryT_crDVRzA`
     - `Content-Type` = `application/json`
   - **Request Body:** `JSON`
   - **JSON:** tap **Choose** → select the **Get Dictionary from Input** output (the parsed body from step 6).
   - **Timeout:** 30 seconds (optional, under Show More).
8. **Parse the response** — see [Parsing the response](#parsing-the-response-choices0messagecontent) below. Add the chain of actions to extract `choices[0].message.content`.
9. **Add action** → search **Speak Text** → add it.
   - **Text:** the extracted content from the parse step.
10. **Name the shortcut:** tap the title at the top → rename to **Ask JARVIS**.
11. **Add to Siri:** tap the shortcut settings (⋯) → **Add to Siri** → record "Ask JARVIS" (or your phrase).

### Alternative: Build body with Dictionary (if Text + Replace fails)

If "Get Dictionary from Input" doesn't parse the JSON correctly on your iOS version, build the body manually:

1. **Dictionary** action → add keys:
   - `model` = `gemini/gemini-2.5-flash` (Text)
   - `messages` = **List** with 2 items:
     - Item 1: **Dictionary** → `role` = `system`, `content` = `You are JARVIS, a personal AI assistant. Be concise and helpful. Reply in 2-3 sentences max.`
     - Item 2: **Dictionary** → `role` = `user`, `content` = **Dictated Text**
2. Use this Dictionary as the **Request Body** → JSON in **Get Contents of URL**.

---

## Shortcut 2: "JARVIS Quick" (text input, Share Sheet / widget)

Text input → send to gateway → show or speak response. Good for Share Sheet (e.g. share selected text to JARVIS) or a home-screen widget.

### Step-by-step actions

1. **Open Shortcuts** → tap **+** (New Shortcut).
2. **Add action** → search **Ask for Input** → add it.
   - Prompt: `What would you like to ask JARVIS?`
   - Input Type: **Text**
   - **For Share Sheet:** set **Default Value** to **Shortcut Input** so shared text is pre-filled when you share to the shortcut. (If run from widget, you’ll type in the prompt.)
3. **Add action** → search **URL** → add it.
   - URL: `http://100.75.3.115:18789/v1/chat/completions`
4. **Add action** → search **Text** → add it.
   - Paste:
     ```
     {"model":"gemini/gemini-2.5-flash","messages":[{"role":"system","content":"You are JARVIS, a personal AI assistant. Be concise and helpful. Reply in 2-3 sentences max."},{"role":"user","content":"REPLACE_ME"}]}
     ```
5. **Add action** → search **Replace Text** → add it.
   - **Text to Search:** `REPLACE_ME`
   - **Replace With:** **Provided Input** (or **Shortcut Input** if using Share Sheet).
   - **Get Text From:** the **Text** output from step 4.
6. **Add action** → search **Get Dictionary from Input** → add it.
   - **Input:** the **Replace Text** output.
7. **Add action** → search **Get Contents of URL** → add it.
   - **URL:** from step 3.
   - **Method:** `POST`
   - **Headers:** `Authorization` = `Bearer 7np03eAY6Qtf73i4lNUf_yZcc6JhhehYryT_crDVRzA`, `Content-Type` = `application/json`
   - **Request Body:** `JSON` → select the **Get Dictionary from Input** output.
   - **Timeout:** 30 seconds (optional).
8. **Parse response** — see [Parsing the response](#parsing-the-response-choices0messagecontent) below.
9. **Add action** → search **Show Result** (or **Speak Text**) → add it.
   - Input = extracted content.
10. **Name:** **JARVIS Quick**.
11. **Share Sheet:** tap shortcut settings (⋯) → **Share Sheet** → enable **Receive Share** → choose **Text** (so you can share selected text to JARVIS).
12. **Widget:** Add a Shortcuts widget to home screen, choose **JARVIS Quick**.

---

## Parsing the response (choices[0].message.content)

The API returns JSON like:

```json
{"choices":[{"message":{"content":"Your answer here."}}]}
```

**Option A — Dictionary + List (no script, works everywhere)**

The **Get Contents of URL** output is usually auto-parsed as a dictionary when the response is JSON. Chain these actions:

1. **Get Dictionary Value**
   - **Dictionary:** Contents of URL (from Get Contents of URL).
   - **Key:** `choices`
2. **Get Item from List**
   - **List:** output of step 1.
   - **Get:** First Item
3. **Get Dictionary Value**
   - **Dictionary:** output of step 2.
   - **Key:** `message`
4. **Get Dictionary Value**
   - **Dictionary:** output of step 3.
   - **Key:** `content`

The final output is the reply text.

**Option B — Run Script (if "Allow Running Scripts" is enabled)**

1. **Run Script** — Language: JavaScript.
2. Script:
   ```javascript
   const data = args[0];
   return data.choices[0].message.content;
   ```
3. **Input:** Contents of URL.

---

## How to trigger

| Method | Shortcut |
|--------|----------|
| **"Hey Siri, Ask JARVIS"** | Ask JARVIS (after adding to Siri) |
| **Home screen icon** | Add shortcut to home screen from Shortcuts app |
| **Share Sheet** | Select text → Share → JARVIS Quick |
| **Widget** | Add Shortcuts widget, tap JARVIS Quick |

---

## Troubleshooting

### Tailscale not connected

- **Symptom:** Request fails immediately or times out.
- **Fix:** Open Tailscale on iPhone → ensure status is green/connected. If not, tap to connect. Ensure you’re signed into the same account as the Pixel.

### Gateway down or unreachable

- **Symptom:** Timeout, connection refused, or 5xx.
- **Fix:** From Mac (on same tailnet): `curl -s -o /dev/null -w "%{http_code}" http://100.75.3.115:18789/` — should return `200`. If not, SSH to Pixel and restart the stack, e.g. `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`.

### Timeout

- **Symptom:** Shortcut runs for a long time then fails.
- **Fix:** Increase timeout in **Get Contents of URL** (Show More → Timeout) to 30–60 seconds. Check that the gateway and LLM are responsive from another device.

### Wrong IP or port

- **Symptom:** Connection refused or no route.
- **Fix:** Confirm the Pixel’s Tailscale IP in the Tailscale app. Update the URL in both shortcuts to `http://<correct-ip>:18789/v1/chat/completions`.

### Auth / 401

- **Symptom:** 401 Unauthorized.
- **Fix:** Verify the Bearer token in the `Authorization` header matches your gateway config. No extra spaces; format: `Bearer <token>`.

### Empty or malformed response

- **Symptom:** Shortcut completes but says nothing or errors on parse.
- **Fix:** Check the raw response: add **Show Result** right after **Get Contents of URL** to inspect the JSON. Ensure the path `choices[0].message.content` exists (some models return slightly different shapes).

---

## Security note

The Bearer token in this guide is a **shared secret**. Don’t commit it to public repos or share it. For production, consider rotating it and storing it in a more secure way (e.g. environment variables, keychain).

---

## Quick reference

- **Gateway:** `http://100.75.3.115:18789`
- **Endpoint:** `POST /v1/chat/completions`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Response path:** `choices[0].message.content`
