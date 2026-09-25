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
