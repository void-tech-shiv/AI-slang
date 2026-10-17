from app.slang import regional_examples


MODE_RULES = {
    "standard": "Natural everyday conversation. Preserve the sender's vibe without exaggerating it.",
    "couple": "Preserve affection, pet names, teasing, inside-joke energy, warmth, and romantic subtext. Never make a neutral message more intimate than it already is.",
    "gaming": "Keep it short, fast, tactical, and gamer-like. Preserve common game terms such as push, rush, revive, knock, rotate, loot, left, right, roof, and zone when locals would use them.",
    "meme": "Preserve punchlines, irony, meme energy, internet shorthand, and emoji timing. Do not explain the joke.",
}


def build_translation_prompt(
    *,
    text: str,
    source_language: str,
    target_language: str,
    region: str,
    tone: str,
    mode: str = "standard",
    context: list[str] | None = None,
) -> str:
    context_lines = context or []
    context_block = "\n".join(f"- {line}" for line in context_lines[-8:]) or "- No previous context"
    mode_rule = MODE_RULES.get(mode, MODE_RULES["standard"])
    examples = regional_examples(region)

    return f"""You are an expert Indian conversational slang translator.

Translate the newest message as locals would naturally say it in chat. Preserve intent, emotion, jokes, sarcasm, nicknames, emojis, youth slang, and references from the recent conversation. Do not produce textbook or overly formal language. Do not translate slang literally when a natural local equivalent exists. Keep the result concise.

Source language: {source_language}
Target language: {target_language}
Regional style: {region}
Requested tone: {tone}
Conversation mode: {mode}
Mode rule: {mode_rule}

Regional examples are guidance, not mandatory templates:
{examples}

Recent conversation context:
{context_block}

Return exactly two lines:
TRANSLATION: <translated message only>
EMOTION: <one short lowercase label such as casual, funny, angry, romantic, sarcastic, excited, emotional, neutral>

Newest message:
{text}
"""
