import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ["VAPID_PUBLIC_KEY"] = "BOutbreakPublicKey"

from app.core.security import limiter
from app.main import app
from app.services.push_service import clear_outbreak_cache

client = TestClient(app)


def _incident_payload(entity="REFSA", suffix=""):
    return {
        "title": f"Estafa energética REFSA{suffix}",
        "description": f"Mensaje falso de REFSA solicitando datos bancarios{suffix}.",
        "impersonated_entity": entity,
        "attack_vector": "WHATSAPP",
    }


def _subscribe(endpoint_suffix):
    return {
        "endpoint": f"https://fcm.googleapis.com/fcm/send/{endpoint_suffix}",
        "keys": {"p256dh": "BPk25dhKeyFormosa", "auth": "AuthSecretFormosa"},
    }


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    clear_outbreak_cache()
    limiter.enabled = False
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "TestPrivateKey")
    yield
    clear_outbreak_cache()
    limiter.enabled = True


class TestAutomaticOutbreakBroadcast:
    def test_five_reports_same_entity_triggers_push(self, monkeypatch):
        sent = []
        monkeypatch.setattr("pywebpush.webpush", lambda **kwargs: sent.append(kwargs))
        client.post("/api/core/push/subscribe", json=_subscribe("brotes1"))

        for i in range(4):
            client.post("/api/core/incidents", json=_incident_payload(suffix=f" {i}"))
        assert len(sent) == 0

        fifth = client.post("/api/core/incidents", json=_incident_payload(suffix=" 5"))
        assert fifth.status_code == 201
        assert len(sent) == 1

        import json
        payload = json.loads(sent[0]["data"])
        assert "REFSA" in payload["title"]
        assert "Brote de estafas" in payload["title"]
        assert payload["url"].startswith("/#radar?incident_id=")
        assert payload["incident_id"] is not None

    def test_ten_votes_on_incident_triggers_push(self, monkeypatch):
        sent = []
        monkeypatch.setattr("pywebpush.webpush", lambda **kwargs: sent.append(kwargs))
        client.post("/api/core/push/subscribe", json=_subscribe("brotes2"))

        inc = client.post("/api/core/incidents", json=_incident_payload(entity="Tarjeta Chigüé")).json()

        for i in range(9):
            res = client.post(
                f"/api/core/incidents/{inc['id']}/me-too",
                json={"user_fingerprint": f"huella-{i}"},
            )
            assert res.status_code == 200
        assert len(sent) == 0

        res = client.post(
            f"/api/core/incidents/{inc['id']}/me-too",
            json={"user_fingerprint": "huella-final"},
        )
        assert res.status_code == 200
        assert res.json()["votes_count"] == 11
        assert len(sent) == 1

    def test_broadcast_not_repeated_within_window(self, monkeypatch):
        sent = []
        monkeypatch.setattr("pywebpush.webpush", lambda **kwargs: sent.append(kwargs))
        client.post("/api/core/push/subscribe", json=_subscribe("brotes3"))

        for i in range(5):
            client.post("/api/core/incidents", json=_incident_payload(entity="ANSES", suffix=f" {i}"))
        assert len(sent) == 1

        client.post("/api/core/incidents", json=_incident_payload(entity="ANSES", suffix=" extra"))
        assert len(sent) == 1

    def test_no_broadcast_for_different_entities(self, monkeypatch):
        sent = []
        monkeypatch.setattr("pywebpush.webpush", lambda **kwargs: sent.append(kwargs))
        client.post("/api/core/push/subscribe", json=_subscribe("brotes4"))

        entidades = ["REFSA", "ANSES", "Banco Formosa", "Tarjeta Chigüé", "IPAF"]
        for entidad in entidades:
            client.post("/api/core/incidents", json=_incident_payload(entity=entidad))
        assert len(sent) == 0

    def test_expired_subscription_cleaned_during_outbreak_broadcast(self, monkeypatch):
        from types import SimpleNamespace
        from pywebpush import WebPushException

        def fake_webpush(subscription_info, data, **kwargs):
            exc = WebPushException("Gone")
            exc.response = SimpleNamespace(status_code=410)
            raise exc

        monkeypatch.setattr("pywebpush.webpush", fake_webpush)
        client.post("/api/core/push/subscribe", json=_subscribe("expirado1"))

        for i in range(5):
            client.post("/api/core/incidents", json=_incident_payload(entity="IOMA", suffix=f" {i}"))

        import app.database as app_db
        from app.repositories.push_repository import PushRepository
        db = app_db.SessionLocal()
        try:
            assert PushRepository().count_active(db) == 0
        finally:
            db.close()
