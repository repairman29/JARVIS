#!/usr/bin/env node
/**
 * Add or update a single secret in Supabase Vault (app_secrets + vault.create_secret).
 * Usage: node scripts/vault-set-secret.js <KEY> <VALUE> [notes]
 *        node scripts/vault-set-secret.js <KEY> <VALUE> [notes] --update
 * With --update: if the key already exists, creates a new secret and updates app_secrets to point to it.
 * Example: node scripts/vault-set-secret.js DISCORD_BOT_TOKEN "your_token" "JARVIS bot" --update
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ~/.clawdbot/.env. Requires exec_sql RPC in Supabase.
 */
const path = require('path');
const os = require('os');
const { loadEnvFile, getVaultConfig } = require('./vault.js');

function dollarQuote(value) {
  const base = 'vault';
  let tag = base;
  while (value.includes(`$${tag}$`)) {
    tag = `${base}${Math.floor(Math.random() * 1e6)}`;
  }
  return `$${tag}$${value}$${tag}$`;
}

async function execSql(sqlQuery, vaultConfig) {
  const { url: supabaseUrl, key: serviceKey } = vaultConfig;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing VAULT_SUPABASE_URL and VAULT_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_*) in ~/.clawdbot/.env. Point them at the project where you ran the Vault SQL.');
  }
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql_query: sqlQuery })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`exec_sql failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function restSelect(table, select, filter, vaultConfig) {
  const { url: supabaseUrl, key: serviceKey } = vaultConfig;
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  Object.entries(filter || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    method: 'GET',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  if (!res.ok) throw new Error(`GET ${table} failed (${res.status})`);
  return res.json();
}

async function restPatch(table, filter, body, vaultConfig) {
  const { url: supabaseUrl, key: serviceKey } = vaultConfig;
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  Object.entries(filter || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed (${res.status}): ${await res.text()}`);
}

async function main() {
  const args = process.argv.slice(2);
  const updateFlag = args.includes('--update');
  const rest = args.filter((a) => a !== '--update');
  const key = rest[0];
  const value = rest[1];
  const notes = rest[2] || 'Set via vault-set-secret.js';
  if (!key || value === undefined) {
    console.error('Usage: node scripts/vault-set-secret.js <KEY> <VALUE> [notes] [--update]');
    process.exit(1);
  }
  loadEnvFile();
  const vaultConfig = getVaultConfig();
  const name = `env/clawdbot/${key}`;
  const rows = await restSelect('app_secrets', 'name', { name: `eq.${name}` }, vaultConfig);
  const exists = Array.isArray(rows) && rows.length > 0;
  if (exists && !updateFlag) {
    console.log(JSON.stringify({ name, updated: false, message: 'already exists (use --update to replace)' }, null, 2));
    return;
  }
  const nameSql = dollarQuote(name);
  const valueSql = dollarQuote(String(value));
  const notesSql = dollarQuote(notes);
  if (exists) {
    // Create new secret with unique name (vault has unique constraint on name), then PATCH app_secrets to point to it
    const uniqueName = `${name}/v${Date.now()}`;
    const uniqueNameSql = dollarQuote(uniqueName);
    const createSql = `select vault.create_secret(${valueSql}, ${uniqueNameSql}, ${notesSql}) as id`;
    const createResult = await execSql(createSql, vaultConfig);
    const row = Array.isArray(createResult) ? createResult[0] : createResult;
    const err = row?.result?.error;
    if (err) throw new Error(err);
    const id = row && (row.id ?? row.ID ?? row.secret_id);
    if (!id) throw new Error('create_secret did not return id. Result: ' + JSON.stringify(createResult).slice(0, 200));
    await restPatch('app_secrets', { name: `eq.${name}` }, { secret_id: id, notes, source: 'env' }, vaultConfig);
    console.log(JSON.stringify({ name, updated: true }, null, 2));
  } else {
    const sql = `
with s as (
  select vault.create_secret(${valueSql}, ${nameSql}, ${notesSql}) as id
)
insert into public.app_secrets (name, secret_id, source, notes)
select ${nameSql}, s.id, 'env', ${notesSql}
from s;
`;
    await execSql(sql, vaultConfig);
    console.log(JSON.stringify({ name, created: true }, null, 2));
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
