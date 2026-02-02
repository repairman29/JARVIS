#!/usr/bin/env node
/**
 * Sync CLAWDBOT_GATEWAY_TOKEN from Vault (or ~/.clawdbot/.env) to Supabase Edge secrets.
 * Fixes 502 "Unauthorized" when Edge calls the gateway: Edge must send the same token
 * the gateway expects. Run from repo root. Requires: supabase link, supabase CLI.
 * Usage: node scripts/sync-edge-gateway-token.js
 */
const path = require('path');
const { execSync } = require('child_process');
const { loadEnvFile, getVaultConfig, resolveEnv } = require('./vault.js');

async function main() {
  loadEnvFile();
  const env = loadEnvFile();
  const token = await resolveEnv('CLAWDBOT_GATEWAY_TOKEN', env) || env.CLAWDBOT_GATEWAY_TOKEN || process.env.CLAWDBOT_GATEWAY_TOKEN || '';
  const trimmed = String(token).trim();
  if (!trimmed) {
    console.error('CLAWDBOT_GATEWAY_TOKEN not found. Set in ~/.clawdbot/.env or in Vault (env/clawdbot/CLAWDBOT_GATEWAY_TOKEN).');
    process.exit(1);
  }

  try {
    execSync(`supabase secrets set CLAWDBOT_GATEWAY_TOKEN=${trimmed}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('Edge secret CLAWDBOT_GATEWAY_TOKEN updated. Test: curl -X POST <EDGE_URL> -H "Content-Type: application/json" -d \'{"message":"hi"}\'');
  } catch (e) {
    console.error('Failed to set secret. Ensure supabase link and CLI are set up.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
