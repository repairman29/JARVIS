#!/usr/bin/env node
/**
 * Supabase secret inventory (redacted).
 * Produces table/column metrics without exposing values.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const LIMIT = 200;
const SECRET_COLUMN_HINTS = [
  'secret',
  'token',
  'api_key',
  'apikey',
  'key',
  'credential',
  'password',
  'private',
  'webhook',
  'encrypted'
];

const NON_SECRET_COLUMN_HINTS = [
  'token_count',
  'tokens_used',
  'total_tokens',
  'tokens_per_request',
  'token_cost',
  'key_metrics',
  'cache_key',
  'template_key',
  'setting_key',
  'variant_key'
];

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

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data, headers: res.headers };
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

function isSensitiveColumn(column) {
  const lower = column.toLowerCase();
  if (NON_SECRET_COLUMN_HINTS.some((hint) => lower.includes(hint))) return false;
  return SECRET_COLUMN_HINTS.some((hint) => lower.includes(hint));
}

function analyzeValue(value) {
  if (value === null || typeof value === 'undefined') return { type: 'null', length: 0 };
  const str = String(value);
  const length = str.length;
  const base64Like = /^[A-Za-z0-9+/=]+$/.test(str) && length >= 32;
  const hexLike = /^[a-f0-9]+$/i.test(str) && length >= 32;
  const jsonLike = str.trim().startsWith('{') && str.trim().endsWith('}');
  const containsSpace = /\s/.test(str);
  return {
    type: base64Like || hexLike ? 'encoded' : jsonLike ? 'json' : containsSpace ? 'text' : 'raw',
    length
  };
}

async function main() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const outArgIndex = process.argv.indexOf('--out');
  const outPath = outArgIndex >= 0 ? process.argv[outArgIndex + 1] : null;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  };

  const openapiRes = await fetchJson(`${supabaseUrl}/rest/v1/`, {
    method: 'GET',
    headers
  });

  if (!openapiRes.ok || typeof openapiRes.data !== 'object') {
    console.error('Failed to load PostgREST OpenAPI spec.');
    process.exit(1);
  }

  const tables = extractTables(openapiRes.data);
  const report = [];

  for (const table of tables) {
    const columns = extractSchemaColumns(openapiRes.data, table);
    const sensitiveCols = columns.filter(isSensitiveColumn);
    if (!sensitiveCols.length) continue;

    const url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(sensitiveCols.join(','))}&limit=${LIMIT}`;
    const dataRes = await fetchJson(url, { method: 'GET', headers });
    if (!dataRes.ok || !Array.isArray(dataRes.data)) continue;

    const columnStats = {};
    for (const col of sensitiveCols) {
      columnStats[col] = { nonNull: 0, maxLen: 0, types: {} };
    }
    for (const row of dataRes.data) {
      for (const col of sensitiveCols) {
        const value = row[col];
        if (value === null || typeof value === 'undefined') continue;
        const analysis = analyzeValue(value);
        columnStats[col].nonNull += 1;
        columnStats[col].maxLen = Math.max(columnStats[col].maxLen, analysis.length);
        columnStats[col].types[analysis.type] = (columnStats[col].types[analysis.type] || 0) + 1;
      }
    }

    report.push({
      table,
      columns: columnStats,
      sampleSize: dataRes.data.length
    });
  }

  const payload = JSON.stringify({ limit: LIMIT, tables: report }, null, 2);
  if (outPath) {
    const resolved = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, payload, 'utf8');
    console.log(`Inventory written to: ${resolved}`);
    return;
  }
  console.log(payload);
}

main().catch((error) => {
  console.error('Inventory failed:', error.message);
  process.exit(1);
});
