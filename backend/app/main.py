import asyncio
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.models import TranslateRequest, TranslateResponse
from app.realtime.manager import ClientProfile, ConnectedClient, manager
from app.services.translator import translate_message

load_dotenv()

app = FastAPI(
    title="AI Slang Translator API",
    description="Natural Indian slang and tone-preserving translation API.",
    version="0.2.0",
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
    return {"message": "AI Slang Translator API", "phase": "2-realtime-chat"}


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


@app.websocket("/ws/chat/{room_id}")
async def chat_socket(websocket: WebSocket, room_id: str) -> None:
    profile = ClientProfile(
        name=websocket.query_params.get("name", "Anonymous")[:40],
        language=websocket.query_params.get("language", "English")[:40],
        region=websocket.query_params.get("region", "General")[:60],
        tone=websocket.query_params.get("tone", "slang")[:20],
    )
    client = ConnectedClient(socket=websocket, profile=profile)
    await manager.connect(room_id, client)

    await _broadcast_presence(room_id, f"{profile.name} joined")

    try:
        while True:
            payload = await websocket.receive_json()
            text = str(payload.get("text", "")).strip()[:1000]
            if not text:
                continue

            await _broadcast_message(
                room_id=room_id,
                sender_socket=websocket,
                sender_profile=profile,
                text=text,
            )
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await _broadcast_presence(room_id, f"{profile.name} left")


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
            result = await asyncio.to_thread(
                translate_message,
                text=text,
                source_language="Auto",
                target_language=connected.profile.language,
                region=connected.profile.region,
                tone=connected.profile.tone,
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
