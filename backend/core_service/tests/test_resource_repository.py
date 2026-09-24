import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"


@pytest.fixture()
def db_session():
    """Crea una sesión SQLite en memoria con la tabla resource_items."""
    from app.database import Base
    from app.models.resource import ResourceItem

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
    from app.repositories.resource_repository import ResourceRepository
    return ResourceRepository()


def _create_item(db, **overrides):
    from app.models.resource import ResourceItem

    payload = {
        "title": "Hospital de Alta Complejidad",
        "description": "Centro de referencia provincial",
        "category": "salud",
        "status": "active",
        "location": "Formosa Capital",
    }
    payload.update(overrides)
    item = ResourceItem(**payload)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def test_paginated_applies_filters_and_total(db_session, repo):
    _create_item(db_session, title="Hospital Central", category="salud", location="Formosa Capital")
    _create_item(db_session, title="Escuela Técnica N°1", category="educacion", location="Clorinda")
    _create_item(db_session, title="Hospital de la Madre y el Niño", category="salud", location="Formosa Capital")
    _create_item(db_session, title="Hospital Clorinda", category="salud", location="Clorinda")

    # Filtro por categoría
    items, total, total_pages = repo.get_paginated(db=db_session, page=1, limit=10, category="salud")
    assert total == 3
    assert total_pages == 1
    assert all(it.category == "salud" for it in items)

    # Búsqueda por texto
    items, total, _ = repo.get_paginated(db=db_session, page=1, limit=10, search="Clorinda")
    assert total == 2
    assert all("Clorinda" in (it.location or "") for it in items)

    # Paginación real: limit=2 -> 2 páginas
    items, total, total_pages = repo.get_paginated(db=db_session, page=1, limit=2)
    assert total == 4
    assert total_pages == 2
    assert len(items) == 2


def test_soft_delete_excludes_from_get_by_id(db_session, repo):
    from datetime import datetime, timezone

    item = _create_item(db_session, title="A borrar")

    assert repo.get_by_id(db_session, item.id) is not None

    assert repo.soft_delete(db_session, item.id) is True
    assert repo.get_by_id(db_session, item.id) is None


def test_soft_delete_excludes_from_paginated(db_session, repo):
    a = _create_item(db_session, title="Visible")
    b = _create_item(db_session, title="Se va")

    repo.soft_delete(db_session, b.id)

    items, total, _ = repo.get_paginated(db=db_session, page=1, limit=10)
    assert total == 1
    assert items[0].id == a.id


def test_update_applies_partial_fields(db_session, repo):
    item = _create_item(db_session, title="Original", category="salud", location="Formosa Capital")

    from app.schemas.resource import ResourceUpdate

    patch = ResourceUpdate(title="Nuevo Título", location="Clorinda")
    updated = repo.update(db_session, item.id, patch)

    assert updated is not None
    assert updated.title == "Nuevo Título"
    assert updated.location == "Clorinda"
    # Categoría no fue tocada (partial update)
    assert updated.category == "salud"
    assert updated.description == "Centro de referencia provincial"


def test_update_returns_none_when_missing(db_session, repo):
    from app.schemas.resource import ResourceUpdate

    assert repo.update(db_session, 9999, ResourceUpdate(title="No Existe")) is None


def test_soft_delete_returns_false_when_missing(db_session, repo):
    assert repo.soft_delete(db_session, 9999) is False


def test_create_persists_and_returns_instance(db_session, repo):
    from app.schemas.resource import ResourceCreate

    data = ResourceCreate(
        title="Centro de Salud Palo Santo",
        description="Atención primaria",
        category="salud",
        status="active",
        location="Palo Santo",
    )
    created = repo.create(db_session, data)
    assert created.id is not None
    assert created.title == "Centro de Salud Palo Santo"
    assert created.deleted_at is None
