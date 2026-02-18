#!/usr/bin/env node
/**
 * Minimal chat server for JARVIS on the Pixel (Termux).
 * Serves: / (chat), /voice (chat + mic + TTS), POST /v1/chat/completions (gateway proxy),
 *         POST /speak and POST /alert (write body to TTS FIFO for termux-tts-speak).
 * Run in Termux: node scripts/pixel-chat-server.js
 * Then on the Pixel open in Chrome: http://127.0.0.1:18888 (or http://localhost:18888)
 *
 * Env: GATEWAY_PORT (default 18789), CHAT_SERVER_PORT (default 18888), TTS_FIFO (default ~/.tts_pipe).
 */

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const os = require('os');

const GATEWAY_PORT = Number(process.env.GATEWAY_PORT || process.env.PORT || '18789');
const CHAT_PORT = Number(process.env.CHAT_SERVER_PORT || '18888');
const GATEWAY_HOST = process.env.GATEWAY_HOST || '127.0.0.1';

function buildChatHtml(voiceMode) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JARVIS${voiceMode ? ' — Voice' : ''}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 12px; background: #0d1117; color: #e6edf3; min-height: 100vh; }
    h1 { font-size: 1.2rem; margin: 0 0 12px 0; }
    #log { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; min-height: 120px; max-height: 50vh; overflow-y: auto; font-size: 14px; white-space: pre-wrap; word-break: break-word; }
    #log .user { color: #58a6ff; margin-bottom: 6px; }
    #log .assistant { color: #7ee787; margin-bottom: 12px; }
    #log .err { color: #f85149; }
    .row { display: flex; gap: 8px; margin-top: 12px; align-items: center; flex-wrap: wrap; }
    input[type="text"] { flex: 1; min-width: 120px; padding: 10px 12px; border: 1px solid #30363d; border-radius: 6px; background: #21262d; color: #e6edf3; font-size: 16px; }
    button { padding: 10px 16px; background: #238636; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .send-area { padding: 10px 16px; background: #238636; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; touch-action: manipulation; min-width: 64px; text-align: center; }
    .send-area:active { opacity: 0.9; }
    .send-area.disabled { opacity: 0.6; pointer-events: none; }
    #micBtn { width: 48px; height: 48px; border-radius: 50%; background: #30363d; padding: 0; display: flex; align-items: center; justify-content: center; }
    #micBtn.listening { background: #da3633; }
    #micBtn svg { width: 24px; height: 24px; fill: #e6edf3; }
    .speak-row { margin-top: 8px; }
    .speak-row label { font-size: 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; }
    #heyJarvisStatus { font-size: 12px; color: #8b949e; margin-top: 4px; }
    #heyJarvisStatus.listening { color: #7ee787; }
    .debug { font-size: 12px; color: #8b949e; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>JARVIS${voiceMode ? ' — Voice' : ''}</h1>
  <div id="log"></div>
  <form id="f" class="row">
    <input id="msg" type="text" placeholder="Type message then tap Send..." autocomplete="off" enterkeyhint="send">
    <button type="button" id="micBtn" title="Tap to talk" style="display:none"><svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.09-.6-.39-1.14-1-1.14z"/></svg></button>
    <div id="btn" class="send-area" role="button" tabindex="0" aria-label="Send message">Send</div>
  </form>
  <p class="debug" id="debugHint">Tap Send after typing; your message should appear above, then JARVIS replies.</p>
  <div class="speak-row"><label><input type="checkbox" id="speakReplies" ${voiceMode ? 'checked' : ''}> Speak replies</label></div>
  ${voiceMode ? '<div class="speak-row"><label><input type="checkbox" id="heyJarvis"> Listen for "Hey JARVIS"</label></div><div id="heyJarvisStatus"></div>' : ''}
  <script>
    const voiceMode = ${JSON.stringify(!!voiceMode)};
    const logEl = document.getElementById('log');
    const form = document.getElementById('f');
    const msg = document.getElementById('msg');
    const btn = document.getElementById('btn');
    window.onerror = function(m, src, line, col, err) {
      if (logEl) {
        var d = document.createElement('div');
        d.className = 'err';
        d.textContent = 'JS error: ' + (m || '') + (err && err.message ? ' ' + err.message : '');
        logEl.appendChild(d);
        logEl.scrollTop = logEl.scrollHeight;
      }
      return false;
    };
    const micBtn = document.getElementById('micBtn');
    const speakReplies = document.getElementById('speakReplies');
    const heyJarvisCheckbox = document.getElementById('heyJarvis');
    const heyJarvisStatus = document.getElementById('heyJarvisStatus');
    let conversation = [];
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const canVoice = !!SpeechRecognition && !!window.speechSynthesis;
    if (canVoice) micBtn.style.display = 'flex';

    function add(role, text, isErr) {
      const div = document.createElement('div');
      div.className = role + (isErr ? ' err' : '');
      div.textContent = (role === 'user' ? 'You: ' : 'JARVIS: ') + text;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    }
    function addDebug(text) {
      if (!logEl) return;
      const div = document.createElement('div');
      div.className = 'debug';
      div.textContent = text;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    }
    function stripForTTS(s) {
      if (!s) return '';
      return s.replace(/\`\`\`[\s\S]*?\`\`\`/g, ' ').replace(/\`[^\`]+\`/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
    }
    function speak(text) {
      if (!speakReplies.checked || !window.speechSynthesis) return;
      const plain = stripForTTS(text);
      if (!plain) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(plain);
      window.speechSynthesis.speak(u);
    }
    const WAKE_PHRASES = ['hey jarvis', 'jarvis'];
    function extractCommand(transcript) {
      const t = transcript.toLowerCase().trim();
      for (const w of WAKE_PHRASES) {
        const i = t.indexOf(w);
        if (i !== -1) {
          const after = t.slice(i + w.length).trim();
          if (after) return after;
          return null;
        }
      }
      return undefined;
    }
    var sending = false;
    async function sendAndShow(text, onDone) {
      if (!text || !text.trim()) { if (onDone) onDone(); return; }
      if (msg) msg.value = '';
      sending = true;
      if (btn.classList) btn.classList.add('disabled'); else btn.disabled = true;
      if (micBtn && micBtn.style.display !== 'none') micBtn.disabled = true;
      add('user', text);
      conversation.push({ role: 'user', content: text });
      try {
        const messages = conversation.slice(-10).map(m => ({ role: m.role, content: m.content }));
        const res = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-openclaw-agent-id': 'main' },
          body: JSON.stringify({ model: 'openclaw:main', messages, stream: false, user: 'pixel-chat' })
        });
        const data = await res.json().catch(() => ({}));
        const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (content) {
          add('assistant', content);
          conversation.push({ role: 'assistant', content });
          speak(content);
        } else {
          const errMsg = (data.error && data.error.message) || 'No reply.';
          add('assistant', errMsg, true);
        }
      } catch (err) {
        add('assistant', err.message || 'Request failed.', true);
      }
      sending = false;
      if (btn.classList) btn.classList.remove('disabled'); else btn.disabled = false;
      if (micBtn && micBtn.style.display !== 'none') micBtn.disabled = false;
      if (onDone) onDone();
    }
    function doSubmit() {
      if (sending) return;
      var text = (msg && msg.value != null) ? String(msg.value).trim() : '';
      if (!text) return;
      msg.value = '';
      sendAndShow(text);
    }
    function onSendTap(e) {
      addDebug('Send tapped');
      e.preventDefault();
      e.stopPropagation();
      if (sending) return false;
      var textNow = (msg && msg.value != null) ? String(msg.value).trim() : '';
      if (textNow) {
        msg.value = '';
        sendAndShow(textNow);
        return false;
      }
      var self = this;
      setTimeout(function() {
        if (sending) return;
        var text = (msg && msg.value != null) ? String(msg.value).trim() : '';
        if (text) {
          msg.value = '';
          sendAndShow(text);
        }
      }, 0);
      return false;
    }
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      doSubmit();
      return false;
    });
    function isSendButton(el) {
      if (!el) return false;
      var node = el.nodeType === 3 ? el.parentElement : el;
      return node && (node.id === 'btn' || (node.closest && node.closest('#btn')));
    }
    function isFormButNotInput(el) {
      if (!el) return false;
      var node = el.nodeType === 3 ? el.parentElement : el;
      if (!node || !form || !form.contains(node)) return false;
      if (node === msg || msg.contains(node)) return false;
      if (micBtn && (node === micBtn || micBtn.contains(node))) return false;
      return true;
    }
    function delegatedSend(e) {
      if (!isSendButton(e.target) && !isFormButNotInput(e.target)) return;
      addDebug('Send tapped');
      e.preventDefault();
      e.stopPropagation();
      if (sending) return;
      var textNow = (msg && msg.value != null) ? String(msg.value).trim() : '';
      if (textNow) {
        msg.value = '';
        sendAndShow(textNow);
        return;
      }
      setTimeout(function() {
        if (sending) return;
        var text = (msg && msg.value != null) ? String(msg.value).trim() : '';
        if (text) {
          msg.value = '';
          sendAndShow(text);
        }
      }, 0);
    }
    document.addEventListener('click', delegatedSend, true);
    document.addEventListener('touchend', function(e) {
      if (!isSendButton(e.target) && !isFormButNotInput(e.target)) return;
      addDebug('Send tapped');
      e.preventDefault();
      e.stopPropagation();
      if (sending) return;
      var textNow = (msg && msg.value != null) ? String(msg.value).trim() : '';
      if (textNow) {
        msg.value = '';
        sendAndShow(textNow);
      } else {
        setTimeout(function() {
          if (sending) return;
          var text = (msg && msg.value != null) ? String(msg.value).trim() : '';
          if (text) { msg.value = ''; sendAndShow(text); }
        }, 0);
      }
    }, { passive: false, capture: true });
    if (btn) {
      btn.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSubmit(); } });
    }
    if (msg) {
      msg.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSubmit();
          return false;
        }
      });
    }

    addDebug('Chat ready (delegated). Type a message and tap the green Send.');

    if (canVoice) {
      let recognition = null;
      let heyJarvisRecognition = null;
      let heyJarvisAwaitingCommand = false;
      function setHeyJarvisStatus(txt, listening) {
        if (heyJarvisStatus) { heyJarvisStatus.textContent = txt; heyJarvisStatus.classList.toggle('listening', !!listening); }
      }
      function startHeyJarvisListening() {
        if (!heyJarvisCheckbox || !heyJarvisCheckbox.checked || heyJarvisRecognition) return;
        heyJarvisRecognition = new SpeechRecognition();
        heyJarvisRecognition.continuous = true;
        heyJarvisRecognition.interimResults = true;
        heyJarvisRecognition.lang = navigator.language || 'en-US';
        heyJarvisRecognition.onresult = (e) => {
          const r = e.results[e.results.length - 1];
          if (!r.isFinal || !r[0]) return;
          const t = r[0].transcript.trim();
          if (!t) return;
          if (heyJarvisAwaitingCommand) {
            heyJarvisAwaitingCommand = false;
            sendAndShow(t, () => { if (heyJarvisCheckbox && heyJarvisCheckbox.checked) startHeyJarvisListening(); });
            return;
          }
          const cmd = extractCommand(t);
          if (cmd !== undefined) {
            if (cmd) sendAndShow(cmd, () => { if (heyJarvisCheckbox && heyJarvisCheckbox.checked) startHeyJarvisListening(); });
            else heyJarvisAwaitingCommand = true;
          }
        };
        heyJarvisRecognition.onend = () => {
          heyJarvisRecognition = null;
          setHeyJarvisStatus('', false);
          if (heyJarvisCheckbox && heyJarvisCheckbox.checked) setTimeout(startHeyJarvisListening, 500);
        };
        heyJarvisRecognition.onerror = () => {
          heyJarvisRecognition = null;
          setHeyJarvisStatus('', false);
          if (heyJarvisCheckbox && heyJarvisCheckbox.checked) setTimeout(startHeyJarvisListening, 1000);
        };
        setHeyJarvisStatus('Listening for "Hey JARVIS"...', true);
        try { heyJarvisRecognition.start(); } catch (_) { setHeyJarvisStatus('', false); }
      }
      function stopHeyJarvisListening() {
        if (heyJarvisRecognition) { heyJarvisRecognition.abort(); heyJarvisRecognition = null; }
        heyJarvisAwaitingCommand = false;
        setHeyJarvisStatus('', false);
      }
      if (heyJarvisCheckbox) {
        heyJarvisCheckbox.addEventListener('change', () => {
          if (heyJarvisCheckbox.checked) startHeyJarvisListening();
          else stopHeyJarvisListening();
        });
      }
      micBtn.addEventListener('click', () => {
        if (recognition && recognition.abort) { recognition.abort(); recognition = null; micBtn.classList.remove('listening'); return; }
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';
        recognition.onresult = (e) => {
          const r = e.results[e.results.length - 1];
          if (r.isFinal && r[0]) {
            const t = r[0].transcript.trim();
            if (t) sendAndShow(t);
          }
        };
        recognition.onend = () => { recognition = null; micBtn.classList.remove('listening'); };
        recognition.onerror = () => { recognition = null; micBtn.classList.remove('listening'); };
        try {
          recognition.start();
          micBtn.classList.add('listening');
        } catch (_) { micBtn.classList.remove('listening'); }
      });
    }
  </script>
</body>
</html>
`;
}
const CHAT_HTML = buildChatHtml(false);
const VOICE_HTML = buildChatHtml(true);

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store, no-cache, must-revalidate' });
    res.end(CHAT_HTML);
    return;
  }
  if (req.method === 'GET' && pathname === '/voice') {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store, no-cache, must-revalidate' });
    res.end(VOICE_HTML);
    return;
  }

  if (req.method === 'POST' && pathname === '/v1/chat/completions') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const proxy = http.request({
        hostname: GATEWAY_HOST,
        port: GATEWAY_PORT,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length,
          'x-openclaw-agent-id': req.headers['x-openclaw-agent-id'] || 'main',
        },
      }, (pres) => {
        res.writeHead(pres.statusCode, { 'Content-Type': pres.headers['content-type'] || 'application/json' });
        pres.pipe(res);
      });
      proxy.on('error', (e) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Gateway unreachable: ' + e.message } }));
      });
      proxy.end(body);
    });
    return;
  }

  // POST /speak or /alert: send text to TTS FIFO (Echeo, webhooks, etc.). Body: plain text or JSON { "text": "..." }.
  if (req.method === 'POST' && (pathname === '/speak' || pathname === '/alert')) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      let text = '';
      const ct = (req.headers['content-type'] || '').toLowerCase();
      if (ct.includes('application/json')) {
        try {
          const j = JSON.parse(body);
          text = (j.text || j.message || j.alert || '').toString();
        } catch (_) {
          text = body.trim();
        }
      } else {
        text = body.trim();
      }
      text = text.replace(/\s+/g, ' ').trim().slice(0, 3000);
      if (!text) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'No text in body' }));
        return;
      }
      const ttsFifo = process.env.TTS_FIFO || path.join(process.env.HOME || os.homedir() || '', '.tts_pipe');
      if (!fs.existsSync(ttsFifo)) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'TTS FIFO not found. Start TTS reader: see PIXEL_VOICE_RUNBOOK §4.', fifo: ttsFifo }));
        return;
      }
      try {
        const fd = fs.openSync(ttsFifo, 'w');
        fs.writeSync(fd, text + '\n');
        fs.closeSync(fd);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, spoke: text.slice(0, 80) + (text.length > 80 ? '...' : '') }));
      } catch (e) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'TTS write failed: ' + e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(CHAT_PORT, '0.0.0.0', () => {
  console.log('JARVIS chat server: http://127.0.0.1:' + CHAT_PORT);
  console.log('  Chat: ' + CHAT_PORT + '  Voice (mic + TTS): /voice  Speak (POST): /speak');
});
