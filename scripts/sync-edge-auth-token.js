#!/usr/bin/env node
/**
 * Sync JARVIS_AUTH_TOKEN from apps/jarvis-ui/.env.local to Supabase Edge.
 * Run from repo root. Requires: supabase link and supabase CLI.
 * Usage: node scripts/sync-edge-auth-token.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '..', 'apps', 'jarvis-ui', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('apps/jarvis-ui/.env.local not found. Add JARVIS_AUTH_TOKEN there first.');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const match = content.match(/^\s*JARVIS_AUTH_TOKEN\s*=\s*(.+)\s*$/m);
const token = match ? match[1].replace(/^["']|["']$/g, '').trim() : '';
if (!token) {
  console.error('JARVIS_AUTH_TOKEN not found in apps/jarvis-ui/.env.local');
  process.exit(1);
}

try {
  execSync(`supabase secrets set JARVIS_AUTH_TOKEN=${token}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('Edge secret JARVIS_AUTH_TOKEN updated. Redeploy if needed: supabase functions deploy jarvis');
} catch (e) {
  console.error('Failed to set secret. Ensure supabase link and CLI are set up.');
  process.exit(1);
}
