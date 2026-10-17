import asyncio
import os
from datetime import datetime, timezone
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware

from app.auth import create_access_token, current_user, decode_username, hash_password, verify_password
from app.models import (
    LoginRequest,
    MessagePublic,
    PreferencesUpdate,
    RegisterRequest,
    TokenResponse,
    TranslateRequest,
    TranslateResponse,
    UserPublic,
)
from app.realtime.manager import ClientProfile, ConnectedClient, manager
from app.services.translator import translate_message
from app.storage import store
from app.voice import transcribe_upload

load_dotenv()

app = FastAPI(
    title="AI Slang Translator API",
    description="Natural Indian slang and tone-preserving translation API.",
    version="0.5.0",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def public_user(user: dict) -> UserPublic:
    return UserPublic(
        username=user["username"],
        display_name=user["display_name"],
        language=user.get("language", "Hinglish"),
        region=user.get("region", "General"),
        tone=user.get("tone", "slang"),
        mode=user.get("mode", "standard"),
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "AI Slang Translator API", "phase": "5-context-modes", "storage": store.mode}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "storage": store.mode}


@app.post("/translate", response_model=TranslateResponse)
def translate(payload: TranslateRequest) -> TranslateResponse:
    try:
        result = translate_message(
            text=payload.text,
            source_language=payload.source_language,
            target_language=payload.target_language,
            region=payload.region,
            tone=payload.tone,
            mode=payload.mode,
            context=payload.context,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Translation service failed") from exc

    return TranslateResponse(
        original=payload.text,
        translated=result.translated,
        emotion=result.emotion,
        provider=result.provider,
    )


@app.post("/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...)) -> dict[str, str]:
    text = await transcribe_upload(file)
    return {"text": text}


@app.post("/auth/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest) -> TokenResponse:
    created = await store.create_user(
        {
            "username": payload.username.lower(),
            "display_name": payload.display_name,
            "password_hash": hash_password(payload.password),
            "language": payload.language,
            "region": payload.region,
            "tone": payload.tone,
            "mode": payload.mode,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    if not created:
        raise HTTPException(status_code=409, detail="Username already exists")
    return TokenResponse(access_token=create_access_token(payload.username))


@app.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    user = await store.get_user(payload.username)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return TokenResponse(access_token=create_access_token(user["username"]))


@app.get("/users/me", response_model=UserPublic)
async def me(user: Annotated[dict, Depends(current_user)]) -> UserPublic:
    return public_user(user)


@app.put("/users/me/preferences", response_model=UserPublic)
async def update_preferences(
    payload: PreferencesUpdate,
    user: Annotated[dict, Depends(current_user)],
) -> UserPublic:
    updated = await store.update_preferences(user["username"], payload.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return public_user(updated)


@app.get("/messages/{room_id}", response_model=list[MessagePublic])
async def room_history(
    room_id: str,
    user: Annotated[dict, Depends(current_user)],
    limit: int = 50,
) -> list[MessagePublic]:
    del user
    messages = await store.get_messages(room_id, limit)
    return [MessagePublic(**message) for message in messages]


@app.websocket("/ws/chat/{room_id}")
async def chat_socket(websocket: WebSocket, room_id: str) -> None:
    profile = await _resolve_socket_profile(websocket)
    client = ConnectedClient(socket=websocket, profile=profile)
    await manager.connect(room_id, client)
    await _broadcast_presence(room_id, f"{profile.name} joined")

    try:
        while True:
            payload = await websocket.receive_json()
            text = str(payload.get("text", "")).strip()[:1000]
            if not text:
                continue

            await store.save_message(
                {
                    "room_id": room_id,
                    "sender": profile.name,
                    "original": text,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            await _broadcast_message(
                room_id=room_id,
                sender_socket=websocket,
                sender_profile=profile,
                text=text,
            )
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await _broadcast_presence(room_id, f"{profile.name} left")


async def _resolve_socket_profile(websocket: WebSocket) -> ClientProfile:
    token = websocket.query_params.get("token", "")
    username = decode_username(token) if token else None
    if username:
        user = await store.get_user(username)
        if user:
            return ClientProfile(
                name=user["display_name"],
                language=user.get("language", "English"),
                region=user.get("region", "General"),
                tone=user.get("tone", "slang"),
                mode=user.get("mode", "standard"),
            )

    return ClientProfile(
        name=websocket.query_params.get("name", "Anonymous")[:40],
        language=websocket.query_params.get("language", "English")[:40],
        region=websocket.query_params.get("region", "General")[:60],
        tone=websocket.query_params.get("tone", "slang")[:20],
        mode=websocket.query_params.get("mode", "standard")[:20],
    )


async def _broadcast_presence(room_id: str, message: str) -> None:
    for connected in manager.clients(room_id):
        try:
            await connected.socket.send_json({"type": "presence", "message": message})
        except RuntimeError:
            manager.disconnect(room_id, connected.socket)


async def _broadcast_message(
    *,
    room_id: str,
    sender_socket: WebSocket,
    sender_profile: ClientProfile,
    text: str,
) -> None:
    clients = manager.clients(room_id)

    async def deliver(connected: ConnectedClient) -> None:
        if connected.socket is sender_socket:
            translated = text
            emotion = "original"
            provider = "local"
        else:
            history = await store.get_messages(room_id, 8)
            context = [item["original"] for item in history[:-1]]
            result = await asyncio.to_thread(
                translate_message,
                text=text,
                source_language="Auto",
                target_language=connected.profile.language,
                region=connected.profile.region,
                tone=connected.profile.tone,
                mode=connected.profile.mode,
                context=context,
            )
            translated = result.translated
            emotion = result.emotion
            provider = result.provider

        await connected.socket.send_json(
            {
                "type": "message",
                "sender": sender_profile.name,
                "original": text,
                "translated": translated,
                "emotion": emotion,
                "provider": provider,
            }
        )

    results = await asyncio.gather(*(deliver(client) for client in clients), return_exceptions=True)
    for connected, result in zip(clients, results):
        if isinstance(result, Exception):
            manager.disconnect(room_id, connected.socket)
