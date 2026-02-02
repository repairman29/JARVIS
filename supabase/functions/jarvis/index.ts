// JARVIS Edge Function — host and call JARVIS on Supabase.
// REST: POST / with body { "message": "...", "session_id?": "..." } → { "content": "..." }
// MCP: POST / with body JSON-RPC 2.0 (initialize, tools/list, tools/call) → JSON-RPC response
// Convenience: body.action "web_search" | "current_time" with query/timezone
// Secrets: JARVIS_GATEWAY_URL, CLAWDBOT_GATEWAY_TOKEN; optional JARVIS_AUTH_TOKEN

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

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const MCP_TOOLS = [
  {
    name: "jarvis_chat",
    description: "Send a message to JARVIS and get a reply. Use for any question, web search, current time, or task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: { type: "string" as const, description: "User message to JARVIS (e.g. 'What time is it in Denver?', 'Search for latest news')" },
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
): Promise<{ content?: string; res?: Response; err?: string }> {
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
  return { content: content || "No response from gateway." };
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

  const authToken = Deno.env.get("JARVIS_AUTH_TOKEN");
  if (authToken) {
    const auth = req.headers.get("Authorization");
    if (!auth || auth !== `Bearer ${authToken}`) {
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
      const params = (body.params || {}) as { name?: string; arguments?: { message?: string } };
      if (params.name !== "jarvis_chat") {
        return jsonResponse({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: `Unknown tool: ${params.name}` },
        }, 400);
      }
      const message = (params.arguments && params.arguments.message) != null
        ? String(params.arguments.message)
        : "";
      if (!message.trim()) {
        return jsonResponse({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Missing argument: message" },
        }, 400);
      }
      const result = await callGateway(
        gatewayUrl,
        gatewayToken,
        [{ role: "user", content: message }],
        "mcp",
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

  if (body.message != null) {
    messages = [{ role: "user", content: String(body.message) }];
  } else if (Array.isArray(body.messages) && body.messages.length > 0) {
    messages = (body.messages as { role?: string; content?: string }[]).map((m) => ({
      role: (m.role ?? "user") as string,
      content: String(m.content ?? ""),
    }));
  } else {
    return jsonResponse(
      { error: "Body must include 'message' (string), 'messages' (array), or MCP JSON-RPC." },
      400
    );
  }

  const result = await callGateway(gatewayUrl, gatewayToken, messages, sessionId, wantStream);

  if (result.err) {
    return jsonResponse({ error: result.err }, 502);
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

  return jsonResponse({ content: result.content || "No response from gateway." });
});
