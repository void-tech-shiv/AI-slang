"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type TranslationResponse = {
  original: string;
  translated: string;
  emotion: string;
  provider: "openai" | "demo";
};

const tones = ["slang", "casual", "gen-z", "funny", "romantic", "aggressive"] as const;

export default function Home() {
  const [text, setText] = useState("Bhai kya scene hai?");
  const [sourceLanguage, setSourceLanguage] = useState("Hinglish");
  const [targetLanguage, setTargetLanguage] = useState("Telugu");
  const [region, setRegion] = useState("Vijayawada");
  const [tone, setTone] = useState<(typeof tones)[number]>("slang");
  const [mode, setMode] = useState("standard");
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          source_language: sourceLanguage,
          target_language: targetLanguage,
          region,
          tone,
          mode,
        }),
      });

      if (!response.ok) throw new Error("Translation failed");
      setResult((await response.json()) as TranslationResponse);
    } catch {
      setError("Backend se connect nahi ho pa raha. FastAPI ko port 8000 par run karo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-xl shadow-xl shadow-violet-950/20">🗣️</div>
            <div>
              <p className="text-lg font-black tracking-tight">AI Slang</p>
              <p className="text-xs text-white/45">translate like locals talk</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/account" className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/65 sm:inline-flex">Account</Link>
            <Link href="/voice" className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/65 sm:inline-flex">Voice</Link>
            <Link href="/chat" className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-semibold text-violet-200">Live chat →</Link>
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/55 md:inline-flex">Phase 6</span>
          </div>
        </nav>

        <section className="grid items-start gap-9 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="pt-4 lg:pt-12">
            <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">Hindi · Hinglish · Telugu slang</span>
            <h1 className="mt-5 max-w-xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
              Same message.<span className="gradient-text block">Same vibe.</span>New language.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/55 sm:text-lg">Robotic translation nahi. AI context, slang aur emotion preserve karke local conversation style me translate karta hai.</p>
            <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
              {["Slang aware", "Tone safe", "Local style"].map((item) => <div key={item} className="glass rounded-2xl px-3 py-4 text-center text-xs font-semibold text-white/70">{item}</div>)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass relative overflow-hidden rounded-[2rem] p-5 shadow-2xl shadow-black/25 sm:p-7">
            <div className="absolute -right-20 -top-20 size-56 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field-label">From<select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} className="field"><option>Auto</option><option>Hinglish</option><option>Hindi</option><option>Telugu</option><option>English</option></select></label>
                <label className="field-label">To<select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="field"><option>Telugu</option><option>Hindi</option><option>Hinglish</option><option>English</option></select></label>
                <label className="field-label">Regional style<select value={region} onChange={(e) => setRegion(e.target.value)} className="field"><option>Vijayawada</option><option>Hyderabad</option><option>Delhi</option><option>Mumbai</option><option>General</option></select></label>
                <label className="field-label">Tone<select value={tone} onChange={(e) => setTone(e.target.value as (typeof tones)[number])} className="field capitalize">{tones.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="field-label">Mode<select value={mode} onChange={(e) => setMode(e.target.value)} className="field capitalize"><option>standard</option><option>couple</option><option>gaming</option><option>meme</option></select></label>
              </div>

              <label className="field-label mt-5">Your message<textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={5} placeholder="Bhai kya scene hai?" className="field resize-none" /></label>
              <div className="mt-2 flex items-center justify-between text-xs text-white/35"><span>Try real college-style Hinglish</span><span>{text.length}/1000</span></div>
              <button type="submit" disabled={loading || !text.trim()} className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#13111c] transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Translating the vibe…" : "Translate naturally →"}</button>
              {error && <p className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
              {result && <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">{result.emotion}</span><span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/40">{result.provider === "openai" ? "AI translation" : "Demo fallback"}</span></div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/30">Natural translation</p><p className="mt-2 text-2xl font-bold leading-relaxed text-white">{result.translated}</p>
                <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs text-white/30">Original</p><p className="mt-1 text-sm text-white/55">{result.original}</p></div>
              </div>}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
