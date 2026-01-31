# Supabase Vault Migration – Final Report

## What was implemented

1. **Local secrets inventory (read-only)**  
   - `scripts/scan-secrets.js`: scans repos under the home directory, flags likely secrets, and writes a redacted report to `reports/secret-scan-YYYY-MM-DD.json`.

2. **DB secrets enumeration**  
   - `scripts/supabase-secret-inventory.js`: lists tables via PostgREST OpenAPI, flags credential-like columns, exports redacted inventory to `reports/supabase-secret-inventory-YYYY-MM-DD.json`.
   - `scripts/supabase-redacted-sample.js`: redacted sampling for candidate tables (no plaintext).

3. **Vault mapping model**  
   - `docs/sql/001_app_secrets.sql`: creates `public.app_secrets` (name, secret_id, source, notes, created_at).  
   - `docs/sql/002_vault_helpers.sql`: adds RPC helpers for `vault.decrypted_secrets`.  
   - Naming: `env/clawdbot/<KEY>`, `db/<table>/<row_id>/<column>` (see `docs/VAULT_MIGRATION.md`).

4. **Migration into Vault**  
   - `scripts/vault-migrate-env.js`: migrates `~/.clawdbot/.env` into Vault and `app_secrets`.
   - `scripts/vault-migrate-db.js`: migrates `public.secrets` and `public.app_config` into Vault; writes `secret_id` and placeholder values (`vault://app_secrets/...`).
   - `scripts/obscure-env.js`: replaces env values with placeholders (backup created).

5. **Runtime Vault resolution**  
   - `scripts/vault.js`: `loadEnvFile`, `getSupabaseConfig`, `getDecryptedSecret`, `getSecretByName`, `resolveEnv` (Vault-first then env; ignores placeholders).  
   - **Updated to use Vault-first resolution:**  
     - `scripts/index-repos.js` – Supabase URL/key via `resolveEnv`.  
     - `scripts/jarvis-safety-net.js` – Supabase URL/key via `resolveEnv`.  
     - `skills/repo-knowledge/index.js` – async `getSupabaseConfig()` using `resolveEnv`.  
     - `services/kroger-oauth/server.js` – async `start()` resolves env from Vault/env; hardcoded `dev-secret` removed; `KROGER_SERVICE_SECRET` required for authenticated routes.

6. **Validation**  
   - `scripts/vault-healthcheck.js`: uses RPC helpers to validate Vault access.  
   - Run `node scripts/vault-healthcheck.js` and key flows (index-repos, safety-net, kroger-oauth) with Vault or `~/.clawdbot/.env` to validate.

## Plaintext remaining

- **Env:** Values remain in `~/.clawdbot/.env` unless you run `migrate-secrets-to-vault.js --write-placeholders` (back up first). Runtime prefers Vault when `app_secrets` has an entry.  
- **Env:** Values can be replaced with `vault://app_secrets/...` placeholders (backup created). Runtime prefers Vault when `app_secrets` has an entry.  
- **DB:** `public.secrets` and `public.app_config` values were replaced with placeholders and `secret_id` pointers. `kroger_tokens` still has plaintext `access_token` / `refresh_token` until you run the optional migration (`docs/sql/002_kroger_tokens_vault_columns.sql`).

## References

- Plan: Supabase Vault Migration (attached).  
- Naming and usage: `docs/VAULT_MIGRATION.md`.  
- SQL: `docs/sql/001_app_secrets.sql`, `docs/sql/002_vault_helpers.sql`, `docs/sql/002_kroger_tokens_vault_columns.sql`.
