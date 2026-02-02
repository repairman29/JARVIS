# Brave Search API key (web search)

JARVIS uses the Brave Search API for web search. If you see:

> I'm not able to execute this task as it requires a Brave Search API key. Please run clawdbot configure --section web to store your API key or set BRAVE_API_KEY in the Gateway environment.

do one of the following.

---

## 1. Interactive (recommended)

Run and follow the prompts:

```bash
clawdbot configure --section web
```

Paste your Brave Search API key when prompted. It will be stored in `~/.clawdbot/.env`.

Then **restart the gateway with Vault** so the key is loaded:

```bash
cd /path/to/CLAWDBOT
node scripts/start-gateway-with-vault.js
```

---

## 2. Vault (if you use start-gateway-with-vault.js)

Add the key to Supabase Vault so it’s loaded when you start the gateway with Vault:

```bash
node scripts/vault-set-secret.js BRAVE_API_KEY <your_brave_search_api_key> "Brave Search API"
```

Then restart the gateway:

```bash
node scripts/start-gateway-with-vault.js
```

---

## 3. .env only

Add to `~/.clawdbot/.env` (create the file if it doesn’t exist):

```
BRAVE_API_KEY=your_brave_search_api_key
```

Then restart the gateway with Vault (so the key is written into the gateway env):

```bash
node scripts/start-gateway-with-vault.js
```

---

## Get a key

- https://brave.com/search/api/
- https://api-dashboard.search.brave.com

---

## After adding the key

Always start the gateway with:

```bash
node scripts/start-gateway-with-vault.js
```

so all keys (Brave, GitHub, Groq, etc.) from Vault and `.env` are loaded into the gateway.
