# Run JARVIS on Your Neural Farm

If you have a **Neural Farm** (OpenAI-compatible API, e.g. on `http://localhost:4000/v1` with key `sk-local-farm`), you can point the JARVIS gateway at it so all JARVIS chat (Web UI, Discord, Cursor MCP, CLI) uses your farm’s models.

---

## 1. Start the farm (on the Mac)

From your Neural Farm repo:

```bash
cd /path/to/neural-farm && ./start_farm.sh
```

Leave it running (adapter + LiteLLM on port **4000**). See your farm’s doc (e.g. `OTHER_BOTS_FARM.md`) for base URL and key.

---

## 2. Point JARVIS at the farm

From the **JARVIS** repo root:

```bash
node scripts/set-primary-neural-farm.js
```

This:

- Adds a **`farm`** provider to `~/.clawdbot/clawdbot.json` with base URL `http://localhost:4000/v1` and API key `sk-local-farm`.
- Sets the gateway’s **primary model** to `farm/gpt-4o-mini`.

Optional: in `~/.clawdbot/.env` set `NEURAL_FARM_BASE_URL` and/or `NEURAL_FARM_API_KEY` if your farm uses a different URL or key (e.g. ngrok or another machine).

---

## 3. Restart the JARVIS gateway

Restart the gateway so it loads the new config, e.g.:

```bash
node scripts/start-gateway-with-vault.js
```

(or your usual start command).

---

## 4. Use JARVIS as usual

- **Web UI** (localhost:3001), **Discord**, **Cursor MCP**, **CLI** — all use the farm for completions.
- You can switch primary back to Groq/OpenAI later with `node scripts/set-primary-groq.js` or `node scripts/set-primary-openai.js`.

---

## Summary

| Step | Command / action |
|------|-------------------|
| 1. Farm running | `cd neural-farm && ./start_farm.sh` |
| 2. Point JARVIS at farm | `node scripts/set-primary-neural-farm.js` (from JARVIS repo) |
| 3. Restart gateway | `node scripts/start-gateway-with-vault.js` |

Same JARVIS (skills, tools, UI); the only change is the LLM backend is your Neural Farm.

---

## 5. Maxing what JARVIS can do with the farm

**Goal:** Get the best quality and resilience from the farm as JARVIS’s brain, and use JARVIS’s full capability (tools, exec, skills) at the same time.

### 5.1 Use the farm’s best model when it helps

The farm exposes several model names (e.g. `gpt-4o-mini`, `gpt-4o`, `cluster-model`). By default JARVIS uses `farm/gpt-4o-mini`. For heavier reasoning or long context you can switch primary to the farm’s strongest model:

- **In `~/.clawdbot/clawdbot.json`** set `agents.defaults.model.primary` to e.g. `farm/gpt-4o` or `farm/cluster-model` (whatever your farm routes to its best backend).
- Or run:  
  **`node scripts/set-farm-max.js`**  
  which sets primary to `farm/cluster-model` (or `farm/gpt-4o`), adds farm fallbacks, and optionally adds Groq as a fallback when the farm is down.

Restart the gateway after changing config.

**Expanded farm (Pixel + iPhone):** If your farm has both nodes (Pixel Gemma + iPhone Llama), LiteLLM load-balances: the same model name (e.g. `gpt-4o-mini`) is listed for both adapters in the farm’s `config.yaml`, so requests are distributed across Pixel and iPhone. Start the farm with `export IPHONE_IP=your_iphone_ip && ./start_farm.sh`. JARVIS still points at **localhost:4000**; no change on the JARVIS side.

### 5.2 Fallbacks so the farm is used first but JARVIS never gets stuck

Add **fallbacks** so that if the primary farm model hits context limits or errors, the gateway tries another farm model, then optionally a cloud model:

- **Farm-only waterfall:** e.g. primary `farm/cluster-model`, fallbacks `farm/gpt-4o`, `farm/gpt-4o-mini`. All inference stays on the farm.
- **Farm + cloud safety net:** same primary/fallbacks, plus `groq/llama-3.1-8b-instant` (or another provider) as last fallback when the farm is unreachable. Requires that provider in `models.providers` and the right API key in `.env` or Vault.

Example fallbacks in `clawdbot.json`:

```json
"agents": {
  "defaults": {
    "model": {
      "primary": "farm/cluster-model",
      "fallbacks": ["farm/gpt-4o", "farm/gpt-4o-mini", "groq/llama-3.1-8b-instant"]
    }
  }
}
```

### 5.3 Context and bootstrap (avoid overflow on the farm)

If your farm has a smaller context window or you see “context overflow” / “prompt too large”:

- Run **`node scripts/fix-context-overflow.js`** (from the JARVIS repo). It sets `agents.defaults.bootstrapMaxChars` (e.g. 5000) so the gateway trims the bootstrap/workspace chunk sent each turn. It also sets `contextWindow` for Groq; the farm provider already has large `contextWindow` in `set-primary-neural-farm.js`, but if your farm’s actual limit is lower, you can reduce the farm model’s `contextWindow` in `models.providers.farm` to match so the gateway doesn’t send oversized prompts.

### 5.4 Let JARVIS use all tools (exec, skills, web)

The farm only does **completions**. JARVIS does the rest (tools, exec, skills, web search, repo, etc.) on the **gateway** machine. To max that out:

- **Web exec:** So the Web UI can ask JARVIS to run commands, beast-mode, code-roach, etc., run **`node scripts/enable-web-exec.js`** and restart the gateway. See [JARVIS_WEB_EXEC.md](./JARVIS_WEB_EXEC.md).
- **Workspace:** Ensure `agents.defaults.workspace` in `clawdbot.json` points at your JARVIS agent repo (e.g. `/path/to/JARVIS/jarvis`). `start-gateway-with-vault.js` sets this when run from repo root.
- **Skills:** Keep the gateway config and skills load so the farm’s replies can trigger tool calls and the gateway runs them.

So: **farm = brain (completions), gateway = body (tools, exec, skills).** Maxing the farm = pick the best farm model + fallbacks + sensible context; maxing JARVIS = enable web exec, set workspace, use the same UI/Discord/MCP/CLI as usual.

---

## 6. Farm on Pixel (Gemma) — what it opens up

When the **farm runs on a Pixel** (or another phone) with **Gemma** models, the same JARVIS setup works: point the gateway at the Pixel’s farm URL instead of localhost. That opens up a few new possibilities.

### 6.1 Point JARVIS at the Pixel

The gateway (on your Mac or elsewhere) must call the farm on the Pixel. So the farm URL is no longer `http://localhost:4000/v1`:

- **Same Wi‑Fi:** Find the Pixel’s LAN IP (e.g. Settings → Network → Wi‑Fi → tap the network → IP). Set **`NEURAL_FARM_BASE_URL=http://PIXEL_IP:4000/v1`** in `~/.clawdbot/.env` (replace `PIXEL_IP` with the actual IP, e.g. `192.168.1.42`). Re-run **`node scripts/set-primary-neural-farm.js`** so it reads that env and writes the correct base URL into `clawdbot.json`, or edit `models.providers.farm.baseUrl` in `clawdbot.json` by hand. Restart the gateway.
- **From the internet:** Run a tunnel (e.g. ngrok, tailscale) on the Pixel so the farm is reachable at a public URL; set `NEURAL_FARM_BASE_URL` to that URL.

The Pixel must be serving an **OpenAI-compatible** API (e.g. a small server that wraps Gemma via Android AI Edge / MediaPipe and exposes `/v1/chat/completions`). Same API key as before (`sk-local-farm`) unless you change it on the Pixel.

### 6.2 What Gemma on Pixel gives you

| Angle | What it means |
|-------|----------------|
| **On-device inference** | The model runs on the Pixel; no audio or text has to leave the phone for the LLM. Only the gateway (e.g. on your Mac) sends prompts and receives replies over Wi‑Fi. |
| **Privacy** | Sensitive chats can use the Pixel as the only “brain”; data stays on your device (and on the Mac if the gateway is local). |
| **Portable brain** | JARVIS’s “brain” is in your pocket. Wherever the gateway can reach the Pixel (same network or tunnel), JARVIS uses it. |
| **Offline** | If Gemma runs fully on-device on the Pixel, the farm can answer without internet; only the Mac↔Pixel link (e.g. Wi‑Fi) is needed. |
| **Gemma model names** | If your farm on Pixel exposes Gemma under different names (e.g. `gemma-3-1b`, `gemma-3n`), add those to `models.providers.farm.models` in `clawdbot.json` and set `primary` or `fallbacks` to e.g. `farm/gemma-3-1b`. The gateway doesn’t care if the backend is Gemma or GPT; it just sends the same completion requests. |

### 6.3 Multimodal (Gemma 3n: image / audio)

**Gemma 3n** on the Pixel can handle **image and audio** as well as text. To use that with JARVIS:

- The **farm** on the Pixel must accept OpenAI-style **vision** (e.g. `content` with `type: image_url`) or audio in the request body.
- The **JARVIS** gateway (and/or Web UI) must send image or audio when the user provides it. The JARVIS UI already supports an optional image in the chat API; the gateway would need to pass that through to the farm. If your farm and gateway support it, you could e.g. send a photo from the Web UI and have Gemma 3n describe it or answer questions about it — that’s the “new stuff” from having a multimodal farm on the Pixel.

Today the JARVIS ↔ farm integration is **text completions**; adding full vision/audio passthrough would be a small extension on the gateway/UI side once the farm exposes the right API shape.
