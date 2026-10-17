"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = { type: "message"; sender: string; original: string; translated: string; emotion: string; provider: string };
type PresenceMessage = { type: "presence"; message: string };
type IncomingMessage = ChatMessage | PresenceMessage;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPage() {
  const [room, setRoom] = useState("college-demo");
  const [name, setName] = useState("Shiv");
  const [language, setLanguage] = useState("Hindi");
  const [region, setRegion] = useState("General");
  const [tone, setTone] = useState("slang");
  const [mode, setMode] = useState("standard");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [status, setStatus] = useState<"offline" | "connecting" | "online">("offline");
  const socketRef = useRef<WebSocket | null>(null);
  const wsBase = useMemo(() => apiUrl.replace(/^http/, "ws"), []);

  function connect() {
    socketRef.current?.close(); setMessages([]); setStatus("connecting");
    const params = new URLSearchParams({ name, language, region, tone, mode });
    const token = localStorage.getItem("ai_slang_token");
    if (token) params.set("token", token);
    const socket = new WebSocket(`${wsBase}/ws/chat/${encodeURIComponent(room)}?${params.toString()}`);
    socketRef.current = socket;
    socket.onopen = () => setStatus("online");
    socket.onmessage = (event) => setMessages((current) => [...current, JSON.parse(event.data) as IncomingMessage]);
    socket.onclose = () => setStatus("offline");
    socket.onerror = () => setStatus("offline");
  }

  useEffect(() => () => socketRef.current?.close(), []);

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ text: text.trim() })); setText("");
  }

  return <main className="min-h-screen px-4 py-6 sm:px-8"><div className="mx-auto max-w-6xl">
    <header className="mb-6 flex items-center justify-between"><div><Link href="/" className="text-xs font-semibold text-violet-300">← Translator</Link><h1 className="mt-2 text-3xl font-black tracking-tight">Live translated chat</h1></div><div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/55"><span className={`size-2 rounded-full ${status === "online" ? "bg-emerald-400" : status === "connecting" ? "bg-amber-400" : "bg-white/30"}`} />{status}</div></header>
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="glass rounded-3xl p-5"><p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-white/35">Your chat profile</p><div className="space-y-4">
        <label className="field-label">Room<input className="field" value={room} onChange={(e) => setRoom(e.target.value)} /></label>
        <label className="field-label">Name<input className="field" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field-label">Read messages in<select className="field" value={language} onChange={(e) => setLanguage(e.target.value)}><option>Hindi</option><option>Telugu</option><option>Hinglish</option><option>English</option></select></label>
        <label className="field-label">Regional style<select className="field" value={region} onChange={(e) => setRegion(e.target.value)}><option>General</option><option>Vijayawada</option><option>Hyderabad</option><option>Delhi</option><option>Mumbai</option></select></label>
        <label className="field-label">Tone<select className="field" value={tone} onChange={(e) => setTone(e.target.value)}><option>slang</option><option>casual</option><option>gen-z</option><option>funny</option><option>romantic</option><option>aggressive</option></select></label>
        <label className="field-label">Mode<select className="field" value={mode} onChange={(e) => setMode(e.target.value)}><option>standard</option><option>couple</option><option>gaming</option><option>meme</option></select></label>
        <button onClick={connect} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#13111c]">{status === "online" ? "Reconnect" : "Join room"}</button>
      </div><p className="mt-5 text-xs leading-5 text-white/35">Login kiya hai to saved profile backend use karega. Demo ke liye same room do browser tabs me join karo.</p></aside>
      <section className="glass flex min-h-[650px] flex-col overflow-hidden rounded-3xl"><div className="border-b border-white/10 px-5 py-4"><p className="font-bold">#{room || "room"}</p><p className="text-xs text-white/35">Each receiver gets their own localized translation.</p></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{messages.length === 0 && <div className="flex h-full min-h-80 items-center justify-center text-center text-sm text-white/30">Join the room and send a message.<br />Second tab me same room join karke translation dekho.</div>}{messages.map((message, index) => {
          if (message.type === "presence") return <p key={`${message.message}-${index}`} className="text-center text-xs text-white/30">{message.message}</p>;
          const mine = message.sender === name;
          return <div key={`${message.sender}-${index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-3xl px-4 py-3 ${mine ? "bg-violet-500/25" : "bg-white/8"}`}><div className="mb-1 flex items-center gap-2 text-[11px] text-white/35"><span className="font-bold text-white/55">{message.sender}</span><span>{message.emotion}</span></div><p className="text-base font-semibold leading-6">{message.translated}</p>{!mine && message.translated !== message.original && <p className="mt-2 border-t border-white/10 pt-2 text-xs text-white/35">Original: {message.original}</p>}</div></div>;
        })}</div>
        <form onSubmit={sendMessage} className="flex gap-3 border-t border-white/10 p-4"><input className="field flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder={status === "online" ? "Type in your own language…" : "Join room first"} disabled={status !== "online"} /><button disabled={status !== "online" || !text.trim()} className="rounded-2xl bg-white px-5 font-black text-[#13111c] disabled:opacity-40">Send</button></form>
      </section>
    </div>
  </div></main>;
}
