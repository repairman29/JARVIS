-- Optional: add Vault secret_id columns to kroger_tokens.
-- Run after migrating token values into Vault (one secret per access_token, one per refresh_token per user).
-- Then null or drop access_token and refresh_token columns.

alter table public.kroger_tokens
  add column if not exists access_token_secret_id uuid,
  add column if not exists refresh_token_secret_id uuid;

comment on column public.kroger_tokens.access_token_secret_id is 'Vault secret_id for access_token (from vault.create_secret)';
comment on column public.kroger_tokens.refresh_token_secret_id is 'Vault secret_id for refresh_token (from vault.create_secret)';

-- After migrating values and updating code to read from Vault:
-- alter table public.kroger_tokens drop column if exists access_token, drop column if exists refresh_token;
