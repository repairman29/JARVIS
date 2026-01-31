#!/usr/bin/env node
/**
 * Migrate env secrets to Supabase Vault + app_secrets registry.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function loadEnvFile() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return { envPath: null, env: {} };
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

async function secretExists(name) {
  const rows = await restSelect('app_secrets', 'name', { name: `eq.${name}` });
  return Array.isArray(rows) && rows.length > 0;
}

async function createSecret(name, value, notes) {
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
  await execSql(sql);
}

async function main() {
  const { envPath, env } = loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  if (!envPath) {
    console.error('No env file found at ~/.clawdbot/.env.');
    process.exit(1);
  }

  const entries = Object.entries(env).filter(([, value]) => value && value.length);
  let created = 0;
  let skipped = 0;

  for (const [key, value] of entries) {
    const name = `env/clawdbot/${key}`;
    const exists = await secretExists(name);
    if (exists) {
      skipped += 1;
      continue;
    }
    await createSecret(name, value, `Migrated from ${envPath}`);
    created += 1;
  }

  console.log(JSON.stringify({ envKeys: entries.length, created, skipped }, null, 2));
}

main().catch((error) => {
  console.error('Env migration failed:', error.message);
  process.exit(1);
});
