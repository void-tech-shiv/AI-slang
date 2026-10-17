import os
import tempfile
from pathlib import Path

from fastapi import HTTPException, UploadFile
from openai import OpenAI


async def transcribe_upload(file: UploadFile) -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is required for voice transcription")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file is too large")

    suffix = Path(file.filename or "voice.webm").suffix or ".webm"
    path = ""
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
            temp.write(data)
            path = temp.name

        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe")
        with open(path, "rb") as audio:
            result = client.audio.transcriptions.create(model=model, file=audio)
        text = getattr(result, "text", "").strip()
        if not text:
            raise HTTPException(status_code=502, detail="No speech detected")
        return text
    finally:
        if path and os.path.exists(path):
            os.remove(path)
