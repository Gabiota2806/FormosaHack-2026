from datetime import datetime, timezone
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException

from app.models.resource import ResourceItem
from app.schemas.resource import ResourceCreate, ResourceUpdate
from app.services.resource_service import ResourceService


@pytest.fixture
def mock_repo():
    return MagicMock()


@pytest.fixture
def service(mock_repo):
    return ResourceService(repo=mock_repo)


def _fake_item(item_id=1, title="Centro de Salud", category="salud"):
    return ResourceItem(
        id=item_id,
        title=title,
        description="Atención primaria",
        category=category,
        status="active",
        location="Formosa Capital",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_list_resources_formats_paginated_response(service, mock_repo):
    db = MagicMock()
    mock_repo.get_paginated.return_value = ([_fake_item(1), _fake_item(2)], 2, 1)

    result = service.list_resources(
        db=db,
        page=1,
        limit=10,
        search="Salud",
        category="salud",
        status_filter="active",
    )

    mock_repo.get_paginated.assert_called_once_with(
        db=db, page=1, limit=10, search="Salud", category="salud", status="active"
    )
    assert result.total == 2
    assert result.page == 1
    assert result.limit == 10
    assert result.total_pages == 1
    assert len(result.data) == 2


def test_get_resource_success(service, mock_repo):
    db = MagicMock()
    mock_repo.get_by_id.return_value = _fake_item(42, title="Hospital Evita")

    result = service.get_resource(db=db, resource_id=42)
    assert result.id == 42
    assert result.title == "Hospital Evita"


def test_get_resource_not_found(service, mock_repo):
    db = MagicMock()
    mock_repo.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        service.get_resource(db=db, resource_id=99)
    assert exc_info.value.status_code == 404


def test_create_resource_sanitizes_strings(service, mock_repo):
    db = MagicMock()
    mock_repo.create.side_effect = lambda _db, data: _fake_item(title=data.title)

    payload = ResourceCreate(
        title="   Hospital Central de Formosa   ",
        description="   Servicio de guardia 24hs   ",
        category="salud",
    )
    service.create_resource(db=db, data=payload)

    assert payload.title == "Hospital Central de Formosa"
    assert payload.description == "Servicio de guardia 24hs"
    mock_repo.create.assert_called_once_with(db, payload)


def test_update_resource_success(service, mock_repo):
    db = MagicMock()
    mock_repo.update.return_value = _fake_item(10, title="Nuevo Nombre")

    payload = ResourceUpdate(title="Nuevo Nombre")
    result = service.update_resource(db=db, resource_id=10, data=payload)
    assert result.title == "Nuevo Nombre"


def test_update_resource_not_found(service, mock_repo):
    db = MagicMock()
    mock_repo.update.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        service.update_resource(db=db, resource_id=99, data=ResourceUpdate(title="Nuevo"))
    assert exc_info.value.status_code == 404


def test_delete_resource_success(service, mock_repo):
    db = MagicMock()
    mock_repo.soft_delete.return_value = True

    result = service.delete_resource(db=db, resource_id=15)
    assert result["id"] == 15
    assert "Soft Delete" in result["message"]


def test_delete_resource_not_found(service, mock_repo):
    db = MagicMock()
    mock_repo.soft_delete.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        service.delete_resource(db=db, resource_id=99)
    assert exc_info.value.status_code == 404
