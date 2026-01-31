#!/usr/bin/env node
/**
 * Migrate DB plaintext secrets to Vault + app_secrets registry.
 * - secrets.value -> Vault, store secret_id, null out value
 * - app_config.value (secret-like keys only) -> Vault, store secret_id, null out value
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const APP_CONFIG_SECRET_KEYS = /(secret|token|key|password|api|oauth|client)/i;

function loadEnvFile() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return {};
  const text = fs.readFileSync(envPath, 'utf8');
  const out = {};
  const normalized = text.replace(/^\uFEFF/, '');
  for (const line of normalized.split(/\r?\n/)) {
    const cleanLine = line.trimEnd();
    const match = cleanLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  for (const [key, value] of Object.entries(out)) {
    if (typeof process.env[key] === 'undefined') {
      process.env[key] = value;
    }
  }
  return out;
}

function dollarQuote(value) {
  const str = String(value ?? '');
  const base = 'vault';
  let tag = base;
  while (str.includes(`$${tag}$`)) {
    tag = `${base}${Math.floor(Math.random() * 1e6)}`;
  }
  return `$${tag}$${str}$${tag}$`;
}

async function execSql(sqlQuery) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
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

async function restSelect(table, select, filter) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
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

async function restUpdate(table, filter, payload) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH ${table} failed (${res.status}): ${body}`);
  }
  return res.json();
}

function placeholderValue(name) {
  return `vault://app_secrets/${name}`;
}

async function secretExists(name) {
  const rows = await restSelect('app_secrets', 'secret_id', { name: `eq.${name}` });
  return Array.isArray(rows) && rows.length > 0;
}

async function getSecretId(name) {
  const rows = await restSelect('app_secrets', 'secret_id', { name: `eq.${name}` });
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0].secret_id || null;
}

async function createSecret(name, value, source, notes) {
  const nameSql = dollarQuote(name);
  const valueSql = dollarQuote(value);
  const notesSql = notes ? dollarQuote(notes) : 'null';
  const sql = `
with s as (
  select vault.create_secret(${valueSql}, ${nameSql}, ${notesSql}) as id
)
insert into public.app_secrets (name, secret_id, source, notes)
select ${nameSql}, s.id, ${dollarQuote(source)}, ${notesSql}
from s;
`;
  await execSql(sql);
}

async function ensureColumn(table, column) {
  const sql = `alter table public.${table} add column if not exists ${column} uuid;`;
  await execSql(sql);
}

async function migrateSecretsTable() {
  await ensureColumn('secrets', 'secret_id');
  const rows = await restSelect('secrets', 'id,key,value,secret_id', { 'value': 'not.is.null' });
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!row.value) continue;
    if (row.secret_id) {
      skipped += 1;
      continue;
    }
    const name = `db/secrets/${row.id}/value`;
    if (!(await secretExists(name))) {
      await createSecret(name, row.value, 'db/secrets', `Migrated from public.secrets (${row.key || row.id})`);
    }
    const secretId = await getSecretId(name);
    if (!secretId) {
      skipped += 1;
      continue;
    }
    await restUpdate('secrets', { id: `eq.${row.id}` }, { secret_id: secretId, value: placeholderValue(name) });
    created += 1;
  }
  return { table: 'secrets', created, skipped, total: rows.length };
}

async function migrateAppConfig() {
  await ensureColumn('app_config', 'secret_id');
  const rows = await restSelect('app_config', 'key,value,secret_id', { 'value': 'not.is.null' });
  let created = 0;
  let skipped = 0;
  let filtered = 0;
  for (const row of rows) {
    if (!row.value) continue;
    if (!APP_CONFIG_SECRET_KEYS.test(String(row.key || ''))) {
      filtered += 1;
      continue;
    }
    if (row.secret_id) {
      skipped += 1;
      continue;
    }
    const name = `db/app_config/${row.key}`;
    if (!(await secretExists(name))) {
      await createSecret(name, row.value, 'db/app_config', 'Migrated from public.app_config');
    }
    const secretId = await getSecretId(name);
    if (!secretId) {
      skipped += 1;
      continue;
    }
    await restUpdate('app_config', { key: `eq.${row.key}` }, { secret_id: secretId, value: placeholderValue(name) });
    created += 1;
  }
  return { table: 'app_config', created, skipped, filtered, total: rows.length };
}

async function main() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const results = [];
  results.push(await migrateSecretsTable());
  results.push(await migrateAppConfig());
  console.log(JSON.stringify({ results }, null, 2));
}

main().catch((error) => {
  console.error('DB migration failed:', error.message);
  process.exit(1);
});
