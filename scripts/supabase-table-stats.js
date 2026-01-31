#!/usr/bin/env node
/**
 * Compute basic counts for a table/column via PostgREST.
 * Usage: node scripts/supabase-table-stats.js <table> <column>
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

async function countWithFilter(table, filter) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', '*');
  url.searchParams.set('limit', '1');
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'count=exact'
    }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Count failed (${res.status}): ${body}`);
  }
  const range = res.headers.get('content-range');
  if (!range) return null;
  const match = range.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function main() {
  loadEnvFile();
  const table = process.argv[2];
  const column = process.argv[3];
  if (!table || !column) {
    console.error('Usage: node scripts/supabase-table-stats.js <table> <column>');
    process.exit(1);
  }

  const total = await countWithFilter(table);
  const nonNull = await countWithFilter(table, { [column]: 'not.is.null' });
  console.log(JSON.stringify({ table, column, total, nonNull }, null, 2));
}

main().catch((error) => {
  console.error('Stats failed:', error.message);
  process.exit(1);
});
