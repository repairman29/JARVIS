#!/usr/bin/env node
/**
 * Aggregate recent Zendesk tickets by a custom field value (e.g. Product, Type).
 * Prints ticket counts per value so you can see trends (e.g. "Refund: 12, Billing: 8").
 *
 * Usage (from repo root):
 *   node scripts/zendesk-trends-by-field.js
 *   node scripts/zendesk-trends-by-field.js --field-id 12345678
 *   node scripts/zendesk-trends-by-field.js --days 7
 *
 * With no --field-id, the script lists ticket fields and picks the first custom
 * field that has options (e.g. dropdown); or you can pass --field-id.
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
  const getArg = (name) => {
    const i = process.argv.indexOf(name);
    return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
  };
  const fieldId = getArg('--field-id');
  const days = parseInt(getArg('--days') || '30', 10) || 30;
  return { fieldId: fieldId ? parseInt(fieldId, 10) : null, days };
}

function dateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10).replace(/-/g, '-');
}

async function main() {
  const { fieldId, days } = parseArgs();

  const fieldsRes = await tools.zendesk_list_ticket_fields();
  if (!fieldsRes.success || !fieldsRes.data || !fieldsRes.data.ticket_fields) {
    console.error('Failed to list ticket fields:', fieldsRes.message);
    process.exit(1);
  }

  const fields = fieldsRes.data.ticket_fields;
  let targetField = null;
  if (fieldId) {
    targetField = fields.find((f) => f.id === fieldId);
    if (!targetField) {
      console.error('Field id', fieldId, 'not found. Available fields:');
      fields.forEach((f) => console.error('  ', f.id, f.title, f.type));
      process.exit(2);
    }
  } else {
    targetField = fields.find((f) => f.custom_field_options && f.custom_field_options.length > 0);
    if (!targetField) {
      console.log('No custom field with options found. Available fields:');
      fields.forEach((f) => console.log('  ', f.id, f.title, f.type));
      console.log('\nRun with --field-id <id> to aggregate by a specific field.');
      process.exit(0);
    }
  }

  const since = dateDaysAgo(days);
  const searchRes = await tools.zendesk_search_tickets({
    query: `type:ticket updated>${since}`,
    sort_by: 'updated_at',
    sort_order: 'desc',
    limit: 100,
  });

  if (!searchRes.success || !searchRes.data) {
    console.error('Search failed:', searchRes.message);
    process.exit(1);
  }

  const tickets = searchRes.data.tickets || [];
  const counts = {};
  const fieldIdNum = targetField.id;
  tickets.forEach((t) => {
    const cf = (t.custom_fields || []).find((c) => String(c.id) === String(fieldIdNum));
    const val = cf && cf.value != null && cf.value !== '' ? String(cf.value) : '(empty)';
    counts[val] = (counts[val] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log(`Trends by field "${targetField.title}" (id ${targetField.id}) — tickets updated in last ${days} days (sample ${tickets.length})\n`);
  sorted.forEach(([value, count]) => console.log(`  ${value}: ${count}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
