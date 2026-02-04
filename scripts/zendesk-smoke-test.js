#!/usr/bin/env node
/**
 * Zendesk Sidekick smoke test: status, account settings, and ticket search.
 * Validates ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN from ~/.clawdbot/.env.
 *
 * Run from repo root: node scripts/zendesk-smoke-test.js
 * See docs/ZENDESK_CXO_SIDEKICK_BLUEPRINT.md for context.
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

async function main() {
  console.log('=== Zendesk Sidekick smoke test ===\n');

  let failed = 0;

  // 1. Status
  console.log('1. zendesk_status');
  const status = await tools.zendesk_status();
  console.log('   ', status.success ? 'OK' : 'FAIL', status.message);
  if (!status.success) failed++;

  // 2. Account settings (comprehend environment)
  console.log('\n2. zendesk_account_settings');
  const settings = await tools.zendesk_account_settings();
  console.log('   ', settings.success ? 'OK' : 'FAIL', settings.message);
  if (settings.success && settings.data) {
    const d = settings.data;
    console.log('   ', 'timezone:', d.timezone || '—', '| agent_workspace:', d.agent_workspace, '| chat:', d.chat_enabled);
  }
  if (!settings.success) failed++;

  // 3. Search tickets
  console.log('\n3. zendesk_search_tickets (query: type:ticket, limit: 3)');
  const search = await tools.zendesk_search_tickets({ query: 'type:ticket', limit: 3 });
  console.log('   ', search.success ? 'OK' : 'FAIL', search.message);
  if (search.success && search.data && search.data.tickets) {
    search.data.tickets.forEach((t) => console.log('   ', `#${t.id}`, t.status, t.subject?.slice(0, 50) + (t.subject?.length > 50 ? '…' : '')));
  }
  if (!search.success) failed++;

  // 4. List schedules (business hours)
  console.log('\n4. zendesk_list_schedules');
  const sched = await tools.zendesk_list_schedules();
  console.log('   ', sched.success ? 'OK' : 'FAIL', sched.message);
  if (sched.success && sched.data && sched.data.schedules) {
    sched.data.schedules.slice(0, 2).forEach((s) => console.log('   ', s.name, s.time_zone || ''));
  }
  if (!sched.success) failed++;

  // 5–7. Business rules (triggers, automations, macros)
  console.log('\n5. zendesk_list_triggers (limit: 5)');
  const triggers = await tools.zendesk_list_triggers({ limit: 5 });
  console.log('   ', triggers.success ? 'OK' : 'FAIL', triggers.message);
  if (triggers.success && triggers.data && triggers.data.triggers) {
    triggers.data.triggers.slice(0, 2).forEach((t) => console.log('   ', `#${t.id}`, t.active ? 'active' : 'inactive', t.title?.slice(0, 40)));
  }
  if (!triggers.success) failed++;

  console.log('\n6. zendesk_list_automations (limit: 5)');
  const automations = await tools.zendesk_list_automations({ limit: 5 });
  console.log('   ', automations.success ? 'OK' : 'FAIL', automations.message);
  if (automations.success && automations.data && automations.data.automations) {
    automations.data.automations.slice(0, 2).forEach((a) => console.log('   ', `#${a.id}`, a.active ? 'active' : 'inactive', a.title?.slice(0, 40)));
  }
  if (!automations.success) failed++;

  console.log('\n7. zendesk_list_macros (limit: 5)');
  const macros = await tools.zendesk_list_macros({ limit: 5 });
  console.log('   ', macros.success ? 'OK' : 'FAIL', macros.message);
  if (macros.success && macros.data && macros.data.macros) {
    macros.data.macros.slice(0, 2).forEach((m) => console.log('   ', `#${m.id}`, m.active ? 'active' : 'inactive', m.title?.slice(0, 40)));
  }
  if (!macros.success) failed++;

  console.log('\n=== Result ===');
  if (failed === 0) {
    console.log('All checks passed. Zendesk Sidekick is live.');
    process.exit(0);
  }
  console.error(`${failed} check(s) failed. Fix ZENDESK_* in ~/.clawdbot/.env and re-run.`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
