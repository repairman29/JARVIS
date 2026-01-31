#!/usr/bin/env node
/**
 * Migrate secrets from ~/.clawdbot/.env into Supabase Vault and app_secrets.
 * Run docs/sql/001_app_secrets.sql in Supabase SQL Editor once before this.
 * Option: --write-placeholders to replace .env values with __VAULT__ (back up .env first).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadEnvFile, getSupabaseConfig } = require('./vault.js');

const ENV_KEYS_TO_MIGRATE = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'KROGER_CLIENT_ID',
  'KROGER_CLIENT_SECRET',
  'KROGER_SERVICE_SECRET'
];

async function createVaultSecret(supabaseUrl, serviceKey, value, name, description) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/create_secret`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'vault',
      'Content-Profile': 'vault'
    },
    body: JSON.stringify({
      value: value,
      name: name || null,
      description: description || null
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`vault.create_secret failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (typeof data === 'string') return data;
  if (data && typeof data.create_secret === 'string') return data.create_secret;
  if (Array.isArray(data) && data.length > 0 && data[0].create_secret) return data[0].create_secret;
  throw new Error('Unexpected create_secret response');
}

async function upsertAppSecret(supabaseUrl, serviceKey, name, secretId, source, notes) {
  const getRes = await fetch(
    `${supabaseUrl}/rest/v1/app_secrets?name=eq.${encodeURIComponent(name)}&select=id`,
    {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const rows = getRes.ok ? await getRes.json() : [];
  const body = { secret_id: secretId, source, notes: notes || null };
  if (Array.isArray(rows) && rows.length > 0) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/app_secrets?name=eq.${encodeURIComponent(name)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    if (!res.ok) throw new Error(`app_secrets PATCH failed: ${res.status} ${await res.text()}`);
  } else {
    const res = await fetch(`${supabaseUrl}/rest/v1/app_secrets`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, ...body })
    });
    if (!res.ok) throw new Error(`app_secrets POST failed: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const writePlaceholders = process.argv.includes('--write-placeholders');
  loadEnvFile();
  const config = getSupabaseConfig();
  if (!config.url || !config.key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set in ~/.clawdbot/.env');
    process.exit(1);
  }

  const envPath = path.join(process.env.USERPROFILE || process.env.HOME || os.homedir(), '.clawdbot', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('No ~/.clawdbot/.env found.');
    process.exit(1);
  }

  const envText = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of envText.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.trimEnd().match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }

  const migrated = [];
  for (const key of ENV_KEYS_TO_MIGRATE) {
    const value = env[key] || process.env[key];
    if (!value || value === '__VAULT__') continue;
    const name = `env/clawdbot/${key}`;
    try {
      const secretId = await createVaultSecret(config.url, config.key, value, name, `From .clawdbot/.env: ${key}`);
      await upsertAppSecret(config.url, config.key, name, secretId, 'env', `Migrated ${key}`);
      migrated.push({ key, name, secretId: secretId.slice(0, 8) + '...' });
    } catch (err) {
      console.error(`Failed ${key}:`, err.message);
    }
  }

  console.log('Migrated:', migrated.length, migrated.map((m) => m.key));
  if (writePlaceholders && migrated.length > 0) {
    let newText = envText;
    for (const { key } of migrated) {
      newText = newText.replace(new RegExp(`^(\\s*${key}\\s*=\\s*).*`, 'm'), `$1__VAULT__`);
    }
    fs.writeFileSync(envPath, newText, 'utf8');
    console.log('Wrote placeholders to', envPath);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
