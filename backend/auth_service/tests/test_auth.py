import os
import pytest
from fastapi.testclient import TestClient

# Usar SQLite en memoria para tests rápidos independientes
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app
from app.database import Base, engine

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_register_user():
    payload = {
        "name": "Juan Perez",
        "email": "juan@formosa.gob.ar",
        "password": "Password123!",
        "role": "user"
    }
    response = client.post("/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert "password_hash" not in data
    assert data["is_totp_enabled"] is False

def test_login_success():
    # Registrar primero
    client.post("/register", json={
        "name": "Maria Lopez",
        "email": "maria@formosa.gob.ar",
        "password": "Password123!"
    })
    # Iniciar sesión
    response = client.post("/login", json={
        "email": "maria@formosa.gob.ar",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["requires_2fa"] is False
