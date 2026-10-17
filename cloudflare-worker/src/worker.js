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

function page() {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Slang</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui;background:#0b0b12;color:#fff}main{max-width:720px;margin:auto;padding:24px}.card{background:#151522;border:1px solid #2a2a3d;border-radius:24px;padding:20px;margin:16px 0}h1{font-size:34px;margin:8px 0}.muted{color:#9797aa}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}textarea,input,select,button{width:100%;border-radius:14px;border:1px solid #34344b;background:#0f0f18;color:#fff;padding:13px;font-size:15px}textarea{min-height:110px}button{background:#fff;color:#111;font-weight:800;border:0}.out{font-size:22px;font-weight:700;min-height:54px}.msg{padding:10px 12px;border-radius:14px;background:#202033;margin:8px 0}.tiny{font-size:12px;color:#8f8fa5}@media(max-width:600px){.grid{grid-template-columns:1fr}main{padding:16px}}
</style>
</head>
<body>
<main>
<div class="tiny">CLOUDFLARE WORKERS AI • LIVE</div>
<h1>AI Slang 🔥</h1>
<p class="muted">Translate like locals actually talk.</p>
<section class="card">
<h2>Translator</h2>
<textarea id="text">Bhai kya scene hai?</textarea>
<div class="grid">
<select id="lang"><option>Telugu</option><option>Hindi</option><option>Hinglish</option><option>English</option></select>
<select id="region"><option>Vijayawada</option><option>Hyderabad</option><option>Delhi</option><option>Mumbai</option><option>General</option></select>
<select id="tone"><option>slang</option><option>casual</option><option>gen-z</option><option>funny</option><option>romantic</option></select>
<select id="mode"><option>standard</option><option>couple</option><option>gaming</option><option>meme</option></select>
</div><br>
<button id="translateBtn">Translate →</button>
<p id="status" class="tiny"></p>
<div id="out" class="out"></div>
</section>
<section class="card">
<h2>Live Room Chat</h2>
<div class="grid">
<input id="displayName" value="Shiv" placeholder="Your name">
<input id="room" value="train-demo" placeholder="Room code">
</div><br>
<button id="joinBtn">Join room</button>
<div id="chat"></div>
<div class="grid">
<input id="msg" placeholder="Type message">
<button id="sendBtn">Send</button>
</div>
<p class="tiny">Open same link on another phone/tab, use same room code, choose receiver language above, then chat.</p>
</section>
</main>
<script>
const $=id=>document.getElementById(id);
let ws=null;
let connectionId=0;
function add(m){const d=document.createElement('div');d.className='msg';d.textContent=m;$('chat').appendChild(d);}
async function go(){
  $('status').textContent='Translating…';$('out').textContent='';
  try{
    const r=await fetch('/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:$('text').value,source_language:'Auto',target_language:$('lang').value,region:$('region').value,tone:$('tone').value,mode:$('mode').value})});
    const d=await r.json();$('out').textContent=d.translated||d.detail||'Translation failed';$('status').textContent=d.provider||'';
  }catch(e){$('status').textContent='Failed';}
}
function join(){
  const current=++connectionId;
  if(ws){ws.onopen=ws.onmessage=ws.onerror=ws.onclose=null;try{ws.close();}catch{}}
  $('chat').innerHTML='';
  const displayName=$('displayName').value.trim()||'Anonymous';
  const roomCode=$('room').value.trim()||'default';
  const proto=location.protocol==='https:'?'wss':'ws';
  const q=new URLSearchParams({name:displayName,language:$('lang').value,region:$('region').value,tone:$('tone').value,mode:$('mode').value});
  ws=new WebSocket(proto+'://'+location.host+'/ws/chat/'+encodeURIComponent(roomCode)+'?'+q.toString());
  ws.onopen=()=>{if(current===connectionId)add('Connected ✓ as '+displayName);};
  ws.onmessage=e=>{if(current!==connectionId)return;const d=JSON.parse(e.data);if(d.type==='message')add((d.sender||'Anonymous')+': '+(d.translated||d.original||''));else if(d.message)add(d.message);};
  ws.onerror=()=>{if(current===connectionId)add('Connection error');};
  ws.onclose=()=>{if(current===connectionId)ws=null;};
}
function sendMsg(){const value=$('msg').value.trim();if(ws&&ws.readyState===1&&value){ws.send(JSON.stringify({text:value}));$('msg').value='';}}
$('translateBtn').addEventListener('click',go);
$('joinBtn').addEventListener('click',join);
$('sendBtn').addEventListener('click',sendMsg);
$('msg').addEventListener('keydown',e=>{if(e.key==='Enter')sendMsg();});
</script>
</body>
</html>`;
}

function promptFor({ source_language = "Auto", target_language = "Telugu", region = "General", tone = "slang", mode = "standard", context = [] }) {
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
    const rawName = (url.searchParams.get("name") || "").trim();
    const safeName = rawName && rawName.toLowerCase() !== "undefined" ? rawName : "Anonymous";
    const profile = {
      name: safeName.slice(0, 40),
      language: (url.searchParams.get("language") || "English").slice(0, 40),
      region: (url.searchParams.get("region") || "General").slice(0, 40),
      tone: (url.searchParams.get("tone") || "slang").slice(0, 20),
      mode: (url.searchParams.get("mode") || "standard").slice(0, 20),
    };
    server.serializeAttachment(profile);
    this.ctx.acceptWebSocket(server);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === server) continue;
      try { ws.send(JSON.stringify({ type: "presence", message: `${profile.name} joined` })); } catch {}
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(sender, message) {
    let payload;
    try {
      payload = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      return;
    }
    const text = String(payload.text || "").trim().slice(0, 1000);
    if (!text) return;
    const senderProfile = sender.deserializeAttachment() || { name: "Anonymous" };
    const senderName = senderProfile.name && senderProfile.name !== "undefined" ? senderProfile.name : "Anonymous";
    const sockets = this.ctx.getWebSockets();
    await Promise.all(sockets.map(async (ws) => {
      try {
        const p = ws.deserializeAttachment() || {};
        if (ws === sender) {
          ws.send(JSON.stringify({ type: "message", sender: senderName, original: text, translated: text, emotion: "original", provider: "local" }));
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
        ws.send(JSON.stringify({ type: "message", sender: senderName, ...out }));
      } catch {
        try { ws.send(JSON.stringify({ type: "error", message: "Translation failed" })); } catch {}
      }
    }));
  }

  async webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch {}
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/" && request.method === "GET") return new Response(page(), { headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" } });
    if (url.pathname === "/api" && request.method === "GET") return json({ message: "AI Slang Cloudflare API", status: "live", runtime: "workers-ai", chat: "durable-objects" });
    if (url.pathname === "/health" && request.method === "GET") return json({ status: "ok", runtime: "cloudflare" });
    if (url.pathname === "/translate" && request.method === "POST") {
      try { return json(await translate(env, await request.json())); }
      catch (error) { return json({ detail: error?.message || "Translation failed" }, 502); }
    }
    if (url.pathname.startsWith("/ws/chat/")) {
      const room = url.pathname.split("/").pop() || "default";
      const id = env.CHAT_ROOMS.idFromName(room);
      return env.CHAT_ROOMS.get(id).fetch(request);
    }
    return json({ detail: "Not found" }, 404);
  },
};
