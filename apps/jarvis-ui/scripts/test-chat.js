#!/usr/bin/env node
/**
 * Simulates the UI: POST /api/chat (non-stream) and extract content the same way Chat.tsx does.
 * Run with dev server up: npm run dev (in another terminal). Usage: node scripts/test-chat.js [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3001';

function extractContent(data) {
  if (data == null || typeof data !== 'object') return '';
  if (typeof data.content === 'string') return data.content;
  const o = data;
  const choice = Array.isArray(o.choices) ? o.choices[0] : undefined;
  if (choice != null && typeof choice === 'object') {
    const msg = choice.message;
    if (typeof msg === 'string') return msg;
    if (msg != null && typeof msg === 'object' && typeof msg.content === 'string') return msg.content;
  }
  if (typeof o.output === 'string') return o.output;
  if (typeof o.response === 'string') return o.response;
  return '';
}

async function main() {
  const url = `${base.replace(/\/$/, '')}/api/chat`;
  const body = {
    messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    sessionId: 'test-chat-script',
    stream: false,
  };
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
  } catch (e) {
    console.error('Fetch failed:', e.message);
    process.exit(1);
  }
  const text = await res.text();
  if (!res.ok) {
    console.error('HTTP', res.status, text.slice(0, 300));
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Response was not JSON:', text.slice(0, 200));
    process.exit(1);
  }
  const content = extractContent(data);
  if (!content) {
    console.error('No extractable content. Response keys:', Object.keys(data).join(', '));
    console.error('Preview:', JSON.stringify(data).slice(0, 500));
    process.exit(1);
  }
  console.log('OK — content length:', content.length);
  console.log('Content:', content.slice(0, 200) + (content.length > 200 ? '…' : ''));
}

main();
