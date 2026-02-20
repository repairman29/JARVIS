#!/usr/bin/env node
/**
 * LLM router for JARVIS on Pixel: two backends (Pixel adapter 8888, iPhone adapter 8887)
 * with round-robin or model-based routing and fallback on failure.
 *
 * Run on Pixel when JARVIS_IPHONE_LLM_URL is set (second adapter runs separately).
 * Gateway should use NEURAL_FARM_BASE_URL=http://127.0.0.1:18890/v1 so all LLM traffic goes through this router.
 *
 * Env:
 *   PIXEL_LLM_ROUTER_PORT  — default 18890
 *   PIXEL_LLM_PRIMARY      — default http://127.0.0.1:8888 (Pixel InferrLM adapter)
 *   PIXEL_LLM_SECONDARY    — default http://127.0.0.1:8887 (iPhone InferrLM adapter; only used if secondary is up)
 *   PIXEL_LLM_TERTIARY     — optional http://127.0.0.1:8890 (Gemini Nano bridge app); included in round-robin when set
 *   PIXEL_LLM_ROUTE        — "round-robin" | "model" | "primary" | "chat-task" (chat-task = short convos → tertiary/Nano, tasks → primary)
 *   PIXEL_LLM_PRIMARY_CHAT_MODEL  — optional; when sending a chat request to primary (InferrLM), set body.model to this if InferrLM supports per-request model
 *   PIXEL_LLM_PRIMARY_TASK_MODEL — optional; when sending a task request to primary, set body.model to this (InferrLM may only have one "default" in-app; use if API honors model field)
 */

const http = require('http');

const PORT = Number(process.env.PIXEL_LLM_ROUTER_PORT || '18890');
const PRIMARY = (process.env.PIXEL_LLM_PRIMARY || 'http://127.0.0.1:8888').replace(/\/$/, '');
const SECONDARY = (process.env.PIXEL_LLM_SECONDARY || 'http://127.0.0.1:8887').replace(/\/$/, '');
const TERTIARY = process.env.PIXEL_LLM_TERTIARY ? process.env.PIXEL_LLM_TERTIARY.replace(/\/$/, '') : null; // Gemini Nano bridge
const ROUTE = (process.env.PIXEL_LLM_ROUTE || 'round-robin').toLowerCase(); // round-robin | model | primary | chat-task
const REQUEST_TIMEOUT_MS = Number(process.env.PIXEL_LLM_ROUTER_TIMEOUT_MS || '120000');
const PRIMARY_CHAT_MODEL = process.env.PIXEL_LLM_PRIMARY_CHAT_MODEL || null;  // model name for chat when sent to primary
const PRIMARY_TASK_MODEL = process.env.PIXEL_LLM_PRIMARY_TASK_MODEL || null; // model name for task when sent to primary

let roundRobinNext = 0;

function backends() {
  const list = [PRIMARY, SECONDARY];
  if (TERTIARY) list.push(TERTIARY);
  return list;
}

function looksLikeChat(body) {
  if (!body || !Array.isArray(body.messages)) return false;
  const n = body.messages.length;
  if (n > 4) return false; // long convo → treat as task
  const hasTools = body.tools != null && body.tools.length > 0;
  const last = body.messages[n - 1];
  const hasToolCalls = last && Array.isArray(last.tool_calls) && last.tool_calls.length > 0;
  if (hasTools || hasToolCalls) return false; // tool use → task
  return true;
}

function chooseBackend(body) {
  if (ROUTE === 'primary') return PRIMARY;
  if (ROUTE === 'chat-task' && TERTIARY) {
    return looksLikeChat(body) ? TERTIARY : PRIMARY;
  }
  if (ROUTE === 'model' && body && typeof body.model === 'string') {
    const m = body.model.toLowerCase();
    if (TERTIARY && (m.includes('gemini') || m.includes('nano') || m.includes('tertiary'))) return TERTIARY;
    if (m.includes('iphone') || m.includes('secondary')) return SECONDARY;
    return PRIMARY;
  }
  // round-robin
  const list = backends();
  const i = roundRobinNext % list.length;
  roundRobinNext += 1;
  return list[i];
}

function proxyRequest(targetBase, path, method, headers, body, res) {
  const url = new URL(path, targetBase + '/');
  const opts = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: { ...headers, host: url.host },
    timeout: REQUEST_TIMEOUT_MS,
  };
  const proxy = http.request(opts, (pres) => {
    res.writeHead(pres.statusCode, pres.headers);
    pres.pipe(res);
  });
  proxy.on('error', (e) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Backend error: ' + e.message } }));
    }
  });
  proxy.on('timeout', () => {
    proxy.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Backend timeout' } }));
    }
  });
  if (body && body.length) proxy.write(body);
  proxy.end();
}

function tryBackend(backendsToTry, path, method, headers, body, res, index) {
  if (index >= backendsToTry.length) {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'All backends failed' } }));
    }
    return;
  }
  const base = backendsToTry[index];
  const url = new URL(path, base + '/');
  const outHeaders = { ...headers, host: url.host };
  if (body && body.length) outHeaders['Content-Length'] = body.length;
  const opts = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: outHeaders,
    timeout: REQUEST_TIMEOUT_MS,
  };
  const proxy = http.request(opts, (pres) => {
    const ok = pres.statusCode >= 200 && pres.statusCode < 300;
    if (ok || index === backendsToTry.length - 1) {
      res.writeHead(pres.statusCode, pres.headers);
      pres.pipe(res);
    } else {
      pres.resume();
      tryBackend(backendsToTry, path, method, headers, body, res, index + 1);
    }
  });
  proxy.on('error', () => {
    tryBackend(backendsToTry, path, method, headers, body, res, index + 1);
  });
  proxy.on('timeout', () => {
    proxy.destroy();
    tryBackend(backendsToTry, path, method, headers, body, res, index + 1);
  });
  if (body && body.length) proxy.write(body);
  proxy.end();
}

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  const pathNorm = path.replace(/\/$/, '') || '/';

  if (req.method === 'GET' && (pathNorm === '' || pathNorm === '/health' || pathNorm === '/health')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (req.method === 'GET' && (pathNorm === '/v1/models' || pathNorm === '/v1/models')) {
    // Forward to primary; gateway only needs one /v1/models
    proxyRequest(PRIMARY, '/v1/models', 'GET', req.headers, null, res);
    return;
  }

  if (req.method === 'POST' && (pathNorm === '/v1/chat/completions' || pathNorm === '/v1/chat/completions')) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      let body = Buffer.concat(chunks);
      let bodyJson = null;
      try {
        bodyJson = JSON.parse(body.toString());
      } catch (_) {}
      const chosen = chooseBackend(bodyJson);
      // When sending to primary (InferrLM), optionally set body.model so InferrLM can use different models per request (if its API supports it)
      if (chosen === PRIMARY && bodyJson && (PRIMARY_CHAT_MODEL || PRIMARY_TASK_MODEL)) {
        const isChat = looksLikeChat(bodyJson);
        const override = isChat ? PRIMARY_CHAT_MODEL : PRIMARY_TASK_MODEL;
        if (override) {
          bodyJson.model = override;
          body = Buffer.from(JSON.stringify(bodyJson), 'utf8');
        }
      }
      const all = backends();
      const order = [chosen].concat(all.filter((b) => b !== chosen));
      tryBackend(order, '/v1/chat/completions', 'POST', req.headers, body, res, 0);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  const backendsLog = TERTIARY ? `primary=${PRIMARY}, secondary=${SECONDARY}, tertiary=${TERTIARY}` : `primary=${PRIMARY}, secondary=${SECONDARY}`;
  console.log(`Pixel LLM router: http://127.0.0.1:${PORT} (${backendsLog}, route=${ROUTE})`);
});
