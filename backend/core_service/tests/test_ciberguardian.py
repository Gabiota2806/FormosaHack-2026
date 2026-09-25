import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_high_risk_urgency_and_credentials():
    payload = {
        "message": "¡URGENTE Banco Formosa! Tu cuenta fue suspendida. Ingresá tu clave token de 6 dígitos en bit.ly/reactivar"
    }
    res = client.post("/api/core/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "HIGH"
    assert data["risk_percentage"] >= 60
    assert data["detected_entity"] == "Banco Formosa"
    assert len(data["highlighted_phrases"]) >= 2
    assert "wa.me" not in data["wa_share_text"] or len(data["wa_share_text"]) > 10

def test_chat_medium_risk():
    payload = {
        "message": "Aviso de Banco Formosa: Por mantenimiento del sistema, rogamos ingresar antes de las 20hs."
    }
    res = client.post("/api/core/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "MEDIUM"
    assert 30 <= data["risk_percentage"] < 60
    assert data["detected_entity"] == "Banco Formosa"

def test_chat_low_risk():
    payload = {
        "message": "Hola, ¿cómo estás? Te paso el apunte de la clase de algoritmos para que lo leas cuando puedas."
    }
    res = client.post("/api/core/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "LOW"
    assert data["risk_percentage"] < 30

def test_incident_creation_and_voting():
    payload = {
        "title": "Phishing REFSA por WhatsApp",
        "description": "Exigen pagar factura a CVU particular en 2 horas bajo amenaza de corte.",
        "impersonated_entity": "REFSA",
        "attack_vector": "WHATSAPP",
        "evidence_text": "Pague a CVU 000000123"
    }
    res = client.post("/api/core/incidents", json=payload)
    assert res.status_code == 201
    inc_id = res.json()["id"]

    # Validar amenaza ("A mí también me llegó")
    vote_res = client.post(f"/api/core/incidents/{inc_id}/me-too", json={"user_fingerprint": "test_fp_12345"})
    assert vote_res.status_code == 200
    assert vote_res.json()["success"] is True
    assert vote_res.json()["votes_count"] == 2

    # Intentar votar nuevamente con la misma huella no debe duplicar
    vote_repeat = client.post(f"/api/core/incidents/{inc_id}/me-too", json={"user_fingerprint": "test_fp_12345"})
    assert vote_repeat.json()["success"] is False
    assert vote_repeat.json()["votes_count"] == 2


def test_chat_no_emojis_in_summary_strings():
    payload = {
        "message": "Soy del Banco Formosa, necesito tu clave token urgente transferencia ya"
    }
    res = client.post("/api/core/chat/message", json=payload)
    assert res.status_code == 200
    summary = res.json()["summary"]
    forbidden_emojis = ["🚨", "⚠️", "✅"]
    for emoji in forbidden_emojis:
        assert emoji not in summary, f"summary contiene emoji prohibido {emoji}: {summary!r}"


def test_chat_family_impersonation_returns_high_risk():
    payload = {
        "message": "Hola má, cambié de número porque se rompió mi teléfono. ¿Me pasás el código de 6 dígitos que te acaba de llegar por SMS?"
    }
    res = client.post("/api/core/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "HIGH", f"esperaba HIGH, obtuve {data['risk_level']} ({data['risk_percentage']}%)"
    assert data["risk_percentage"] >= 60
    categories = {phrase["category"] for phrase in data["highlighted_phrases"]}
    assert "FAMILY_IMPERSONATION" in categories, f"categorías: {categories}"


def test_chat_url_keywords_are_not_counted_as_credential_or_greed():
    payload = {
        "message": "Tenés una acreditación pendiente, hace click acá bit.ly/bono-acreditacion"
    }
    res = client.post("/api/core/chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    phrases_text = " ".join(p["phrase"] for p in data["highlighted_phrases"]).lower()
    assert "acredita" not in phrases_text or any(
        "bit.ly" in p["phrase"].lower() for p in data["highlighted_phrases"]
    ), "El término 'acredita' no debe detectarse fuera del URL"


def test_chat_wa_share_text_remains_for_backward_compatibility():
    res = client.post("/api/core/chat/message", json={"message": "Hola"})
    assert res.status_code == 200
    data = res.json()
    assert "wa_share_text" in data
    assert isinstance(data["wa_share_text"], str)
    assert len(data["wa_share_text"]) > 10
