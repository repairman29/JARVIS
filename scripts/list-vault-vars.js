#!/usr/bin/env node
/**
 * List all secret names (vars) in Supabase Vault (app_secrets).
 * Uses VAULT_SUPABASE_URL and VAULT_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_*)
 * from ~/.clawdbot/.env. Values are not printed (names only).
 * Run from repo root: node scripts/list-vault-vars.js
 */
const { loadEnvFile, getVaultConfig } = require('./vault.js');

async function main() {
  loadEnvFile();
  const { url: supabaseUrl, key: serviceKey } = getVaultConfig();
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing VAULT_SUPABASE_URL and VAULT_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_*). Set in ~/.clawdbot/.env');
    process.exit(1);
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/app_secrets?select=name,source&order=name.asc`, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.error('Vault list failed:', res.status, await res.text());
    process.exit(1);
  }

  const rows = await res.json();
  if (!Array.isArray(rows)) {
    console.error('Unexpected response');
    process.exit(1);
  }

  console.log('Vault vars (app_secrets):');
  if (rows.length === 0) {
    console.log('  (none)');
    return;
  }
  const prefix = 'env/clawdbot/';
  for (const r of rows) {
    const name = r.name || '';
    const key = name.startsWith(prefix) ? name.slice(prefix.length) : name;
    const source = r.source || '';
    console.log(`  ${key || name}\t${name}\t[${source}]`);
  }
  console.log(`Total: ${rows.length}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
