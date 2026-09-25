import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"


@pytest.fixture()
def db_session():
    """Crea una sesión SQLite en memoria con las tablas de sesiones e historial de chat."""
    from app.database import Base
    from app.models.chat import ChatHistoryEntry, ChatSession  # noqa: F401

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
    from app.repositories.chat_history_repository import ChatHistoryRepository
    return ChatHistoryRepository()


SESSION_KEY = "b7f3a2c1-6d4e-4f8a-9c2b-formosa00001"


def _make_history_payload(**overrides):
    from app.schemas.chat_history import ChatHistoryCreate

    payload = {
        "message": "URGENTE: El Banco Formosa bloqueó tu cuenta. Ingresá ya a bancoformosa-seguridad.com con tu clave",
        "risk_level": "HIGH",
        "risk_percentage": 95,
        "detected_entity": "Banco Formosa",
        "detected_vector": "WHATSAPP",
        "summary": "Es una trampa para robarte la clave del banco.",
        "immediate_action": "No ingreses al enlace ni compartas tu clave.",
        "what_not_to_do": "NUNCA envíes tu clave ni tokens por WhatsApp.",
        "highlighted_phrases": [
            {"phrase": "URGENTE", "reason": "Genera pánico.", "category": "URGENCE"},
        ],
        "wa_share_text": "Hola, recibí este mensaje sospechoso del Banco Formosa...",
    }
    payload.update(overrides)
    return ChatHistoryCreate(**payload)


def test_get_or_create_session_creates_once(db_session, repo):
    session = repo.get_or_create_session(db_session, SESSION_KEY)
    again = repo.get_or_create_session(db_session, SESSION_KEY)

    assert session.id == again.id
    assert session.session_key == SESSION_KEY
    assert session.user_id is None
    assert session.deleted_at is None
    assert session.active is True


def test_get_session_by_key_excludes_soft_deleted(db_session, repo):
    session = repo.get_or_create_session(db_session, SESSION_KEY)
    assert repo.get_session_by_key(db_session, SESSION_KEY).id == session.id

    assert repo.soft_delete_session(db_session, session.id) is True
    assert repo.get_session_by_key(db_session, SESSION_KEY) is None


def test_create_entry_persists_full_diagnosis(db_session, repo):
    session = repo.get_or_create_session(db_session, SESSION_KEY)
    entry = repo.create_entry(db_session, session.id, _make_history_payload())

    assert entry.id is not None
    assert entry.session_id == session.id
    assert entry.user_id is None
    assert entry.risk_level == "HIGH"
    assert entry.risk_percentage == 95
    assert entry.detected_entity == "Banco Formosa"
    assert len(entry.highlighted_phrases) == 1
    assert entry.highlighted_phrases[0]["category"] == "URGENCE"
    assert entry.deleted_at is None


def test_list_by_user_paginates_and_orders_desc(db_session, repo):
    session = repo.get_or_create_session(db_session, SESSION_KEY, user_id=42)
    for i in range(5):
        repo.create_entry(db_session, session.id, _make_history_payload(
            message=f"Mensaje sospechoso número {i} del Banco Formosa",
        ))

    page = repo.list_by_user(db_session, user_id=42, page=1, limit=2)

    assert page["total"] == 5
    assert len(page["items"]) == 2
    assert page["items"][0].id > page["items"][1].id

    page3 = repo.list_by_user(db_session, user_id=42, page=3, limit=2)
    assert len(page3["items"]) == 1


def test_list_by_user_excludes_soft_deleted_entries(db_session, repo):
    session = repo.get_or_create_session(db_session, SESSION_KEY, user_id=7)
    kept = repo.create_entry(db_session, session.id, _make_history_payload())
    removed = repo.create_entry(db_session, session.id, _make_history_payload(
        message="Otro mensaje engañoso distinto para eliminar",
    ))

    assert repo.soft_delete_entry(db_session, removed.id) is True

    page = repo.list_by_user(db_session, user_id=7)
    assert page["total"] == 1
    assert page["items"][0].id == kept.id
    assert repo.get_entry_by_id(db_session, removed.id) is None


def test_claim_session_links_session_and_entries_to_user(db_session, repo):
    session = repo.get_or_create_session(db_session, SESSION_KEY)
    entry = repo.create_entry(db_session, session.id, _make_history_payload())

    claimed = repo.claim_session(db_session, SESSION_KEY, user_id=99)

    assert claimed is not None
    assert claimed.user_id == 99
    db_session.refresh(entry)
    assert entry.user_id == 99

    page = repo.list_by_user(db_session, user_id=99)
    assert page["total"] == 1
    assert page["items"][0].id == entry.id


def test_claim_session_is_idempotent_for_same_user(db_session, repo):
    repo.get_or_create_session(db_session, SESSION_KEY)
    first = repo.claim_session(db_session, SESSION_KEY, user_id=5)
    second = repo.claim_session(db_session, SESSION_KEY, user_id=5)

    assert first.id == second.id
    assert second.user_id == 5


def test_claim_session_returns_none_for_missing_or_deleted(db_session, repo):
    assert repo.claim_session(db_session, "clave-inexistente", user_id=1) is None

    session = repo.get_or_create_session(db_session, SESSION_KEY)
    repo.soft_delete_session(db_session, session.id)
    assert repo.claim_session(db_session, SESSION_KEY, user_id=1) is None


def test_claim_does_not_revive_soft_deleted_entries(db_session, repo):
    session = repo.get_or_create_session(db_session, SESSION_KEY)
    alive = repo.create_entry(db_session, session.id, _make_history_payload())
    deleted = repo.create_entry(db_session, session.id, _make_history_payload(
        message="Mensaje eliminado por el usuario antes del login",
    ))
    repo.soft_delete_entry(db_session, deleted.id)

    repo.claim_session(db_session, SESSION_KEY, user_id=11)

    page = repo.list_by_user(db_session, user_id=11)
    assert page["total"] == 1
    assert page["items"][0].id == alive.id
    db_session.refresh(deleted)
    assert deleted.deleted_at is not None


def test_soft_delete_entry_returns_false_for_missing_id(db_session, repo):
    assert repo.soft_delete_entry(db_session, 9999) is False
    assert repo.soft_delete_session(db_session, 9999) is False


def test_schema_validation():
    from pydantic import ValidationError
    from app.schemas.chat_history import ChatHistoryCreate

    with pytest.raises(ValidationError):
        ChatHistoryCreate(message="ok")

    with pytest.raises(ValidationError):
        _make_history_payload(risk_percentage=150)


def test_response_schemas_from_models(db_session, repo):
    from app.schemas.chat_history import ChatHistoryOut, ChatSessionOut

    session = repo.get_or_create_session(db_session, SESSION_KEY, user_id=3)
    entry = repo.create_entry(db_session, session.id, _make_history_payload())

    session_out = ChatSessionOut.model_validate(session)
    entry_out = ChatHistoryOut.model_validate(entry)

    assert session_out.session_key == SESSION_KEY
    assert session_out.user_id == 3
    assert entry_out.risk_level == "HIGH"
    assert entry_out.highlighted_phrases[0].phrase == "URGENTE"
    assert entry_out.created_at is not None
