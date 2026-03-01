#!/usr/bin/env node
/**
 * iPhone Vision Bridge — Turn an iPhone 15 Pro (on a desk near the Pixel server) into a vision/camera node for JARVIS.
 *
 * HOW TO USE:
 * 1. Start: node scripts/iphone-vision-bridge.js (or integrate into JARVIS proot startup)
 * 2. Open http://PIXEL_IP:18792/vision on the desk iPhone's Safari (replace PIXEL_IP with your Pixel's LAN or Tailscale IP)
 * 3. Bookmark to home screen for app-like experience
 * 4. Keep the screen on — the page requests a wake lock when possible
 *
 * The iPhone's camera captures images; they're sent to a vision-capable LLM (Gemini) for analysis.
 * Other JARVIS components can poll GET /vision/latest for the most recent analysis.
 *
 * Env: PORT_VISION (default 18792), GEMINI_API_KEY
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = Number(process.env.PORT_VISION || '18792');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDMeLV0c8Bljme1EGMZ1HGPadbiI_VNDBg';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${GEMINI_API_KEY}`;

let latestAnalysis = null;

function respond(res, statusCode, body, contentType = 'application/json') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function serveHtml(res) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>JARVIS Vision</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .container { padding: 16px; max-width: 480px; margin: 0 auto; }
    h1 { font-size: 1.25rem; margin: 0 0 16px; color: #58a6ff; }
    video {
      width: 100%;
      max-height: 50vh;
      object-fit: cover;
      border-radius: 12px;
      background: #161b22;
    }
    .preview-wrap { position: relative; margin-bottom: 16px; }
    .preview-wrap canvas { display: none; }
    .controls { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    input[type="text"] {
      width: 100%;
      padding: 14px 16px;
      font-size: 16px;
      border: 1px solid #30363d;
      border-radius: 10px;
      background: #161b22;
      color: #e6edf3;
    }
    input::placeholder { color: #8b949e; }
    button {
      padding: 16px 24px;
      font-size: 17px;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-primary {
      background: #238636;
      color: white;
    }
    .btn-primary:active { background: #2ea043; }
    .btn-secondary {
      background: #21262d;
      color: #e6edf3;
      border: 1px solid #30363d;
    }
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
    }
    .toggle-row label { font-size: 15px; }
    .toggle {
      width: 52px;
      height: 32px;
      background: #21262d;
      border-radius: 16px;
      position: relative;
      cursor: pointer;
      border: 1px solid #30363d;
    }
    .toggle::after {
      content: '';
      position: absolute;
      width: 26px;
      height: 26px;
      background: #8b949e;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
    }
    .toggle.on { background: #238636; border-color: #238636; }
    .toggle.on::after { transform: translateX(20px); background: white; }
    .result {
      margin-top: 16px;
      padding: 16px;
      background: #161b22;
      border-radius: 10px;
      border: 1px solid #30363d;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .result.empty { color: #8b949e; font-style: italic; }
    .status { font-size: 13px; color: #8b949e; margin-top: 8px; }
    .error { color: #f85149; }
  </style>
</head>
<body>
  <div class="container">
    <h1>JARVIS Vision</h1>
    <div class="preview-wrap">
      <video id="video" playsinline autoplay muted></video>
      <canvas id="canvas"></canvas>
    </div>
    <div class="controls">
      <input type="text" id="question" placeholder="What do you want to know about this image?" value="Describe what you see in detail.">
      <button class="btn-primary" id="capture">Capture & Analyze</button>
      <div class="toggle-row">
        <label for="auto">Continuous monitoring (every 30s)</label>
        <div class="toggle" id="auto" role="switch" aria-checked="false"></div>
      </div>
    </div>
    <div class="result empty" id="result">No analysis yet. Tap Capture & Analyze.</div>
    <div class="status" id="status"></div>
  </div>
  <script>
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const questionInput = document.getElementById('question');
    const captureBtn = document.getElementById('capture');
    const autoToggle = document.getElementById('auto');
    const resultEl = document.getElementById('result');
    const statusEl = document.getElementById('status');

    let stream = null;
    let wakeLock = null;
    let autoInterval = null;

    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          statusEl.textContent = 'Screen wake lock active';
        } catch (e) {
          statusEl.textContent = 'Wake lock unavailable';
        }
      }
    }

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        video.srcObject = stream;
        statusEl.textContent = 'Camera ready';
      } catch (e) {
        statusEl.textContent = 'Camera error: ' + e.message;
        resultEl.textContent = 'Could not access camera. Allow camera access and reload.';
        resultEl.classList.add('error');
      }
    }

    function captureFrame() {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    }

    async function analyze(base64, question) {
      statusEl.textContent = 'Analyzing...';
      resultEl.textContent = 'Sending to vision model...';
      resultEl.classList.remove('empty', 'error');
      try {
        const res = await fetch('/vision/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, question: question || 'Describe what you see' })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        resultEl.textContent = data.analysis || 'No analysis returned.';
        resultEl.classList.remove('empty');
        statusEl.textContent = 'Done';
      } catch (e) {
        resultEl.textContent = 'Error: ' + e.message;
        resultEl.classList.add('error');
        statusEl.textContent = 'Failed';
      }
    }

    async function captureAndAnalyze() {
      if (!stream || video.readyState < 2) {
        statusEl.textContent = 'Waiting for camera...';
        return;
      }
      const base64 = captureFrame();
      const question = questionInput.value.trim() || 'Describe what you see in detail.';
      await analyze(base64, question);
    }

    autoToggle.addEventListener('click', () => {
      autoToggle.classList.toggle('on');
      const on = autoToggle.classList.contains('on');
      autoToggle.setAttribute('aria-checked', on);
      if (on) {
        captureAndAnalyze();
        autoInterval = setInterval(captureAndAnalyze, 30000);
        statusEl.textContent = 'Auto-capturing every 30s';
      } else {
        clearInterval(autoInterval);
        autoInterval = null;
        statusEl.textContent = 'Manual mode';
      }
    });

    captureBtn.addEventListener('click', captureAndAnalyze);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && wakeLock === null) requestWakeLock();
    });

    initCamera().then(() => requestWakeLock());
  </script>
</body>
</html>`;
  respond(res, 200, html, 'text/html');
}

function analyzeVision(req, res) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch (_) {
      respond(res, 400, { error: 'Invalid JSON' });
      return;
    }
    const image = body.image;
    const question = body.question || 'Describe what you see';
    if (!image || typeof image !== 'string') {
      respond(res, 400, { error: 'Missing or invalid image (base64)' });
      return;
    }

    const payload = {
      model: 'gemini-2.0-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }
      ],
      max_tokens: 1024
    };

    const reqBody = JSON.stringify(payload);
    const apiUrl = new url.URL(GEMINI_URL);
    const opts = {
      hostname: apiUrl.hostname,
      port: 443,
      path: apiUrl.pathname + apiUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody)
      }
    };

    const geminiReq = https.request(opts, (geminiRes) => {
      const chunks = [];
      geminiRes.on('data', (c) => chunks.push(c));
      geminiRes.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf8');
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          respond(res, 502, { error: 'Invalid response from vision API' });
          return;
        }
        const text = parsed.choices?.[0]?.message?.content;
        if (text) {
          latestAnalysis = { analysis: text, at: new Date().toISOString() };
          respond(res, 200, { analysis: text });
        } else if (parsed.error) {
          respond(res, 502, { error: parsed.error.message || 'Vision API error' });
        } else {
          respond(res, 502, { error: 'No analysis in response' });
        }
      });
    });
    geminiReq.on('error', (e) => {
      respond(res, 502, { error: 'Vision API request failed: ' + e.message });
    });
    geminiReq.write(reqBody);
    geminiReq.end();
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/', true);
  const pathname = parsed.pathname;

  if (req.method === 'GET' && pathname === '/vision') {
    serveHtml(res);
    return;
  }

  if (req.method === 'GET' && pathname === '/vision/latest') {
    respond(res, 200, latestAnalysis || { analysis: null, at: null });
    return;
  }

  if (req.method === 'POST' && pathname === '/vision/analyze') {
    analyzeVision(req, res);
    return;
  }

  if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
    respond(res, 200, { ok: true, service: 'iphone-vision-bridge' });
    return;
  }

  respond(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('iPhone Vision Bridge: http://0.0.0.0:' + PORT + '/vision');
  console.log('  GET /vision         — camera UI');
  console.log('  POST /vision/analyze — analyze image');
  console.log('  GET /vision/latest   — poll latest analysis');
});
