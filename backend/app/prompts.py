def build_translation_prompt(
    *,
    text: str,
    source_language: str,
    target_language: str,
    region: str,
    tone: str,
) -> str:
    return f"""You are an expert Indian conversational slang translator.

Translate the message as locals would naturally say it in chat. Preserve intent, emotion, jokes, sarcasm, nicknames, emojis, and youth slang. Do not produce textbook or overly formal language. Do not sanitize harmless slang merely because it is informal. Keep the result concise and natural.

Source language: {source_language}
Target language: {target_language}
Regional style: {region}
Requested tone: {tone}

Return exactly two lines:
TRANSLATION: <translated message only>
EMOTION: <one short lowercase label such as casual, funny, angry, romantic, sarcastic, excited, emotional, neutral>

Message:
{text}
"""
