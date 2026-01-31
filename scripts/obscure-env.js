#!/usr/bin/env node
/**
 * Replace env values with Vault placeholders (local .env).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function findEnvPath() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function main() {
  const envPath = findEnvPath();
  if (!envPath) {
    console.error('No .clawdbot/.env found.');
    process.exit(1);
  }

  const text = fs.readFileSync(envPath, 'utf8');
  const normalized = text.replace(/^\uFEFF/, '');
  const lines = normalized.split(/\r?\n/);
  const skipKeys = new Set(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

  const updated = lines.map((line) => {
    const match = line.match(/^(\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*)(.*)$/);
    if (!match) return line;
    const key = match[2];
    if (skipKeys.has(key)) return line;
    const prefix = match[1];
    const placeholder = `vault://app_secrets/env/clawdbot/${key}`;
    return `${prefix}${placeholder}`;
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const backupPath = `${envPath}.bak-${stamp}`;
  fs.writeFileSync(backupPath, text, 'utf8');
  fs.writeFileSync(envPath, updated.join(os.EOL), 'utf8');
  console.log(`Updated env file with placeholders. Backup: ${backupPath}`);
}

main();
