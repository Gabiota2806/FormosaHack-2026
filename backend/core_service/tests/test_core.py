import os
import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app
from app.database import Base, engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_and_get_resource():
    payload = {
        "title": "Hospital de Alta Complejidad",
        "description": "Centro de referencia provincial",
        "category": "salud",
        "status": "active",
        "location": "Formosa Capital"
    }
    create_res = client.post("/", json=payload)
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    get_res = client.get(f"/{item_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == payload["title"]

def test_soft_delete():
    create_res = client.post("/", json={
        "title": "Registro Temporal",
        "category": "educacion",
        "location": "Pirané"
    })
    item_id = create_res.json()["id"]

    # Borrado lógico
    del_res = client.delete(f"/{item_id}")
    assert del_res.status_code == 200

    # No debe ser encontrado luego del borrado lógico
    get_res = client.get(f"/{item_id}")
    assert get_res.status_code == 404

def test_pagination_validation_lives_in_router():
    """
    La validación de paginación debe ocurrir en la capa Router (Query constraints),
    no en el Service. Si el cliente envía limit fuera de rango, FastAPI debe
    responder 422 antes de llegar al service.
    """
    # limit=999 excede el máximo permitido (le=100)
    bad_limit = client.get("/?limit=999")
    assert bad_limit.status_code == 422

    # page=0 viola ge=1
    bad_page = client.get("/?page=0")
    assert bad_page.status_code == 422
