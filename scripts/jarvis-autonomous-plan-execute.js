#!/usr/bin/env node
/**
 * JARVIS autonomous plan-and-execute — create a plan and run it with tools, without you in the loop.
 * One gateway call: JARVIS plans (focus repo, PRs, issues), then executes steps via tools; gateway
 * runs the full tool loop. Result is posted to webhook (or printed).
 *
 * Usage:
 *   node scripts/jarvis-autonomous-plan-execute.js
 *   node scripts/jarvis-autonomous-plan-execute.js --no-webhook
 *   node scripts/jarvis-autonomous-plan-execute.js --dry-run
 *
 * Env:
 *   Same as jarvis-autonomous-heartbeat.js (CLAWDBOT_GATEWAY_TOKEN, JARVIS_GATEWAY_URL, webhooks).
 *   NTFY_TOPIC or JARVIS_NTFY_TOPIC — ntfy topic for push; NTFY_URL for self-hosted (default https://ntfy.sh).
 *   JARVIS_AUTONOMOUS_TIMEOUT_MS  — max time for plan+execute (default 600000 = 10 min).
 *
 * Cron (e.g. daily at 8 AM):
 *   0 8 * * * cd /path/to/JARVIS && node scripts/jarvis-autonomous-plan-execute.js
 *
 * See docs/JARVIS_AUTONOMOUS_AGENT.md.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

const { loadEnvFile } = require('./vault.js');

function logAudit(eventAction, details) {
  const repoRoot = path.resolve(__dirname, '..');
  const args = ['scripts/audit-log.js', eventAction];
  if (details) args.push(details.slice(0, 300));
  args.push('--channel', 'autonomous', '--actor', 'plan-execute');
  spawn(process.execPath, args, {
    cwd: repoRoot,
    stdio: 'ignore',
    env: { ...process.env, HOME: process.env.HOME || os.homedir() },
  }).on('error', () => {});
}

const PLAN_EXECUTE_SYSTEM = `You are JARVIS running autonomously: you will create a plan and then execute it using your tools. No human is in the loop. Follow jarvis/TASKS.md for task buckets and guardrails. When the goal or focus leaves slack, include one item from jarvis/CREATIVE_PROJECTS.md (foundational/bash, stay modern, or quality of life) and summarize it.

Plan:
- Use products.json (in the repo) for product order; focus repo = first active product unless context says otherwise.
- Decide what to do next: e.g. check focus-repo PRs/issues, run github_status, run a small quality check or build, triage one issue, draft one PR comment. Keep the plan short (3–7 concrete steps).
- For build and test, use build_server_pipeline(repo) or build_server_build(repo, command). Do not use raw exec for npm run build/test when the build server is available.
- Execute each step using your tools: github_status, exec (for gh, deploy, cat, etc.), build_server_* skills, and other skills as needed. To read files, use exec with cat (e.g. exec cat jarvis/TASKS.md). Do NOT call a "read" tool — it does not exist. Only use tools listed in the tool set provided to you.
- You may run multiple tool calls in sequence; the gateway will return each result and you continue until the plan is done.
- If the plan included "ship" or "deploy" for a repo and build+test passed, call github_workflow_dispatch (deploy workflow) or exec (e.g. vercel deploy, railway up) before replying AUTONOMOUS_DONE.
- For long or heavy tasks (e.g. full BEAST MODE run, long implementation), use sessions_spawn with clear deliverables and ETA instead of doing everything in this run; then report that you spawned a subagent and what to expect.

Guardrails:
- Do not force-push, do not delete branches or prod data, do not commit secrets.
- Prefer read-only and low-risk actions (status, list, run tests) unless the plan explicitly includes a safe write (e.g. open a draft PR, comment on an issue).
- If a step fails, note it and continue or stop with a clear summary; do not retry destructively.

When you have finished executing the plan (or hit a safe stopping point), reply with exactly:
AUTONOMOUS_DONE
Then add a short summary: what you did, any failures, and one suggested next action. Keep the whole reply concise.`;

const PLAN_EXECUTE_USER_BASE = `Create a plan for what to do next (focus repo from products.json, open PRs/issues, recent failures). Then execute the plan step by step using your tools. When done, reply with AUTONOMOUS_DONE and a brief summary.`;

const LAST_SUMMARY_PATH = path.join(os.homedir(), '.jarvis', 'autonomous-last-summary.txt');
const LAST_SUMMARY_MAX_CHARS = 600;

function getLastRunSummary() {
  try {
    if (fs.existsSync(LAST_SUMMARY_PATH)) {
      const raw = fs.readFileSync(LAST_SUMMARY_PATH, 'utf8').trim();
      if (raw.length > 0) return raw.slice(-LAST_SUMMARY_MAX_CHARS);
    }
  } catch (_) {}
  return '';
}

function writeLastRunSummary(content) {
  try {
    const dir = path.dirname(LAST_SUMMARY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const summary = (content || '').trim().slice(-LAST_SUMMARY_MAX_CHARS);
    fs.writeFileSync(LAST_SUMMARY_PATH, summary, 'utf8');
  } catch (_) {}
}

const RETRY_DELAY_MS = 30000;
const GOAL_PATH = path.join(os.homedir(), '.jarvis', 'autonomous-goal.txt');

function getConfig() {
  loadEnvFile();
  const gatewayUrl = (process.env.JARVIS_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim().replace(/\/$/, '');
  const token = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';
  const webhookUrl = process.env.JARVIS_ALERT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || '';
  const ntfyTopic = process.env.JARVIS_NTFY_TOPIC || process.env.NTFY_TOPIC || '';
  const ntfyBaseUrl = (process.env.JARVIS_NTFY_URL || process.env.NTFY_URL || 'https://ntfy.sh').trim().replace(/\/$/, '');
  const timeoutMs = Math.max(60000, parseInt(process.env.JARVIS_AUTONOMOUS_TIMEOUT_MS || '600000', 10));
  const fallbackUrl = (process.env.JARVIS_AUTONOMOUS_FALLBACK_URL || '').trim().replace(/\/$/, '');
  return { gatewayUrl, token, webhookUrl, ntfyTopic, ntfyBaseUrl, timeoutMs, fallbackUrl };
}

function getMultiDayGoal() {
  try {
    if (fs.existsSync(GOAL_PATH)) {
      const raw = fs.readFileSync(GOAL_PATH, 'utf8').trim();
      if (raw.length > 0) return raw.slice(0, 500);
    }
  } catch (_) {}
  return '';
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

async function callGateway(gatewayUrl, token, messages, timeoutMs) {
  const chatUrl = `${gatewayUrl}/v1/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    'x-openclaw-agent-id': 'main',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(chatUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'openclaw:main',
      messages,
      stream: false,
      user: 'autonomous',
    }),
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

async function callWithRetryAndFallback(gatewayUrl, token, messages, timeoutMs, fallbackUrl) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await callGateway(gatewayUrl, token, messages, timeoutMs);
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
      const t = setTimeout(() => ac.abort(), Math.min(timeoutMs, 120000));
      const fallbackRes = await fetch(`${fallbackUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openclaw-agent-id': 'main',
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

  const { gatewayUrl, token, webhookUrl, ntfyTopic, ntfyBaseUrl, timeoutMs, fallbackUrl } = getConfig();

  const lastSummary = getLastRunSummary();
  const goal = getMultiDayGoal();
  let userContent = lastSummary
    ? `${PLAN_EXECUTE_USER_BASE}\n\nPrevious autonomous run ended with:\n${lastSummary}\nPick up from there if relevant; otherwise plan as usual.`
    : PLAN_EXECUTE_USER_BASE;
  if (goal) {
    userContent = `Current multi-day goal: ${goal}\nPrefer steps that advance this goal.\n\n` + userContent;
  }

  const messages = [
    { role: 'system', content: PLAN_EXECUTE_SYSTEM },
    { role: 'user', content: userContent },
  ];

  if (dryRun) {
    console.log('Dry run. Would POST to', `${gatewayUrl}/v1/chat/completions`, 'timeout', timeoutMs, 'ms');
    console.log('System prompt (first 300 chars):', PLAN_EXECUTE_SYSTEM.slice(0, 300) + '...');
    console.log('User prompt:', userContent.slice(0, 400) + (userContent.length > 400 ? '...' : ''));
    return;
  }

  if (!token) {
    console.error('Set CLAWDBOT_GATEWAY_TOKEN (or OPENCLAW_GATEWAY_TOKEN) in ~/.clawdbot/.env');
    process.exit(1);
  }

  logAudit('autonomous_plan_execute_start');
  console.error('Plan-and-execute started; timeout', Math.round(timeoutMs / 1000), 's');
  let content;
  try {
    content = await callWithRetryAndFallback(gatewayUrl, token, messages, timeoutMs, fallbackUrl);
  } catch (e) {
    console.error('Gateway call failed:', e.message);
    process.exit(1);
  }

  const lines = [
    `JARVIS plan-and-execute — ${new Date().toISOString()}`,
    content.trim(),
  ];
  const text = lines.join('\n');
  console.log(text);

  // Always write to local file (no login required)
  const reportsDir = path.join(os.homedir(), '.jarvis', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const latestPath = path.join(reportsDir, 'latest.txt');
  const stampedPath = path.join(reportsDir, `plan-execute-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
  fs.writeFileSync(latestPath, text, 'utf8');
  fs.writeFileSync(stampedPath, text, 'utf8');
  const afterDone = content.split(/\bAUTONOMOUS_DONE\b/i).slice(1).join('').trim() || content.trim();
  writeLastRunSummary(afterDone.slice(-LAST_SUMMARY_MAX_CHARS));
  logAudit('autonomous_plan_execute_done', afterDone);
  console.error('Report written to', latestPath);
  if (process.platform === 'darwin' && process.env.JARVIS_REPORTS_NOTIFY === '1') {
    try {
      require('child_process').execSync('osascript -e \'display notification "Plan-execute report ready" with title "JARVIS"\'', { stdio: 'ignore' });
    } catch (_) {}
  }

  if (!noWebhook && ntfyTopic) {
    try {
      await postNtfy(ntfyBaseUrl, ntfyTopic, 'JARVIS plan-execute', text);
      console.error('Report sent to ntfy topic:', ntfyTopic);
    } catch (e) {
      console.error('ntfy post failed:', e.message);
    }
  }

  if (!noWebhook && webhookUrl) {
    try {
      await postWebhook(webhookUrl, text);
      console.error('Summary posted to webhook.');
    } catch (e) {
      console.error('Webhook post failed:', e.message);
      process.exit(1);
    }
  } else if (!noWebhook && !webhookUrl) {
    console.warn('No webhook set. Report is in ~/.jarvis/reports/latest.txt');
  }
}

main().catch((e) => {
  console.error('jarvis-autonomous-plan-execute failed:', e.message);
  process.exit(1);
});
