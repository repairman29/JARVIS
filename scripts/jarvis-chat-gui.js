#!/usr/bin/env node
/**
 * GUI for chatting with JARVIS on the Pixel from your Mac.
 * Runs a local server (default port 9191); open http://localhost:9191 in your browser.
 * No npm deps.
 *
 * Usage: node scripts/jarvis-chat-gui.js [port]
 *        ./scripts/jarvis-chat-gui
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Chat server (18888) is reachable from Mac; gateway (18789) is often unreachable from Mac (localhost-only on Pixel)
const PIXEL_CHAT_PORT = Number(process.env.JARVIS_PIXEL_PORT || '18888');
const PIXEL_FALLBACK_PORT = PIXEL_CHAT_PORT === 18789 ? 18888 : 18789;
const DEFAULT_IP = '192.168.86.209';
const GUI_PORT = Number(process.argv[2] || process.env.JARVIS_GUI_PORT || '9191');

function getPixelIP() {
  if (process.env.JARVIS_PIXEL_IP) return process.env.JARVIS_PIXEL_IP.trim();
  const root = path.resolve(__dirname, '..');
  const cache = path.join(root, '.pixel-ip');
  if (fs.existsSync(cache)) {
    const ip = fs.readFileSync(cache, 'utf8').trim().replace(/\r\n/g, '');
    if (ip) return ip;
  }
  return DEFAULT_IP;
}

const PIXEL_IP = getPixelIP();
const CHAT_TIMEOUT_MS = Number(process.env.JARVIS_CHAT_TIMEOUT_MS || '90000'); // 90s; chat should be fast (Nano) when router + bridge are on

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JARVIS (Pixel)</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 12px 16px;
      border-bottom: 1px solid #30363d;
      font-size: 14px;
      color: #8b949e;
    }
    .header strong { color: #e6edf3; }
    #messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .msg { max-width: 85%; }
    .msg.user { align-self: flex-end; }
    .msg.assistant { align-self: flex-start; }
    .msg .role {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #8b949e;
      margin-bottom: 4px;
    }
    .msg.user .role { color: #58a6ff; }
    .msg.assistant .role { color: #7ee787; }
    .msg .content {
      padding: 10px 14px;
      border-radius: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 15px;
      line-height: 1.5;
    }
    .msg.user .content { background: #21262d; border: 1px solid #30363d; }
    .msg.assistant .content { background: #161b22; border: 1px solid #30363d; }
    .msg .content.err { color: #f85149; }
    .input-row {
      padding: 12px 16px;
      border-top: 1px solid #30363d;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    #input {
      flex: 1;
      padding: 12px 14px;
      border: 1px solid #30363d;
      border-radius: 8px;
      background: #21262d;
      color: #e6edf3;
      font-size: 15px;
      resize: none;
      min-height: 44px;
      max-height: 120px;
    }
    #input:focus { outline: none; border-color: #58a6ff; }
    #send {
      padding: 12px 20px;
      background: #238636;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }
    #send:hover { background: #2ea043; }
    #send:disabled { opacity: 0.5; cursor: not-allowed; }
    .status { font-size: 12px; color: #8b949e; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    Chat with <strong>JARVIS</strong> on Pixel &nbsp;·&nbsp; <span id="target"></span>
  </div>
  <div id="messages"></div>
  <div class="input-row">
    <textarea id="input" placeholder="Type a message..." rows="1"></textarea>
    <button id="send">Send</button>
  </div>
  <div class="input-row status" id="status"></div>
  <script>
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('input');
    const sendBtn = document.getElementById('send');
    const targetEl = document.getElementById('target');
    const statusEl = document.getElementById('status');

    fetch('/config').then(r => r.json()).then(c => {
      targetEl.textContent = c.pixelIP + ':' + (c.pixelPort || 18888);
    }).catch(() => { targetEl.textContent = 'Pixel'; });

    function addMessage(role, content, isErr) {
      const div = document.createElement('div');
      div.className = 'msg ' + role;
      div.innerHTML = '<div class="role">' + (role === 'user' ? 'You' : 'JARVIS') + '</div><div class="content' + (isErr ? ' err' : '') + '"></div>';
      div.querySelector('.content').textContent = content;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function setStatus(text) {
      statusEl.textContent = text;
    }

    async function send() {
      const text = (inputEl.value || '').trim();
      if (!text) return;
      inputEl.value = '';
      sendBtn.disabled = true;
      addMessage('user', text);
      setStatus('Thinking…');
      try {
        const res = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-openclaw-agent-id': 'main' },
          body: JSON.stringify({ model: 'openclaw:main', messages: [{ role: 'user', content: text }], stream: false, user: 'jarvis-chat-gui' })
        });
        const data = await res.json().catch(() => ({}));
        const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (content != null) {
          addMessage('assistant', content);
          setStatus('');
        } else {
          const err = (data.error && data.error.message) || 'No reply';
          addMessage('assistant', err, true);
          setStatus('');
        }
      } catch (e) {
        addMessage('assistant', e.message || 'Request failed', true);
        setStatus('');
      }
      sendBtn.disabled = false;
    }

    sendBtn.addEventListener('click', send);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
  </script>
</body>
</html>
`;

function proxyToPixel(req, res, body, tryPort) {
  tryPort = tryPort ?? PIXEL_CHAT_PORT;
  const pathname = (req.url || '/').split('?')[0];
  const opts = {
    hostname: PIXEL_IP,
    port: tryPort,
    path: pathname,
    method: 'POST',
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Content-Length': body ? Buffer.byteLength(body) : 0,
      'x-openclaw-agent-id': req.headers['x-openclaw-agent-id'] || 'main',
    },
    timeout: CHAT_TIMEOUT_MS,
  };
  const proxy = http.request(opts, (pxRes) => {
    const code = pxRes.statusCode;
    if (code === 405) {
      res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: { message: 'Pixel returned 405 (method not allowed). Ensure JARVIS stack is running on the Pixel (port 18888).' } }));
      pxRes.resume();
      return;
    }
    const headers = { ...pxRes.headers, 'Access-Control-Allow-Origin': '*' };
    res.writeHead(code, headers);
    pxRes.pipe(res);
  });
  const corsHeader = { 'Access-Control-Allow-Origin': '*' };
  proxy.on('error', (e) => {
    if ((e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') && tryPort === 18789 && PIXEL_FALLBACK_PORT === 18888) {
      proxyToPixel(req, res, body, 18888);
      return;
    }
    res.writeHead(502, { 'Content-Type': 'application/json', ...corsHeader });
    res.end(JSON.stringify({ error: { message: 'Pixel unreachable: ' + e.message } }));
  });
  proxy.on('timeout', () => {
    proxy.destroy();
    if (tryPort === 18789 && PIXEL_FALLBACK_PORT === 18888) {
      proxyToPixel(req, res, body, 18888);
      return;
    }
    res.writeHead(504, { 'Content-Type': 'application/json', ...corsHeader });
    res.end(JSON.stringify({ error: { message: 'Timeout after ' + (CHAT_TIMEOUT_MS / 1000) + 's. Set JARVIS_CHAT_TIMEOUT_MS for a longer wait.' } }));
  });
  if (body && body.length) proxy.write(body);
  proxy.end();
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  if (pathname === '/v1/chat/completions') {
    console.log('[jarvis-chat-gui]', req.method, pathname);
  }

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
    return;
  }
  if (req.method === 'GET' && pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === 'GET' && pathname === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ pixelIP: PIXEL_IP, pixelPort: PIXEL_CHAT_PORT }));
    return;
  }
  if (pathname === '/v1/chat/completions') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-openclaw-agent-id',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: { message: 'Use POST with JSON body to chat' } }));
      return;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      proxyToPixel(req, res, Buffer.concat(chunks));
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(GUI_PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${GUI_PORT}`;
  console.log('JARVIS chat GUI: ' + url);
  console.log('Pixel: ' + PIXEL_IP + ':' + PIXEL_CHAT_PORT);
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  require('child_process').spawn(open, [url], { stdio: 'ignore', detached: true }).unref();
});
