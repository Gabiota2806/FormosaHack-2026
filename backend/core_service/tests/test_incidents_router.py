from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.models.incident import OfficialChannel
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


def test_list_incidents_paginated_basic():
    for i in range(3):
        _create_incident(
            client,
            title=f"Amenaza número {i + 1}",
            description=f"Descripción detallada del intento de estafa número {i + 1}",
        )

    res = client.get("/api/core/incidents?page=1&limit=2")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] == 3
    assert data["page"] == 1
    assert data["limit"] == 2
    assert data["total_pages"] == 2
    assert len(data["items"]) == 2


def test_list_incidents_filter_by_entity_and_vector():
    _create_incident(
        client,
        title="REFSA intento WhatsApp",
        description="Reporte uno sobre REFSA suplantada por WhatsApp",
        impersonated_entity="REFSA",
        attack_vector="WHATSAPP",
    )
    _create_incident(
        client,
        title="Banco Formosa SMS",
        description="Reporte dos sobre Banco Formosa suplantada por SMS",
        impersonated_entity="Banco Formosa",
        attack_vector="SMS",
    )

    res_entity = client.get("/api/core/incidents?entity=REFSA")
    assert res_entity.status_code == 200
    data_entity = res_entity.json()
    assert data_entity["total"] == 1
    assert data_entity["items"][0]["impersonated_entity"] == "REFSA"

    res_vector = client.get("/api/core/incidents?vector=SMS")
    assert res_vector.status_code == 200
    data_vector = res_vector.json()
    assert data_vector["total"] == 1
    assert data_vector["items"][0]["attack_vector"] == "SMS"


def test_list_incidents_search_text():
    _create_incident(
        client,
        title="Phishing Banco Formosa urgente",
        description="Descripción de la amenaza con palabra clave",
    )
    _create_incident(
        client,
        title="Otro reporte distinto",
        description="Otra cosa sin la palabra clave buscada",
    )

    res = client.get("/api/core/incidents?search=Phishing")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert "Phishing" in data["items"][0]["title"]


def test_soft_delete_excludes_from_feed():
    created = _create_incident(
        client,
        title="Amenaza a borrar lógico",
        description="Reporte que se va a eliminar con soft delete",
    )
    incident_id = created["id"]

    list_before = client.get("/api/core/incidents")
    assert list_before.status_code == 200
    assert any(item["id"] == incident_id for item in list_before.json()["items"])

    del_res = client.delete(f"/api/core/incidents/{incident_id}")
    assert del_res.status_code == 204

    list_after = client.get("/api/core/incidents")
    assert list_after.status_code == 200
    assert all(item["id"] != incident_id for item in list_after.json()["items"])


def test_vote_increments_atomically():
    created = _create_incident(
        client,
        title="Amenaza votable",
        description="Reporte para validar voto atómico y deduplicación",
    )
    incident_id = created["id"]
    assert created["votes_count"] == 1

    vote1 = client.post(
        f"/api/core/incidents/{incident_id}/me-too",
        json={"user_fingerprint": "fingerprint_dispositivo_A_001"},
    )
    assert vote1.status_code == 200
    assert vote1.json()["success"] is True
    assert vote1.json()["votes_count"] == 2

    vote2 = client.post(
        f"/api/core/incidents/{incident_id}/me-too",
        json={"user_fingerprint": "fingerprint_dispositivo_B_002"},
    )
    assert vote2.status_code == 200
    assert vote2.json()["success"] is True
    assert vote2.json()["votes_count"] == 3

    vote_dup = client.post(
        f"/api/core/incidents/{incident_id}/me-too",
        json={"user_fingerprint": "fingerprint_dispositivo_A_001"},
    )
    assert vote_dup.status_code == 200
    assert vote_dup.json()["success"] is False
    assert vote_dup.json()["votes_count"] == 3


def test_outbreak_spike_detection():
    for i in range(3):
        _create_incident(
            client,
            title=f"Brote REFSA intento {i + 1}",
            description=f"Descripción del intento de estafa REFSA número {i + 1}",
            impersonated_entity="REFSA",
            attack_vector="WHATSAPP",
        )
    _create_incident(
        client,
        title="Reporte aislado Banco Formosa",
        description="Reporte sin brote activo de la otra entidad",
        impersonated_entity="Banco Formosa",
        attack_vector="SMS",
    )

    res = client.get("/api/core/incidents")
    assert res.status_code == 200
    data = res.json()

    assert data["has_active_outbreak"] is True
    assert data["outbreak_entity"] == "REFSA"

    refsa_items = [item for item in data["items"] if item["impersonated_entity"] == "REFSA"]
    assert len(refsa_items) >= 3
    assert all(item["is_outbreak_spike"] is True for item in refsa_items)

    banfo_items = [
        item for item in data["items"] if item["impersonated_entity"] == "Banco Formosa"
    ]
    assert all(item["is_outbreak_spike"] is False for item in banfo_items)


def test_get_verified_channels_returns_only_active():
    with app_db.SessionLocal() as db:
        active_channel = OfficialChannel(
            entity_name="Banco Formosa",
            official_domains="bancoformosa.com.ar",
            official_phones="+54 370 4450000",
            emergency_phone="+54 370 4450000",
            verified_whatsapp="+54 9 370 4450000",
            advice="Nunca transfieras a CVU particular.",
        )
        deleted_channel = OfficialChannel(
            entity_name="Canal Borrado REFSA",
            official_domains="refsa-falso.com.ar",
            official_phones="+54 370 4430000",
            emergency_phone="+54 370 4430000",
            deleted_at=datetime.now(timezone.utc),
        )
        db.add_all([active_channel, deleted_channel])
        db.commit()

    res = client.get("/api/core/incidents/channels/verified")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["entity_name"] == "Banco Formosa"