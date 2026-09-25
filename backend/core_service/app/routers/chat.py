from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chatbot CiberGuardián"])

def get_chat_service() -> ChatService:
    return ChatService()

@router.post(
    "/message",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Analizar mensaje sospechoso en tiempo real",
    description="Evalúa el texto enviado con Gemini AI (o motor heurístico resiliente ante degradación), detecta manipulación psicológica, calcula el semáforo de riesgo y provee acciones inmediatas y plantilla para WhatsApp."
)
async def analyze_message(
    payload: ChatMessageRequest,
    service: ChatService = Depends(get_chat_service)
):
    try:
        return await service.analyze_message_with_fallback(payload.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar el mensaje: {str(e)}"
        )

