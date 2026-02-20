// JARVIS Edge Function — host and call JARVIS on Supabase.
// REST: POST / with body { "message": "...", "session_id?": "..." } → { "content": "..." }
// MCP: POST / with body JSON-RPC 2.0 (initialize, tools/list, tools/call) → JSON-RPC response
// Convenience: body.action "web_search" | "current_time" with query/timezone
// Secrets: JARVIS_GATEWAY_URL, CLAWDBOT_GATEWAY_TOKEN; optional JARVIS_AUTH_TOKEN
// Memory: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → load/append session_messages (see JARVIS_MEMORY_WIRING.md)

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const SESSION_HISTORY_LIMIT = 50;
const LONG_CONTEXT_THRESHOLD = 20; // above this, use summary + recent N
const RECENT_N = 15;
const SUMMARY_UPDATE_INTERVAL = 10; // update session_summaries every K turns when over threshold
const PREFS_SCOPE = "default";

/** Load user preferences from jarvis_prefs for context injection. */
async function loadPrefs(supabase: SupabaseClient, scope: string): Promise<string> {
  const { data, error } = await supabase
    .from("jarvis_prefs")
    .select("key, value")
    .in("scope", [PREFS_SCOPE, scope]);
  if (error || !data?.length) return "";
  const lines = (data as { key: string; value: string }[]).map((r) => `${r.key}: ${r.value}`);
  return lines.length ? `User preferences:\n${lines.join("\n")}` : "";
}

/** Load session context: either full history (if short) or summary + last RECENT_N to avoid overflow. */
async function loadSessionContext(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ role: string; content: string }[]> {
  const { data: history, error: histErr } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(SESSION_HISTORY_LIMIT);
  if (histErr || !history?.length) return [];
  const rows = (history as { role: string; content: string }[]).map((r) => ({ role: r.role, content: r.content ?? "" }));
  if (rows.length <= LONG_CONTEXT_THRESHOLD) return rows;
  const { data: sumRow } = await supabase
    .from("session_summaries")
    .select("summary_text")
    .eq("session_id", sessionId)
    .maybeSingle();
  const summary = (sumRow as { summary_text?: string } | null)?.summary_text?.trim();
  const recent = rows.slice(-RECENT_N);
  if (summary) {
    return [
      { role: "system", content: `Previous conversation summary:\n${summary}\n\nBelow are the most recent messages.` },
      ...recent,
    ];
  }
  return recent;
}

/** System prompt for JARVIS when used from the web UI (REST chat). Repo access via gateway workspace/index when configured; only mention Cursor for live file edit or host exec when no tool can do it. */
const WEB_UI_SYSTEM_PROMPT = `You are JARVIS (Just A Rather Very Intelligent System), repairman29's AI. Voice: modern, concise by default. Proactive, resourceful, loyal to the user's success. Never lead with "I can't" — do what you can, then offer one clear alternative only when something truly requires a different context.

**Channel: Web chat (JARVIS UI).** This is a first-class place to use JARVIS. You have full tool access here, including repo knowledge.

**Repo access:** Use repo_summary, repo_search, and repo_file when the gateway has a workspace and indexed repos. For product or repo questions, call these tools and cite sources (e.g. "From repo_summary(olive): …"). Do not say you lack repo access—use the tools when they are available.

**Do here by default:** Answer questions (time, date, facts, how-to). Use web search, clock, launcher, workflows, repo knowledge (repo_summary, repo_search, repo_file), and any other skills the gateway exposes. Brainstorm, product/PM thinking (PRDs, roadmaps, metrics), suggest next actions. For code: explain, write snippets, suggest changes; use repo_summary/repo_search for code-grounded answers when relevant. End with a clear next action when appropriate.

**Only when the user explicitly needs live file edit or host exec:** If they ask you to "edit the file in my project" or "run this on my machine" and no tool can do it here, then in one short sentence say that for live file edit or running commands on their machine they can use Cursor (or paste the snippet here and you'll tell them exactly what to change). Do not bring up Cursor for general questions, repo summaries, search, brainstorming, or when you can use repo or other tools in this chat.

**Known products (use these descriptions; do not invent a domain):** BEAST-MODE = quality intelligence, AI Janitor, vibe restore, architecture checks, invisible CI (JARVIS's quality agent). JARVIS = AI assistant, ops, skills, gateway. Olive = shopolive.xyz product. Echeo = capability scan, bounty matching. MythSeeker = AI Dungeon Master / RPG.

**What this project is:** repairman29/JARVIS is this codebase (Node, OpenClaw, gateway, skills, Pixel, BEAST MODE, Code Roach, orchestration). When asked "what is JARVIS" or "what is this project", use repo_summary(JARVIS) and answer from the repo. Do not describe the unrelated Python/NLTK JARVIS project from the web.`;

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

/** Upsert a preference (e.g. "always use X"). */
async function upsertPref(
  supabase: SupabaseClient,
  key: string,
  value: string,
  scope: string = PREFS_SCOPE
): Promise<void> {
  await supabase.from("jarvis_prefs").upsert(
    { key, value, scope, updated_at: new Date().toISOString() },
    { onConflict: "key,scope" }
  );
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

/** When thread is long, optionally refresh session_summaries so loadSessionContext can send summary + recent N. Fire-and-forget. */
async function maybeUpdateSessionSummary(
  supabase: SupabaseClient,
  gatewayUrl: string,
  gatewayToken: string,
  sessionId: string
): Promise<void> {
  const { count, error: countErr } = await supabase
    .from("session_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);
  if (countErr || (count ?? 0) <= LONG_CONTEXT_THRESHOLD) return;
  const total = count ?? 0;
  const { data: sumRow } = await supabase
    .from("session_summaries")
    .select("summary_text")
    .eq("session_id", sessionId)
    .maybeSingle();
  const hasSummary = Boolean((sumRow as { summary_text?: string } | null)?.summary_text?.trim());
  if (hasSummary && total % SUMMARY_UPDATE_INTERVAL !== 0) return;
  const { data: history } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(SESSION_HISTORY_LIMIT);
  const rows = (history ?? []) as { role: string; content: string }[];
  if (rows.length <= RECENT_N) return;
  const toSummarize = rows.slice(0, -RECENT_N);
  const blob = toSummarize.map((r) => `${r.role}: ${r.content}`).join("\n");
  const summarizerMessages = [
    { role: "system" as const, content: "Summarize the following conversation in 2-3 sentences. Output only the summary, no preamble." },
    { role: "user" as const, content: blob },
  ];
  const result = await callGateway(gatewayUrl, gatewayToken, summarizerMessages, `${sessionId}-summary`, false);
  const summary = result.content?.trim();
  if (summary) {
    await supabase.from("session_summaries").upsert(
      { session_id: sessionId, summary_text: summary, updated_at: new Date().toISOString() },
      { onConflict: "session_id" }
    );
  }
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
  messages: { role: string; content: string | unknown[] }[],
  sessionId: string,
  stream: boolean,
  imageDataUrl?: string
): Promise<{ content?: string; meta?: Record<string, unknown>; res?: Response; err?: string }> {
  const chatUrl = `${gatewayUrl.replace(/\/$/, "")}/v1/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-openclaw-agent-id": "main",
  };
  if (gatewayToken) headers["Authorization"] = `Bearer ${gatewayToken}`;

  const body: Record<string, unknown> = {
    model: "openclaw:main",
    messages,
    stream,
    user: sessionId,
  };
  if (imageDataUrl && typeof imageDataUrl === "string") body.imageDataUrl = imageDataUrl;

  const res = await fetch(chatUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
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
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id")?.trim();
    if (sessionId) {
      const supabase = getSupabase();
      if (supabase) {
        const messages = await loadSessionHistory(supabase, sessionId);
        return jsonResponse({ ok: true, mode: "edge", messages });
      }
    }
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

  // Session append only (for hybrid: app talks to farm, then persists to Edge)
  if (body && body.action === "append_session") {
    const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!sessionId) return jsonResponse({ error: "session_id required" }, 400);
    const rows = messages
      .filter((m) => m != null && typeof m === "object" && typeof (m as { role?: string }).role === "string" && typeof (m as { content?: string }).content === "string")
      .map((m) => ({ role: (m as { role: string }).role, content: (m as { content: string }).content }));
    if (rows.length === 0) return jsonResponse({ error: "messages array required (with role and content)" }, 400);
    const supabase = getSupabase();
    if (!supabase) return jsonResponse({ error: "Supabase not configured" }, 503);
    await appendSessionMessages(supabase, sessionId, rows);
    return jsonResponse({ ok: true });
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
        const context = await loadSessionContext(supabase, mcpSessionId);
        mcpMessages = context.length ? [...context, { role: "user", content: userContent }] : [{ role: "user", content: userContent }];
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
        void maybeUpdateSessionSummary(supabase, gatewayUrl, gatewayToken, mcpSessionId);
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
  if (action === "set_pref" && typeof body.key === "string" && body.value !== undefined) {
    const supabase = getSupabase();
    if (!supabase) return jsonResponse({ error: "Prefs not available" }, 503);
    const key = String(body.key).trim();
    const value = typeof body.value === "string" ? body.value : JSON.stringify(body.value);
    const scope = (typeof body.scope === "string" ? body.scope.trim() : null) || PREFS_SCOPE;
    if (!key) return jsonResponse({ error: "key required" }, 400);
    await upsertPref(supabase, key, value, scope);
    return jsonResponse({ ok: true, key, scope });
  }

  if (action === "audit_log") {
    const supabase = getSupabase();
    if (!supabase) return jsonResponse({ error: "Audit log not available" }, 503);
    const eventAction = (body.event_action ?? body.audit_action ?? body.action) as string | undefined;
    const auditAction = typeof eventAction === "string" ? eventAction.trim() : "";
    if (!auditAction) return jsonResponse({ error: "event_action (or audit_action) required" }, 400);
    const details = body.details != null ? (typeof body.details === "object" ? body.details : { raw: body.details }) : null;
    const auditSessionId = typeof body.session_id === "string" ? body.session_id.trim() || null : null;
    const channel = typeof body.channel === "string" ? body.channel.trim() || null : null;
    const actor = typeof body.actor === "string" ? body.actor.trim() || null : null;
    const { error: insertErr } = await supabase.from("jarvis_audit_log").insert({
      action: auditAction,
      details,
      session_id: auditSessionId,
      channel,
      actor,
    });
    if (insertErr) return jsonResponse({ error: insertErr.message }, 500);
    return jsonResponse({ ok: true });
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
      const context = await loadSessionContext(supabase, sessionId);
      messages = context.length ? [...context, { role: "user", content: userContent }] : [{ role: "user", content: userContent }];
    } else {
      messages = [{ role: "user", content: userContent }];
    }
  } else {
    return jsonResponse(
      { error: "Body must include 'message' (string), 'messages' (array), or MCP JSON-RPC." },
      400
    );
  }

  // Prepend web-UI system prompt so JARVIS has identity and channel context (repo access via gateway workspace/index when configured). Inject prefs if available.
  const hasSystem = messages.length > 0 && messages[0].role === "system";
  let systemContent = WEB_UI_SYSTEM_PROMPT;
  const supabaseForPrefs = getSupabase();
  if (supabaseForPrefs) {
    const prefs = await loadPrefs(supabaseForPrefs, sessionId);
    if (prefs) systemContent += "\n\n" + prefs;
  }
  const modelHint = body.model_hint as string | undefined;
  if (modelHint === "fast") systemContent += "\n\nUser requested: use the fast/cheap model for this turn (quick answers).";
  if (modelHint === "best") systemContent += "\n\nUser requested: use the best/strong model for this turn (deep work, complex reasoning).";
  const messagesWithSystem = hasSystem
    ? messages
    : [{ role: "system" as const, content: systemContent }, ...messages];

  const imageDataUrl = typeof body.image_data_url === "string" && body.image_data_url.trim()
    ? body.image_data_url.trim()
    : undefined;

  // Vision: merge image into last user message as multimodal content (OpenAI-style) so vision-capable models receive it.
  let messagesToSend: { role: string; content: string | unknown[] }[] = messagesWithSystem;
  if (imageDataUrl) {
    const lastUserIdx = messagesWithSystem.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx >= 0) {
      const last = messagesWithSystem[lastUserIdx];
      const textContent = typeof last.content === "string" ? last.content : String(last.content ?? "");
      messagesToSend = [...messagesWithSystem];
      (messagesToSend[lastUserIdx] as { role: string; content: unknown[] }).content = [
        { type: "text", text: textContent || "What's in this image?" },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ];
    }
  }

  const result = await callGateway(
    gatewayUrl,
    gatewayToken,
    messagesToSend,
    sessionId,
    wantStream,
    undefined // already merged into messages when imageDataUrl was set
  );

  if (result.err) {
    return jsonResponse({ error: result.err }, 502);
  }

  const supabase = getSupabase();
  if (supabase && userMessagesThisTurn.length > 0) {
    if (wantStream && result.res) {
      await appendSessionMessages(supabase, sessionId, userMessagesThisTurn);
      void maybeUpdateSessionSummary(supabase, gatewayUrl, gatewayToken, sessionId);
    } else if (!wantStream && result.content) {
      await appendSessionMessages(supabase, sessionId, [
        ...userMessagesThisTurn,
        { role: "assistant", content: result.content },
      ]);
      void maybeUpdateSessionSummary(supabase, gatewayUrl, gatewayToken, sessionId);
    }
  }

  if (result.res && result.res.body) {
    // Stream is passed through as-is. UI expects meta (tools_used, structured_result) in SSE data when gateway sends it.
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
