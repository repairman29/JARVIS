# How to play with your LLM stack

You have **primary + 9 fallbacks** (Groq → Cerebras → Gemini → DeepSeek → Cohere → OpenRouter → Together → Mistral → Hugging Face). Here’s how to try them.

---

## 1. Use the JARVIS UI (normal flow)

1. Open the JARVIS app (Vercel or local `npm run dev` in `apps/jarvis-ui`).
2. Send messages as usual. The **primary** (Groq 8B) handles most requests.
3. If Groq hits a rate limit or errors, the gateway automatically tries the next fallback (Groq 70B, then Cerebras, then Gemini, etc.) until one succeeds. You don’t have to do anything.

**To see a different provider:** Temporarily set that model as primary (see §3), send a few messages, then set primary back.

---

## 2. Test one provider by making it primary

Edit **`~/.clawdbot/clawdbot.json`** and set:

```json
"agents": {
  "defaults": {
    "model": {
      "primary": "cerebras/llama-3.3-70b",
      "fallbacks": [ ... ]
    }
  }
}
```

Replace `cerebras/llama-3.3-70b` with any `provider/model` you want to try, e.g.:

- `gemini/gemini-2.5-flash`
- `deepseek/deepseek-chat`
- `cohere/command-r-plus`
- `openrouter/arcee-ai/trinity-mini:free`
- `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`
- `mistral/mistral-large-latest`
- `huggingface/meta-llama/Llama-3.2-3B-Instruct`

**Restart the gateway** after editing. Then use the JARVIS UI or Discord; all requests go to that primary until it fails (then fallbacks run).

To restore the optimized order: run **`node scripts/optimize-llm-fallbacks.js`** and restart.

---

## 3. Force a fallback (without changing config)

- **Rate-limit the primary:** Send a burst of requests so Groq returns 429; the gateway will move to the next fallback for the next request.
- **Context overflow:** Send a very long thread so Groq 8B hits context limits; the gateway will try Groq 70B then others.

---

## 4. Chat from the terminal (gateway or Edge)

With the gateway running locally:

```bash
# Replace with your gateway URL if different (or use Edge URL)
curl -s -X POST http://127.0.0.1:18789/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLAWDBOT_GATEWAY_TOKEN" \
  -d '{"model":"openclaw:main","messages":[{"role":"user","content":"Hello, which model are you?"}],"stream":false}'
```

Response is JSON with the assistant’s reply. The gateway picks primary then fallbacks; it doesn’t tell you which model answered unless the gateway adds that to the response.

Via Edge (deployed UI):

- Just use the JARVIS UI; it talks to Edge, which uses your primary/fallback chain.

---

## 5. Quick “try this model” script (optional)

You can add a one-liner or script that sets primary to a given model, restarts the gateway, and prints “Send a message in the UI, then run optimize-llm-fallbacks.js to restore order.” For now, editing `clawdbot.json` and restarting is enough.

---

## Summary

| Goal | What to do |
|------|------------|
| Use the stack as-is | Open JARVIS UI; primary (Groq 8B) + fallbacks run automatically. |
| Try one provider | Set that provider’s model as `primary` in `clawdbot.json`, restart gateway, chat. |
| Restore optimized order | Run `node scripts/optimize-llm-fallbacks.js`, restart gateway. |
| Test from CLI | `curl` the gateway’s `/v1/chat/completions` with a message. |
