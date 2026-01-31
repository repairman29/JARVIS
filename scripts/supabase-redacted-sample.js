#!/usr/bin/env node
/**
 * Fetch redacted samples from a Supabase table/columns.
 * Usage: node scripts/supabase-redacted-sample.js <table> <col1,col2,...> [limit]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

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

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function redact(value) {
  if (value === null || typeof value === 'undefined') return null;
  const str = String(value);
  const trimmed = str.replace(/^["']|["']$/g, '').trim();
  if (!trimmed) return null;
  return {
    hash: sha256(trimmed).slice(0, 12),
    last4: trimmed.slice(-4),
    length: trimmed.length
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

  const table = process.argv[2];
  const columns = (process.argv[3] || '').split(',').map((c) => c.trim()).filter(Boolean);
  const limit = Number(process.argv[4] || 20);

  if (!table || !columns.length) {
    console.error('Usage: node scripts/supabase-redacted-sample.js <table> <col1,col2,...> [limit]');
    process.exit(1);
  }

  const url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(columns.join(','))}&limit=${limit}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  if (!res.ok) {
    console.error('Fetch failed:', res.status);
    process.exit(1);
  }
  const data = await res.json();
  const redactedRows = data.map((row) => {
    const out = {};
    for (const col of columns) {
      out[col] = redact(row[col]);
    }
    return out;
  });
  console.log(JSON.stringify({ table, columns, sampleSize: data.length, rows: redactedRows }, null, 2));
}

main().catch((error) => {
  console.error('Sample failed:', error.message);
  process.exit(1);
});
