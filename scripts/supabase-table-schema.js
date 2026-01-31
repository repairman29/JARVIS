#!/usr/bin/env node
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

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}

function extractSchema(openapi, table) {
  const schemas = (openapi.components && openapi.components.schemas) || openapi.definitions || {};
  return schemas[table] || null;
}

async function main() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const tables = process.argv.slice(2);
  if (!tables.length) {
    console.error('Usage: node scripts/supabase-table-schema.js <table> [table2...]');
    process.exit(1);
  }

  const openapi = await fetchJson(`${supabaseUrl}/rest/v1/`, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });

  const output = {};
  for (const table of tables) {
    const schema = extractSchema(openapi, table);
    if (!schema || !schema.properties) {
      output[table] = null;
      continue;
    }
    output[table] = Object.keys(schema.properties);
  }
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error('Schema read failed:', error.message);
  process.exit(1);
});
