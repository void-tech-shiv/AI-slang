import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.storage import store

password_hash = PasswordHash.recommended()
security = HTTPBearer(auto_error=False)
ALGORITHM = "HS256"
TOKEN_TTL_DAYS = 7


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_access_token(username: str) -> str:
    secret = os.getenv("JWT_SECRET", "dev-only-change-me")
    expires = datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS)
    return jwt.encode({"sub": username.lower(), "exp": expires}, secret, algorithm=ALGORITHM)


def decode_username(token: str) -> str | None:
    try:
        secret = os.getenv("JWT_SECRET", "dev-only-change-me")
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        return str(subject).lower() if subject else None
    except InvalidTokenError:
        return None


async def current_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    username = decode_username(credentials.credentials)
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = await store.get_user(username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    return user
