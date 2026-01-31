#!/usr/bin/env node
/**
 * Execute SQL against Supabase via /rpc/exec_sql.
 * Usage: node scripts/supabase-exec-sql.js --sql "<sql>"
 *        node scripts/supabase-exec-sql.js --file path/to.sql
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

function parseArgs(argv) {
  const out = { sql: null, file: null, show: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--sql') out.sql = argv[++i];
    else if (arg === '--file') out.file = argv[++i];
    else if (arg === '--show') out.show = true;
  }
  return out;
}

async function main() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const { sql, file, show } = parseArgs(process.argv);
  let sqlQuery = sql;
  if (file) {
    const resolved = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    sqlQuery = fs.readFileSync(resolved, 'utf8');
  }
  if (!sqlQuery) {
    console.error('Provide --sql or --file.');
    process.exit(1);
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
    console.error('exec_sql failed:', res.status);
    console.error(body);
    process.exit(1);
  }
  const data = await res.json();
  if (show) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (Array.isArray(data)) {
    console.log(JSON.stringify({ rows: data.length }, null, 2));
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error('exec_sql failed:', error.message);
  process.exit(1);
});
