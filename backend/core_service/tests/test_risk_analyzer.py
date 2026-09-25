import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.chat_service import ChatService
from app.schemas.chat import ChatMessageResponse

client = TestClient(app)

# ==============================================================================
# PRUEBAS UNITARIAS: ChatService (Motor Heurístico)
# ==============================================================================

class TestChatServiceUnit:
    """Suite de pruebas unitarias para el motor heurístico ChatService."""

    @pytest.fixture(autouse=True)
    def setup_service(self):
        self.service = ChatService()

    def test_detect_banco_formosa(self):
        msg = "Estimado cliente de Banco Formosa, su cuenta ha sufrido un bloqueo preventivo."
        result = self.service.analyze_message(msg)
        assert result.detected_entity == "Banco Formosa"
        assert any(p.category == "AUTHORITY" for p in result.highlighted_phrases)

    def test_detect_tarjeta_chigue(self):
        msg = "Aviso importante de Tarjeta Chigüé: regularice sus consumos ingresando aquí."
        result = self.service.analyze_message(msg)
        assert result.detected_entity == "Tarjeta Chigüé"

    def test_detect_refsa_utility(self):
        msg = "REFSA informa: corte de luz programado por deuda pendiente. Evitá el corte abonando en 24 horas."
        result = self.service.analyze_message(msg)
        assert result.detected_entity == "REFSA"
        assert any(p.category == "URGENCE" for p in result.highlighted_phrases)

    def test_detect_mercado_pago(self):
        msg = "Alerta de Mercado Pago: detectamos un inicio de sesión desconocido en tu cuenta de MP Argentina."
        result = self.service.analyze_message(msg)
        assert result.detected_entity == "Mercado Pago"

    def test_detect_anses(self):
        msg = "ANSES: Fuiste seleccionado para el bono extraordinario de fin de año. Reclamá tu acreditación pendiente."
        result = self.service.analyze_message(msg)
        assert result.detected_entity == "ANSES"
        assert any(p.category == "GREED" for p in result.highlighted_phrases)

    def test_detect_whatsapp_support_impersonation(self):
        msg = "Soporte de WhatsApp: Tu código de verificación ha sido solicitado desde otro dispositivo."
        result = self.service.analyze_message(msg)
        assert result.detected_entity == "WhatsApp"

    def test_detect_police_judiciary(self):
        msg = "Policía y Fiscalía provincial: Citación judicial urgente bajo orden de detención."
        result = self.service.analyze_message(msg)
        assert result.detected_entity == "Policía / Poder Judicial"

    def test_urgency_detection(self):
        msg = "¡Último aviso urgente! Tenés 24 horas antes del cierre definitivo de tu cuenta."
        result = self.service.analyze_message(msg)
        urgence_matches = [p for p in result.highlighted_phrases if p.category == "URGENCE"]
        assert len(urgence_matches) >= 2

    def test_credentials_detection_and_critical_warning(self):
        msg = "Ingresá tu clave token de 6 dígitos y transferí tus fondos al nuevo CBU para respaldarlos."
        result = self.service.analyze_message(msg)
        cred_matches = [p for p in result.highlighted_phrases if p.category == "CREDENTIALS"]
        assert len(cred_matches) >= 2
        assert "NUNCA" in result.what_not_to_do.upper()

    def test_remote_desktop_software_detection(self):
        msg = "Para solucionar el inconveniente técnico descargá esta app: AnyDesk o TeamViewer y danos acceso."
        result = self.service.analyze_message(msg)
        assert any("anydesk" in p.phrase.lower() or "teamviewer" in p.phrase.lower() for p in result.highlighted_phrases)
        assert any(p.category == "CREDENTIALS" for p in result.highlighted_phrases)

    def test_fake_link_detection(self):
        msg = "Verificá tus datos ingresando en bit.ly/banco-formosa-actualizar antes del cierre."
        result = self.service.analyze_message(msg)
        link_matches = [p for p in result.highlighted_phrases if p.category == "FAKE_LINK"]
        assert len(link_matches) >= 1
        assert "bit.ly" in link_matches[0].phrase

    def test_high_risk_semaforo(self):
        msg = "URGENTE Banco Formosa: cuenta suspendida. Validá tu token en http://phishing-formosa.xyz"
        result = self.service.analyze_message(msg)
        assert result.risk_level == "HIGH"
        assert result.risk_percentage >= 60
        assert "ALERTA ROJA" in result.summary
        assert "FRENÁ INMEDIATAMENTE" in result.immediate_action

    def test_medium_risk_semaforo(self):
        msg = "Aviso de Banco Formosa: estimamos demoras en la atención antes de las 18hs."
        result = self.service.analyze_message(msg)
        assert result.risk_level == "MEDIUM"
        assert 30 <= result.risk_percentage < 60
        assert "PRECAUCIÓN" in result.summary

    def test_low_risk_semaforo(self):
        msg = "Hola Gabriel, ¿vamos a almorzar empanadas después de la reunión técnica?"
        result = self.service.analyze_message(msg)
        assert result.risk_level == "LOW"
        assert result.risk_percentage < 30
        assert "RIESGO BAJO" in result.summary

    def test_wa_share_text_generation(self):
        msg = "Banco Formosa: tu clave caduca en 2 horas."
        result = self.service.analyze_message(msg)
        assert "Banco Formosa" in result.wa_share_text
        assert "CiberGuardián" in result.wa_share_text
        assert str(result.risk_percentage) in result.wa_share_text
        assert result.risk_level in result.wa_share_text

    def test_attack_vector_inference(self):
        msg_wa = "Hola mamá, agendá mi nuevo número de WhatsApp que perdí el celular."
        res_wa = self.service.analyze_message(msg_wa)
        assert res_wa.detected_vector == "WHATSAPP"

        msg_web = "Renová tu clave bancaria ingresando en https://sitio-trucho.com"
        res_web = self.service.analyze_message(msg_web)
        assert res_web.detected_vector == "WEB"


# ==============================================================================
# PRUEBAS DE INTEGRACIÓN: API /chat/message
# ==============================================================================

class TestChatRouterIntegration:
    """Suite de integración HTTP para el endpoint de análisis de chat."""

    def test_post_message_success_high_risk(self):
        payload = {
            "message": "¡ALERTA ROJA! Tu cuenta de Banco Formosa será bloqueada en 24 horas. Ingresá tu CBU y token en bit.ly/reactivar"
        }
        response = client.post("/chat/message", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] == "HIGH"
        assert data["risk_percentage"] >= 60
        assert data["detected_entity"] == "Banco Formosa"
        assert len(data["highlighted_phrases"]) >= 3
        assert "wa_share_text" in data

    def test_post_message_success_medium_risk(self):
        payload = {
            "message": "Aviso de REFSA: Evitá el corte de luz antes de las 18hs."
        }
        response = client.post("/chat/message", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] in ("MEDIUM", "HIGH")
        assert data["detected_entity"] == "REFSA"

    def test_post_message_success_low_risk(self):
        payload = {
            "message": "¿Tenés los apuntes de la clase de ciberseguridad para pasarme?"
        }
        response = client.post("/chat/message", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] == "LOW"
        assert data["risk_percentage"] < 30

    def test_post_message_validation_min_length(self):
        payload = {"message": "hi"}  # Menor a 3 caracteres (min_length=3)
        response = client.post("/chat/message", json=payload)
        assert response.status_code == 422
        errors = response.json().get("detail", [])
        assert any("message" in str(err.get("loc", [])) for err in errors)

    def test_post_message_validation_empty_body(self):
        response = client.post("/chat/message", json={})
        assert response.status_code == 422

    def test_post_message_via_prefixed_route_compatibility(self):
        """Verifica que la ruta espejo /api/core/chat/message funcione transparentemente."""
        payload = {
            "message": "¡Banco Formosa urgente! Clave token solicitada."
        }
        response = client.post("/api/core/chat/message", json=payload)
        assert response.status_code == 200
        assert response.json()["detected_entity"] == "Banco Formosa"
