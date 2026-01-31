-- Vault migration: app_secrets registry table
-- Run in Supabase Dashboard → SQL Editor (project rbfzlqmkwhbvrrfdcain).
-- Maps logical secret names to Vault secret UUIDs and source.

create table if not exists public.app_secrets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  secret_id uuid not null,
  source text not null,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.app_secrets is 'Registry mapping logical secret names to Supabase Vault secret_id. Used by scripts/skills to resolve secrets at runtime.';
comment on column public.app_secrets.name is 'Stable logical name, e.g. env/clawdbot/SUPABASE_SERVICE_ROLE_KEY or db/kroger_tokens/<user_id>/access_token';
comment on column public.app_secrets.secret_id is 'UUID from vault.create_secret()';
comment on column public.app_secrets.source is 'Origin: env | db/<table>';

create index if not exists idx_app_secrets_name on public.app_secrets(name);
create index if not exists idx_app_secrets_secret_id on public.app_secrets(secret_id);
