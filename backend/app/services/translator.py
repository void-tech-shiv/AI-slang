import os
import re
from dataclasses import dataclass

from dotenv import load_dotenv
from openai import OpenAI

from app.prompts import build_translation_prompt

load_dotenv()


@dataclass
class TranslationResult:
    translated: str
    emotion: str
    provider: str


DEMO_TRANSLATIONS = {
    "bhai kya scene hai?": ("Em scene ra?", "casual"),
    "bhai kya scene hai": ("Em scene ra?", "casual"),
    "chill maar": ("Lite teesko ra", "casual"),
    "bakchodi mat kar": ("Over cheyyaku ra", "annoyed"),
    "bhai kidhar hai?": ("Ra ekkada unnav?", "casual"),
    "bhai kidhar hai": ("Ra ekkada unnav?", "casual"),
    "kal bunk kare?": ("Repu bunk cheddama?", "casual"),
    "left se push kar": ("Left nundi push chey ra", "urgent"),
}


def _demo_translate(text: str, target_language: str) -> TranslationResult:
    key = text.strip().lower()
    if target_language.lower() == "telugu" and key in DEMO_TRANSLATIONS:
        translated, emotion = DEMO_TRANSLATIONS[key]
        return TranslationResult(translated, emotion, "demo")
    return TranslationResult(translated=f"[Demo mode] {text}", emotion="neutral", provider="demo")


def _parse_output(output: str) -> tuple[str, str]:
    translation = ""
    emotion = "neutral"
    for line in output.strip().splitlines():
        if line.upper().startswith("TRANSLATION:"):
            translation = line.split(":", 1)[1].strip()
        elif line.upper().startswith("EMOTION:"):
            emotion = line.split(":", 1)[1].strip().lower()
    if not translation:
        translation = re.sub(r"^TRANSLATION:\s*", "", output.strip(), flags=re.I)
    return translation or output.strip(), emotion or "neutral"


def translate_message(
    *,
    text: str,
    source_language: str,
    target_language: str,
    region: str,
    tone: str,
    mode: str = "standard",
    context: list[str] | None = None,
) -> TranslationResult:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _demo_translate(text, target_language)

    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    prompt = build_translation_prompt(
        text=text,
        source_language=source_language,
        target_language=target_language,
        region=region,
        tone=tone,
        mode=mode,
        context=context,
    )
    response = client.responses.create(model=model, input=prompt)
    translated, emotion = _parse_output(response.output_text)
    return TranslationResult(translated, emotion, "openai")
