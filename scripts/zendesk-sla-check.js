#!/usr/bin/env node
/**
 * Zendesk SLA check: find open/pending tickets and report at-risk ones
 * (no first reply within threshold, or high requester wait time).
 * For use with cron or manual runs. Exit 0 = no at-risk; 1 = at-risk (alert).
 *
 * Env: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN from ~/.clawdbot/.env.
 * Optional: ZENDESK_SLA_NO_REPLY_HOURS=2, ZENDESK_SLA_WAIT_THRESHOLD=60, ZENDESK_SLA_MAX_TICKETS=50.
 *
 * Run from repo root: node scripts/zendesk-sla-check.js
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

const NO_REPLY_HOURS = Math.max(0, parseInt(process.env.ZENDESK_SLA_NO_REPLY_HOURS, 10) || 2);
const WAIT_THRESHOLD_MIN = Math.max(0, parseInt(process.env.ZENDESK_SLA_WAIT_THRESHOLD, 10) || 60);
const MAX_TICKETS = Math.min(100, Math.max(1, parseInt(process.env.ZENDESK_SLA_MAX_TICKETS, 10) || 50));

function hoursAgo(hours) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

async function main() {
  const atRisk = [];

  const search = await tools.zendesk_search_tickets({
    query: `type:ticket status:open status:pending`,
    sort_by: 'created_at',
    sort_order: 'asc',
    limit: MAX_TICKETS,
  });

  if (!search.success || !search.data || !search.data.tickets) {
    console.error('SLA check: search failed:', search.message || 'unknown');
    process.exit(2);
  }

  const tickets = search.data.tickets;
  if (tickets.length === 0) {
    console.log('SLA check: no open/pending tickets.');
    process.exit(0);
  }

  const cutoff = hoursAgo(NO_REPLY_HOURS);

  for (const t of tickets) {
    const metricsResult = await tools.zendesk_get_ticket_metrics({ ticket_id: t.id });
    const created = t.created_at || '';

    if (!metricsResult.success || !metricsResult.data) {
      atRisk.push({
        id: t.id,
        subject: t.subject,
        reason: 'Could not fetch metrics',
        created_at: created,
      });
      continue;
    }

    const m = metricsResult.data;
    const replyMin = m.reply_time_in_minutes;
    const waitMin = m.requester_wait_time_in_minutes;

    if (replyMin == null && created < cutoff) {
      atRisk.push({
        id: t.id,
        subject: t.subject,
        reason: `No first reply yet (older than ${NO_REPLY_HOURS}h)`,
        created_at: created,
      });
    } else if (waitMin != null && waitMin > WAIT_THRESHOLD_MIN) {
      atRisk.push({
        id: t.id,
        subject: t.subject,
        reason: `Requester wait ${Math.round(waitMin)} min (threshold ${WAIT_THRESHOLD_MIN})`,
        created_at: created,
      });
    }
  }

  if (atRisk.length === 0) {
    console.log(`SLA check: ${tickets.length} open/pending ticket(s) checked; none at-risk.`);
    process.exit(0);
  }

  console.error(`SLA check: ${atRisk.length} at-risk ticket(s):`);
  atRisk.forEach((a) => {
    console.error(`  #${a.id} ${a.reason} | ${(a.subject || '').slice(0, 60)}`);
  });
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
