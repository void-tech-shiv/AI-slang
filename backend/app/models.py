from typing import Literal

from pydantic import BaseModel, Field


Tone = Literal["casual", "slang", "romantic", "funny", "aggressive", "gen-z"]


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    source_language: str = Field(default="Auto", min_length=2, max_length=40)
    target_language: str = Field(default="Telugu", min_length=2, max_length=40)
    region: str = Field(default="Vijayawada", min_length=2, max_length=60)
    tone: Tone = "slang"


class TranslateResponse(BaseModel):
    original: str
    translated: str
    emotion: str
    provider: Literal["openai", "demo"]
