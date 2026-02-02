#!/usr/bin/env node
/**
 * Vault healthcheck: validates Vault access (decrypted_secrets) on the Vault project.
 * Uses VAULT_SUPABASE_URL and VAULT_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_*) from ~/.clawdbot/.env.
 */
const { loadEnvFile, getVaultConfig, getSecretByName } = require('./vault.js');

async function main() {
  loadEnvFile();
  const { url: supabaseUrl, key: serviceKey } = getVaultConfig();
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing VAULT_SUPABASE_URL and VAULT_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_*). Set in ~/.clawdbot/.env pointing at the project where you ran the Vault SQL.');
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
