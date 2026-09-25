"""
Pruebas del seeder de estafas reales y canales verificados (FH26-48 / TASK-009).
"""

from fastapi.testclient import TestClient

import app.database as app_db
from app.main import app
from app.models.incident import IncidentReport, OfficialChannel, AttackVector
from app.seeder import INCIDENTS, OFFICIAL_CHANNELS, run_seed

client = TestClient(app)


def test_seed_creates_all_channels_and_incidents():
    db = app_db.SessionLocal()
    try:
        result = run_seed(db)

        assert result["created"] == {"channels": 5, "incidents": 10}
        assert result["skipped"] == {"channels": 0, "incidents": 0}
        assert db.query(OfficialChannel).count() == len(OFFICIAL_CHANNELS)
        assert db.query(IncidentReport).count() == len(INCIDENTS)
    finally:
        db.close()


def test_seed_is_idempotent():
    db = app_db.SessionLocal()
    try:
        run_seed(db)
        second = run_seed(db)

        assert second["created"] == {"channels": 0, "incidents": 0}
        assert second["skipped"] == {"channels": 5, "incidents": 10}
        assert db.query(OfficialChannel).count() == len(OFFICIAL_CHANNELS)
        assert db.query(IncidentReport).count() == len(INCIDENTS)
    finally:
        db.close()


def test_seeded_incidents_integrity():
    db = app_db.SessionLocal()
    try:
        run_seed(db)
        incidents = db.query(IncidentReport).all()

        valid_vectors = {v.value for v in AttackVector}
        for incident in incidents:
            assert incident.attack_vector in valid_vectors
            assert incident.attack_vector == incident.attack_vector.upper()
            assert incident.votes_count >= 1
            assert incident.status == "active"
            assert incident.deleted_at is None
            assert incident.impersonated_entity
            assert incident.description
    finally:
        db.close()


def test_seeded_channels_visible_via_api():
    db = app_db.SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()

    response = client.get("/api/core/incidents/channels/verified")

    assert response.status_code == 200
    channels = response.json()
    assert len(channels) == len(OFFICIAL_CHANNELS)
    names = {c["entity_name"] for c in channels}
    assert {"Banco Formosa", "Tarjeta Chigüé", "REFSA Electricidad"} <= names
    for channel in channels:
        assert channel["emergency_phone"]
        assert channel["official_domains"]


def test_seeded_incidents_visible_in_radar():
    db = app_db.SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()

    response = client.get("/api/core/incidents", params={"page": 1, "limit": 5})

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == len(INCIDENTS)
    assert len(payload["items"]) == 5

    filtered = client.get("/api/core/incidents", params={"entity": "REFSA"})
    assert filtered.status_code == 200
    assert filtered.json()["total"] >= 1
