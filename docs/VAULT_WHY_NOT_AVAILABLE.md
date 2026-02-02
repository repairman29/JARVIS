# Why Vault isn't available in Supabase

## Vault is per Supabase project (not global)

Supabase Vault lives **inside a single Supabase project**. There is no built-in "one Vault for all projects." Each project has its own Vault and, if you create it, its own `app_secrets` table.

**You get "one Vault for all JARVIS secrets" by choosing one project as the Vault project** and pointing `~/.clawdbot/.env` at it:

- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to **that** project.
- Run the Vault SQL (001_app_secrets.sql, 002_vault_helpers.sql) **once in that project**.
- Then all JARVIS scripts (vault-set-secret, start-gateway-with-vault, etc.) use that project’s Vault. Same Vault for gateway, Brave, GitHub, Discord, etc.

So: one project = one Vault for JARVIS. Other Supabase projects (e.g. for Olive, other apps) can have their own Vaults; JARVIS only uses the project in your `.env`.

---

## Why you're seeing 404

Scripts like `vault-set-secret.js` and `start-gateway-with-vault.js` talk to the Supabase project defined by `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `~/.clawdbot/.env`.

**Your `.env` points at:** `https://YOUR_CURRENT_PROJECT_REF.supabase.co`  
**The repo’s Vault docs/SQL** assume you run Vault in one project (e.g. `YOUR_VAULT_PROJECT_REF`).

So:

1. **The `app_secrets` table doesn’t exist** in the project you’re using (your current `SUPABASE_URL`). The scripts do `GET /rest/v1/app_secrets` → **404** because that table was never created there.

2. **Vault setup is per project.** The migration SQL must be run **in the same project** that your `.env` uses.

---

## One Vault for all projects (recommended)

You can use **one** Supabase project as the Vault for JARVIS and keep other projects for other apps:

1. **Pick one project** where you’ll run the Vault SQL (e.g. `YOUR_VAULT_PROJECT_REF` or any project).
2. In that project, run **docs/sql/001_app_secrets.sql** and **docs/sql/002_vault_helpers.sql** (and enable Vault in Project Settings if needed).
3. In **~/.clawdbot/.env**, set:
   - `VAULT_SUPABASE_URL=https://YOUR_VAULT_PROJECT_REF.supabase.co`
   - `VAULT_SUPABASE_SERVICE_ROLE_KEY=<service_role_key_for_that_project>`
   You can keep `SUPABASE_URL` pointing at a different project (e.g. for Olive or other apps); Vault scripts use **VAULT_*** for lookups.
4. All JARVIS scripts (vault-set-secret, start-gateway-with-vault, vault-healthcheck) will call **that** project’s Vault. No need to copy tables to other projects.

If you don’t set `VAULT_*`, scripts fall back to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Vault (so one project can still be both your app DB and your Vault).

---

## How to fix it (pick one)

### Option A: Enable Vault in your current project

1. Open **Supabase Dashboard** for the project in your `.env`:  
   https://supabase.com/dashboard/project/YOUR_PROJECT_REF

2. **Enable Vault** (if needed):  
   Project Settings → Database → Vault → enable.  
   (Supabase Vault is the extension that provides `vault.create_secret` and `vault.decrypted_secrets`.)

3. **Run the Vault SQL in that project:**
   - Go to **SQL Editor** for that project.
   - Run the contents of **docs/sql/001_app_secrets.sql** (creates `public.app_secrets`).
   - Run the contents of **docs/sql/002_vault_helpers.sql** (creates `get_vault_secret` and `get_vault_secret_by_name`).

4. **Retry:**
   ```bash
   node scripts/vault-set-secret.js BRAVE_API_KEY <your_key> "Brave Search API"
   ```

### Option B: Use another project for Vault

If the Vault SQL has **already** been run in a different Supabase project (e.g. for another app):

1. In `~/.clawdbot/.env`, point Vault scripts at that project by setting:
   - `VAULT_SUPABASE_URL=https://YOUR_VAULT_PROJECT_REF.supabase.co`
   - `VAULT_SUPABASE_SERVICE_ROLE_KEY=<service_role_key_for_that_project>`
   (Get the service role key from that project’s Dashboard → Settings → API.)

2. Run the Vault SQL there **if you haven’t already** (001_app_secrets.sql, then 002_vault_helpers.sql).

3. Then run:
   ```bash
   node scripts/vault-set-secret.js BRAVE_API_KEY <your_key> "Brave Search API"
   ```

---

## Summary

| Cause | Fix |
|--------|-----|
| `app_secrets` doesn’t exist in the project your `.env` uses | Run **001_app_secrets.sql** and **002_vault_helpers.sql** in that project’s SQL Editor (and enable Vault if needed). |
| `.env` points at project A, Vault was set up in project B | Either run the same SQL in project A (Option A) or point `.env` at project B for Vault (Option B). |

After the table and helpers exist in the project your scripts use, Vault will be available and `vault-set-secret.js` will stop returning 404.
