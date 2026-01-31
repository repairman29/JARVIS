#!/usr/bin/env node
/**
 * Vault healthcheck: validates Vault access (decrypted_secrets) using env or Vault resolution.
 */
const { loadEnvFile, resolveEnv } = require('./vault.js');

async function main() {
  const env = loadEnvFile();
  const supabaseUrl = await resolveEnv('SUPABASE_URL', env);
  const serviceKey =
    (await resolveEnv('SUPABASE_SERVICE_ROLE_KEY', env)) ||
    (await resolveEnv('SUPABASE_SERVICE_KEY', env));
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use ~/.clawdbot/.env or Vault.');
    process.exit(1);
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql_query: 'select id from vault.decrypted_secrets limit 1;' })
  });

  if (!res.ok) {
    console.error('Vault check failed:', res.status);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  const { getSecretByName } = require('./vault.js');
  const probe = await getSecretByName(supabaseUrl, serviceKey, 'env/clawdbot/SUPABASE_URL');
  if (!probe) {
    console.error('Vault access OK but probe secret not found.');
    process.exit(1);
  }
  console.log('Vault access OK (RPC helper working).');
}

main().catch((error) => {
  console.error('Vault check failed:', error.message);
  process.exit(1);
});
