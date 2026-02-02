import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789';
const EDGE_URL = process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '';
const TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';
const EDGE_TOKEN = process.env.JARVIS_AUTH_TOKEN || '';
const CHAT_URL = `${GATEWAY_URL.replace(/\/$/, '')}/v1/chat/completions`;

/** Extract assistant text from gateway JSON (OpenAI-style or OpenResponses-style). */
function extractContent(data: unknown): string {
  if (data == null || typeof data !== 'object') return '';
  const o = data as Record<string, unknown>;
  const choice = Array.isArray(o.choices) ? o.choices[0] : undefined;
  if (choice != null && typeof choice === 'object') {
    const c = choice as Record<string, unknown>;
    const msg = c.message ?? c.delta;
    if (typeof msg === 'string') return msg;
    if (msg != null && typeof msg === 'object') {
      const m = msg as Record<string, unknown>;
      const content = m.content ?? m.text;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        const parts = (content as unknown[])
          .map((p) => (p != null && typeof p === 'object' && typeof (p as { text: string }).text === 'string' ? (p as { text: string }).text : ''))
          .filter(Boolean);
        if (parts.length) return (parts as string[]).join('\n');
      }
    }
    if (typeof c.text === 'string') return c.text;
  }
  if (typeof o.output === 'string') return o.output;
  if (typeof o.response === 'string') return o.response;
  if (typeof o.message === 'string') return o.message;
  if (typeof o.text === 'string') return o.text;
  if (typeof o.content === 'string') return o.content;
  return '';
}

export interface ChatRequestBody {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  sessionId?: string;
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { messages, sessionId = 'jarvis-ui', stream = false } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: 'messages array required', type: 'invalid_request_error' } },
        { status: 400 }
      );
    }

    if (EDGE_URL) {
      const edgeHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (EDGE_TOKEN) edgeHeaders['Authorization'] = `Bearer ${EDGE_TOKEN}`;
      if (stream) edgeHeaders['X-Stream'] = 'true';
      const lastMessage = messages[messages.length - 1];
      const res = await fetch(EDGE_URL.replace(/\/$/, ''), {
        method: 'POST',
        headers: edgeHeaders,
        body: JSON.stringify({
          message: lastMessage?.content ?? '',
          messages,
          session_id: sessionId,
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        const errBody = await res.text();
        let errJson: { error?: string } = {};
        try {
          errJson = errBody ? JSON.parse(errBody) : {};
        } catch {
          errJson = { error: errBody || res.statusText };
        }
        return NextResponse.json(
          { error: { message: errJson.error || res.statusText, type: 'api_error' } },
          { status: res.status }
        );
      }
      if (stream && res.body) {
        return new Response(res.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }
      const data = (await res.json()) as { content?: string; meta?: { prompt_trimmed_to?: number; tools_used?: string[] } };
      const edgeContent = typeof data?.content === 'string' ? data.content : 'No response from JARVIS.';
      const body: { content: string; meta?: { prompt_trimmed_to?: number; tools_used?: string[] } } = { content: edgeContent };
      if (data?.meta != null) {
        body.meta = {};
        if (typeof data.meta.prompt_trimmed_to === 'number') body.meta.prompt_trimmed_to = data.meta.prompt_trimmed_to;
        if (Array.isArray(data.meta.tools_used) && data.meta.tools_used.length > 0) body.meta.tools_used = data.meta.tools_used;
        if (Object.keys(body.meta).length === 0) delete body.meta;
      }
      return NextResponse.json(body, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-openclaw-agent-id': 'main',
    };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'openclaw:main',
        messages,
        stream,
        user: sessionId,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      let errJson: { error?: { message?: string; type?: string } } = {};
      try {
        errJson = JSON.parse(errBody);
      } catch {
        errJson = { error: { message: errBody || res.statusText, type: 'api_error' } };
      }
      const message =
        res.status === 405
          ? 'Chat API not enabled on gateway. Enable chat completions in gateway config (see apps/jarvis-ui/README.md).'
          : errJson.error?.message || res.statusText;
      return NextResponse.json(
        { error: { ...errJson.error, message, type: errJson.error?.type || 'api_error' } },
        { status: res.status }
      );
    }

    if (!stream) {
      const raw = await res.text();
      let data: unknown;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        return NextResponse.json(
          { error: { message: 'Gateway returned invalid JSON', type: 'api_error' } },
          { status: 502 }
        );
      }
      const content = extractContent(data);
      const fallback =
        content === ''
          ? 'Gateway returned no text. Check gateway logs (clawdbot gateway logs) and that chat completions are enabled.'
          : content;
      // 2.2: pass through "prompt trimmed" when gateway sends it (meta.prompt_trimmed_to or usage.prompt_trimmed_to)
      const obj = data as Record<string, unknown>;
      const meta = (obj?.meta as Record<string, unknown>) ?? (obj?.usage as Record<string, unknown>);
      const promptTrimmedTo =
        typeof meta?.prompt_trimmed_to === 'number' ? meta.prompt_trimmed_to : undefined;
      const toolsUsed =
        Array.isArray(meta?.tools_used) && (meta.tools_used as unknown[]).every((t) => typeof t === 'string')
          ? (meta.tools_used as string[])
          : undefined;
      const body: { content: string; meta?: { prompt_trimmed_to?: number; tools_used?: string[] } } = { content: fallback };
      if (promptTrimmedTo != null || (toolsUsed != null && toolsUsed.length > 0)) {
        body.meta = {};
        if (promptTrimmedTo != null) body.meta.prompt_trimmed_to = promptTrimmedTo;
        if (toolsUsed != null && toolsUsed.length > 0) body.meta.tools_used = toolsUsed;
      }
      return NextResponse.json(body, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isUnreachable =
      /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(message) ||
      (err instanceof TypeError && message.includes('fetch'));
    return NextResponse.json(
      {
        error: {
          message: isUnreachable
            ? `Backend unreachable: ${EDGE_URL ? 'Edge' : 'Gateway'}. Is it running?`
            : message,
          type: isUnreachable ? 'api_error' : 'internal_error',
        },
      },
      { status: isUnreachable ? 502 : 500 }
    );
  }
}
