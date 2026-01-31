#!/usr/bin/env node
/**
 * Enumerate Supabase tables and locate plaintext credentials.
 * Produces redacted inventory: table/column names, row counts, last-4 only for secret columns.
 * Plan: Supabase Vault Migration step 2.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SECRET_COLUMN_HINTS = ['secret', 'token', 'password', 'key', 'credential', 'env', 'private'];
const NON_SECRET_HINTS = ['token_count', 'key_metrics', 'cache_key', 'updated_at', 'created_at', 'expires_at'];

function loadEnvFile() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);
  const envPath = candidates.find((c) => fs.existsSync(c));
  if (!envPath) return {};
  const text = fs.readFileSync(envPath, 'utf8');
  const out = {};
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.trimEnd().match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  for (const [k, v] of Object.entries(out)) {
    if (typeof process.env[k] === 'undefined') process.env[k] = v;
  }
  return out;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

function extractTables(openapi) {
  const paths = openapi.paths || {};
  const tables = new Set();
  for (const key of Object.keys(paths)) {
    const normalized = key.replace(/^\//, '');
    if (!normalized || normalized.includes('/')) continue;
    tables.add(normalized);
  }
  return Array.from(tables).sort();
}

function extractSchemaColumns(openapi, table) {
  const schemas = (openapi.components && openapi.components.schemas) || openapi.definitions || {};
  const schema = schemas[table];
  if (!schema || !schema.properties) return [];
  return Object.keys(schema.properties);
}

function isSensitiveColumn(col) {
  const lower = col.toLowerCase();
  if (NON_SECRET_HINTS.some((h) => lower.includes(h))) return false;
  return SECRET_COLUMN_HINTS.some((h) => lower.includes(h));
}

function last4(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s.length === 0) return null;
  return s.length >= 4 ? s.slice(-4) : '****';
}

async function getCount(supabaseUrl, headers, table) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    method: 'HEAD',
    headers: { ...headers, Prefer: 'count=exact' }
  });
  const range = res.headers.get('content-range');
  if (!range) return null;
  const m = range.match(/\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

async function main() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  };

  const openapiRes = await fetchJson(`${supabaseUrl}/rest/v1/`, { method: 'GET', headers });
  if (!openapiRes.ok || typeof openapiRes.data !== 'object') {
    console.error('Failed to load PostgREST OpenAPI spec.');
    process.exit(1);
  }

  const tables = extractTables(openapiRes.data);
  const report = {
    generatedAt: new Date().toISOString(),
    tablesWithSecrets: [],
    redactedRows: {}
  };

  for (const table of tables) {
    const columns = extractSchemaColumns(openapiRes.data, table);
    const sensitiveCols = columns.filter(isSensitiveColumn);
    if (sensitiveCols.length === 0) continue;

    const count = await getCount(supabaseUrl, headers, table);
    report.tablesWithSecrets.push({
      table,
      credentialColumns: sensitiveCols,
      rowCount: count
    });

    const selectCols = [...new Set([...columns.filter((c) => !isSensitiveColumn(c)).slice(0, 5), ...sensitiveCols])];
    const url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(selectCols.join(','))}&limit=50`;
    const dataRes = await fetchJson(url, { method: 'GET', headers });
    if (!dataRes.ok || !Array.isArray(dataRes.data)) continue;

    report.redactedRows[table] = dataRes.data.map((row) => {
      const redacted = {};
      for (const col of selectCols) {
        if (sensitiveCols.includes(col)) {
          redacted[`${col}_last4`] = last4(row[col]);
        } else {
          redacted[col] = row[col];
        }
      }
      return redacted;
    });
  }

  const reportPath = path.join(__dirname, 'enumerate-supabase-db-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Redacted DB report written to:', reportPath);
  console.log('Tables with credential-like columns:', report.tablesWithSecrets.length);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
