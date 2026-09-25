from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.models.incident import IncidentReport, OfficialChannel
import app.database as app_db

client = TestClient(app)


def _create_incident(client, **overrides):
    payload = {
        "title": "Phishing genérico detectado",
        "description": "Descripción detallada del intento de estafa reportado.",
        "impersonated_entity": "Banco Formosa",
        "attack_vector": "WHATSAPP",
        "evidence_text": "Texto prueba de evidencia",
    }
    payload.update(overrides)
    res = client.post("/api/core/incidents", json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def test_stats_empty_database_returns_zeroes():
    res = client.get("/api/core/incidents/stats")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data == {
        "total_incidents": 0,
        "total_votes": 0,
        "verified_channels": 0,
        "distinct_entities": 0,
        "active_outbreaks_24h": 0,
    }


def test_stats_counts_incidents_votes_and_entities():
    inc1 = _create_incident(client, title="Amenaza uno Banco Formosa", description="Descripción detallada amenaza uno.")
    _create_incident(client, title="Amenaza dos REFSA", description="Descripción detallada amenaza dos.", impersonated_entity="REFSA")

    for i in range(2):
        res = client.post(f"/api/core/incidents/{inc1['id']}/me-too", json={"user_fingerprint": f"huella-anonima-{i:03d}"})
        assert res.status_code == 200

    res = client.get("/api/core/incidents/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_incidents"] == 2
    assert data["total_votes"] == 4
    assert data["distinct_entities"] == 2
    assert data["active_outbreaks_24h"] == 0


def test_stats_excludes_soft_deleted_incidents():
    inc = _create_incident(client, title="Amenaza a eliminar", description="Descripción detallada a eliminar.")
    _create_incident(client, title="Amenaza vigente", description="Descripción detallada vigente.")

    res = client.delete(f"/api/core/incidents/{inc['id']}")
    assert res.status_code == 204

    data = client.get("/api/core/incidents/stats").json()
    assert data["total_incidents"] == 1
    assert data["total_votes"] == 1


def test_stats_counts_verified_channels_excluding_deleted():
    with app_db.SessionLocal() as db:
        db.add(OfficialChannel(entity_name="Banco Formosa", official_domains="bancoformosa.com.ar", official_phones="0800-444-1234", emergency_phone="0800-444-1234"))
        db.add(OfficialChannel(entity_name="REFSA", official_domains="refsa.com.ar", official_phones="0800-888-4321", emergency_phone="0800-888-4321", deleted_at=datetime.now(timezone.utc)))
        db.commit()

    data = client.get("/api/core/incidents/stats").json()
    assert data["verified_channels"] == 1


def test_stats_detects_active_outbreak_24h():
    for i in range(3):
        _create_incident(client, title=f"Brote REFSA reporte {i + 1}", description=f"Descripción detallada brote número {i + 1}.", impersonated_entity="REFSA")
    _create_incident(client, title="Aislado Banco Formosa", description="Descripción detallada caso aislado.", impersonated_entity="Banco Formosa")

    data = client.get("/api/core/incidents/stats").json()
    assert data["active_outbreaks_24h"] == 1
