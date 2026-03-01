#!/usr/bin/env node
/**
 * Small HTTP server that triggers JARVIS plan-execute on webhook (e.g. GitHub push/PR).
 * Run: node scripts/webhook-trigger-server.js
 *
 * Endpoints:
 *   POST /webhook/github  — GitHub webhook (push, pull_request). Optionally verify X-Hub-Signature-256 if GITHUB_WEBHOOK_SECRET is set.
 *   POST /trigger-plan   — Trigger plan-execute (optional Authorization: Bearer <token> or same secret as query ?secret=).
 *   GET /health          — 200 OK if server is up.
 *
 * Env:
 *   WEBHOOK_TRIGGER_PORT (default 18791)
 *   GITHUB_WEBHOOK_SECRET — if set, GitHub delivery signature is verified
 *   JARVIS_WEBHOOK_TRIGGER_SECRET — if set, POST /trigger-plan requires ?secret=<this> or Authorization: Bearer <this>
 *
 * Plan-execute runs in background; response is 202 Accepted.
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.WEBHOOK_TRIGGER_PORT || '18791');

function verifyGitHubSignature(body, signature, secret) {
  if (!secret || !signature) return !secret;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expected = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function triggerPlanExecute() {
  spawn(process.execPath, [path.join(__dirname, 'jarvis-autonomous-plan-execute.js')], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env },
  }).unref();
}

function respond(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
    respond(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && (req.url === '/trigger-plan' || req.url === '/webhook/github')) {
    const secret = process.env.JARVIS_WEBHOOK_TRIGGER_SECRET || '';
    const ghSecret = process.env.GITHUB_WEBHOOK_SECRET || '';
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');

      if (req.url === '/webhook/github' && ghSecret) {
        const sig = req.headers['x-hub-signature-256'];
        if (!verifyGitHubSignature(body, sig, ghSecret)) {
          respond(res, 401, { error: 'Invalid signature' });
          return;
        }
        let event;
        try {
          const payload = JSON.parse(body);
          event = req.headers['x-github-event'] || payload.action;
          const ref = payload.ref || '';
          const action = payload.action || '';
          if (event === 'push' && ref === 'refs/heads/main') {
            triggerPlanExecute();
          } else if (event === 'pull_request' && ['opened', 'synchronize', 'closed'].includes(action)) {
            triggerPlanExecute();
          } else {
            respond(res, 200, { ok: true, skipped: 'event not configured to trigger' });
            return;
          }
        } catch (_) {
          respond(res, 400, { error: 'Invalid JSON' });
          return;
        }
      } else if (req.url === '/trigger-plan' && secret) {
        const auth = req.headers['authorization'];
        const bearer = auth && auth.startsWith('Bearer ') ? auth.slice(7) : '';
        const q = new URL(req.url, 'http://localhost').searchParams.get('secret');
        if (bearer !== secret && q !== secret) {
          respond(res, 401, { error: 'Unauthorized' });
          return;
        }
        triggerPlanExecute();
      } else {
        triggerPlanExecute();
      }

      respond(res, 202, { ok: true, message: 'Plan-execute triggered' });
    });
    return;
  }

  if (req.method === 'POST' && req.url && req.url.startsWith('/webhook/location')) {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      let payload = {};
      try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (_) {}
      const urlPath = req.url.split('?')[0];
      const event = urlPath.endsWith('/arrive') ? 'arrive' : urlPath.endsWith('/leave') ? 'leave' : 'unknown';
      const location = payload.location || 'unknown';
      const ts = new Date().toISOString();
      console.error(`[location] ${ts} event=${event} location=${location}`);

      try {
        const { notify } = require('./notify-iphone.js');
        const icon = event === 'arrive' ? 'house' : 'walking';
        const title = event === 'arrive' ? `Arrived: ${location}` : `Left: ${location}`;
        notify(title, `JARVIS noted at ${new Date().toLocaleTimeString()}`, { tags: icon, priority: 'low' }).catch(() => {});
      } catch (_) {}

      if (event === 'arrive' && (location.toLowerCase().includes('office') || location.toLowerCase().includes('home'))) {
        triggerPlanExecute();
      }

      respond(res, 200, { ok: true, event, location, ts });
    });
    return;
  }

  respond(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.error('Webhook trigger server on http://0.0.0.0:' + PORT);
  console.error('  POST /trigger-plan       — trigger plan-execute');
  console.error('  POST /webhook/github     — GitHub webhook');
  console.error('  POST /webhook/location/arrive — location arrive event');
  console.error('  POST /webhook/location/leave  — location leave event');
});
