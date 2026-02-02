#!/usr/bin/env node
/**
 * Migrate env secrets to Supabase Vault + app_secrets registry.
 * Uses VAULT_SUPABASE_* (or SUPABASE_*) from ~/.clawdbot/.env to target the Vault project.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadEnvFile: loadVaultEnv, getVaultConfig } = require('./vault.js');

function loadEnvFile() {
  const result = loadVaultEnv();
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return { envPath: null, env: result || {} };
  const text = fs.readFileSync(envPath, 'utf8');
  const out = {};
  const normalized = text.replace(/^\uFEFF/, '');
  for (const line of normalized.split(/\r?\n/)) {
    const cleanLine = line.trimEnd();
    const match = cleanLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  return { envPath, env: out };
}

function dollarQuote(value) {
  const base = 'vault';
  let tag = base;
  while (value.includes(`$${tag}$`)) {
    tag = `${base}${Math.floor(Math.random() * 1e6)}`;
  }
  return `$${tag}$${value}$${tag}$`;
}

async function execSql(sqlQuery, vaultConfig) {
  const { url: supabaseUrl, key: serviceKey } = vaultConfig || getVaultConfig();
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
  const { url: supabaseUrl, key: serviceKey } = vaultConfig || getVaultConfig();
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${table} failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function secretExists(name, vaultConfig) {
  const rows = await restSelect('app_secrets', 'name', { name: `eq.${name}` }, vaultConfig);
  return Array.isArray(rows) && rows.length > 0;
}

async function createSecret(name, value, notes, vaultConfig) {
  const nameSql = dollarQuote(name);
  const valueSql = dollarQuote(value);
  const notesSql = notes ? dollarQuote(notes) : 'null';
  const sql = `
with s as (
  select vault.create_secret(${valueSql}, ${nameSql}, ${notesSql}) as id
)
insert into public.app_secrets (name, secret_id, source, notes)
select ${nameSql}, s.id, 'env', ${notesSql}
from s;
`;
  await execSql(sql, vaultConfig);
}

async function main() {
  loadVaultEnv();
  const { url: supabaseUrl, key: serviceKey } = getVaultConfig();
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing VAULT_SUPABASE_URL and VAULT_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_*). Set in ~/.clawdbot/.env.');
    process.exit(1);
  }
  const { envPath, env } = loadEnvFile();
  if (!envPath) {
    console.error('No env file found at ~/.clawdbot/.env.');
    process.exit(1);
  }

  const vaultConfig = getVaultConfig();
  const entries = Object.entries(env).filter(([, value]) => value && value.length);
  let created = 0;
  let skipped = 0;

  for (const [key, value] of entries) {
    const name = `env/clawdbot/${key}`;
    const exists = await secretExists(name, vaultConfig);
    if (exists) {
      skipped += 1;
      continue;
    }
    await createSecret(name, value, `Migrated from ${envPath}`, vaultConfig);
    created += 1;
  }

  console.log(JSON.stringify({ envKeys: entries.length, created, skipped }, null, 2));
}

main().catch((error) => {
  console.error('Env migration failed:', error.message);
  process.exit(1);
});
