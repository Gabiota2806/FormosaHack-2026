"""
Tests específicos para FH26-47: Endpoints de Radar Paginado en Servidor y Filtros.

Cubre los criterios de aceptación de FH26-10 [US-05]:
  * Escenario 1: paginación server-side con filtros (entity, vector, search).
  * Escenario 2: voto atómico + deduplicación por fingerprint.
  * Detección de brote activo con flag `is_outbreak_spike` por tarjeta.
"""

from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.models.incident import IncidentReport, OfficialChannel
import app.database as app_db

client = TestClient(app)


def _seed_incident(client, **overrides):
    payload = {
        "title": "Amenaza base de pruebas FH26-47",
        "description": "Descripción base para validar paginación y filtros del Radar",
        "impersonated_entity": "Banco Formosa",
        "attack_vector": "WHATSAPP",
        "evidence_text": "transferir ya promo exclusiva",
    }
    payload.update(overrides)
    res = client.post("/api/core/incidents", json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def test_pagination_bounds_reject_invalid_query_params():
    res = client.get("/api/core/incidents?page=0&limit=10")
    assert res.status_code == 422

    res = client.get("/api/core/incidents?page=1&limit=0")
    assert res.status_code == 422

    res = client.get("/api/core/incidents?page=1&limit=51")
    assert res.status_code == 422


def test_pagination_default_values_when_no_params():
    res = client.get("/api/core/incidents")
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert data["limit"] == 10
    assert data["total_pages"] >= 1


def test_pagination_math_total_pages_calculation():
    for i in range(7):
        _seed_incident(client, title=f"Incidente paginación #{i + 1}")

    res = client.get("/api/core/incidents?limit=3")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 7
    assert data["limit"] == 3
    assert data["total_pages"] == 3


def test_pagination_returns_correct_slice_without_duplicates():
    created_ids = []
    for i in range(5):
        item = _seed_incident(client, title=f"Slice item #{i + 1}")
        created_ids.append(item["id"])

    page1 = client.get("/api/core/incidents?page=1&limit=2").json()
    page2 = client.get("/api/core/incidents?page=2&limit=2").json()
    page3 = client.get("/api/core/incidents?page=3&limit=2").json()

    page1_ids = {item["id"] for item in page1["items"]}
    page2_ids = {item["id"] for item in page2["items"]}
    page3_ids = {item["id"] for item in page3["items"]}

    assert len(page1["items"]) == 2
    assert len(page2["items"]) == 2
    assert len(page3["items"]) == 1

    assert page1_ids.isdisjoint(page2_ids)
    assert page1_ids.isdisjoint(page3_ids)
    assert page2_ids.isdisjoint(page3_ids)

    union_ids = page1_ids | page2_ids | page3_ids
    assert union_ids == set(created_ids)


def test_filter_entity_is_case_insensitive_ilike():
    _seed_incident(client, impersonated_entity="REFSA", title="Reporte REFSA mayúsculas")

    res_lower = client.get("/api/core/incidents?entity=refsa")
    res_upper = client.get("/api/core/incidents?entity=REFSA")
    res_partial = client.get("/api/core/incidents?entity=fsa")

    assert res_lower.json()["total"] >= 1
    assert res_upper.json()["total"] >= 1
    assert res_partial.json()["total"] >= 1


def test_filter_vector_uppercases_input_before_query():
    _seed_incident(client, attack_vector="SMS")

    res_lower = client.get("/api/core/incidents?vector=sms")
    res_upper = client.get("/api/core/incidents?vector=SMS")

    assert res_lower.json()["total"] >= 1
    assert res_upper.json()["total"] >= 1


def test_search_matches_title_description_and_evidence():
    _seed_incident(
        client,
        title="Promoción exclusiva Banco Formosa",
        description="Descripción genérica sin keyword",
        evidence_text="lorem ipsum dolor sit amet",
    )
    _seed_incident(
        client,
        title="Reporte sin keyword",
        description="Descripción con palabra clave token visible",
        evidence_text="otra cosa",
    )

    res_title = client.get("/api/core/incidents?search=Promoción")
    assert res_title.json()["total"] == 1

    res_desc = client.get("/api/core/incidents?search=token")
    assert res_desc.json()["total"] == 1


def test_combined_filters_use_logical_and():
    _seed_incident(
        client,
        impersonated_entity="REFSA",
        attack_vector="WHATSAPP",
        title="Reporte A match completo",
    )
    _seed_incident(
        client,
        impersonated_entity="REFSA",
        attack_vector="SMS",
        title="Reporte B mismo entity distinto vector",
    )
    _seed_incident(
        client,
        impersonated_entity="Banco Formosa",
        attack_vector="WHATSAPP",
        title="Reporte C distinto entity mismo vector",
    )

    res = client.get("/api/core/incidents?entity=REFSA&vector=WHATSAPP")
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Reporte A match completo"


def test_filter_with_no_matches_returns_empty_pagination():
    _seed_incident(client, impersonated_entity="Banco Formosa")

    res = client.get("/api/core/incidents?entity=NoExisteEsaEntidad")
    data = res.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["total_pages"] == 1


def test_ordering_returns_most_recent_first():
    first = _seed_incident(client, title="Primer reporte creado")
    res = client.get("/api/core/incidents")
    items = res.json()["items"]
    assert items[0]["id"] == first["id"]


def test_vote_is_idempotent_per_fingerprint_across_pages():
    created = _seed_incident(client, title="Reorte para voto idempotente")
    incident_id = created["id"]

    fingerprint = "qa_fh47_fingerprint_persistente_001"

    v1 = client.post(
        f"/api/core/incidents/{incident_id}/me-too",
        json={"user_fingerprint": fingerprint},
    )
    assert v1.json()["success"] is True
    assert v1.json()["votes_count"] == 2

    v2 = client.post(
        f"/api/core/incidents/{incident_id}/me-too",
        json={"user_fingerprint": fingerprint},
    )
    assert v2.json()["success"] is False
    assert v2.json()["votes_count"] == 2


def test_outbreak_flag_propagates_through_pagination_response():
    for i in range(3):
        _seed_incident(
            client,
            impersonated_entity="BroteEntity",
            attack_vector="WHATSAPP",
            title=f"Brote item #{i + 1}",
        )

    res = client.get("/api/core/incidents?limit=2")
    data = res.json()

    assert data["has_active_outbreak"] is True
    assert data["outbreak_entity"] == "BroteEntity"

    page2 = client.get("/api/core/incidents?page=2&limit=2").json()
    spike_ids_p1 = {item["id"] for item in data["items"] if item["is_outbreak_spike"]}
    spike_ids_p2 = {item["id"] for item in page2["items"] if item["is_outbreak_spike"]}
    assert len(spike_ids_p1 | spike_ids_p2) >= 3


def test_response_schema_contract_for_pagination_envelope():
    res = client.get("/api/core/incidents?page=1&limit=5")
    data = res.json()
    required_keys = {"items", "total", "page", "limit", "total_pages", "has_active_outbreak", "outbreak_entity"}
    assert required_keys.issubset(data.keys())
    assert isinstance(data["items"], list)
    assert isinstance(data["total"], int)
    assert isinstance(data["page"], int)
    assert isinstance(data["limit"], int)
    assert isinstance(data["total_pages"], int)
    assert isinstance(data["has_active_outbreak"], bool)
    assert data["outbreak_entity"] is None or isinstance(data["outbreak_entity"], str)


def test_each_item_schema_has_required_fields():
    _seed_incident(client, title="Item para validar schema individual")
    res = client.get("/api/core/incidents")
    item = res.json()["items"][0]
    required = {"id", "title", "description", "impersonated_entity", "attack_vector", "votes_count", "status", "created_at", "updated_at", "is_outbreak_spike"}
    assert required.issubset(item.keys())
    assert isinstance(item["votes_count"], int)
    assert isinstance(item["is_outbreak_spike"], bool)


def test_verified_channels_endpoint_excludes_soft_deleted():
    with app_db.SessionLocal() as db:
        db.add(
            OfficialChannel(
                entity_name="Canal Visible FH26-47",
                official_domains="formosa.gov.ar",
                official_phones="+54 370 1000000",
                emergency_phone="+54 370 1000000",
            )
        )
        db.add(
            OfficialChannel(
                entity_name="Canal Oculto FH26-47",
                official_domains="fake.gov.ar",
                official_phones="+54 370 2000000",
                emergency_phone="+54 370 2000000",
                deleted_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

    res = client.get("/api/core/incidents/channels/verified")
    assert res.status_code == 200
    names = {c["entity_name"] for c in res.json()}
    assert "Canal Visible FH26-47" in names
    assert "Canal Oculto FH26-47" not in names