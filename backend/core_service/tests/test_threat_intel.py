import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.core.security import limiter
from app.main import app
from app.repositories.threat_intel_repository import ThreatIntelRepository
from app.services.threat_intel_service import ThreatIntelService

client = TestClient(app)


@pytest.fixture(autouse=True)
def _state(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    limiter.enabled = False
    yield
    limiter.enabled = True


def _session():
    import app.database as app_db
    return app_db.SessionLocal()


def _create_incident(phone=None, url=None, cbu=None, entity="REFSA", votes=1):
    from app.models.incident import IncidentReport

    db = _session()
    try:
        incident = IncidentReport(
            title=f"Aviso falso de {entity}",
            description=f"Mensaje sospechoso suplantando a {entity}.",
            impersonated_entity=entity,
            attack_vector="WHATSAPP",
            suspicious_phone=phone,
            suspicious_url=url,
            fake_cbu=cbu,
            votes_count=votes,
            status="active",
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident.id
    finally:
        db.close()


def _seed_official_channel(entity="REFSA", phones="0800-888-7337, 3704-439800", domains="https://www.refsa.com.ar"):
    from app.models.incident import OfficialChannel

    db = _session()
    try:
        db.add(OfficialChannel(
            entity_name=entity,
            official_domains=domains,
            official_phones=phones,
            emergency_phone="911",
        ))
        db.commit()
    finally:
        db.close()


# ==============================================================================
# PRUEBAS UNITARIAS: extracción y normalización de indicadores
# ==============================================================================

class TestIndicatorExtraction:
    def setup_method(self):
        self.service = ThreatIntelService()

    def test_extract_local_phone(self):
        indicators = self.service.extract_indicators("Llamame al 3704-439800 urgente")
        assert ("PHONE", "3704439800") in indicators

    def test_extract_international_phone(self):
        indicators = self.service.extract_indicators("Escribí al +54 9 370 412-3456")
        assert ("PHONE", "3704123456") in indicators

    def test_extract_url_domain(self):
        indicators = self.service.extract_indicators("Ingresá en http://www.refsa-pagos.com.ar/login")
        assert ("URL", "refsa-pagos.com.ar") in indicators

    def test_extract_url_www_without_scheme(self):
        indicators = self.service.extract_indicators("Visitá www.bancoformosa-seguro.top ya")
        assert ("URL", "bancoformosa-seguro.top") in indicators

    def test_extract_cbu_22_digits(self):
        cbu = "0000003100097654321234"
        indicators = self.service.extract_indicators(f"Transferí al CBU {cbu} por favor")
        assert ("CBU", cbu) in indicators

    def test_no_indicators_in_plain_text(self):
        assert self.service.extract_indicators("Hola, ¿cómo estás? Nos vemos mañana.") == []


class TestThreatIntelRepository:
    def test_only_incidents_with_min_votes(self):
        _create_incident(phone="3704111111", votes=2)
        _create_incident(phone="3704222222", votes=3)

        db = _session()
        try:
            indicators = ThreatIntelRepository().get_active_indicators(db, min_votes=3)
        finally:
            db.close()

        values = {(i.indicator_type, i.value) for i in indicators}
        assert ("PHONE", "3704222222") in values
        assert ("PHONE", "3704111111") not in values

    def test_soft_deleted_incidents_excluded(self):
        from datetime import datetime, timezone

        incident_id = _create_incident(phone="3704333333", votes=5)
        db = _session()
        try:
            from app.models.incident import IncidentReport
            incident = db.get(IncidentReport, incident_id)
            incident.deleted_at = datetime.now(timezone.utc)
            db.commit()
            indicators = ThreatIntelRepository().get_active_indicators(db, min_votes=3)
        finally:
            db.close()

        assert all(i.value != "3704333333" for i in indicators)

    def test_whitelist_contains_official_values(self):
        _seed_official_channel()
        db = _session()
        try:
            whitelist = ThreatIntelRepository().get_whitelisted_values(db)
        finally:
            db.close()

        assert "3704439800" in whitelist
        assert "refsa.com.ar" in whitelist


# ==============================================================================
# PRUEBAS DE INTEGRACIÓN: motor de inferencia con brotes comunitarios
# ==============================================================================

class TestOutbreakCommunityDetection:
    OUTBREAK_PHRASE = "brote activo reportado recientemente por la comunidad en Formosa"

    def test_phone_with_three_votes_raises_risk_to_100(self):
        _create_incident(phone="3704-555123", votes=3)

        res = client.post("/api/core/chat/message", json={
            "message": "REFSA te informa: evitá el corte de luz, llamá al 3704-555123 y acreditá tu pago con token."
        })

        assert res.status_code == 200
        body = res.json()
        assert body["risk_level"] == "HIGH"
        assert body["risk_percentage"] == 100
        assert "100%" in body["wa_share_text"]
        assert self.OUTBREAK_PHRASE in body["summary"]
        assert any(p["category"] == "COMMUNITY_OUTBREAK" for p in body["highlighted_phrases"])

    def test_phone_with_two_votes_does_not_override(self):
        _create_incident(phone="3704-666987", votes=2)

        res = client.post("/api/core/chat/message", json={
            "message": "Hola, ¿me llamás al 3704-666987 cuando puedas? Gracias."
        })

        assert res.status_code == 200
        body = res.json()
        assert body["risk_percentage"] < 100
        assert not any(p["category"] == "COMMUNITY_OUTBREAK" for p in body["highlighted_phrases"])

    def test_official_channel_phone_never_flagged(self):
        _seed_official_channel(phones="3704-439800")
        _create_incident(phone="3704-439800", votes=5)

        res = client.post("/api/core/chat/message", json={
            "message": "Ante cortes de luz podés llamar al 3704-439800 para reclamar."
        })

        assert res.status_code == 200
        body = res.json()
        assert not any(p["category"] == "COMMUNITY_OUTBREAK" for p in body["highlighted_phrases"])

    def test_domain_outbreak_match(self):
        _create_incident(url="https://www.bancoformosa-premios.top/ganaste", votes=4)

        res = client.post("/api/core/chat/message", json={
            "message": "Ganaste un premio de Banco Formosa, ingresá en www.bancoformosa-premios.top ya mismo."
        })

        assert res.status_code == 200
        body = res.json()
        assert body["risk_percentage"] == 100
        assert self.OUTBREAK_PHRASE in body["summary"]

    def test_cbu_outbreak_match(self):
        cbu = "0000003100097654321234"
        _create_incident(cbu=cbu, entity="Mercado Pago", votes=3)

        res = client.post("/api/core/chat/message", json={
            "message": f"Para acreditar tu bono transferí al CBU {cbu} antes de las 24 horas."
        })

        assert res.status_code == 200
        body = res.json()
        assert body["risk_percentage"] == 100
        assert body["risk_level"] == "HIGH"

    def test_db_failure_degrades_silently(self, monkeypatch):
        def boom(*args, **kwargs):
            raise RuntimeError("Base de datos caída")

        monkeypatch.setattr(ThreatIntelService, "match_outbreak_indicators", boom)

        res = client.post("/api/core/chat/message", json={
            "message": "ANSES: urgente, acreditá tu clave y token para cobrar el bono."
        })

        assert res.status_code == 200
        body = res.json()
        assert body["risk_level"] in ("LOW", "MEDIUM", "HIGH")

    def test_heuristic_path_without_db_session_still_works(self):
        res = client.post("/api/core/chat/message", json={"message": "Hola mamá, cambié de número, ¿me prestás plata?"})

        assert res.status_code == 200
        assert res.json()["risk_level"] in ("LOW", "MEDIUM", "HIGH")
