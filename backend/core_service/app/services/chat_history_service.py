import logging
import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.chat import ChatHistoryEntry
from app.repositories.chat_history_repository import ChatHistoryRepository
from app.schemas.chat import ChatMessageResponse
from app.schemas.chat_history import (
    ChatHistoryCreate,
    ChatHistoryOut,
    ChatHistoryPage,
    ChatSessionOut,
)

logger = logging.getLogger("ciberguardian.chat_history")


class ChatHistoryService:
    """
    Capa de servicio para la gestión del historial de consultas del Asistente Virtual.
    Aplica Repository Pattern, validación de pertenencia (403), Soft Delete y Auto-Claim.
    """

    def __init__(self, repository: Optional[ChatHistoryRepository] = None):
        self.repository = repository or ChatHistoryRepository()

    def list_user_history(
        self, db: Session, user_id: int, page: int = 1, limit: int = 10
    ) -> ChatHistoryPage:
        """Obtiene las entradas de historial activas del usuario de forma paginada y en orden descendente."""
        page = max(1, page)
        limit = max(1, min(100, limit))
        result = self.repository.list_by_user(db, user_id=user_id, page=page, limit=limit)
        items = [ChatHistoryOut.model_validate(e) for e in result["items"]]
        return ChatHistoryPage(
            items=items,
            total=result["total"],
            page=page,
            limit=limit,
        )

    def get_entry_detail(
        self, db: Session, entry_id: int, user_id: int
    ) -> ChatHistoryOut:
        """Obtiene una consulta por ID asegurando pertenencia al usuario solicitante."""
        entry = self.repository.get_entry_by_id(db, entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consulta de historial no encontrada o eliminada.",
            )
        if entry.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para acceder a esta consulta del historial.",
            )
        return ChatHistoryOut.model_validate(entry)

    def delete_entry(
        self, db: Session, entry_id: int, user_id: int
    ) -> bool:
        """Aplica Soft Delete a una entrada de historial verificando pertenencia del usuario."""
        entry = self.repository.get_entry_by_id(db, entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consulta de historial no encontrada o eliminada.",
            )
        if entry.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para eliminar esta consulta del historial.",
            )
        return self.repository.soft_delete_entry(db, entry_id)

    def claim_session(
        self, db: Session, session_key: str, user_id: int
    ) -> ChatSessionOut:
        """
        Auto-Claim: Asocia una sesión anónima y sus consultas previas al usuario autenticado.
        """
        session = self.repository.claim_session(db, session_key=session_key, user_id=user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesión de chat no encontrada o inactiva.",
            )
        return ChatSessionOut.model_validate(session)

    def save_analysis_message(
        self,
        db: Session,
        diagnosis: ChatMessageResponse,
        original_message: str,
        session_key: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> Optional[ChatHistoryEntry]:
        """
        Persistencia automática silenciosa del mensaje analizado y su diagnóstico
        si se cuenta con session_key o usuario autenticado.
        """
        if not session_key and not user_id:
            return None

        try:
            effective_key = session_key or f"user-session-{user_id}-{uuid.uuid4().hex[:8]}"
            session = self.repository.get_or_create_session(
                db, session_key=effective_key, user_id=user_id
            )
            if user_id is not None and session.user_id is None:
                session.user_id = user_id
                db.commit()
                db.refresh(session)

            create_dto = ChatHistoryCreate(
                message=original_message,
                risk_level=diagnosis.risk_level,
                risk_percentage=diagnosis.risk_percentage,
                detected_entity=diagnosis.detected_entity,
                detected_vector=diagnosis.detected_vector or "WHATSAPP",
                summary=diagnosis.summary,
                immediate_action=diagnosis.immediate_action,
                what_not_to_do=diagnosis.what_not_to_do,
                highlighted_phrases=diagnosis.highlighted_phrases,
                wa_share_text=diagnosis.wa_share_text,
            )
            return self.repository.create_entry(
                db, session_id=session.id, data=create_dto, user_id=user_id or session.user_id
            )
        except Exception as exc:
            logger.warning("Fallo silencioso al persistir historial de chat: %s", exc)
            return None
