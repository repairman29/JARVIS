-- Vault helper functions (public schema)
-- Provides access to decrypted secrets via RPC (service role).

create or replace function public.get_vault_secret(secret_id uuid)
returns text
language sql
security definer
set search_path = vault, public
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where id = secret_id
  limit 1;
$$;

create or replace function public.get_vault_secret_by_name(secret_name text)
returns text
language sql
security definer
set search_path = vault, public
as $$
  select v.decrypted_secret
  from public.app_secrets a
  join vault.decrypted_secrets v on v.id = a.secret_id
  where a.name = secret_name
  limit 1;
$$;
