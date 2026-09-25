import os
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from jose import jwt

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ["VAPID_PUBLIC_KEY"] = "BRouterTestPublicKey"

from app.core.security import SECRET_KEY, ALGORITHM, limiter
from app.main import app
from app.services.push_service import clear_outbreak_cache

client = TestClient(app)


def _moderator_token(role="admin", pending_2fa=False):
    payload = {"sub": "moderador@ciberguardian.gob.ar", "role": role}
    if pending_2fa:
        payload = {"sub": "moderador@ciberguardian.gob.ar", "type": "2fa_pending"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _auth(role="admin", pending_2fa=False):
    return {"Authorization": f"Bearer {_moderator_token(role, pending_2fa)}"}


def _subscribe(endpoint="https://fcm.googleapis.com/fcm/send/router1"):
    return {
        "endpoint": endpoint,
        "keys": {"p256dh": "BPk25dhKeyFormosa", "auth": "AuthSecretFormosa"},
        "user_agent": "Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile",
    }


def _incident_payload(entity="Banco Formosa"):
    return {
        "title": "SMS falso del Banco Formosa",
        "description": "Mensaje con enlace clonado para robar credenciales home banking.",
        "impersonated_entity": entity,
        "attack_vector": "SMS",
    }


@pytest.fixture(autouse=True)
def _reset_state():
    clear_outbreak_cache()
    original = limiter.enabled
    limiter.enabled = False
    yield
    limiter.enabled = original
    clear_outbreak_cache()


class TestVapidEndpoint:
    def test_returns_public_key(self, monkeypatch):
        monkeypatch.setenv("VAPID_PUBLIC_KEY", "BRouterTestPublicKey")
        res = client.get("/api/core/push/vapid-public-key")
        assert res.status_code == 200
        assert res.json()["vapid_public_key"] == "BRouterTestPublicKey"


class TestSubscribeEndpoints:
    def test_subscribe_returns_201(self):
        res = client.post("/api/core/push/subscribe", json=_subscribe())
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["active"] is True
        assert data["endpoint"].startswith("https://fcm.googleapis.com/fcm/send/router1")

    def test_subscribe_validates_payload(self):
        res = client.post("/api/core/push/subscribe", json={"endpoint": "https://x.com/a"})
        assert res.status_code == 422

    def test_unsubscribe_soft_deletes(self):
        sub = client.post("/api/core/push/subscribe", json=_subscribe(endpoint="https://fcm.googleapis.com/fcm/send/baja1"))
        assert sub.status_code == 201
        res = client.request(
            "DELETE",
            "/api/core/push/subscriptions",
            json={"endpoint": "https://fcm.googleapis.com/fcm/send/baja1"},
        )
        assert res.status_code == 204
        again = client.request(
            "DELETE",
            "/api/core/push/subscriptions",
            json={"endpoint": "https://fcm.googleapis.com/fcm/send/baja1"},
        )
        assert again.status_code == 404


class TestBroadcastOutbreakEndpoint:
    def test_requires_authentication(self):
        inc = client.post("/api/core/incidents", json=_incident_payload()).json()
        res = client.post(f"/api/core/incidents/{inc['id']}/broadcast-outbreak", json={})
        assert res.status_code == 401

    def test_rejects_pending_2fa_token(self):
        inc = client.post("/api/core/incidents", json=_incident_payload()).json()
        res = client.post(
            f"/api/core/incidents/{inc['id']}/broadcast-outbreak",
            json={},
            headers=_auth(pending_2fa=True),
        )
        assert res.status_code == 403
        assert "2FA" in res.json()["detail"]

    def test_rejects_regular_user_role(self):
        inc = client.post("/api/core/incidents", json=_incident_payload()).json()
        res = client.post(
            f"/api/core/incidents/{inc['id']}/broadcast-outbreak",
            json={},
            headers=_auth(role="user"),
        )
        assert res.status_code == 403

    def test_rejects_invalid_token(self):
        inc = client.post("/api/core/incidents", json=_incident_payload()).json()
        fake = jwt.encode({"sub": "x", "role": "admin"}, "clave-falsa", algorithm=ALGORITHM)
        res = client.post(
            f"/api/core/incidents/{inc['id']}/broadcast-outbreak",
            json={},
            headers={"Authorization": f"Bearer {fake}"},
        )
        assert res.status_code == 401

    def test_moderator_broadcast_succeeds(self, monkeypatch):
        sent = []
        monkeypatch.setattr("pywebpush.webpush", lambda **kwargs: sent.append(kwargs))
        monkeypatch.setenv("VAPID_PRIVATE_KEY", "TestPrivateKey")
        client.post("/api/core/push/subscribe", json=_subscribe(endpoint="https://fcm.googleapis.com/fcm/send/mod1"))
        inc = client.post("/api/core/incidents", json=_incident_payload()).json()

        res = client.post(
            f"/api/core/incidents/{inc['id']}/broadcast-outbreak",
            json={"title": "🚨 Comunicado oficial: REFSA", "body": "Corte de servicio programado, no caigas en estafas."},
            headers=_auth(role="operator"),
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["trigger"] == "moderator"
        assert data["enviados"] == 1
        assert data["title"] == "🚨 Comunicado oficial: REFSA"
        assert len(sent) == 1

    def test_broadcast_unknown_incident_returns_404(self):
        res = client.post("/api/core/incidents/999999/broadcast-outbreak", json={}, headers=_auth())
        assert res.status_code == 404


class TestRateLimiting:
    def test_broadcast_rate_limited(self, monkeypatch):
        limiter.enabled = True
        monkeypatch.setattr("pywebpush.webpush", lambda **kwargs: None)
        monkeypatch.setenv("VAPID_PRIVATE_KEY", "TestPrivateKey")
        inc = client.post("/api/core/incidents", json=_incident_payload()).json()

        status_codes = [
            client.post(
                f"/api/core/incidents/{inc['id']}/broadcast-outbreak",
                json={},
                headers=_auth(),
            ).status_code
            for _ in range(7)
        ]
        assert 429 in status_codes
        limiter.reset()
        limiter.enabled = False
