import os
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from pymongo import AsyncMongoClient


class AppStore:
    def __init__(self) -> None:
        self._mongo_uri = os.getenv("MONGODB_URI", "").strip()
        self._db_name = os.getenv("MONGODB_DB", "ai_slang")
        self._client: AsyncMongoClient | None = None
        self._memory_users: dict[str, dict[str, Any]] = {}
        self._memory_messages: list[dict[str, Any]] = []

    @property
    def mode(self) -> str:
        return "mongodb" if self._mongo_uri else "memory"

    def _db(self):
        if not self._mongo_uri:
            return None
        if self._client is None:
            self._client = AsyncMongoClient(self._mongo_uri)
        return self._client[self._db_name]

    async def create_user(self, user: dict[str, Any]) -> bool:
        username = user["username"].lower()
        user = {**user, "username": username}
        db = self._db()
        if db is None:
            if username in self._memory_users:
                return False
            self._memory_users[username] = deepcopy(user)
            return True

        existing = await db.users.find_one({"username": username})
        if existing:
            return False
        await db.users.insert_one(user)
        return True

    async def get_user(self, username: str) -> dict[str, Any] | None:
        username = username.lower()
        db = self._db()
        if db is None:
            user = self._memory_users.get(username)
            return deepcopy(user) if user else None

        user = await db.users.find_one({"username": username}, {"_id": 0})
        return user

    async def update_preferences(self, username: str, preferences: dict[str, str]) -> dict[str, Any] | None:
        username = username.lower()
        db = self._db()
        if db is None:
            user = self._memory_users.get(username)
            if not user:
                return None
            user.update(preferences)
            return deepcopy(user)

        await db.users.update_one({"username": username}, {"$set": preferences})
        return await db.users.find_one({"username": username}, {"_id": 0})

    async def save_message(self, message: dict[str, Any]) -> None:
        doc = {**message, "created_at": message.get("created_at") or datetime.now(timezone.utc).isoformat()}
        db = self._db()
        if db is None:
            self._memory_messages.append(deepcopy(doc))
            self._memory_messages = self._memory_messages[-2000:]
            return
        await db.messages.insert_one(doc)

    async def get_messages(self, room_id: str, limit: int = 50) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 100))
        db = self._db()
        if db is None:
            matches = [m for m in self._memory_messages if m.get("room_id") == room_id]
            return deepcopy(matches[-limit:])

        cursor = db.messages.find({"room_id": room_id}, {"_id": 0}).sort("created_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        docs.reverse()
        return docs


store = AppStore()
