#!/usr/bin/env node
/**
 * List Zendesk tickets matching a keyword (subject/description) or tag.
 * Use for "all tickets about [product/entity]" or "tickets tagged X".
 *
 * Usage (from repo root):
 *   node scripts/zendesk-tickets-by-entity.js "Product X"
 *   node scripts/zendesk-tickets-by-entity.js "refund"
 *   node scripts/zendesk-tickets-by-entity.js tag:billing
 *   node scripts/zendesk-tickets-by-entity.js tag:bug --limit 50
 *
 * Env: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN from ~/.clawdbot/.env.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

function homedir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir();
}

function loadEnv() {
  const envPath = path.join(homedir(), '.clawdbot', '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

loadEnv();
try {
  const { loadEnvFile } = require('./vault.js');
  if (loadEnvFile) loadEnvFile();
} catch (_) {}

const skillPath = path.join(__dirname, '..', 'skills', 'zendesk', 'index.js');
const { tools } = require(skillPath);

function parseArgs() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const limitIdx = process.argv.indexOf('--limit');
  const limit = limitIdx >= 0 && process.argv[limitIdx + 1] ? parseInt(process.argv[limitIdx + 1], 10) : 50;
  const keyword = args[0] || '';
  return { keyword: keyword.trim(), limit: Math.min(100, Math.max(1, limit)) };
}

async function main() {
  const { keyword, limit } = parseArgs();
  if (!keyword) {
    console.error('Usage: node scripts/zendesk-tickets-by-entity.js <keyword|tag:name> [--limit N]');
    process.exit(2);
  }

  const isTag = /^tag:/i.test(keyword);
  const query = isTag
    ? `type:ticket ${keyword}`
    : `type:ticket ${keyword}`;

  const res = await tools.zendesk_search_tickets({
    query,
    sort_by: 'updated_at',
    sort_order: 'desc',
    limit,
  });

  if (!res.success) {
    console.error('Search failed:', res.message);
    process.exit(1);
  }

  const tickets = (res.data && res.data.tickets) || [];
  console.log(`Found ${tickets.length} ticket(s) for "${keyword}"\n`);
  tickets.forEach((t) => {
    const subj = (t.subject || '').slice(0, 70);
    const tags = (t.tags && t.tags.length) ? ` [${t.tags.slice(0, 3).join(', ')}]` : '';
    console.log(`#${t.id}  ${t.status}  ${subj}${subj.length >= 70 ? '…' : ''}${tags}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
