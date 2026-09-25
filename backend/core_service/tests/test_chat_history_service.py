import os
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"


@pytest.fixture()
def db_session():
    from app.database import Base
    from app.models.chat import ChatHistoryEntry, ChatSession  # noqa: F401
    from app.models.user import User  # noqa: F401

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
    from app.services.chat_history_service import ChatHistoryService
    return ChatHistoryService()


def _make_diagnosis(overrides=None):
    from app.schemas.chat import ChatMessageResponse, HighlightedPhrase

    data = {
        "risk_level": "HIGH",
        "risk_percentage": 90,
        "detected_entity": "Banco Formosa",
        "detected_vector": "WHATSAPP",
        "summary": "Intento de estafa detectado.",
        "immediate_action": "Bloquear remitente.",
        "what_not_to_do": "No ingresar claves.",
        "highlighted_phrases": [
            HighlightedPhrase(phrase="URGENTE", reason="Presión", category="URGENCE")
        ],
        "wa_share_text": "Cuidado con este mensaje...",
    }
    if overrides:
        data.update(overrides)
    return ChatMessageResponse(**data)


def test_list_user_history_returns_paged_results(db_session, service):
    diag = _make_diagnosis()
    service.save_analysis_message(
        db_session, diag, "Mensaje de prueba 1", session_key="sess-user-1", user_id=10
    )
    service.save_analysis_message(
        db_session, diag, "Mensaje de prueba 2", session_key="sess-user-1", user_id=10
    )

    page = service.list_user_history(db_session, user_id=10, page=1, limit=1)
    assert page.total == 2
    assert len(page.items) == 1
    assert page.page == 1
    assert page.limit == 1
    assert page.items[0].message == "Mensaje de prueba 2"


def test_get_entry_detail_success_and_forbidden(db_session, service):
    diag = _make_diagnosis()
    entry = service.save_analysis_message(
        db_session, diag, "Mensaje confidencial", session_key="sess-owner", user_id=5
    )

    detail = service.get_entry_detail(db_session, entry_id=entry.id, user_id=5)
    assert detail.id == entry.id
    assert detail.detected_entity == "Banco Formosa"

    with pytest.raises(HTTPException) as exc_info:
        service.get_entry_detail(db_session, entry_id=entry.id, user_id=999)
    assert exc_info.value.status_code == 403


def test_get_entry_detail_not_found(db_session, service):
    with pytest.raises(HTTPException) as exc_info:
        service.get_entry_detail(db_session, entry_id=99999, user_id=1)
    assert exc_info.value.status_code == 404


def test_delete_entry_soft_delete_and_permissions(db_session, service):
    diag = _make_diagnosis()
    entry = service.save_analysis_message(
        db_session, diag, "Mensaje a borrar", session_key="sess-del", user_id=7
    )

    # Intento de borrado por usuario no propietario -> 403
    with pytest.raises(HTTPException) as exc_info:
        service.delete_entry(db_session, entry_id=entry.id, user_id=8)
    assert exc_info.value.status_code == 403

    # Borrado por propietario
    assert service.delete_entry(db_session, entry_id=entry.id, user_id=7) is True

    # Comprobar que ya no aparece en get_entry_detail (404)
    with pytest.raises(HTTPException) as exc_info:
        service.get_entry_detail(db_session, entry_id=entry.id, user_id=7)
    assert exc_info.value.status_code == 404


def test_claim_session_success_and_not_found(db_session, service):
    diag = _make_diagnosis()
    service.save_analysis_message(
        db_session, diag, "Mensaje anónimo", session_key="anon-session-xyz"
    )

    claimed = service.claim_session(db_session, session_key="anon-session-xyz", user_id=44)
    assert claimed.session_key == "anon-session-xyz"
    assert claimed.user_id == 44

    page = service.list_user_history(db_session, user_id=44)
    assert page.total == 1
    assert page.items[0].message == "Mensaje anónimo"

    # Sesión inexistente -> 404
    with pytest.raises(HTTPException) as exc_info:
        service.claim_session(db_session, session_key="no-existe", user_id=44)
    assert exc_info.value.status_code == 404


def test_save_analysis_message_without_keys_returns_none(db_session, service):
    diag = _make_diagnosis()
    res = service.save_analysis_message(
        db_session, diag, "Mensaje sin tracking", session_key=None, user_id=None
    )
    assert res is None
