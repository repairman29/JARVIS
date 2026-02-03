// JARVIS Edge Function — host and call JARVIS on Supabase.
// REST: POST / with body { "message": "...", "session_id?": "..." } → { "content": "..." }
// MCP: POST / with body JSON-RPC 2.0 (initialize, tools/list, tools/call) → JSON-RPC response
// Convenience: body.action "web_search" | "current_time" with query/timezone
// Secrets: JARVIS_GATEWAY_URL, CLAWDBOT_GATEWAY_TOKEN; optional JARVIS_AUTH_TOKEN
// Memory: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → load/append session_messages (see JARVIS_MEMORY_WIRING.md)

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const SESSION_HISTORY_LIMIT = 50;

/** System prompt for JARVIS when used from the web UI (REST chat). Injects identity and channel context so JARVIS doesn't claim it "can't access" repos—it clarifies where it *does* have access (Cursor). */
const WEB_UI_SYSTEM_PROMPT = `You are JARVIS (Just A Rather Very Intelligent System), repairman29's AI. Voice: modern, concise by default; never say "I cannot" without offering an alternative. Proactive, resourceful, loyal to the user's success.

**Channel: Web chat (JARVIS UI).** You do NOT have live access to the user's codebase or GitHub repos in this chat. When they mention a repo (e.g. repairman29/BEAST-MODE, repairman29/JARVIS) or say "you've already scanned it" or "you can access it": acknowledge the project warmly, then say that for code review, improvements, or reading their repo you need either (1) them to open that repo in Cursor and ask you there—where you have full workspace access—or (2) they paste specific files or snippets here and you'll help. Do not say "I can't access GitHub" or "I cannot access external repositories"; instead say you don't have live repo access in this chat and point them to Cursor or pasted code.

**What you CAN do here:** Answer questions, brainstorm, product/PM thinking (PRDs, roadmaps, metrics), suggest next actions, use any tools the gateway exposes (e.g. web search). When asked "which version" or "what capabilities," say you're JARVIS with productivity and reasoning capabilities, and for code/repo work they get the full experience in Cursor. End with a clear next action when appropriate.`;

function getSupabase(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

async function loadSessionHistory(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ role: string; content: string }[]> {
  const { data, error } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(SESSION_HISTORY_LIMIT);
  if (error) return [];
  return (data ?? []).map((r) => ({ role: r.role, content: r.content ?? "" }));
}

async function appendSessionMessages(
  supabase: SupabaseClient,
  sessionId: string,
  rows: { role: string; content: string }[]
): Promise<void> {
  if (rows.length === 0) return;
  await supabase.from("session_messages").insert(
    rows.map((r) => ({ session_id: sessionId, role: r.role, content: r.content }))
  );
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-stream",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function extractContent(data: unknown): string {
  if (data == null || typeof data !== "object") return "";
  const o = data as Record<string, unknown>;
  const choice = Array.isArray(o.choices) ? o.choices[0] : undefined;
  if (choice != null && typeof choice === "object") {
    const c = choice as Record<string, unknown>;
    const msg = c.message ?? c.delta;
    if (typeof msg === "string") return msg;
    if (msg != null && typeof msg === "object") {
      const m = msg as Record<string, unknown>;
      const content = m.content ?? m.text;
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        const parts = (content as unknown[])
          .map((p) =>
            p != null && typeof p === "object" && typeof (p as { text: string }).text === "string"
              ? (p as { text: string }).text
              : ""
          )
          .filter(Boolean);
        if (parts.length) return (parts as string[]).join("\n");
      }
    }
    if (typeof c.text === "string") return c.text;
  }
  if (typeof o.output === "string") return o.output;
  if (typeof o.response === "string") return o.response;
  if (typeof o.message === "string") return o.message;
  if (typeof o.text === "string") return o.text;
  if (typeof o.content === "string") return o.content;
  return "";
}

/** Extract meta (tools_used, structured_result, prompt_trimmed_to) from gateway response; optionally from tool_calls. */
function extractMeta(data: unknown): Record<string, unknown> | null {
  if (data == null || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const topMeta = o.meta as Record<string, unknown> | undefined;
  const choice = Array.isArray(o.choices) ? o.choices[0] : undefined;
  const msg = choice != null && typeof choice === "object" ? (choice as Record<string, unknown>).message : undefined;
  const toolCalls = msg != null && typeof msg === "object" && Array.isArray((msg as Record<string, unknown>).tool_calls)
    ? (msg as Record<string, unknown>).tool_calls as Array<{ function?: { name?: string } }>
    : [];
  const toolsUsedFromCalls = toolCalls.length > 0
    ? toolCalls.map((t) => t.function?.name).filter((n): n is string => typeof n === "string")
    : null;
  const meta: Record<string, unknown> = {};
  if (topMeta && typeof topMeta === "object") {
    if (Array.isArray(topMeta.tools_used)) meta.tools_used = topMeta.tools_used;
    if (topMeta.structured_result != null) meta.structured_result = topMeta.structured_result;
    if (typeof topMeta.prompt_trimmed_to === "number") meta.prompt_trimmed_to = topMeta.prompt_trimmed_to;
  }
  if (toolsUsedFromCalls && toolsUsedFromCalls.length > 0 && !meta.tools_used) meta.tools_used = toolsUsedFromCalls;
  return Object.keys(meta).length > 0 ? meta : null;
}

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const MCP_TOOLS = [
  {
    name: "jarvis_chat",
    description: "Send a message to JARVIS and get a reply. By default all Cursor bots stitch into one session. Optional speaker/bot_id: so JARVIS knows which bot said what (e.g. workspace name). Optional session_id: use only if you want this bot in a separate thread.",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: { type: "string" as const, description: "User message to JARVIS (e.g. 'What time is it in Denver?', 'Search for latest news')" },
        speaker: { type: "string" as const, description: "Optional. Identity of this bot (e.g. workspace name, 'Cursor-olive'). Prepended as [Bot: speaker] so JARVIS is aware different bots are different." },
        session_id: { type: "string" as const, description: "Optional. Omit to stitch into the shared MCP session. Set only if you want this bot in a separate thread." },
      },
      required: ["message"],
    },
  },
];

async function callGateway(
  gatewayUrl: string,
  gatewayToken: string,
  messages: { role: string; content: string }[],
  sessionId: string,
  stream: boolean
): Promise<{ content?: string; meta?: Record<string, unknown>; res?: Response; err?: string }> {
  const chatUrl = `${gatewayUrl.replace(/\/$/, "")}/v1/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-openclaw-agent-id": "main",
  };
  if (gatewayToken) headers["Authorization"] = `Bearer ${gatewayToken}`;

  const res = await fetch(chatUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "openclaw:main",
      messages,
      stream,
      user: sessionId,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg: string;
    try {
      const data = text ? JSON.parse(text) : null;
      errMsg = (data && data.error && data.error.message) || text || res.statusText;
    } catch {
      errMsg = text || res.statusText;
    }
    return { err: errMsg };
  }

  if (stream && res.body) {
    return { res };
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  const content = extractContent(data);
  const meta = extractMeta(data);
  return { content: content || "No response from gateway.", meta: meta ?? undefined };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return jsonResponse({ ok: true, mode: "edge" });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Require Bearer auth when running in Supabase cloud (production). Local serve has no auth.
  const isCloud = Boolean(Deno.env.get("DENO_DEPLOYMENT_ID") ?? Deno.env.get("SB_REGION"));
  const authToken = (Deno.env.get("JARVIS_AUTH_TOKEN") ?? "").trim();
  if (isCloud && authToken) {
    const auth = (req.headers.get("Authorization") ?? "").trim();
    const want = `Bearer ${authToken}`;
    if (!auth || auth !== want) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
  }

  const gatewayUrl = Deno.env.get("JARVIS_GATEWAY_URL") || "http://127.0.0.1:18789";
  const gatewayToken = Deno.env.get("CLAWDBOT_GATEWAY_TOKEN") || "";
  const wantStream = req.headers.get("x-stream") === "true";

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // MCP JSON-RPC
  if (body && body.jsonrpc === "2.0" && typeof body.method === "string") {
    const id = body.id;
    const method = body.method as string;

    if (method === "initialize") {
      return jsonResponse({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "jarvis", version: "1.0" },
        },
      });
    }

    if (method === "tools/list") {
      return jsonResponse({
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS },
      });
    }

    if (method === "tools/call") {
      const params = (body.params || {}) as { name?: string; arguments?: { message?: string; speaker?: string; session_id?: string } };
      if (params.name !== "jarvis_chat") {
        return jsonResponse({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: `Unknown tool: ${params.name}` },
        }, 400);
      }
      const rawMessage = (params.arguments && params.arguments.message) != null
        ? String(params.arguments.message)
        : "";
      if (!rawMessage.trim()) {
        return jsonResponse({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Missing argument: message" },
        }, 400);
      }
      const speaker = (params.arguments && typeof params.arguments.speaker === "string" && params.arguments.speaker.trim())
        ? params.arguments.speaker.trim()
        : "";
      const userContent = speaker ? `[Bot: ${speaker}]\n${rawMessage}` : rawMessage;
      const mcpSessionId = (params.arguments && typeof params.arguments.session_id === "string" && params.arguments.session_id.trim())
        ? params.arguments.session_id.trim()
        : "mcp";
      let mcpMessages: { role: string; content: string }[] = [{ role: "user", content: userContent }];
      const supabase = getSupabase();
      if (supabase) {
        const history = await loadSessionHistory(supabase, mcpSessionId);
        mcpMessages = [...history, { role: "user", content: userContent }];
      }
      const result = await callGateway(
        gatewayUrl,
        gatewayToken,
        mcpMessages,
        mcpSessionId,
        false
      );
      if (result.err) {
        return jsonResponse({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: result.err }],
            isError: true,
          },
        });
      }
      if (supabase && result.content) {
        await appendSessionMessages(supabase, mcpSessionId, [
          { role: "user", content: userContent },
          { role: "assistant", content: result.content },
        ]);
      }
      return jsonResponse({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: result.content || "No response." }],
          isError: false,
        },
      });
    }

    return jsonResponse({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    }, 400);
  }

  // Convenience: web_search / current_time
  const action = body.action as string | undefined;
  if (action === "web_search" && typeof body.query === "string") {
    const messages = [{ role: "user" as const, content: `Use web search to find: ${body.query.trim()}` }];
    const result = await callGateway(gatewayUrl, gatewayToken, messages, "jarvis-edge", false);
    if (result.err) return jsonResponse({ error: result.err }, 502);
    return jsonResponse({ content: result.content, results: [] });
  }
  if (action === "current_time") {
    const tz = typeof body.timezone === "string" ? body.timezone.trim() : "";
    const content = tz
      ? `What is the current date and time in ${tz}?`
      : "What is the current date and time right now?";
    const result = await callGateway(
      gatewayUrl,
      gatewayToken,
      [{ role: "user", content }],
      "jarvis-edge",
      false
    );
    if (result.err) return jsonResponse({ error: result.err }, 502);
    return jsonResponse({ content: result.content });
  }

  // REST chat
  const sessionId = (body.session_id as string) ?? "jarvis-edge";
  let messages: { role: string; content: string }[];
  const userMessagesThisTurn: { role: string; content: string }[] = [];

  if (Array.isArray(body.messages) && body.messages.length > 0) {
    messages = (body.messages as { role?: string; content?: string }[]).map((m) => ({
      role: (m.role ?? "user") as string,
      content: String(m.content ?? ""),
    }));
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx >= 0) userMessagesThisTurn.push(messages[lastUserIdx]);
  } else if (body.message != null) {
    const userContent = String(body.message);
    userMessagesThisTurn.push({ role: "user", content: userContent });
    const supabase = getSupabase();
    if (supabase) {
      const history = await loadSessionHistory(supabase, sessionId);
      messages = [...history, { role: "user", content: userContent }];
    } else {
      messages = [{ role: "user", content: userContent }];
    }
  } else {
    return jsonResponse(
      { error: "Body must include 'message' (string), 'messages' (array), or MCP JSON-RPC." },
      400
    );
  }

  // Prepend web-UI system prompt so JARVIS has identity and accurate channel context (no repo access here).
  const hasSystem = messages.length > 0 && messages[0].role === "system";
  const messagesWithSystem = hasSystem
    ? messages
    : [{ role: "system" as const, content: WEB_UI_SYSTEM_PROMPT }, ...messages];

  const result = await callGateway(gatewayUrl, gatewayToken, messagesWithSystem, sessionId, wantStream);

  if (result.err) {
    return jsonResponse({ error: result.err }, 502);
  }

  const supabase = getSupabase();
  if (supabase && userMessagesThisTurn.length > 0) {
    if (wantStream && result.res) {
      await appendSessionMessages(supabase, sessionId, userMessagesThisTurn);
    } else if (!wantStream && result.content) {
      await appendSessionMessages(supabase, sessionId, [
        ...userMessagesThisTurn,
        { role: "assistant", content: result.content },
      ]);
    }
  }

  if (result.res && result.res.body) {
    return new Response(result.res.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...corsHeaders,
      },
    });
  }

  const payload: { content: string; meta?: Record<string, unknown> } = {
    content: result.content || "No response from gateway.",
  };
  if (result.meta && Object.keys(result.meta).length > 0) payload.meta = result.meta;
  return jsonResponse(payload);
});
