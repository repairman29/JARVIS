import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim();
const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const FARM_URL = (process.env.JARVIS_FARM_URL || process.env.FARM_URL || '').trim();
const TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();
const CHAT_URL = `${GATEWAY_URL.replace(/\/$/, '')}/v1/chat/completions`;
const FARM_PROBE_MS = 2500;

/** Fire-and-forget: append user + assistant to Edge session (for hybrid farm path). */
async function appendToEdgeSession(
  sessionId: string,
  userContent: string,
  assistantContent: string
): Promise<void> {
  if (!EDGE_URL) return;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
  try {
    await fetch(EDGE_URL.replace(/\/$/, ''), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'append_session',
        session_id: sessionId,
        messages: [
          { role: 'user', content: userContent },
          { role: 'assistant', content: assistantContent },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // best-effort; do not fail the chat response
  }
}

/** Consume SSE stream and return accumulated assistant content (for hybrid farm stream → append). */
async function accumulateStreamContent(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const payload = trimmed.slice(6);
            const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string') content += delta;
          } catch {
            // ignore
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return content;
}

/** Injected when using local gateway so JARVIS does not deflect to Cursor for everything. Same intent as Edge WEB_UI_SYSTEM_PROMPT. */
const WEB_CHAT_SYSTEM_HINT = `Channel: Web chat (JARVIS UI). You have full tool access here, including repo knowledge: use repo_summary, repo_search, and repo_file when the gateway has a workspace and indexed repos. Answer questions, search repos, cite sources (e.g. "From repo_summary(olive): …"). Use web search, clock, launcher, workflows, and other skills. Only mention Cursor when the user explicitly needs live file edit on their machine or host exec and no tool can do it—otherwise help fully in this chat. When asked what JARVIS or repairman29/JARVIS is, use repo_summary(JARVIS) and answer from this codebase; do not describe the unrelated Python/NLTK JARVIS project from the web.`;

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
  /** 'fast' | 'best' — hint for model tier (see GETTING_STARTED_MODES) */
  modelHint?: 'fast' | 'best';
  /** Optional image (data URL or base64). Forwarded to Edge when set; vision models can use it when supported. */
  imageDataUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    let body: ChatRequestBody;
    try {
      const raw = await req.text();
      body = raw ? (JSON.parse(raw) as ChatRequestBody) : ({} as ChatRequestBody);
    } catch {
      return NextResponse.json(
        { error: { message: 'Invalid JSON body', type: 'invalid_request_error' } },
        { status: 400 }
      );
    }
    const { messages, sessionId = 'jarvis-ui', stream = false, modelHint, imageDataUrl } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: 'messages array required', type: 'invalid_request_error' } },
        { status: 400 }
      );
    }

    // Hybrid: when both Edge and Farm URL are set, try farm first
    let useFarm = false;
    if (EDGE_URL && FARM_URL) {
      try {
        const base = FARM_URL.replace(/\/$/, '');
        const probe = await fetch(`${base}/`, {
          method: 'GET',
          headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
          signal: AbortSignal.timeout(FARM_PROBE_MS),
        });
        useFarm = probe.ok;
      } catch {
        useFarm = false;
      }
    }

    if (useFarm) {
      const FARM_CHAT_URL = `${FARM_URL.replace(/\/$/, '')}/v1/chat/completions`;
      const lastUserContent = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
      const farmHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': 'main',
      };
      if (TOKEN) farmHeaders['Authorization'] = `Bearer ${TOKEN}`;
      if (modelHint === 'fast' || modelHint === 'best') farmHeaders['X-JARVIS-Model-Hint'] = modelHint;
      const gatewayMessages = messages.some((m) => m.role === 'system')
        ? messages
        : [{ role: 'system' as const, content: WEB_CHAT_SYSTEM_HINT }, ...messages];

      const farmRes = await fetch(FARM_CHAT_URL, {
        method: 'POST',
        headers: farmHeaders,
        body: JSON.stringify({
          model: 'openclaw:main',
          messages: gatewayMessages,
          stream,
          user: sessionId,
          ...(imageDataUrl && typeof imageDataUrl === 'string' ? { imageDataUrl } : {}),
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (!farmRes.ok) {
        const errBody = await farmRes.text();
        let errJson: { error?: { message?: string; type?: string } } = {};
        try {
          errJson = JSON.parse(errBody);
        } catch {
          errJson = { error: { message: errBody || farmRes.statusText, type: 'api_error' } };
        }
        const message =
          farmRes.status === 405
            ? 'Chat API not enabled on farm gateway.'
            : errJson.error?.message || farmRes.statusText;
        return NextResponse.json(
          { error: { ...errJson.error, message, type: errJson.error?.type || 'api_error' } },
          { status: farmRes.status }
        );
      }

      const backendHeader = { 'X-Backend': 'farm' };

      if (!stream) {
        const raw = await farmRes.text();
        let data: unknown;
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          return NextResponse.json(
            { error: { message: 'Farm returned invalid JSON', type: 'api_error' } },
            { status: 502 }
          );
        }
        const content = extractContent(data);
        const fallback = content === '' ? 'Farm returned no text.' : content;
        const obj = data as Record<string, unknown>;
        const meta = (obj?.meta as Record<string, unknown>) ?? (obj?.usage as Record<string, unknown>);
        const promptTrimmedTo =
          typeof meta?.prompt_trimmed_to === 'number' ? meta.prompt_trimmed_to : undefined;
        const toolsUsed =
          Array.isArray(meta?.tools_used) && (meta.tools_used as unknown[]).every((t) => typeof t === 'string')
            ? (meta.tools_used as string[])
            : undefined;
        const structuredResult = meta?.structured_result;
        await appendToEdgeSession(sessionId, lastUserContent, fallback);
        const body: {
          content: string;
          meta?: { prompt_trimmed_to?: number; tools_used?: string[]; structured_result?: unknown };
        } = { content: fallback };
        if (promptTrimmedTo != null || (toolsUsed != null && toolsUsed.length > 0) || structuredResult != null) {
          body.meta = {};
          if (promptTrimmedTo != null) body.meta.prompt_trimmed_to = promptTrimmedTo;
          if (toolsUsed != null && toolsUsed.length > 0) body.meta.tools_used = toolsUsed;
          if (structuredResult != null) body.meta.structured_result = structuredResult;
        }
        return NextResponse.json(body, {
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', ...backendHeader },
        });
      }

      if (!farmRes.body) {
        return NextResponse.json(
          { error: { message: 'Farm returned no body', type: 'api_error' } },
          { status: 502 }
        );
      }
      const [forClient, forAccumulate] = farmRes.body.tee();
      void accumulateStreamContent(forAccumulate).then((assistantContent) => {
        if (assistantContent.trim()) appendToEdgeSession(sessionId, lastUserContent, assistantContent);
      });
      return new Response(forClient, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          ...backendHeader,
        },
      });
    }

    if (EDGE_URL) {
      const edgeHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (EDGE_TOKEN) edgeHeaders['Authorization'] = `Bearer ${EDGE_TOKEN}`;
      if (stream) edgeHeaders['X-Stream'] = 'true';
      const lastMessage = messages[messages.length - 1];
      const messageBody = lastMessage?.content ?? '';
      const edgeBody: Record<string, unknown> = {
        message: messageBody,
        messages,
        session_id: sessionId,
      };
      if (messageBody) edgeBody.task = messageBody;
      if (modelHint === 'fast' || modelHint === 'best') edgeBody.model_hint = modelHint;
      if (imageDataUrl && typeof imageDataUrl === 'string') edgeBody.image_data_url = imageDataUrl;
      const res = await fetch(EDGE_URL.replace(/\/$/, ''), {
        method: 'POST',
        headers: edgeHeaders,
        body: JSON.stringify(edgeBody),
        signal: AbortSignal.timeout(120000),
      });
    if (!res.ok) {
      const errBody = await res.text();
      let errMessage: string = res.statusText;
      try {
        const errJson = errBody ? (JSON.parse(errBody) as { error?: string }) : {};
        const raw = errJson.error;
        errMessage = typeof raw === 'string' ? raw : res.status === 502 ? 'Edge or gateway unreachable. Check Supabase Edge logs and JARVIS_GATEWAY_URL.' : res.statusText;
      } catch {
        if (errBody && errBody.length < 200) errMessage = errBody;
      }
      if (res.status === 403 && /OAuth|organization/i.test(errMessage)) {
        errMessage += ' — Your LLM provider’s org may have OAuth disabled; use a personal API key or switch provider (e.g. Groq). See GETTING_STARTED_MODES.md or DISCORD_SETUP.md.';
      }
      return NextResponse.json(
        { error: { message: errMessage, type: 'api_error' } },
        { status: res.status }
      );
    }
      const edgeContentType = res.headers.get('content-type') || '';
      const isEventStream = edgeContentType.includes('text/event-stream');
      if (stream && res.body && isEventStream) {
        return new Response(res.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }
      const raw = await res.text();
      let data: { content?: string; meta?: { prompt_trimmed_to?: number; tools_used?: string[]; structured_result?: unknown } } | null = null;
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : null;
      } catch {
        data = null;
      }
      if (!data || typeof data !== 'object') {
        return NextResponse.json(
          { error: { message: 'Edge returned invalid JSON', type: 'api_error' } },
          { status: 502 }
        );
      }
      const edgeData = data as { content?: string; meta?: { prompt_trimmed_to?: number; tools_used?: string[]; structured_result?: unknown } };
      const edgeContent = typeof edgeData.content === 'string' ? edgeData.content : 'No response from JARVIS.';
      const body: {
        content: string;
        meta?: { prompt_trimmed_to?: number; tools_used?: string[]; structured_result?: unknown };
      } = { content: edgeContent };
      if (edgeData.meta != null) {
        body.meta = {};
        if (typeof edgeData.meta.prompt_trimmed_to === 'number') body.meta.prompt_trimmed_to = edgeData.meta.prompt_trimmed_to;
        if (Array.isArray(edgeData.meta.tools_used) && edgeData.meta.tools_used.length > 0) body.meta.tools_used = edgeData.meta.tools_used;
        if (edgeData.meta.structured_result != null) body.meta.structured_result = edgeData.meta.structured_result;
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
    if (modelHint === 'fast' || modelHint === 'best') headers['X-JARVIS-Model-Hint'] = modelHint;

    // Prepend web-chat context so JARVIS helps here instead of deflecting to Cursor (local gateway has no Edge prompt).
    const gatewayMessages = messages.some((m) => m.role === 'system')
      ? messages
      : [{ role: 'system' as const, content: WEB_CHAT_SYSTEM_HINT }, ...messages];

    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'openclaw:main',
        messages: gatewayMessages,
        stream,
        user: sessionId,
        ...(imageDataUrl && typeof imageDataUrl === 'string' ? { imageDataUrl } : {}),
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
      let message =
        res.status === 405
          ? 'Chat API not enabled on gateway. Enable chat completions in gateway config (see apps/jarvis-ui/README.md).'
          : errJson.error?.message || res.statusText;
      if (res.status === 403 && /OAuth|organization/i.test(message)) {
        message += ' — Your LLM provider’s org may have OAuth disabled; use a personal API key or switch provider (e.g. Groq). See GETTING_STARTED_MODES.md or DISCORD_SETUP.md.';
      }
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
      const structuredResult = meta?.structured_result;
      const body: {
        content: string;
        meta?: { prompt_trimmed_to?: number; tools_used?: string[]; structured_result?: unknown };
      } = { content: fallback };
      if (promptTrimmedTo != null || (toolsUsed != null && toolsUsed.length > 0) || structuredResult != null) {
        body.meta = {};
        if (promptTrimmedTo != null) body.meta.prompt_trimmed_to = promptTrimmedTo;
        if (toolsUsed != null && toolsUsed.length > 0) body.meta.tools_used = toolsUsed;
        if (structuredResult != null) body.meta.structured_result = structuredResult;
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
