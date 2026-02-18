#!/usr/bin/env node
/**
 * Test triad/swarm: send a short triad instruction to JARVIS and print the reply.
 * Usage: node scripts/test-triad.js [baseUrl]
 * Example: node scripts/test-triad.js https://jarvis-xxx.vercel.app
 * Requires: JARVIS UI (and Edge/gateway) reachable at baseUrl.
 */
const base = process.argv[2] || 'http://localhost:3001';

const TRIAD_MESSAGE = `Run a short triad on BEAST-MODE: in one pass give (1) a one-paragraph PRD outline, (2) three issue titles, and (3) a 2-milestone roadmap. Use the format: Plan → Assigned roles → Outputs → Next action. Keep each part brief (2–3 sentences max per role).`;

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
  console.log('Testing triad — sending to', url);
  console.log('Message:', TRIAD_MESSAGE.slice(0, 80) + '…\n');

  const body = {
    messages: [{ role: 'user', content: TRIAD_MESSAGE }],
    sessionId: 'test-triad-' + Date.now(),
    stream: false,
  };

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
  } catch (e) {
    console.error('Fetch failed:', e.message);
    console.error('Tip: Start the UI (npm run dev) or pass the deployed URL.');
    process.exit(1);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error('HTTP', res.status, text.slice(0, 400));
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
    console.error('No content in response. Keys:', Object.keys(data).join(', '));
    process.exit(1);
  }

  console.log('--- JARVIS reply ---');
  console.log(content);
  console.log('--- end ---');
  console.log('\nTriad test OK — reply length:', content.length);
}

main();
