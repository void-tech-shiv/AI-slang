"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type User = { username: string; display_name: string; language: string; region: string; tone: string };

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState("Hinglish");
  const [region, setRegion] = useState("General");
  const [tone, setTone] = useState("slang");
  const [message, setMessage] = useState("");

  async function loadMe(token: string) {
    const response = await fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const me = (await response.json()) as User;
    setUser(me); setLanguage(me.language); setRegion(me.region); setTone(me.tone);
  }

  useEffect(() => { const token = localStorage.getItem("ai_slang_token"); if (token) void loadMe(token); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("");
    const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
    const body = mode === "register" ? { username, password, display_name: displayName || username, language, region, tone } : { username, password };
    const response = await fetch(`${apiUrl}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.detail || "Request failed"); return; }
    localStorage.setItem("ai_slang_token", data.access_token);
    await loadMe(data.access_token); setMessage("Account ready ✓");
  }

  async function savePreferences() {
    const token = localStorage.getItem("ai_slang_token"); if (!token) return;
    const response = await fetch(`${apiUrl}/users/me/preferences`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ language, region, tone }) });
    if (response.ok) { setUser((await response.json()) as User); setMessage("Preferences saved ✓"); }
  }

  function logout() { localStorage.removeItem("ai_slang_token"); setUser(null); setMessage("Logged out"); }

  return <main className="min-h-screen px-4 py-8"><div className="mx-auto max-w-xl">
    <div className="mb-6 flex items-center justify-between"><div><Link href="/" className="text-xs font-semibold text-violet-300">← Home</Link><h1 className="mt-2 text-3xl font-black">Your AI Slang profile</h1></div><Link href="/chat" className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#13111c]">Chat</Link></div>
    {!user ? <form onSubmit={submit} className="glass rounded-3xl p-6"><div className="mb-5 flex rounded-2xl bg-black/20 p-1">{(["register", "login"] as const).map((item) => <button type="button" key={item} onClick={() => setMode(item)} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${mode === item ? "bg-white text-black" : "text-white/45"}`}>{item}</button>)}</div><div className="space-y-4">
      <label className="field-label">Username<input className="field" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
      {mode === "register" && <label className="field-label">Display name<input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>}
      <label className="field-label">Password<input type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {mode === "register" && <PreferenceFields language={language} setLanguage={setLanguage} region={region} setRegion={setRegion} tone={tone} setTone={setTone} />}
      <button className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">{mode === "register" ? "Create account" : "Login"}</button>
    </div></form> : <div className="glass rounded-3xl p-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs text-white/35">Signed in as</p><p className="text-xl font-black">{user.display_name}</p><p className="text-xs text-white/35">@{user.username}</p></div><button onClick={logout} className="text-xs font-bold text-red-300">Logout</button></div><PreferenceFields language={language} setLanguage={setLanguage} region={region} setRegion={setRegion} tone={tone} setTone={setTone} /><button onClick={savePreferences} className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-black text-black">Save preferences</button></div>}
    {message && <p className="mt-4 text-center text-sm text-white/55">{message}</p>}
  </div></main>;
}

function PreferenceFields({ language, setLanguage, region, setRegion, tone, setTone }: { language: string; setLanguage: (v: string) => void; region: string; setRegion: (v: string) => void; tone: string; setTone: (v: string) => void }) {
  return <><label className="field-label">Preferred language<select className="field" value={language} onChange={(e) => setLanguage(e.target.value)}><option>Hinglish</option><option>Hindi</option><option>Telugu</option><option>English</option></select></label><label className="field-label">Regional style<select className="field" value={region} onChange={(e) => setRegion(e.target.value)}><option>General</option><option>Vijayawada</option><option>Hyderabad</option><option>Delhi</option><option>Mumbai</option></select></label><label className="field-label">Tone<select className="field" value={tone} onChange={(e) => setTone(e.target.value)}><option>slang</option><option>casual</option><option>gen-z</option><option>funny</option><option>romantic</option><option>aggressive</option></select></label></>;
}
