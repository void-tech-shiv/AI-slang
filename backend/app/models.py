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


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=40)
    language: str = Field(default="Hinglish", min_length=2, max_length=40)
    region: str = Field(default="General", min_length=2, max_length=60)
    tone: Tone = "slang"


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PreferencesUpdate(BaseModel):
    language: str = Field(min_length=2, max_length=40)
    region: str = Field(min_length=2, max_length=60)
    tone: Tone


class UserPublic(BaseModel):
    username: str
    display_name: str
    language: str
    region: str
    tone: str


class MessagePublic(BaseModel):
    room_id: str
    sender: str
    original: str
    created_at: str
