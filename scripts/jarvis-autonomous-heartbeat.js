#!/usr/bin/env node
/**
 * JARVIS autonomous heartbeat — run the agent via the gateway (farm/LLM + tools), then post result to webhook.
 * Use on a schedule (cron) or on-demand to make JARVIS act as a long-running agent that checks in periodically.
 *
 * Unlike heartbeat-brief.js (safety net + PR counts only), this sends a real prompt to the gateway so JARVIS
 * can use tools (github_status, exec, etc.) and reply with HEARTBEAT_OK or HEARTBEAT_REPORT per jarvis/HEARTBEAT.md.
 *
 * Usage:
 *   node scripts/jarvis-autonomous-heartbeat.js
 *   node scripts/jarvis-autonomous-heartbeat.js --no-webhook   # run agent, print only
 *   node scripts/jarvis-autonomous-heartbeat.js --dry-run      # print prompt and exit (no gateway call)
 *
 * Env (from ~/.clawdbot/.env or process.env):
 *   CLAWDBOT_GATEWAY_TOKEN or OPENCLAW_GATEWAY_TOKEN  — required for gateway auth
 *   JARVIS_GATEWAY_URL or NEXT_PUBLIC_GATEWAY_URL     — default http://127.0.0.1:18789
 *   JARVIS_ALERT_WEBHOOK_URL or DISCORD_WEBHOOK_URL   — where to post the brief (optional)
 *   NTFY_TOPIC or JARVIS_NTFY_TOPIC                  — ntfy topic for push (optional); NTFY_URL for self-hosted (default https://ntfy.sh)
 *
 * Cron example (every 6 hours):
 *   0 *\/6 * * * cd /path/to/JARVIS && node scripts/jarvis-autonomous-heartbeat.js
 *
 * See docs/JARVIS_AUTONOMOUS_AGENT.md.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

const { loadEnvFile } = require('./vault.js');

const HEARTBEAT_SYSTEM = `You are JARVIS running an autonomous heartbeat. Follow jarvis/HEARTBEAT.md and jarvis/TASKS.md. When there's slack, you may do one item from jarvis/CREATIVE_PROJECTS.md (bash/scripting, try one tool, runbook improvement, or quality-of-life automation) and report it.

Rules:
- Check if there are actionable items (focus repo, open PRs/issues, recent failures, user follow-ups). Use tools as needed: github_status, exec for gh pr list / gh issue list, etc.
- To read files, use the exec tool with cat (e.g. exec cat jarvis/HEARTBEAT.md). Do NOT call a "read" tool — it does not exist. Only use tools listed in the tool set provided to you.
- If no actionable items: reply with exactly HEARTBEAT_OK and optionally one short line (e.g. "All clear.").
- If there are actionable items: reply with HEARTBEAT_REPORT, then 3–5 bullets and a clear next action. Be concise.
- Keep the reply short (a few lines). No preamble.`;

const HEARTBEAT_USER = 'Run your heartbeat now. Use tools if needed. Reply with HEARTBEAT_OK or HEARTBEAT_REPORT and bullets.';

const RETRY_DELAY_MS = 30000;

function getConfig() {
  loadEnvFile();
  const gatewayUrl = (process.env.JARVIS_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim().replace(/\/$/, '');
  const token = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';
  const webhookUrl = process.env.JARVIS_ALERT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || '';
  const ntfyTopic = process.env.JARVIS_NTFY_TOPIC || process.env.NTFY_TOPIC || '';
  const ntfyBaseUrl = (process.env.JARVIS_NTFY_URL || process.env.NTFY_URL || 'https://ntfy.sh').trim().replace(/\/$/, '');
  const fallbackUrl = (process.env.JARVIS_AUTONOMOUS_FALLBACK_URL || '').trim().replace(/\/$/, '');
  return { gatewayUrl, token, webhookUrl, ntfyTopic, ntfyBaseUrl, fallbackUrl };
}

function extractContent(data) {
  if (data == null || typeof data !== 'object') return '';
  const o = data;
  const choice = Array.isArray(o.choices) ? o.choices[0] : undefined;
  if (choice != null && typeof choice === 'object') {
    const msg = choice.message ?? choice.delta;
    if (typeof msg === 'string') return msg;
    if (msg != null && typeof msg === 'object') {
      const content = msg.content ?? msg.text;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        const parts = content
          .map((p) => (p != null && typeof p === 'object' && typeof p.text === 'string' ? p.text : ''))
          .filter(Boolean);
        if (parts.length) return parts.join('\n');
      }
    }
    if (typeof choice.text === 'string') return choice.text;
  }
  if (typeof o.output === 'string') return o.output;
  if (typeof o.response === 'string') return o.response;
  if (typeof o.message === 'string') return o.message;
  if (typeof o.content === 'string') return o.content;
  return '';
}

function postNtfy(baseUrl, topic, title, body) {
  const url = `${baseUrl}/${encodeURIComponent(topic)}`;
  const parsed = new URL(url);
  const lib = parsed.protocol === 'https:' ? https : http;
  const msg = String(body).slice(0, 4000);
  const headers = { 'X-Title': title || 'JARVIS' };
  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        method: 'POST',
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers: { ...headers, 'Content-Length': Buffer.byteLength(msg, 'utf8') },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode));
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('ntfy timeout')); });
    req.write(msg, 'utf8');
    req.end();
  });
}

function postWebhook(url, payload) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const body = JSON.stringify(typeof payload === 'string' ? { content: payload } : payload);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        {
          method: 'POST',
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', () => resolve(res.statusCode));
        }
      );
      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Webhook timeout'));
      });
      req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function callGateway(gatewayUrl, token, messages, timeoutMs = 120000) {
  const chatUrl = `${gatewayUrl}/v1/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    'x-openclaw-agent-id': 'main',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const body = JSON.stringify({
    model: 'openclaw:main',
    messages,
    stream: false,
    user: 'autonomous',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(chatUrl, {
    method: 'POST',
    headers,
    body,
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    const text = await res.text();
    let err = text;
    try {
      const j = JSON.parse(text);
      if (j.error && j.error.message) err = j.error.message;
    } catch (_) {}
    throw new Error(`Gateway ${res.status}: ${err}`);
  }

  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('Gateway returned invalid JSON');
  }
  return extractContent(data) || 'No response from JARVIS.';
}

async function callWithRetryAndFallback(gatewayUrl, token, messages, fallbackUrl) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await callGateway(gatewayUrl, token, messages);
    } catch (e) {
      lastErr = e;
      if (attempt === 0) {
        console.error('Gateway call failed, retrying in 30s:', e.message);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  if (fallbackUrl) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 120000);
      const fallbackRes = await fetch(`${fallbackUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          model: 'openclaw:main',
          messages,
          stream: false,
          user: 'autonomous',
        }),
        signal: ac.signal,
      });
      clearTimeout(t);
      const raw = await fallbackRes.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (_) {
        throw new Error('Fallback returned invalid JSON');
      }
      const content = extractContent(data) || 'No response from fallback.';
      return '[Fallback LLM; gateway/farm was unavailable.] ' + content;
    } catch (e) {
      console.error('Fallback also failed:', e.message);
    }
  }
  throw lastErr;
}

async function main() {
  const noWebhook = process.argv.includes('--no-webhook');
  const dryRun = process.argv.includes('--dry-run');

  const { gatewayUrl, token, webhookUrl, ntfyTopic, ntfyBaseUrl, fallbackUrl } = getConfig();

  const messages = [
    { role: 'system', content: HEARTBEAT_SYSTEM },
    { role: 'user', content: HEARTBEAT_USER },
  ];

  if (dryRun) {
    console.log('Dry run. Would POST to', `${gatewayUrl}/v1/chat/completions`);
    console.log('System prompt (first 200 chars):', HEARTBEAT_SYSTEM.slice(0, 200) + '...');
    console.log('User prompt:', HEARTBEAT_USER);
    return;
  }

  if (!token) {
    console.error('Set CLAWDBOT_GATEWAY_TOKEN (or OPENCLAW_GATEWAY_TOKEN) in ~/.clawdbot/.env');
    process.exit(1);
  }

  let content;
  try {
    content = await callWithRetryAndFallback(gatewayUrl, token, messages, fallbackUrl);
  } catch (e) {
    console.error('Gateway call failed:', e.message);
    process.exit(1);
  }

  const lines = [
    `JARVIS autonomous heartbeat — ${new Date().toISOString()}`,
    content.trim(),
  ];
  const text = lines.join('\n');
  console.log(text);

  // Always write to local file (no login required)
  const reportsDir = path.join(os.homedir(), '.jarvis', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const latestPath = path.join(reportsDir, 'latest.txt');
  const stampedPath = path.join(reportsDir, `heartbeat-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
  fs.writeFileSync(latestPath, text, 'utf8');
  fs.writeFileSync(stampedPath, text, 'utf8');
  console.log('Report written to', latestPath);
  if (process.platform === 'darwin' && process.env.JARVIS_REPORTS_NOTIFY === '1') {
    try {
      require('child_process').execSync('osascript -e \'display notification "Heartbeat report ready" with title "JARVIS"\'', { stdio: 'ignore' });
    } catch (_) {}
  }

  if (!noWebhook && ntfyTopic) {
    try {
      await postNtfy(ntfyBaseUrl, ntfyTopic, 'JARVIS heartbeat', text);
      console.log('Report sent to ntfy topic:', ntfyTopic);
    } catch (e) {
      console.error('ntfy post failed:', e.message);
    }
  }

  if (!noWebhook && webhookUrl) {
    try {
      await postWebhook(webhookUrl, text);
      console.log('Brief posted to webhook.');
    } catch (e) {
      console.error('Webhook post failed:', e.message);
      process.exit(1);
    }
  } else if (!noWebhook && !webhookUrl) {
    console.warn('No webhook set. Report is in ~/.jarvis/reports/latest.txt');
  }
}

main().catch((e) => {
  console.error('jarvis-autonomous-heartbeat failed:', e.message);
  process.exit(1);
});

/* -----------------------------------------------------------------------------
 * Helper: ntfy push on HEARTBEAT_REPORT
 *
 * When the content contains HEARTBEAT_REPORT (actionable items), send a
 * higher-priority push via notify-iphone.js so the user gets alerted on iPhone.
 *
 * Integration (add after parsing content, before writing reports):
 *
 *   const isReport = /HEARTBEAT_REPORT/i.test(content);
 *   if (isReport && ntfyTopic) {
 *     try {
 *       const { notify } = require('./notify-iphone.js');
 *       const clickUrl = process.env.JARVIS_CLICK_URL || gatewayUrl;
 *       await notify('JARVIS Report', content.trim(), {
 *         priority: 'high',
 *         tags: 'robot,clipboard',
 *         click: clickUrl,
 *       });
 *       console.log('Report pushed to ntfy (HEARTBEAT_REPORT).');
 *     } catch (e) {
 *       console.error('ntfy push failed:', e.message);
 *     }
 *   }
 *
 * The existing postNtfy() above already sends every heartbeat to ntfy when
 * ntfyTopic is set. This helper shows how to add a *second* notification
 * with higher priority specifically for HEARTBEAT_REPORT, so actionable
 * items stand out on the lock screen.
 * ----------------------------------------------------------------------------- */
