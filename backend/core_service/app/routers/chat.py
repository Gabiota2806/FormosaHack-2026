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
    description="Evalúa el texto enviado, detecta manipulación psicológica, calcula el semáforo de riesgo y provee acciones inmediatas y plantilla para WhatsApp."
)
def analyze_message(
    payload: ChatMessageRequest,
    service: ChatService = Depends(get_chat_service)
):
    try:
        return service.analyze_message(payload.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar el mensaje: {str(e)}"
        )
