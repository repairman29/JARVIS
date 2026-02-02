# One Vault for All Projects

Use **one** Supabase project as the shared Vault. All other projects (JARVIS, Olive, other apps) point at it via env vars—no copying tables.

---

## 1. The Vault project (one per org/team)

- **One** Supabase project holds:
  - `public.app_secrets` (logical name → Vault secret_id)
  - Supabase Vault (encrypted secrets)
  - RPCs: `get_vault_secret(secret_id)`, `get_vault_secret_by_name(secret_name)`

- **Your Vault project:** `YOUR_PROJECT_REF`  
  - Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_REF  
  - URL: `https://YOUR_PROJECT_REF.supabase.co`

- The SQL that creates the table and RPCs lives in **this repo**:
  - `docs/sql/001_app_secrets.sql` — creates `public.app_secrets`
  - `docs/sql/002_vault_helpers.sql` — creates `get_vault_secret`, `get_vault_secret_by_name`

Run both in the Vault project’s **SQL Editor** once (and enable Vault in Project Settings if needed).

---

## 2. Pointing a project at the shared Vault

In **any** project or app that should read/write the shared Vault, set in its env (e.g. `~/.clawdbot/.env` or the app’s `.env`):

```bash
VAULT_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VAULT_SUPABASE_SERVICE_ROLE_KEY=<service_role_key_for_that_project>
```

Get the service role key from:  
Supabase Dashboard → **YOUR_PROJECT_REF** → Settings → API → **service_role** (secret).

- **JARVIS / Clawdbot:** Uses `VAULT_*` from `~/.clawdbot/.env`. Scripts: `vault-set-secret.js`, `start-gateway-with-vault.js`, `vault-healthcheck.js`, etc.
- **Other apps:** Use the same two vars; call the Vault project’s REST API or RPC (see below). You can keep each app’s own `SUPABASE_URL` for its own DB.

If you don’t set `VAULT_*`, JARVIS scripts fall back to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Vault.

**JARVIS full Vault access:** When you start the gateway with `node scripts/start-gateway-with-vault.js`, it loads **every** secret in the Vault under `env/clawdbot/<KEY>` (not just a fixed list). So all keys/passwords you store in the Supabase Vault as `env/clawdbot/<KEY>` are available to JARVIS when the gateway runs. Add secrets with `vault-set-secret.js`; they are picked up on the next gateway start.

---

## 3. Adding a secret (any project that has VAULT_*)

From a repo that has the scripts (e.g. CLAWDBOT):

```bash
node scripts/vault-set-secret.js BRAVE_API_KEY <value> "Brave Search API"
node scripts/vault-set-secret.js GITHUB_TOKEN <value> "GitHub PAT"
```

Secrets are stored under logical names like `env/clawdbot/BRAVE_API_KEY`.

---

## 4. Reading a secret (other projects / other code)

Call the **Vault project’s** API with the **Vault project’s** URL and service role key:

- **RPC (recommended):**  
  `POST https://YOUR_PROJECT_REF.supabase.co/rest/v1/rpc/get_vault_secret_by_name`  
  Body: `{ "secret_name": "env/clawdbot/BRAVE_API_KEY" }`  
  Headers: `apikey: <service_role>`, `Authorization: Bearer <service_role>`, `Content-Type: application/json`

- **From this repo:** Use `scripts/vault.js`: `getVaultConfig()` for URL/key, then `getSecretByName(url, key, "env/clawdbot/BRAVE_API_KEY")`.

---

## 5. Verify

```bash
node scripts/vault-healthcheck.js
```

Expect: `Vault access OK (RPC helper working).`

---

## Quick reference

| Goal | Action |
|------|--------|
| Use shared Vault in a project | Set `VAULT_SUPABASE_URL` and `VAULT_SUPABASE_SERVICE_ROLE_KEY` to the Vault project (e.g. YOUR_PROJECT_REF). |
| JARVIS has full access to all Vault secrets | Start gateway with `node scripts/start-gateway-with-vault.js`; it loads every `env/clawdbot/<KEY>` from the Vault. |
| Add a secret | `node scripts/vault-set-secret.js KEY value "notes"` (from a repo that has the script). |
| Check Vault | `node scripts/vault-healthcheck.js` |
| SQL for the Vault project | Run `docs/sql/001_app_secrets.sql` and `002_vault_helpers.sql` in that project’s SQL Editor once. |

---

**Doc location:** `docs/VAULT_ONE_PROJECT_FOR_ALL.md` (this file). Point other projects or repos here for the “one Vault for all” setup.
