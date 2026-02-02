# Supabase Vault Migration

Secrets are migrated from local env files and DB plaintext columns into Supabase Vault. Runtime code resolves secrets via the `app_secrets` registry and `vault.decrypted_secrets`.

**Vault is per project.** Supabase doesn’t provide one global Vault; each project has its own. For JARVIS, you pick **one** Supabase project as your “Vault project,” run the SQL there once, and set `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in `~/.clawdbot/.env` to that project. All JARVIS Vault scripts then use that project’s Vault for every secret (Brave, GitHub, Discord, etc.).

**One Vault for all projects:** Set `VAULT_SUPABASE_URL` and `VAULT_SUPABASE_SERVICE_ROLE_KEY` in `~/.clawdbot/.env` to the **one** Supabase project where you run the Vault SQL. All JARVIS scripts then use that project’s Vault; other projects (and `SUPABASE_URL`) can stay pointed at different DBs. If you don’t set `VAULT_*`, scripts use `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Vault.

**Prerequisites:** Run `docs/sql/001_app_secrets.sql` and `docs/sql/002_vault_helpers.sql` in the Supabase SQL Editor of **the project you use for Vault** (the one in `VAULT_SUPABASE_URL` or `SUPABASE_URL`). You can use any project (e.g. `YOUR_PROJECT_REF`)—run the SQL there and point `VAULT_*` (or `SUPABASE_*`) at it.

## Naming scheme

| Source | Name pattern | Example |
|--------|--------------|---------|
| Env file (`~/.clawdbot/.env`) | `env/clawdbot/<KEY>` | `env/clawdbot/SUPABASE_SERVICE_ROLE_KEY` |
| DB table (per row) | `db/<table>/<row_id>/<column>` | `db/kroger_tokens/user_123/access_token` |

- **Env:** One Vault secret per env key. `app_secrets.name` = `env/clawdbot/<KEY>`, `source` = `env`.
- **DB:** One Vault secret per sensitive cell. `app_secrets.name` = `db/<table>/<row_id>/<column>`, `source` = `db/<table>`. The table row stores `secret_id` (UUID) instead of plaintext.

## app_secrets table

Created by `docs/sql/001_app_secrets.sql` (run once in Supabase SQL Editor).

- `name` – Logical name (unique).
- `secret_id` – UUID from `vault.create_secret(value [, name, description])`.
- `source` – `env` or `db/<table>`.
- `notes` – Optional.

## Runtime resolution

Scripts use `scripts/vault.js` to resolve a logical name to a decrypted value:

1. Look up `app_secrets` by `name` → get `secret_id`.
2. Call `public.get_vault_secret()` or `public.get_vault_secret_by_name()` (RPC) → get `decrypted_secret`.

Env keys can remain in `process.env` for compatibility; Vault is tried first. If env values are replaced with placeholders (`vault://app_secrets/...`), `scripts/vault.js` will ignore them and use Vault.

## Using Vault for the Clawdbot gateway (Discord, etc.)

The Clawdbot gateway reads env from `~/.clawdbot/.env` only. To use **Supabase Vault** as the source for `DISCORD_BOT_TOKEN`, `GROQ_API_KEY`, and other gateway secrets:

1. **Migrate secrets to Vault** (one-time): ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in `~/.clawdbot/.env`, then run:
   ```bash
   node scripts/vault-migrate-env.js
   ```
   This creates `env/clawdbot/<KEY>` entries in Vault for each non-empty key in `.env` (e.g. `env/clawdbot/DISCORD_BOT_TOKEN`).

2. **Start the gateway with Vault**: from the repo root:
   ```bash
   node scripts/start-gateway-with-vault.js
   ```
   This resolves the gateway keys from Vault (then falls back to `.env`), sets `process.env`, and runs `npx clawdbot gateway run`. Use this instead of `npx clawdbot gateway run` when you want Discord and other secrets to come from Supabase Vault.

3. **Verify Discord token** (from Vault or .env):
   ```bash
   node scripts/check-discord-bot.js
   ```
   The script uses `vault.js` and will resolve `DISCORD_BOT_TOKEN` from Vault when present in `app_secrets`.
