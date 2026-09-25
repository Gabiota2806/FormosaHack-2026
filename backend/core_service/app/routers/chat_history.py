from typing import Dict
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, limiter
from app.database import get_db
from app.schemas.chat_history import (
    ChatHistoryClaimRequest,
    ChatHistoryOut,
    ChatHistoryPage,
    ChatSessionOut,
)
from app.services.chat_history_service import ChatHistoryService

router = APIRouter(prefix="/chat/history", tags=["Historial de Chat"])


def get_chat_history_service() -> ChatHistoryService:
    return ChatHistoryService()


@router.get(
    "",
    response_model=ChatHistoryPage,
    summary="Listar consultas del historial del usuario",
    description="Devuelve el historial paginado de consultas analizadas por el usuario autenticado, en orden cronológico descendente y excluyendo las eliminadas por Soft Delete."
)
@limiter.limit("60/minute")
def list_history(
    request: Request,
    page: int = Query(1, ge=1, description="Número de página (1-indexed)."),
    limit: int = Query(10, ge=1, le=100, description="Cantidad de registros por página."),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    service: ChatHistoryService = Depends(get_chat_history_service),
):
    return service.list_user_history(
        db, user_id=current_user["user_id"], page=page, limit=limit
    )


@router.get(
    "/{id}",
    response_model=ChatHistoryOut,
    summary="Obtener detalle de consulta del historial",
    description="Recupera la tarjeta completa de diagnóstico y el mensaje analizado por su ID, verificando que pertenezca al usuario autenticado."
)
@limiter.limit("60/minute")
def get_history_entry(
    request: Request,
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    service: ChatHistoryService = Depends(get_chat_history_service),
):
    return service.get_entry_detail(db, entry_id=id, user_id=current_user["user_id"])


@router.delete(
    "/{id}",
    summary="Eliminar consulta del historial con Soft Delete",
    description="Aplica borrado lógico (deleted_at = now()) a la consulta seleccionada impidiendo su visualización futura. Asegura pertenencia al usuario."
)
@limiter.limit("30/minute")
def delete_history_entry(
    request: Request,
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    service: ChatHistoryService = Depends(get_chat_history_service),
) -> Dict[str, object]:
    service.delete_entry(db, entry_id=id, user_id=current_user["user_id"])
    return {
        "message": "Consulta eliminada exitosamente del historial.",
        "id": id,
        "deleted": True,
    }


@router.post(
    "/claim",
    response_model=ChatSessionOut,
    summary="Auto-claim de sesión anónima",
    description="Vincula una sesión anónima previa generada por el frontend (session_key) y todas sus consultas al usuario recién autenticado."
)
@limiter.limit("30/minute")
def claim_session(
    request: Request,
    payload: ChatHistoryClaimRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    service: ChatHistoryService = Depends(get_chat_history_service),
):
    return service.claim_session(
        db, session_key=payload.session_key, user_id=current_user["user_id"]
    )
