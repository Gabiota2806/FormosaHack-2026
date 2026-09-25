import os
from types import SimpleNamespace

import pytest

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ["VAPID_PUBLIC_KEY"] = "BTestPublicKeyFormosa"
os.environ["VAPID_PRIVATE_KEY"] = "TestPrivateKeyFormosa"


@pytest.fixture()
def db_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from app.database import Base
    from app.models.push import PushSubscription  # noqa: F401
    from app.models.incident import IncidentReport, IncidentVote  # noqa: F401

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def service():
    from app.services.push_service import PushService, clear_outbreak_cache
    clear_outbreak_cache()
    return PushService()


def _subscribe_payload(endpoint="https://fcm.googleapis.com/fcm/send/dev1", **overrides):
    from app.schemas.push import PushSubscriptionCreate
    payload = {
        "endpoint": endpoint,
        "keys": {"p256dh": "BPk25dhKeyFormosa", "auth": "AuthSecretFormosa"},
        "user_agent": "Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile",
    }
    payload.update(overrides)
    return PushSubscriptionCreate(**payload)


def _create_incident(db, entity="REFSA", title="Estafa REFSA", description="Mensaje falso de REFSA"):
    from app.models.incident import IncidentReport
    incident = IncidentReport(
        title=title,
        description=description,
        impersonated_entity=entity,
        attack_vector="WHATSAPP",
        votes_count=1,
        status="active",
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def _register_votes(db, incident_id, count):
    from app.models.incident import IncidentVote
    for i in range(count):
        db.add(IncidentVote(incident_id=incident_id, user_fingerprint=f"fp-{i}"))
    db.commit()


class TestSubscribe:
    def test_subscribe_creates_subscription(self, db_session, service):
        result = service.subscribe(db_session, _subscribe_payload())
        assert result.id is not None
        assert result.active is True
        assert service.repo.count_active(db_session) == 1

    def test_subscribe_is_idempotent_by_endpoint(self, db_session, service):
        first = service.subscribe(db_session, _subscribe_payload())
        second = service.subscribe(db_session, _subscribe_payload(user_id=7))
        assert first.id == second.id
        assert second.user_id == 7
        assert service.repo.count_active(db_session) == 1

    def test_unsubscribe_applies_soft_delete(self, db_session, service):
        service.subscribe(db_session, _subscribe_payload())
        assert service.unsubscribe(db_session, "https://fcm.googleapis.com/fcm/send/dev1") is True
        assert service.repo.count_active(db_session) == 0
        assert service.unsubscribe(db_session, "https://fcm.googleapis.com/fcm/send/dev1") is False


class TestBroadcast:
    def test_broadcast_delivers_to_active_subscriptions(self, db_session, service, monkeypatch):
        sent = []

        def fake_webpush(subscription_info, data, **kwargs):
            sent.append(subscription_info["endpoint"])

        monkeypatch.setattr("pywebpush.webpush", fake_webpush)
        service.subscribe(db_session, _subscribe_payload(endpoint="https://fcm.googleapis.com/fcm/send/a"))
        service.subscribe(db_session, _subscribe_payload(endpoint="https://fcm.googleapis.com/fcm/send/b"))

        result = service.broadcast(
            db_session,
            title="🚨 Brote de estafas en Formosa: Suplantación de REFSA",
            body="Alerta comunitaria",
            url="/#radar?incident_id=1",
            incident_id=1,
        )
        assert result.enviados == 2
        assert result.fallidos == 0
        assert result.suscripciones_limpiadas == 0
        assert set(sent) == {
            "https://fcm.googleapis.com/fcm/send/a",
            "https://fcm.googleapis.com/fcm/send/b",
        }

    def test_broadcast_soft_deletes_expired_subscriptions_on_410(self, db_session, service, monkeypatch):
        from pywebpush import WebPushException

        def fake_webpush(subscription_info, data, **kwargs):
            if subscription_info["endpoint"].endswith("/gone"):
                exc = WebPushException("Expired")
                exc.response = SimpleNamespace(status_code=410)
                raise exc
            return None

        monkeypatch.setattr("pywebpush.webpush", fake_webpush)
        service.subscribe(db_session, _subscribe_payload(endpoint="https://fcm.googleapis.com/fcm/send/gone"))
        service.subscribe(db_session, _subscribe_payload(endpoint="https://fcm.googleapis.com/fcm/send/ok"))

        result = service.broadcast(db_session, title="Alerta", body="Cuerpo", url="/#radar")
        assert result.enviados == 1
        assert result.fallidos == 1
        assert result.suscripciones_limpiadas == 1
        assert service.repo.count_active(db_session) == 1
        assert service.repo.get_by_endpoint(db_session, "https://fcm.googleapis.com/fcm/send/gone") is None

    def test_broadcast_soft_deletes_on_404(self, db_session, service, monkeypatch):
        from pywebpush import WebPushException

        def fake_webpush(subscription_info, data, **kwargs):
            exc = WebPushException("Not found")
            exc.response = SimpleNamespace(status_code=404)
            raise exc

        monkeypatch.setattr("pywebpush.webpush", fake_webpush)
        service.subscribe(db_session, _subscribe_payload(endpoint="https://fcm.googleapis.com/fcm/send/missing"))

        result = service.broadcast(db_session, title="Alerta", body="Cuerpo", url="/#radar")
        assert result.suscripciones_limpiadas == 1
        assert service.repo.count_active(db_session) == 0

    def test_broadcast_keeps_subscription_on_transient_error(self, db_session, service, monkeypatch):
        from pywebpush import WebPushException

        def fake_webpush(subscription_info, data, **kwargs):
            exc = WebPushException("Server error")
            exc.response = SimpleNamespace(status_code=503)
            raise exc

        monkeypatch.setattr("pywebpush.webpush", fake_webpush)
        service.subscribe(db_session, _subscribe_payload())

        result = service.broadcast(db_session, title="Alerta", body="Cuerpo", url="/#radar")
        assert result.enviados == 0
        assert result.suscripciones_limpiadas == 0
        assert service.repo.count_active(db_session) == 1


class TestOutbreakDetection:
    def test_no_outbreak_below_thresholds(self, db_session, service):
        incident = _create_incident(db_session)
        _register_votes(db_session, incident.id, 4)
        for i in range(3):
            _create_incident(db_session, title=f"Extra {i}")
        assert service.detect_outbreak(db_session, incident) is False

    def test_outbreak_with_five_reports_same_entity_within_window(self, db_session, service):
        incident = _create_incident(db_session)
        for i in range(4):
            _create_incident(db_session, title=f"Reporte {i}")
        assert service.detect_outbreak(db_session, incident) is True

    def test_outbreak_requires_same_entity(self, db_session, service):
        incident = _create_incident(db_session, entity="REFSA")
        for i in range(4):
            _create_incident(db_session, entity="ANSES", title=f"Anses {i}")
        assert service.detect_outbreak(db_session, incident) is False

    def test_outbreak_with_ten_votes_on_incident(self, db_session, service):
        incident = _create_incident(db_session)
        _register_votes(db_session, incident.id, 10)
        assert service.detect_outbreak(db_session, incident) is True

    def test_outbreak_with_nine_votes_is_false(self, db_session, service):
        incident = _create_incident(db_session)
        _register_votes(db_session, incident.id, 9)
        assert service.detect_outbreak(db_session, incident) is False

    def test_auto_broadcast_sent_only_once_per_window(self, db_session, service, monkeypatch):
        sent = []
        monkeypatch.setattr("pywebpush.webpush", lambda **kwargs: sent.append(kwargs))
        service.subscribe(db_session, _subscribe_payload())

        incident = _create_incident(db_session)
        for i in range(4):
            _create_incident(db_session, title=f"Reporte {i}")

        first = service.check_and_broadcast_outbreak(db_session, incident)
        second = service.check_and_broadcast_outbreak(db_session, incident)
        assert first is not None
        assert first.trigger == "outbreak"
        assert first.enviados == 1
        assert second is None
        assert len(sent) == 1
