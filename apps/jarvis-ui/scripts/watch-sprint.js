#!/usr/bin/env node
/**
 * Watch JARVIS coordinate bots to execute a sprint — streams the reply so you see it live.
 * Usage: node scripts/watch-sprint.js [baseUrl] [product]
 * Example: node scripts/watch-sprint.js http://localhost:3001 BEAST-MODE
 * Requires: JARVIS UI (and Edge/gateway) reachable. Product defaults to BEAST-MODE.
 */
const base = process.argv[2] || 'http://localhost:3001';
const product = process.argv[3] || 'BEAST-MODE';

const SPRINT_MESSAGE = `Coordinate a short sprint on ${product}. Do it step by step so I can watch:

1) **Plan** — Define 3 concrete issues/tasks for this sprint (use ${product}'s real purpose: see known products, no invented domain).
2) **Orchestrate** — Say which bots you would invoke (e.g. BEAST MODE for quality, Code Roach for health, workflow_dispatch) and in what order. If you have exec or tools, run what you can (e.g. beast-mode quality score) and report the result.
3) **Report** — Summarize: sprint plan, what each bot did or would do, and the next action.

Reply in clear steps so I can watch you coordinate.`;

async function main() {
  const url = `${base.replace(/\/$/, '')}/api/chat`;
  console.error('Watching JARVIS coordinate sprint on', product, '—', url);
  console.error('Streaming reply below.\n');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: SPRINT_MESSAGE }],
      sessionId: 'watch-sprint-' + Date.now(),
      stream: true,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('HTTP', res.status, text.slice(0, 500));
    process.exit(1);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') || !res.body) {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      process.stdout.write(text);
      return;
    }
    const content = data.content ?? data.message ?? '';
    process.stdout.write(typeof content === 'string' ? content : JSON.stringify(content));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string') process.stdout.write(delta);
        } catch {
          // skip partial chunks
        }
      }
    }
  }
  if (buffer.trim().startsWith('data: ')) {
    try {
      const payload = buffer.trim().slice(6);
      if (payload !== '[DONE]') {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') process.stdout.write(delta);
      }
    } catch {}
  }
  process.stdout.write('\n');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
