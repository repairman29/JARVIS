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

async function main() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const url = `${supabaseUrl}/rest/v1/app_secrets?select=name,source&limit=1000`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('Failed to list app_secrets:', res.status);
    console.error(body);
    process.exit(1);
  }
  const data = await res.json();
  console.log(JSON.stringify({ count: data.length, entries: data }, null, 2));
}

main().catch((error) => {
  console.error('List failed:', error.message);
  process.exit(1);
});
