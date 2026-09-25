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
from app.schemas.chat_history import ChatHistoryCreate

client = TestClient(app)


def _user_token(email="usuario1@ciberguardian.gob.ar", user_id=1, role="user", pending_2fa=False):
    payload = {"sub": email, "user_id": user_id, "role": role}
    if pending_2fa:
        payload["type"] = "2fa_pending"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _auth_headers(email="usuario1@ciberguardian.gob.ar", user_id=1, pending_2fa=False):
    return {"Authorization": f"Bearer {_user_token(email=email, user_id=user_id, pending_2fa=pending_2fa)}"}


def _seed_entry(session_key="sess-test-router-1", user_id=1, message="Estafa Banco Formosa"):
    repo = ChatHistoryRepository()
    db = app_db.SessionLocal()
    try:
        session = repo.get_or_create_session(db, session_key=session_key, user_id=user_id)
        entry = repo.create_entry(
            db,
            session_id=session.id,
            data=ChatHistoryCreate(
                message=message,
                risk_level="HIGH",
                risk_percentage=92,
                detected_entity="Banco Formosa",
                detected_vector="WHATSAPP",
                summary="Intento de phishing detectado.",
                immediate_action="No abrir enlaces.",
                what_not_to_do="No dar claves.",
                highlighted_phrases=[],
                wa_share_text="Atención familiar...",
            ),
            user_id=user_id,
        )
        return entry.id
    finally:
        db.close()


def test_unauthenticated_requests_return_401():
    endpoints = [
        ("GET", "/chat/history"),
        ("GET", "/chat/history/1"),
        ("DELETE", "/chat/history/1"),
        ("POST", "/chat/history/claim"),
    ]
    for method, path in endpoints:
        res = client.request(method, path, json={"session_key": "some-key"} if method == "POST" else None)
        assert res.status_code == 401, f"{method} {path} should return 401 without token"


def test_2fa_pending_token_returns_403():
    headers = _auth_headers(pending_2fa=True)
    res = client.get("/chat/history", headers=headers)
    assert res.status_code == 403
    assert "2FA incompleta" in res.json()["detail"]


def test_list_history_and_pagination():
    entry_id = _seed_entry(session_key="sess-list-1", user_id=101, message="Mensaje 1 de usuario 101")
    _seed_entry(session_key="sess-list-1", user_id=101, message="Mensaje 2 de usuario 101")
    _seed_entry(session_key="sess-list-2", user_id=202, message="Mensaje de otro usuario")

    headers = _auth_headers(email="user101@test.com", user_id=101)
    res = client.get("/chat/history?page=1&limit=10", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 2
    for item in data["items"]:
        assert item["user_id"] == 101

    # Paginación
    res_paged = client.get("/chat/history?page=1&limit=1", headers=headers)
    assert res_paged.status_code == 200
    assert len(res_paged.json()["items"]) == 1


def test_get_history_entry_detail():
    entry_id = _seed_entry(session_key="sess-get-1", user_id=303, message="Mensaje para consultar")

    # Dueño legítimo -> 200
    headers_owner = _auth_headers(email="owner@test.com", user_id=303)
    res = client.get(f"/chat/history/{entry_id}", headers=headers_owner)
    assert res.status_code == 200
    assert res.json()["id"] == entry_id
    assert res.json()["detected_entity"] == "Banco Formosa"

    # Usuario ajeno -> 403
    headers_other = _auth_headers(email="other@test.com", user_id=999)
    res_forbidden = client.get(f"/chat/history/{entry_id}", headers=headers_other)
    assert res_forbidden.status_code == 403

    # ID inexistente -> 404
    res_not_found = client.get("/chat/history/999999", headers=headers_owner)
    assert res_not_found.status_code == 404


def test_delete_history_entry():
    entry_id = _seed_entry(session_key="sess-del-1", user_id=404, message="Mensaje para borrar")

    # Usuario ajeno -> 403
    headers_other = _auth_headers(email="other404@test.com", user_id=505)
    res_forbidden = client.delete(f"/chat/history/{entry_id}", headers=headers_other)
    assert res_forbidden.status_code == 403

    # Dueño -> 200
    headers_owner = _auth_headers(email="owner404@test.com", user_id=404)
    res_del = client.delete(f"/chat/history/{entry_id}", headers=headers_owner)
    assert res_del.status_code == 200
    assert res_del.json()["deleted"] is True

    # Comprobación de que ya no es accesible por GET (404)
    res_after = client.get(f"/chat/history/{entry_id}", headers=headers_owner)
    assert res_after.status_code == 404


def test_claim_session():
    repo = ChatHistoryRepository()
    db = app_db.SessionLocal()
    anon_key = "anon-claim-test-key-01"
    try:
        session = repo.get_or_create_session(db, session_key=anon_key, user_id=None)
        repo.create_entry(
            db,
            session_id=session.id,
            data=ChatHistoryCreate(
                message="Mensaje previo al login",
                risk_level="MEDIUM",
                risk_percentage=45,
                summary="Aviso falso.",
                immediate_action="Descartar.",
                what_not_to_do="No abrir.",
                highlighted_phrases=[],
                wa_share_text="Alerta familiar.",
            ),
            user_id=None,
        )
    finally:
        db.close()

    headers = _auth_headers(email="claimed_user@test.com", user_id=606)
    res = client.post("/chat/history/claim", json={"session_key": anon_key}, headers=headers)
    assert res.status_code == 200
    assert res.json()["user_id"] == 606

    # Consultar historial del usuario tras el claim
    res_list = client.get("/chat/history", headers=headers)
    assert res_list.status_code == 200
    assert any(item["message"] == "Mensaje previo al login" for item in res_list.json()["items"])

    # Reclamar clave que no existe -> 404
    res_missing = client.post("/chat/history/claim", json={"session_key": "clave-no-existente-000"}, headers=headers)
    assert res_missing.status_code == 404


def test_api_core_mirror_routes():
    headers = _auth_headers(email="mirror@test.com", user_id=707)
    res = client.get("/api/core/chat/history", headers=headers)
    assert res.status_code == 200
    assert "items" in res.json()
