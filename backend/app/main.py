import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import TranslateRequest, TranslateResponse
from app.services.translator import translate_message

load_dotenv()

app = FastAPI(
    title="AI Slang Translator API",
    description="Natural Indian slang and tone-preserving translation API.",
    version="0.1.0",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "AI Slang Translator API", "phase": "1-mvp"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/translate", response_model=TranslateResponse)
def translate(payload: TranslateRequest) -> TranslateResponse:
    try:
        result = translate_message(
            text=payload.text,
            source_language=payload.source_language,
            target_language=payload.target_language,
            region=payload.region,
            tone=payload.tone,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Translation service failed") from exc

    return TranslateResponse(
        original=payload.text,
        translated=result.translated,
        emotion=result.emotion,
        provider=result.provider,
    )
