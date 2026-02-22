#!/usr/bin/env node
/**
 * Neural Farm Load Balancer v4
 * 4-node cluster: Mac (M4 MLX Qwen3-8B) + Pixel (CPU) + 2x iPhone (InferrLM)
 *
 * Architecture:
 *  - Mac "smart" tier: Qwen 3 8B via MLX — handles complex/reasoning queries
 *  - Phones "primary"/"secondary" tier: fast 3-4B models for simple queries
 *  - SSE streaming with protocol translation & <think> tag stripping
 *  - Health checks with auto-failover & monitoring
 */

const http = require('http');

const PORT = parseInt(process.env.FARM_PORT || '8899');
const HEALTH_INTERVAL = 20000;
const REQUEST_TIMEOUT = 120000;

const NODES = [
  {
    name: 'mac',
    host: '127.0.0.1',
    port: 8890,
    api: 'openai',
    models: [],
    tier: 'smart',
    parallel: 2,
    healthy: false,
    busy: 0,
    lastCheck: 0,
    totalRequests: 0,
    totalErrors: 0,
    avgLatencyMs: 0,
    upSince: null,
  },
  {
    name: 'pixel',
    host: '100.75.3.115',
    port: 8889,
    api: 'openai',
    models: [],
    tier: 'primary',
    parallel: 2,
    healthy: false,
    busy: 0,
    lastCheck: 0,
    totalRequests: 0,
    totalErrors: 0,
    avgLatencyMs: 0,
    upSince: null,
  },
  {
    name: 'iphone15',
    host: '100.102.220.122',
    port: 8889,
    api: 'inferrlm',
    models: [],
    tier: 'primary',
    parallel: 1,
    healthy: false,
    busy: 0,
    lastCheck: 0,
    totalRequests: 0,
    totalErrors: 0,
    avgLatencyMs: 0,
    upSince: null,
  },
  {
    name: 'iphone16',
    host: '100.91.240.55',
    port: 8889,
    api: 'inferrlm',
    models: [],
    tier: 'primary',
    parallel: 1,
    healthy: false,
    busy: 0,
    lastCheck: 0,
    totalRequests: 0,
    totalErrors: 0,
    avgLatencyMs: 0,
    upSince: null,
  },
];

const startTime = Date.now();

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Raw HTTP helpers ──

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(options.timeout || 8000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function httpStream(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      resolve(res);
    });
    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT, () => { req.destroy(); reject(new Error('stream timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// ── Health checks ──

async function healthCheck(node) {
  const wasPrevHealthy = node.healthy;
  try {
    if (node.api === 'openai') {
      const res = await httpRequest({
        hostname: node.host, port: node.port, path: '/health',
        method: 'GET', timeout: 5000,
      });
      node.healthy = res.status === 200 && res.body.includes('ok');
      if (node.healthy) {
        try {
          const mr = await httpRequest({
            hostname: node.host, port: node.port, path: '/v1/models',
            method: 'GET', timeout: 5000,
          });
          if (mr.status === 200) {
            const md = JSON.parse(mr.body);
            if (md.data?.length) {
              node.models = md.data.map(m => m.id.replace('.gguf', '').replace(/-Q\d.*$/, ''));
            }
          }
        } catch {}
      }
    } else {
      const res = await httpRequest({
        hostname: node.host, port: node.port, path: '/api/tags',
        method: 'GET', timeout: 5000,
      });
      node.healthy = res.status === 200 && res.body.includes('models');
      if (node.healthy) {
        try {
          const data = JSON.parse(res.body);
          if (data.models?.length) {
            node.models = data.models.map(m => m.name);
          }
        } catch {}
      }
    }
  } catch {
    node.healthy = false;
  }
  if (node.healthy && !wasPrevHealthy) {
    node.upSince = Date.now();
    log(`${node.name} came UP (models: ${node.models.join(', ')})`);
  }
  if (!node.healthy && wasPrevHealthy) {
    node.upSince = null;
    log(`${node.name} went DOWN`);
  }
  node.lastCheck = Date.now();
}

// ── Node selection ──

function estimateComplexity(messages) {
  const totalLen = messages.reduce((s, m) => s + (typeof m.content === 'string' ? m.content.length : 100), 0);
  const lastMsg = messages[messages.length - 1];
  const lastContent = typeof lastMsg?.content === 'string' ? lastMsg.content.toLowerCase() : '';
  const wordCount = lastContent.split(/\s+/).length;

  const deepSignals = ['analyze', 'compare', 'design', 'implement', 'debug', 'review',
    'step by step', 'pros and cons', 'tradeoff', 'trade-off', 'in detail', 'comprehensive'];
  const mediumSignals = ['explain', 'write', 'create', 'solve', 'summarize', 'translate', 'code', 'why'];

  const isDeep = deepSignals.some(s => lastContent.includes(s));
  const isMedium = mediumSignals.some(s => lastContent.includes(s));

  if ((isDeep && wordCount > 8) || totalLen > 1200 || messages.length > 8) return 'complex';
  if (isMedium || totalLen > 400 || messages.length > 4) return 'medium';
  return 'simple';
}

function pickNode(requestedModel, messages) {
  let candidates = NODES.filter(n => n.healthy);

  if (requestedModel && requestedModel !== 'auto') {
    const q = requestedModel.toLowerCase().replace('.gguf', '').replace(/-q\d.*$/i, '');
    const modelMatch = candidates.filter(n =>
      n.models.some(m => {
        const mn = m.toLowerCase().replace('.gguf', '').replace(/-q\d.*$/i, '');
        return mn.includes(q) || q.includes(mn);
      })
    );
    if (modelMatch.length > 0) candidates = modelMatch;
  }

  const available = candidates.filter(n => n.busy < n.parallel);
  if (available.length === 0) {
    return candidates.sort((a, b) => (a.busy / a.parallel) - (b.busy / b.parallel))[0] || null;
  }

  const complexity = messages ? estimateComplexity(messages) : 'simple';

  if (complexity === 'complex' || complexity === 'medium') {
    const smart = available.filter(n => n.tier === 'smart');
    if (smart.length > 0) return smart[0];
  }

  if (complexity === 'simple') {
    const fast = available.filter(n => n.tier === 'primary');
    if (fast.length > 0) {
      fast.sort((a, b) => (a.busy / a.parallel) - (b.busy / b.parallel));
      return fast[0];
    }
  }

  const tierOrder = { primary: 0, smart: 1, secondary: 2 };
  available.sort((a, b) => {
    const aLoad = a.busy / a.parallel;
    const bLoad = b.busy / b.parallel;
    if (Math.abs(aLoad - bLoad) > 0.3) return aLoad - bLoad;
    const ta = tierOrder[a.tier] ?? 9;
    const tb = tierOrder[b.tier] ?? 9;
    if (ta !== tb) return ta - tb;
    return a.totalRequests - b.totalRequests;
  });
  return available[0];
}

// ── Request queue (holds requests when all slots are busy) ──

const QUEUE_MAX = 10;
const QUEUE_TIMEOUT = 60000;
const requestQueue = [];

function waitForSlot(requestedModel, messages) {
  return new Promise((resolve, reject) => {
    const entry = { requestedModel, messages, resolve, reject, ts: Date.now() };
    if (requestQueue.length >= QUEUE_MAX) {
      return reject(new Error(`Queue full (${QUEUE_MAX} waiting)`));
    }
    requestQueue.push(entry);
    log(`Queued request (${requestQueue.length} waiting)`);
  });
}

function drainQueue() {
  while (requestQueue.length > 0) {
    const entry = requestQueue[0];
    if (Date.now() - entry.ts > QUEUE_TIMEOUT) {
      requestQueue.shift();
      entry.reject(new Error('Queue timeout'));
      continue;
    }
    const node = pickNode(entry.requestedModel, entry.messages);
    if (node && node.busy < node.parallel) {
      requestQueue.shift();
      entry.resolve(node);
    } else {
      break;
    }
  }
}

// ── Think-tag stripping (Qwen 3 emits <think>...</think> reasoning) ──

function stripThinkTags(text) {
  text = text.replace(/<think>[\s\S]*?<\/think>\s*/g, '');
  text = text.replace(/<think>[\s\S]*$/g, '');
  return text.trim();
}

// ── Non-streaming calls ──

async function callOpenAI(node, messages, maxTokens) {
  const body = JSON.stringify({
    model: node.models[0] || 'default',
    messages,
    max_tokens: maxTokens || 2048,
    stream: false,
  });
  const res = await httpRequest({
    hostname: node.host, port: node.port, path: '/v1/chat/completions',
    method: 'POST', timeout: REQUEST_TIMEOUT,
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, body);
  if (res.status !== 200) throw new Error(`${node.name} returned ${res.status}: ${res.body.slice(0, 200)}`);
  const result = JSON.parse(res.body);
  if (result.choices?.[0]?.message?.content) {
    result.choices[0].message.content = stripThinkTags(result.choices[0].message.content);
  }
  return result;
}

async function callInferrLM(node, messages, maxTokens) {
  const body = JSON.stringify({
    model: node.models[0] || '',
    messages,
    stream: false,
  });
  const res = await httpRequest({
    hostname: node.host, port: node.port, path: '/api/chat',
    method: 'POST', timeout: REQUEST_TIMEOUT,
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, body);
  if (res.status !== 200) throw new Error(`${node.name} returned ${res.status}: ${res.body.slice(0, 200)}`);
  const data = JSON.parse(res.body);
  const rawContent = data.response || data.message?.content || '';
  return {
    id: `chatcmpl-farm-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: `farm/${node.models[0] || node.name}`,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: stripThinkTags(rawContent) },
      finish_reason: data.done !== false ? 'stop' : 'length',
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    _farm: { node: node.name },
  };
}

// ── Streaming calls ──

function streamOpenAI(node, messages, maxTokens, clientRes, cors) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: node.models[0] || 'default',
      messages,
      max_tokens: maxTokens || 2048,
      stream: true,
    });
    const upstream = http.request({
      hostname: node.host, port: node.port, path: '/v1/chat/completions',
      method: 'POST', timeout: REQUEST_TIMEOUT,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (upRes) => {
      if (upRes.statusCode !== 200) {
        let errData = '';
        upRes.on('data', c => errData += c);
        upRes.on('end', () => reject(new Error(`${node.name} stream ${upRes.statusCode}: ${errData.slice(0, 200)}`)));
        return;
      }
      clientRes.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...cors,
      });

      let inThink = false;
      let tagBuf = '';
      let sseBuf = '';
      upRes.on('data', (chunk) => {
        sseBuf += chunk.toString();
        const lines = sseBuf.split('\n');
        sseBuf = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: [DONE]')) {
            clientRes.write('data: [DONE]\n\n');
            continue;
          }
          if (!line.startsWith('data: ')) { continue; }
          try {
            const obj = JSON.parse(line.slice(6));
            const content = obj.choices?.[0]?.delta?.content;
            if (content === undefined && !obj.choices?.[0]?.finish_reason) {
              clientRes.write(line + '\n\n');
              continue;
            }
            if (obj.choices?.[0]?.finish_reason && !content) {
              clientRes.write(`data: ${JSON.stringify(obj)}\n\n`);
              continue;
            }
            tagBuf += (content || '');
            let output = '';
            while (tagBuf.length > 0) {
              if (inThink) {
                const closeIdx = tagBuf.indexOf('</think>');
                if (closeIdx !== -1) {
                  tagBuf = tagBuf.slice(closeIdx + 8);
                  inThink = false;
                } else {
                  if (tagBuf.length > 100) tagBuf = tagBuf.slice(-20);
                  break;
                }
              } else {
                const openIdx = tagBuf.indexOf('<think>');
                if (openIdx !== -1) {
                  output += tagBuf.slice(0, openIdx);
                  tagBuf = tagBuf.slice(openIdx + 7);
                  inThink = true;
                } else if (tagBuf.length > 7 && !tagBuf.slice(-7).includes('<')) {
                  output += tagBuf;
                  tagBuf = '';
                } else if (tagBuf.includes('<') && tagBuf.length <= 7) {
                  break;
                } else {
                  const lastLt = tagBuf.lastIndexOf('<');
                  if (lastLt > 0) {
                    output += tagBuf.slice(0, lastLt);
                    tagBuf = tagBuf.slice(lastLt);
                  }
                  break;
                }
              }
            }
            output = output.replace(/^\s+/, '') || '';
            if (output) {
              obj.choices[0].delta.content = output;
              clientRes.write(`data: ${JSON.stringify(obj)}\n\n`);
            }
          } catch {
            clientRes.write(line + '\n\n');
          }
        }
      });
      upRes.on('end', () => {
        clientRes.end();
        resolve();
      });
      upRes.on('error', reject);
    });
    upstream.on('error', reject);
    upstream.write(body);
    upstream.end();
  });
}

function streamInferrLM(node, messages, maxTokens, clientRes, cors) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: node.models[0] || '',
      messages,
      stream: true,
    });
    const upstream = http.request({
      hostname: node.host, port: node.port, path: '/api/chat',
      method: 'POST', timeout: REQUEST_TIMEOUT,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (upRes) => {
      if (upRes.statusCode !== 200) {
        let errData = '';
        upRes.on('data', c => errData += c);
        upRes.on('end', () => reject(new Error(`${node.name} stream ${upRes.statusCode}: ${errData.slice(0, 200)}`)));
        return;
      }
      clientRes.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...cors,
      });

      let buffer = '';
      let thinkBuf = '';
      let inThink = false;
      const chunkId = `chatcmpl-farm-${Date.now()}`;
      upRes.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            let token = obj.response || obj.message?.content || '';
            if (!token && !obj.done) continue;

            thinkBuf += token;
            if (!inThink && thinkBuf.includes('<think>')) {
              const before = thinkBuf.split('<think>')[0];
              if (before) {
                const sseData = {
                  id: chunkId, object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: `farm/${node.models[0] || node.name}`,
                  choices: [{ index: 0, delta: { content: before }, finish_reason: null }],
                };
                clientRes.write(`data: ${JSON.stringify(sseData)}\n\n`);
              }
              inThink = true;
              thinkBuf = thinkBuf.split('<think>').slice(1).join('<think>');
            }
            if (inThink && thinkBuf.includes('</think>')) {
              inThink = false;
              const after = thinkBuf.split('</think>').slice(1).join('</think>').replace(/^\s+/, '');
              thinkBuf = '';
              if (after) {
                const sseData = {
                  id: chunkId, object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: `farm/${node.models[0] || node.name}`,
                  choices: [{ index: 0, delta: { content: after }, finish_reason: null }],
                };
                clientRes.write(`data: ${JSON.stringify(sseData)}\n\n`);
              }
              continue;
            }
            if (inThink) { continue; }

            if (thinkBuf.length > 0 && !thinkBuf.startsWith('<')) {
              const sseData = {
                id: chunkId, object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: `farm/${node.models[0] || node.name}`,
                choices: [{ index: 0, delta: { content: thinkBuf }, finish_reason: obj.done ? 'stop' : null }],
              };
              clientRes.write(`data: ${JSON.stringify(sseData)}\n\n`);
              thinkBuf = '';
            } else if (!inThink && thinkBuf.length > 6 && !thinkBuf.startsWith('<think')) {
              const sseData = {
                id: chunkId, object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: `farm/${node.models[0] || node.name}`,
                choices: [{ index: 0, delta: { content: thinkBuf }, finish_reason: obj.done ? 'stop' : null }],
              };
              clientRes.write(`data: ${JSON.stringify(sseData)}\n\n`);
              thinkBuf = '';
            }
          } catch {}
        }
      });
      upRes.on('end', () => {
        clientRes.write('data: [DONE]\n\n');
        clientRes.end();
        resolve();
      });
      upRes.on('error', reject);
    });
    upstream.on('error', reject);
    upstream.write(body);
    upstream.end();
  });
}

// ── Main request handler ──

async function handleChat(reqBody, clientRes, cors) {
  const stream = reqBody.stream === true;
  const messages = reqBody.messages || [];
  let node = pickNode(reqBody.model, messages);

  if (!node) {
    const healthy = NODES.filter(n => n.healthy);
    if (healthy.length === 0) throw new Error('No healthy farm nodes available');
    node = await waitForSlot(reqBody.model, messages);
  }

  const baseMaxTokens = reqBody.max_tokens || 1024;

  let effectiveMessages = messages;
  const maxTokens = baseMaxTokens;
  const start = Date.now();
  node.busy++;
  node.totalRequests++;

  try {
    if (stream) {
      if (node.api === 'openai') {
        await streamOpenAI(node, effectiveMessages, maxTokens, clientRes, cors);
      } else {
        await streamInferrLM(node, effectiveMessages, maxTokens, clientRes, cors);
      }
      const elapsed = Date.now() - start;
      node.avgLatencyMs = node.avgLatencyMs ? (node.avgLatencyMs * 0.8 + elapsed * 0.2) : elapsed;
      return null; // already sent
    }

    let result;
    if (node.api === 'openai') {
      result = await callOpenAI(node, effectiveMessages, maxTokens);
    } else {
      result = await callInferrLM(node, effectiveMessages, maxTokens);
    }
    const elapsed = Date.now() - start;
    node.avgLatencyMs = node.avgLatencyMs ? (node.avgLatencyMs * 0.8 + elapsed * 0.2) : elapsed;
    result._farm = { node: node.name, latencyMs: elapsed };
    return result;
  } catch (err) {
    node.totalErrors++;
    const fallback = NODES.find(n => n.healthy && n.name !== node.name && n.busy < n.parallel);
    if (fallback) {
      log(`${node.name} failed (${err.message}), falling back to ${fallback.name}`);
      fallback.busy++;
      fallback.totalRequests++;
      try {
        if (stream) {
          if (fallback.api === 'openai') {
            await streamOpenAI(fallback, effectiveMessages, maxTokens, clientRes, cors);
          } else {
            await streamInferrLM(fallback, effectiveMessages, maxTokens, clientRes, cors);
          }
          return null;
        }
        let result;
        if (fallback.api === 'openai') {
          result = await callOpenAI(fallback, effectiveMessages, maxTokens);
        } else {
          result = await callInferrLM(fallback, effectiveMessages, maxTokens);
        }
        result._farm = { node: fallback.name, fallback: true };
        return result;
      } finally {
        fallback.busy = Math.max(0, fallback.busy - 1);
        drainQueue();
      }
    }
    throw err;
  } finally {
    node.busy = Math.max(0, node.busy - 1);
    drainQueue();
  }
}

// ── HTTP Server ──

const server = http.createServer(async (req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning, x-stream',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/health?format=full') {
    const nodes = NODES.map(n => ({
      name: n.name,
      tier: n.tier,
      healthy: n.healthy,
      busy: n.busy,
      parallel: n.parallel,
      models: n.models,
      requests: n.totalRequests,
      errors: n.totalErrors,
      avgMs: Math.round(n.avgLatencyMs),
      uptimeMs: n.upSince ? Date.now() - n.upSince : 0,
    }));
    const healthy = nodes.filter(n => n.healthy).length;
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify({
      status: healthy > 0 ? 'ok' : 'degraded',
      healthy,
      total: nodes.length,
      queued: requestQueue.length,
      uptimeMs: Date.now() - startTime,
      nodes,
    }));
    return;
  }

  if (req.url === '/v1/models' && req.method === 'GET') {
    const models = [];
    for (const n of NODES.filter(n => n.healthy)) {
      for (const m of n.models) {
        models.push({ id: m, object: 'model', owned_by: `farm-${n.name}` });
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify({ object: 'list', data: models }));
    return;
  }

  if (req.url === '/v1/chat/completions' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    let parsed;
    try { parsed = JSON.parse(body); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
      res.end(JSON.stringify({ error: { message: 'Invalid JSON' } }));
      return;
    }

    try {
      const result = await handleChat(parsed, res, cors);
      if (result !== null) {
        res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
        res.end(JSON.stringify(result));
      }
    } catch (err) {
      log(`Error: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json', ...cors });
        res.end(JSON.stringify({ error: { message: err.message, type: 'farm_error' } }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json', ...cors });
  res.end(JSON.stringify({ error: 'Use /v1/chat/completions, /v1/models, or /health' }));
});

// ── Startup ──

setInterval(async () => {
  await Promise.all(NODES.map(n => healthCheck(n)));
  const summary = NODES.map(n => `${n.name}:${n.healthy ? 'OK' : 'DOWN'}[${n.models.length}m]`).join(' ');
  log(`health: ${summary}`);
}, HEALTH_INTERVAL);

Promise.all(NODES.map(n => healthCheck(n))).then(() => {
  const summary = NODES.map(n => `${n.name}:${n.healthy ? 'OK' : 'DOWN'} (${n.models.join(',')})`).join(' | ');
  server.listen(PORT, () => {
    log(`Farm balancer v2 listening on http://0.0.0.0:${PORT}`);
    log(`Nodes: ${summary}`);
    log(`Features: streaming, multi-model, failover, monitoring`);
  });
});
