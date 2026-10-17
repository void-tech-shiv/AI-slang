import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type TranslationResponse = {
  original: string;
  translated: string;
  emotion: string;
  provider: "openai" | "demo";
};

const languages = ["Telugu", "Hindi", "Hinglish", "English"] as const;
const regions = ["Vijayawada", "Hyderabad", "Delhi", "Mumbai", "General"] as const;
const tones = ["slang", "casual", "gen-z", "funny", "romantic", "aggressive"] as const;
const modes = ["standard", "couple", "gaming", "meme"] as const;

export default function App() {
  const [text, setText] = useState("Bhai kya scene hai?");
  const [targetLanguage, setTargetLanguage] = useState<(typeof languages)[number]>("Telugu");
  const [region, setRegion] = useState<(typeof regions)[number]>("Vijayawada");
  const [tone, setTone] = useState<(typeof tones)[number]>("slang");
  const [mode, setMode] = useState<(typeof modes)[number]>("standard");
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = useMemo(
    () => (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000").replace(/\/$/, ""),
    [],
  );

  async function translate() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          source_language: "Auto",
          target_language: targetLanguage,
          region,
          tone,
          mode,
          context: [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Translation failed");
      setResult(data as TranslationResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Backend se connect nahi ho pa raha. API URL check karo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0910" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.logo}><Text style={styles.logoText}>🗣️</Text></View>
            <View style={styles.flex}>
              <Text style={styles.brand}>AI Slang</Text>
              <Text style={styles.tagline}>translate like locals talk</Text>
            </View>
            <View style={styles.phase}><Text style={styles.phaseText}>APK · P6</Text></View>
          </View>

          <Text style={styles.eyebrow}>INDIAN SLANG TRANSLATOR</Text>
          <Text style={styles.hero}>Same message.{"\n"}<Text style={styles.heroAccent}>Same vibe.</Text>{"\n"}New language.</Text>
          <Text style={styles.subtitle}>Textbook translation nahi. Emotion, slang aur local style preserve karo.</Text>

          <View style={styles.card}>
            <Section title="Translate to">
              <ChipRow options={languages} value={targetLanguage} onChange={setTargetLanguage} />
            </Section>
            <Section title="Regional style">
              <ChipRow options={regions} value={region} onChange={setRegion} />
            </Section>
            <Section title="Tone">
              <ChipRow options={tones} value={tone} onChange={setTone} />
            </Section>
            <Section title="Conversation mode">
              <ChipRow options={modes} value={mode} onChange={setMode} />
            </Section>

            <Text style={styles.label}>YOUR MESSAGE</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Bhai kya scene hai?"
              placeholderTextColor="#625d6c"
              multiline
              maxLength={1000}
              style={styles.input}
            />
            <View style={styles.counterRow}>
              <Text style={styles.hint}>Hindi, Hinglish, Telugu ya mixed text</Text>
              <Text style={styles.hint}>{text.length}/1000</Text>
            </View>

            <Pressable
              onPress={translate}
              disabled={!text.trim() || loading}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, (!text.trim() || loading) && styles.disabled]}
            >
              {loading ? <ActivityIndicator color="#18131f" /> : <Text style={styles.primaryButtonText}>Translate naturally →</Text>}
            </Pressable>

            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>

          {result && (
            <View style={styles.resultCard}>
              <View style={styles.badgeRow}>
                <View style={styles.emotionBadge}><Text style={styles.emotionText}>{result.emotion.toUpperCase()}</Text></View>
                <Text style={styles.provider}>{result.provider === "openai" ? "AI translation" : "Demo fallback"}</Text>
              </View>
              <Text style={styles.resultLabel}>NATURAL TRANSLATION</Text>
              <Text style={styles.translation}>{result.translated}</Text>
              <View style={styles.divider} />
              <Text style={styles.originalLabel}>Original</Text>
              <Text style={styles.original}>{result.original}</Text>
            </View>
          )}

          <Text style={styles.footer}>Web + Android · Same FastAPI backend</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ChipRowProps<T extends readonly string[]> = {
  options: T;
  value: T[number];
  onChange: (value: T[number]) => void;
};

function ChipRow<T extends readonly string[]>({ options, value, onChange }: ChipRowProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          style={[styles.chip, option === value && styles.chipSelected]}
        >
          <Text style={[styles.chipText, option === value && styles.chipTextSelected]}>{option}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b0910" },
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 36 },
  logo: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#f9f7ff", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 22 },
  brand: { color: "#fff", fontSize: 19, fontWeight: "900" },
  tagline: { color: "#777180", fontSize: 11, marginTop: 2 },
  phase: { borderWidth: 1, borderColor: "#2c2733", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  phaseText: { color: "#8d8796", fontSize: 10, fontWeight: "800" },
  eyebrow: { color: "#b8a7ff", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  hero: { color: "#fff", fontSize: 46, lineHeight: 49, fontWeight: "900", letterSpacing: -1.8, marginTop: 12 },
  heroAccent: { color: "#d9c8ff" },
  subtitle: { color: "#90899a", fontSize: 15, lineHeight: 23, marginTop: 16, marginBottom: 26 },
  card: { borderWidth: 1, borderColor: "#28232f", borderRadius: 28, backgroundColor: "#121018", padding: 18 },
  section: { marginBottom: 18 },
  label: { color: "#777180", fontSize: 10, fontWeight: "900", letterSpacing: 1.15, marginBottom: 9 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: "#302a38", backgroundColor: "#17131d" },
  chipSelected: { backgroundColor: "#eee8ff", borderColor: "#eee8ff" },
  chipText: { color: "#aaa3b2", fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  chipTextSelected: { color: "#17131d" },
  input: { minHeight: 126, borderWidth: 1, borderColor: "#312b39", borderRadius: 20, backgroundColor: "#0c0a10", color: "#fff", padding: 15, fontSize: 16, lineHeight: 23, textAlignVertical: "top" },
  counterRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 8 },
  hint: { color: "#57515f", fontSize: 10 },
  primaryButton: { height: 54, marginTop: 18, borderRadius: 18, backgroundColor: "#f4f0ff", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#18131f", fontWeight: "900", fontSize: 14 },
  pressed: { transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  error: { marginTop: 14, color: "#ffb4b4", fontSize: 12, lineHeight: 18 },
  resultCard: { marginTop: 16, borderWidth: 1, borderColor: "#35294b", borderRadius: 28, backgroundColor: "#15101e", padding: 20 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  emotionBadge: { borderRadius: 999, backgroundColor: "#183226", paddingHorizontal: 9, paddingVertical: 5 },
  emotionText: { color: "#8be8b7", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  provider: { color: "#6d6675", fontSize: 10 },
  resultLabel: { color: "#6d6675", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 18 },
  translation: { color: "#fff", fontSize: 26, lineHeight: 35, fontWeight: "900", marginTop: 7 },
  divider: { height: 1, backgroundColor: "#2a2431", marginVertical: 18 },
  originalLabel: { color: "#5d5765", fontSize: 10 },
  original: { color: "#928b9b", fontSize: 13, lineHeight: 19, marginTop: 5 },
  footer: { color: "#4f4957", textAlign: "center", fontSize: 10, marginTop: 24 },
});
