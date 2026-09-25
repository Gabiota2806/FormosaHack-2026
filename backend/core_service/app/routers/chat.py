from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_optional_user
from app.database import get_db
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatFollowupRequest,
    ChatFollowupResponse,
)
from app.services.chat_service import ChatService
from app.services.chat_history_service import ChatHistoryService

router = APIRouter(prefix="/chat", tags=["Chatbot CiberGuardián"])

def get_chat_service() -> ChatService:
    return ChatService()

def get_chat_history_service() -> ChatHistoryService:
    return ChatHistoryService()

@router.post(
    "/message",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Analizar mensaje sospechoso en tiempo real",
    description="Evalúa el texto enviado con Gemini AI (o motor heurístico resiliente ante degradación), detecta manipulación psicológica, correlaciona con brotes comunitarios activos (>= 3 votos), calcula el semáforo de riesgo y provee acciones inmediatas y plantilla para WhatsApp."
)
async def analyze_message(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    service: ChatService = Depends(get_chat_service),
    history_service: ChatHistoryService = Depends(get_chat_history_service),
    current_user: Optional[dict] = Depends(get_optional_user),
    x_session_key: Optional[str] = Header(None, alias="X-Session-Key"),
):
    try:
        diagnosis = await service.analyze_message_with_fallback(payload.message, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar el mensaje: {str(e)}"
        )

    effective_session_key = payload.session_key or x_session_key
    user_id = current_user.get("user_id") if current_user else None
    if effective_session_key or user_id:
        history_service.save_analysis_message(
            db=db,
            diagnosis=diagnosis,
            original_message=payload.message,
            session_key=effective_session_key,
            user_id=user_id,
        )

    return diagnosis

@router.post(
    "/followup",
    response_model=ChatFollowupResponse,
    status_code=status.HTTP_200_OK,
    summary="Preguntas de seguimiento y contención post-diagnóstico",
    description="Responde consultas del usuario tras un análisis de riesgo manteniendo el hilo conversacional, brindando contención psicológica, pautas de auxilio bancario y canales de denuncia oficiales de Formosa."
)
async def followup_message(
    payload: ChatFollowupRequest,
    db: Session = Depends(get_db),
    service: ChatService = Depends(get_chat_service)
):
    try:
        return await service.followup_with_fallback(payload, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el seguimiento: {str(e)}"
        )

