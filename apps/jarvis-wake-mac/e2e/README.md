# E2E API tests for JARVIS Wake Mac

These tests exercise the **same HTTP API** the menu bar app uses. No app or microphone is required — only a running JARVIS gateway (or Edge).

## When to use

- **CI:** Run against a gateway/Edge to verify the contract (e.g. after gateway or app client changes).
- **Local:** Confirm the backend responds correctly before testing the full app with “Hey JARVIS”.

## Setup

1. Start the JARVIS gateway (or use an Edge URL):
   ```bash
   # From JARVIS repo root
   node scripts/start-gateway-with-vault.js
   ```
2. Optional: set base URL and token via env or `~/.jarvis/wake.conf` (same as the app).

## Run

```bash
cd apps/jarvis-wake-mac/e2e
python3 e2e_api_test.py
```

- **Success:** Exit 0, prints reply content preview.
- **Failure:** Exit 1 (e.g. gateway down, 401, or empty reply).

### Options

| Option | Description |
|--------|-------------|
| `--no-assert-content` | Do not require a non-empty reply (only check HTTP 200). |
| `--message "Your prompt"` | Send a custom message (default: `What time is it?`). |

### Override URL / token

- **Environment:** `JARVIS_WAKE_BASE_URL`, `JARVIS_WAKE_TOKEN`
- **File:** `~/.jarvis/wake.conf` with `baseURL=...` and optional `token=...`

Example:

```bash
JARVIS_WAKE_BASE_URL=http://127.0.0.1:18789 python3 e2e_api_test.py
```

## Contract covered

- **Gateway:** `POST {baseURL}/v1/chat/completions` with `x-openclaw-agent-id: main`, body `model`, `messages`, `stream: false`, `user`.
- **Edge:** `POST {baseURL}` with body `message`, `session_id` and optional `Authorization: Bearer <token>`.

Response is parsed the same way as `JarvisClient` (content from `choices[0].message.content` or top-level `content` / `message` / `text`).
