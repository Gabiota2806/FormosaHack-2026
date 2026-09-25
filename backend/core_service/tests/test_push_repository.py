import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"


@pytest.fixture()
def db_session():
    """Crea una sesión SQLite en memoria con la tabla push_subscriptions."""
    from app.database import Base
    from app.models.push import PushSubscription  # noqa: F401

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
def repo(db_session):
    from app.repositories.push_repository import PushRepository
    return PushRepository()


def _make_payload(**overrides):
    from app.schemas.push import PushSubscriptionCreate

    payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
        "keys": {"p256dh": "BPk25dhKeyFormosa", "auth": "AuthSecretFormosa"},
        "user_agent": "Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile",
    }
    payload.update(overrides)
    return PushSubscriptionCreate(**payload)


def test_upsert_creates_new_subscription(db_session, repo):
    sub = repo.upsert(db_session, _make_payload())

    assert sub.id is not None
    assert sub.endpoint == "https://fcm.googleapis.com/fcm/send/abc123"
    assert sub.p256dh_key == "BPk25dhKeyFormosa"
    assert sub.auth_key == "AuthSecretFormosa"
    assert sub.deleted_at is None
    assert repo.count_active(db_session) == 1


def test_upsert_is_idempotent_by_endpoint(db_session, repo):
    repo.upsert(db_session, _make_payload())
    updated = repo.upsert(db_session, _make_payload(
        keys={"p256dh": "BPkNuevaRotada", "auth": "AuthNuevoRotado"}
    ))

    assert repo.count_active(db_session) == 1
    assert updated.p256dh_key == "BPkNuevaRotada"
    assert updated.auth_key == "AuthNuevoRotado"


def test_upsert_reactivates_soft_deleted_subscription(db_session, repo):
    first = repo.upsert(db_session, _make_payload())
    assert repo.soft_delete(db_session, first.id) is True
    assert repo.count_active(db_session) == 0

    revived = repo.upsert(db_session, _make_payload())

    assert revived.id == first.id
    assert revived.deleted_at is None
    assert repo.count_active(db_session) == 1


def test_get_active_subscriptions_excludes_soft_deleted(db_session, repo):
    repo.upsert(db_session, _make_payload())
    deleted = repo.upsert(db_session, _make_payload(
        endpoint="https://updates.push.services.mozilla.com/gone-410"
    ))
    repo.soft_delete(db_session, deleted.id)

    actives = repo.get_active_subscriptions(db_session)

    assert len(actives) == 1
    assert actives[0].endpoint == "https://fcm.googleapis.com/fcm/send/abc123"


def test_get_by_endpoint_returns_only_active(db_session, repo):
    sub = repo.upsert(db_session, _make_payload())
    assert repo.get_by_endpoint(db_session, sub.endpoint).id == sub.id

    repo.soft_delete(db_session, sub.id)
    assert repo.get_by_endpoint(db_session, sub.endpoint) is None


def test_soft_delete_by_endpoint_marks_deleted_at(db_session, repo):
    sub = repo.upsert(db_session, _make_payload())

    assert repo.soft_delete_by_endpoint(db_session, sub.endpoint) is True
    assert repo.count_active(db_session) == 0

    db_session.refresh(sub)
    assert sub.deleted_at is not None


def test_soft_delete_returns_false_for_missing_id(db_session, repo):
    assert repo.soft_delete(db_session, 9999) is False
    assert repo.soft_delete_by_endpoint(db_session, "https://inexistente.example.com") is False


def test_schema_rejects_payload_without_keys():
    from pydantic import ValidationError
    from app.schemas.push import PushSubscriptionCreate

    with pytest.raises(ValidationError):
        PushSubscriptionCreate(endpoint="https://fcm.googleapis.com/fcm/send/x")


def test_schema_rejects_invalid_endpoint():
    from pydantic import ValidationError
    from app.schemas.push import PushSubscriptionCreate

    with pytest.raises(ValidationError):
        PushSubscriptionCreate(
            endpoint="no-es-una-url",
            keys={"p256dh": "BPk", "auth": "Auth"},
        )


def test_response_schema_from_model(db_session, repo):
    from app.schemas.push import PushSubscriptionResponse

    sub = repo.upsert(db_session, _make_payload())
    response = PushSubscriptionResponse.model_validate(sub)

    assert response.id == sub.id
    assert response.endpoint == sub.endpoint
    assert response.active is True
    assert not hasattr(response, "auth_key")
