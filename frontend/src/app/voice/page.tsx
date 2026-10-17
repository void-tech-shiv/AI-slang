"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VoicePage() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Telugu");
  const [region, setRegion] = useState("Vijayawada");
  const [tone, setTone] = useState("slang");
  const [error, setError] = useState("");

  async function startRecording() {
    setError("");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      await processVoice(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function processVoice(blob: Blob) {
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", blob, "voice.webm");
      const transcriptionResponse = await fetch(`${apiUrl}/voice/transcribe`, { method: "POST", body: form });
      const transcription = await transcriptionResponse.json();
      if (!transcriptionResponse.ok) throw new Error(transcription.detail || "Transcription failed");
      setTranscript(transcription.text);

      const translationResponse = await fetch(`${apiUrl}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcription.text, source_language: "Auto", target_language: targetLanguage, region, tone }),
      });
      const translation = await translationResponse.json();
      if (!translationResponse.ok) throw new Error(translation.detail || "Translation failed");
      setTranslated(translation.translated);
      speak(translation.translated, targetLanguage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice translation failed");
    } finally {
      setProcessing(false);
    }
  }

  function speak(text: string, language: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "Telugu" ? "te-IN" : language === "Hindi" || language === "Hinglish" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  }

  return <main className="min-h-screen px-4 py-8"><div className="mx-auto max-w-3xl">
    <div className="mb-8 flex items-center justify-between"><div><Link href="/" className="text-xs font-semibold text-violet-300">← Home</Link><h1 className="mt-2 text-4xl font-black">Voice slang translator</h1><p className="mt-2 text-sm text-white/40">Speak naturally. AI transcribes + translates. Browser speaks it back.</p></div><Link href="/chat" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold">Live chat</Link></div>

    <div className="glass rounded-[2rem] p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field-label">Translate to<select className="field" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}><option>Telugu</option><option>Hindi</option><option>Hinglish</option><option>English</option></select></label>
        <label className="field-label">Region<select className="field" value={region} onChange={(e) => setRegion(e.target.value)}><option>Vijayawada</option><option>Hyderabad</option><option>Delhi</option><option>Mumbai</option><option>General</option></select></label>
        <label className="field-label">Tone<select className="field" value={tone} onChange={(e) => setTone(e.target.value)}><option>slang</option><option>casual</option><option>gen-z</option><option>funny</option><option>romantic</option></select></label>
      </div>

      <div className="mt-8 flex flex-col items-center py-8 text-center">
        <button disabled={processing} onClick={recording ? stopRecording : startRecording} className={`flex size-32 items-center justify-center rounded-full text-4xl shadow-2xl transition ${recording ? "animate-pulse bg-red-500/80" : "bg-white text-black hover:scale-105"}`}>{recording ? "■" : "🎙️"}</button>
        <p className="mt-5 font-bold">{processing ? "Understanding your vibe…" : recording ? "Recording… tap to stop" : "Tap to speak"}</p>
        <p className="mt-1 text-xs text-white/35">Best with short conversational messages.</p>
      </div>

      {error && <p className="rounded-2xl border border-red-400/15 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
      {transcript && <div className="mt-4 rounded-3xl bg-black/20 p-5"><p className="text-xs uppercase tracking-widest text-white/30">You said</p><p className="mt-2 text-lg text-white/70">{transcript}</p></div>}
      {translated && <div className="mt-4 rounded-3xl border border-violet-400/15 bg-violet-400/10 p-5"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-widest text-violet-200/60">Natural translation</p><button onClick={() => speak(translated, targetLanguage)} className="text-sm">🔊 Replay</button></div><p className="mt-2 text-2xl font-black">{translated}</p></div>}
    </div>
  </div></main>;
}
