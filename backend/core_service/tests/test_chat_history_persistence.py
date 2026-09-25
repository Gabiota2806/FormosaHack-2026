import os
import pytest
from fastapi.testclient import TestClient
from jose import jwt

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.core.security import SECRET_KEY, ALGORITHM
from app import database as app_db
from app.main import app
from app.models.chat import ChatHistoryEntry, ChatSession
from app.repositories.chat_history_repository import ChatHistoryRepository

client = TestClient(app)


def _token(user_id=888, email="persist_user@formosa.gob.ar"):
    return jwt.encode({"sub": email, "user_id": user_id, "role": "user"}, SECRET_KEY, algorithm=ALGORITHM)


def test_analyze_message_persists_with_session_key_in_body():
    session_key = "persist-session-body-01"
    payload = {
        "message": "URGENTE Banco Formosa: Bloqueo de cuenta bancaria. Ingrese a link sospechoso.",
        "session_key": session_key,
    }

    res = client.post("/api/core/chat/message", json=payload)
    assert res.status_code == 200

    repo = ChatHistoryRepository()
    db = app_db.SessionLocal()
    try:
        session = repo.get_session_by_key(db, session_key)
        assert session is not None
        entry = db.query(ChatHistoryEntry).filter(ChatHistoryEntry.session_id == session.id).first()
        assert entry is not None
        assert entry.message == payload["message"]
        assert entry.risk_level in ["HIGH", "MEDIUM", "LOW"]
    finally:
        db.close()


def test_analyze_message_persists_with_header_session_key():
    session_key = "persist-session-header-02"
    payload = {
        "message": "Aviso de Banco Formosa sobre mantenimiento de clave token.",
    }
    headers = {"X-Session-Key": session_key}

    res = client.post("/api/core/chat/message", json=payload, headers=headers)
    assert res.status_code == 200

    repo = ChatHistoryRepository()
    db = app_db.SessionLocal()
    try:
        session = repo.get_session_by_key(db, session_key)
        assert session is not None
        entry = db.query(ChatHistoryEntry).filter(ChatHistoryEntry.session_id == session.id).first()
        assert entry is not None
        assert entry.message == payload["message"]
    finally:
        db.close()


def test_analyze_message_persists_with_jwt_user():
    user_id = 999
    token = _token(user_id=user_id)
    payload = {
        "message": "Hola Banco Formosa, me llegó un mensaje que pide mi contraseña.",
    }
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/core/chat/message", json=payload, headers=headers)
    assert res.status_code == 200

    repo = ChatHistoryRepository()
    db = app_db.SessionLocal()
    try:
        history = repo.list_by_user(db, user_id=user_id)
        assert history["total"] >= 1
        assert history["items"][0].user_id == user_id
    finally:
        db.close()


def test_analyze_message_without_session_or_token_does_not_persist():
    payload = {
        "message": "Consulta anónima sin tracking ni session key.",
    }
    db = app_db.SessionLocal()
    try:
        before_count = db.query(ChatHistoryEntry).filter(ChatHistoryEntry.message == payload["message"]).count()
        res = client.post("/api/core/chat/message", json=payload)
        assert res.status_code == 200
        after_count = db.query(ChatHistoryEntry).filter(ChatHistoryEntry.message == payload["message"]).count()
        assert after_count == before_count
    finally:
        db.close()
