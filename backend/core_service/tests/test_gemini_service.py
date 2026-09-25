import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from google.genai.errors import APIError

from app.main import app
from app.schemas.chat import ChatMessageResponse, HighlightedPhrase
from app.services.gemini_service import GeminiService
from app.services.chat_service import ChatService

client = TestClient(app)

@pytest.fixture
def sample_chat_response():
    return ChatMessageResponse(
        risk_level="HIGH",
        risk_percentage=95,
        detected_entity="Banco Formosa",
        detected_vector="WHATSAPP",
        summary="ALERTA ROJA: Intento de suplantación de identidad bancaria detectado por IA.",
        immediate_action="No ingreses al enlace y bloqueá al remitente.",
        what_not_to_do="NUNCA proporciones tokens ni claves de acceso.",
        highlighted_phrases=[
            HighlightedPhrase(
                phrase="banco formosa",
                reason="Suplantación de entidad bancaria legítima.",
                category="AUTHORITY"
            )
        ],
        wa_share_text="Hola, CiberGuardián me alertó sobre un mensaje sospechoso de Banco Formosa (Riesgo HIGH 95%)."
    )

class TestGeminiServiceUnit:
    """Pruebas unitarias para GeminiService, cliente asíncrono y structured output."""

    @pytest.mark.anyio
    async def test_service_without_api_key_is_unavailable(self):
        service = GeminiService(api_key=None)
        assert service.is_available is False
        result = await service.analyze("Mensaje sospechoso de prueba")
        assert result is None

    @pytest.mark.anyio
    async def test_service_analyze_success_structured_output(self, sample_chat_response):
        service = GeminiService(api_key="fake-test-key")
        assert service.is_available is True

        mock_response = MagicMock()
        mock_response.parsed = sample_chat_response
        mock_response.text = None

        with patch.object(service._client.aio.models, "generate_content", new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = mock_response
            result = await service.analyze("Urgente Banco Formosa cuenta bloqueada")

            assert result is not None
            assert result.risk_level == "HIGH"
            assert result.risk_percentage == 95
            assert result.detected_entity == "Banco Formosa"
            mock_generate.assert_called_once()

    @pytest.mark.anyio
    async def test_service_analyze_success_from_raw_json_text(self, sample_chat_response):
        service = GeminiService(api_key="fake-test-key")
        assert service.is_available is True

        mock_response = MagicMock()
        mock_response.parsed = None
        mock_response.text = sample_chat_response.model_dump_json()

        with patch.object(service._client.aio.models, "generate_content", new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = mock_response
            result = await service.analyze("Urgente Banco Formosa cuenta bloqueada")

            assert result is not None
            assert result.risk_level == "HIGH"
            assert result.risk_percentage == 95
            assert result.detected_entity == "Banco Formosa"

    @pytest.mark.anyio
    async def test_service_analyze_timeout_triggers_graceful_none(self):
        # Configuramos un timeout ultracorto (0.05s) para provocar TimeoutError
        service = GeminiService(api_key="fake-test-key", timeout=0.05)

        async def slow_generate(*args, **kwargs):
            await asyncio.sleep(0.5)
            return MagicMock()

        with patch.object(service._client.aio.models, "generate_content", side_effect=slow_generate):
            result = await service.analyze("Mensaje demorado")
            assert result is None

    @pytest.mark.anyio
    async def test_service_analyze_api_error_triggers_graceful_none(self):
        service = GeminiService(api_key="fake-test-key")

        with patch.object(service._client.aio.models, "generate_content", side_effect=APIError(429, {"error": "Quota Exceeded"})):
            result = await service.analyze("Mensaje con cuota agotada")
            assert result is None


class TestChatServiceFallback:
    """Pruebas del orquestador híbrido con fallback automático hacia heurística."""

    @pytest.mark.anyio
    async def test_chat_service_fallback_when_gemini_not_available(self):
        gemini_mock = MagicMock(spec=GeminiService)
        gemini_mock.is_available = False

        chat_service = ChatService(gemini_service=gemini_mock)
        msg = "¡ÚLTIMO AVISO! Banco Formosa: tu cuenta caduca hoy. Ingresá tu token en bit.ly/bloqueo"
        result = await chat_service.analyze_message_with_fallback(msg)

        assert result.risk_level == "HIGH"
        assert result.detected_entity == "Banco Formosa"
        assert result.risk_percentage >= 60

    @pytest.mark.anyio
    async def test_chat_service_fallback_when_gemini_returns_none(self):
        gemini_mock = MagicMock(spec=GeminiService)
        gemini_mock.is_available = True
        gemini_mock.analyze = AsyncMock(return_value=None)

        chat_service = ChatService(gemini_service=gemini_mock)
        msg = "REFSA informa: corte de luz inminente por deuda. Evitá el corte abonando en 24 horas."
        result = await chat_service.analyze_message_with_fallback(msg)

        assert result.detected_entity == "REFSA"
        assert result.risk_level in ("MEDIUM", "HIGH")

        gemini_mock.analyze.assert_called_once_with(msg)

    @pytest.mark.anyio
    async def test_chat_service_uses_gemini_result_when_successful(self, sample_chat_response):
        gemini_mock = MagicMock(spec=GeminiService)
        gemini_mock.is_available = True
        gemini_mock.analyze = AsyncMock(return_value=sample_chat_response)

        chat_service = ChatService(gemini_service=gemini_mock)
        msg = "Mensaje evaluado por IA"
        result = await chat_service.analyze_message_with_fallback(msg)

        assert result == sample_chat_response
        gemini_mock.analyze.assert_called_once_with(msg)


class TestChatRouterGeminiIntegration:
    """Pruebas de integración HTTP del endpoint /chat/message con el flujo híbrido."""

    def test_post_message_with_fallback_returns_200(self):
        payload = {
            "message": "Aviso de Banco Formosa: valide su token de 6 dígitos antes de las 24 horas."
        }
        response = client.post("/chat/message", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] == "HIGH"
        assert data["detected_entity"] == "Banco Formosa"
        assert "wa_share_text" in data

    def test_post_message_prefixed_route_returns_200(self):
        payload = {
            "message": "Hola má, cambié de número, se me rompió el celular."
        }
        response = client.post("/api/core/chat/message", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] in ("MEDIUM", "HIGH")
        assert any(p["category"] == "FAMILY_IMPERSONATION" for p in data["highlighted_phrases"])
