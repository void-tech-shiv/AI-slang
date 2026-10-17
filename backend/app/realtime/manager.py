from dataclasses import dataclass

from fastapi import WebSocket


@dataclass
class ClientProfile:
    name: str
    language: str
    region: str
    tone: str
    mode: str = "standard"


@dataclass
class ConnectedClient:
    socket: WebSocket
    profile: ClientProfile


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, list[ConnectedClient]] = {}

    async def connect(self, room_id: str, client: ConnectedClient) -> None:
        await client.socket.accept()
        self.rooms.setdefault(room_id, []).append(client)

    def disconnect(self, room_id: str, socket: WebSocket) -> None:
        clients = self.rooms.get(room_id, [])
        self.rooms[room_id] = [client for client in clients if client.socket is not socket]
        if not self.rooms[room_id]:
            self.rooms.pop(room_id, None)

    def clients(self, room_id: str) -> list[ConnectedClient]:
        return list(self.rooms.get(room_id, []))


manager = ConnectionManager()
