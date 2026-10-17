const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function promptFor({
  source_language = "Auto",
  target_language = "Telugu",
  region = "General",
  tone = "slang",
  mode = "standard",
  context = [],
}) {
  return [
    "You are AI Slang, an Indian local-conversation translator.",
    "Translate like real young locals talk, not textbook language.",
    "Preserve emotion, slang, sarcasm, jokes, intensity and emojis.",
    "Never explain. Return only the translated message.",
    `Source: ${source_language}. Target: ${target_language}. Region/style: ${region}. Tone: ${tone}. Conversation mode: ${mode}.`,
    context?.length ? `Recent context: ${context.slice(-6).join(" | ")}` : "",
  ].filter(Boolean).join("\n");
}

async function translate(env, payload) {
  const text = String(payload.text || "").trim().slice(0, 1500);
  if (!text) throw new Error("Message is empty");

  const result = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: promptFor(payload) },
      { role: "user", content: text },
    ],
  });

  const translated = (result && (result.response || result.result?.response)) || "";
  return {
    original: text,
    translated: String(translated).trim() || text,
    emotion: payload.tone || "slang",
    provider: "cloudflare-workers-ai",
  };
}

export class ChatRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const url = new URL(request.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const profile = {
      name: (url.searchParams.get("name") || "Anonymous").slice(0, 40),
      language: (url.searchParams.get("language") || "English").slice(0, 40),
      region: (url.searchParams.get("region") || "General").slice(0, 40),
      tone: (url.searchParams.get("tone") || "slang").slice(0, 20),
      mode: (url.searchParams.get("mode") || "standard").slice(0, 20),
    };

    server.serializeAttachment(profile);
    this.ctx.acceptWebSocket(server);

    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(JSON.stringify({ type: "presence", message: `${profile.name} joined` }));
      } catch {}
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(sender, message) {
    let payload;
    try {
      payload = JSON.parse(
        typeof message === "string" ? message : new TextDecoder().decode(message),
      );
    } catch {
      return;
    }

    const text = String(payload.text || "").trim().slice(0, 1000);
    if (!text) return;

    const senderProfile = sender.deserializeAttachment() || { name: "Anonymous" };
    const sockets = this.ctx.getWebSockets();

    await Promise.all(
      sockets.map(async (ws) => {
        try {
          const p = ws.deserializeAttachment() || {};

          if (ws === sender) {
            ws.send(
              JSON.stringify({
                type: "message",
                sender: senderProfile.name,
                original: text,
                translated: text,
                emotion: "original",
                provider: "local",
              }),
            );
            return;
          }

          const out = await translate(this.env, {
            text,
            source_language: "Auto",
            target_language: p.language || "English",
            region: p.region || "General",
            tone: p.tone || "slang",
            mode: p.mode || "standard",
            context: [],
          });

          ws.send(JSON.stringify({ type: "message", sender: senderProfile.name, ...out }));
        } catch {
          try {
            ws.send(JSON.stringify({ type: "error", message: "Translation failed" }));
          } catch {}
        }
      }),
    );
  }

  async webSocketClose(ws, code, reason) {
    try {
      ws.close(code, reason);
    } catch {}
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return json({
        message: "AI Slang Cloudflare API",
        status: "live",
        runtime: "workers-ai",
        chat: "durable-objects",
      });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ status: "ok", runtime: "cloudflare" });
    }

    if (url.pathname === "/translate" && request.method === "POST") {
      try {
        return json(await translate(env, await request.json()));
      } catch (error) {
        return json({ detail: error?.message || "Translation failed" }, 502);
      }
    }

    if (url.pathname.startsWith("/ws/chat/")) {
      const room = url.pathname.split("/").pop() || "default";
      const id = env.CHAT_ROOMS.idFromName(room);
      return env.CHAT_ROOMS.get(id).fetch(request);
    }

    return json({ detail: "Not found" }, 404);
  },
};
