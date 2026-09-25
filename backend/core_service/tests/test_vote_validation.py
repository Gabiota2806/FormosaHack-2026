import pytest
from fastapi.testclient import TestClient
from app.main import app
import app.database as app_db
from app.models.incident import IncidentReport
from app.services.incident_service import IncidentService
from app.schemas.incident import IncidentCreate, VoteRequest

client = TestClient(app)

def _create_sample_incident(client, **overrides) -> dict:
    payload = {
        "title": "Phishing REFSA en Formosa Capital",
        "description": "Mensaje fraudulento intimando corte de suministro eléctrico en 2 horas.",
        "impersonated_entity": "REFSA",
        "attack_vector": "WHATSAPP",
        "evidence_text": "Pague inmediatamente a este CVU para evitar corte",
    }
    payload.update(overrides)
    res = client.post("/incidents", json=payload)
    assert res.status_code == 201, res.text
    return res.json()

# ==============================================================================
# PRUEBAS UNITARIAS: IncidentService y Validación Atómica de Votos
# ==============================================================================

class TestVoteValidationUnit:
    """Pruebas unitarias de la lógica de negocio de votación solidaria y deduplicación."""

    @pytest.fixture(autouse=True)
    def setup_service(self):
        self.service = IncidentService()

    def test_vote_first_time_increments_count(self):
        with app_db.SessionLocal() as db:
            created = self.service.create_incident(db, IncidentCreate(
                title="Estafa Tarjeta Chigüé en Clorinda",
                description="Llamada pidiendo datos de tarjeta para supuesto reintegro.",
                impersonated_entity="Tarjeta Chigüé",
                attack_vector="LLAMADA"
            ))
            assert created.votes_count == 1

            vote_res = self.service.vote_incident(db, created.id, "device_fingerprint_alpha_01")
            assert vote_res is not None
            assert vote_res.success is True
            assert vote_res.votes_count == 2
            assert "colaborar" in vote_res.message

    def test_vote_duplicate_fingerprint_rejected(self):
        with app_db.SessionLocal() as db:
            created = self.service.create_incident(db, IncidentCreate(
                title="Mensaje falso Banco Formosa",
                description="SMS con enlace a clon de home banking.",
                impersonated_entity="Banco Formosa",
                attack_vector="SMS"
            ))

            # Primer voto: aceptado
            res1 = self.service.vote_incident(db, created.id, "device_fingerprint_beta_02")
            assert res1.success is True
            assert res1.votes_count == 2

            # Segundo voto misma huella: rechazado atómicamente
            res2 = self.service.vote_incident(db, created.id, "device_fingerprint_beta_02")
            assert res2.success is False
            assert res2.votes_count == 2
            assert "anteriormente" in res2.message

    def test_multiple_unique_fingerprints_accumulate(self):
        with app_db.SessionLocal() as db:
            created = self.service.create_incident(db, IncidentCreate(
                title="Estafa Anses bono Pirané",
                description="Supuesto cobro de IFE con pedido de clave token.",
                impersonated_entity="ANSES",
                attack_vector="WHATSAPP"
            ))

            for i in range(5):
                fp = f"unique_device_fingerprint_{i:04d}"
                res = self.service.vote_incident(db, created.id, fp)
                assert res.success is True
                assert res.votes_count == 2 + i

    def test_vote_nonexistent_incident_returns_none(self):
        with app_db.SessionLocal() as db:
            res = self.service.vote_incident(db, 999999, "valid_fp_for_missing_item")
            assert res is None

    def test_vote_soft_deleted_incident_returns_none(self):
        with app_db.SessionLocal() as db:
            created = self.service.create_incident(db, IncidentCreate(
                title="Amenaza a borrar",
                description="Incidente que se dará de baja por soft delete.",
                impersonated_entity="REFSA",
                attack_vector="WEB"
            ))
            # Aplicar soft delete
            deleted = self.service.delete_incident(db, created.id)
            assert deleted is True

            # Intento de votar incidente borrado lógicamente
            res = self.service.vote_incident(db, created.id, "valid_fp_for_deleted_item")
            assert res is None


# ==============================================================================
# PRUEBAS DE INTEGRACIÓN: API /incidents/{id}/me-too y Validaciones Pydantic
# ==============================================================================

class TestVoteRouterIntegration:
    """Pruebas de endpoints REST para votación comunitaria y validaciones HTTP."""

    def test_api_vote_success_and_deduplication(self):
        item = _create_sample_incident(client, title="Intento suplantación Mercado Pago")
        inc_id = item["id"]
        assert item["votes_count"] == 1

        # Voto exitoso
        vote1 = client.post(f"/incidents/{inc_id}/me-too", json={"user_fingerprint": "fingerprint_user_1111"})
        assert vote1.status_code == 200
        data1 = vote1.json()
        assert data1["success"] is True
        assert data1["incident_id"] == inc_id
        assert data1["votes_count"] == 2

        # Voto repetido (misma huella)
        vote_dup = client.post(f"/incidents/{inc_id}/me-too", json={"user_fingerprint": "fingerprint_user_1111"})
        assert vote_dup.status_code == 200
        data_dup = vote_dup.json()
        assert data_dup["success"] is False
        assert data_dup["votes_count"] == 2

    def test_api_vote_nonexistent_incident_returns_404(self):
        response = client.post("/incidents/999999/me-too", json={"user_fingerprint": "fingerprint_user_2222"})
        assert response.status_code == 404
        assert "no encontrado" in response.json()["detail"].lower()

    def test_api_vote_soft_deleted_incident_returns_404(self):
        item = _create_sample_incident(client, title="Incidente para probar borrado y voto")
        inc_id = item["id"]

        del_res = client.delete(f"/incidents/{inc_id}")
        assert del_res.status_code == 204

        vote_res = client.post(f"/incidents/{inc_id}/me-too", json={"user_fingerprint": "fingerprint_user_3333"})
        assert vote_res.status_code == 404

    def test_api_vote_validation_fingerprint_too_short(self):
        item = _create_sample_incident(client)
        # Menor a 8 caracteres (min_length=8)
        response = client.post(f"/incidents/{item['id']}/me-too", json={"user_fingerprint": "short"})
        assert response.status_code == 422
        errors = response.json().get("detail", [])
        assert any("user_fingerprint" in str(err.get("loc", [])) for err in errors)

    def test_api_vote_validation_fingerprint_too_long(self):
        item = _create_sample_incident(client)
        # Mayor a 64 caracteres (max_length=64)
        response = client.post(f"/incidents/{item['id']}/me-too", json={"user_fingerprint": "a" * 65})
        assert response.status_code == 422

    def test_api_vote_validation_missing_fingerprint(self):
        item = _create_sample_incident(client)
        response = client.post(f"/incidents/{item['id']}/me-too", json={})
        assert response.status_code == 422

    def test_api_vote_via_prefixed_route_compatibility(self):
        """Verifica compatibilidad con la ruta /api/core/incidents/{id}/me-too."""
        item = _create_sample_incident(client, title="Prueba ruta prefijada /api/core")
        response = client.post(
            f"/api/core/incidents/{item['id']}/me-too",
            json={"user_fingerprint": "fingerprint_prefix_route"}
        )
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["votes_count"] == 2

    def test_outbreak_spike_activation_on_feed(self):
        """Verifica que al acumular 3 reportes de una entidad se active el banner de brote y el flag de spike."""
        for i in range(3):
            _create_sample_incident(
                client,
                title=f"Brote activo REFSA número {i + 1}",
                impersonated_entity="REFSA",
                attack_vector="WHATSAPP"
            )

        res = client.get("/incidents?page=1&limit=10")
        assert res.status_code == 200
        data = res.json()
        assert data["has_active_outbreak"] is True
        assert data["outbreak_entity"] == "REFSA"

        refsa_items = [it for it in data["items"] if it["impersonated_entity"] == "REFSA"]
        assert len(refsa_items) >= 3
        assert all(it["is_outbreak_spike"] is True for it in refsa_items)
