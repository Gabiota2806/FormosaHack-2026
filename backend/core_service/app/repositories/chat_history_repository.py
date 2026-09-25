from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.chat import ChatHistoryEntry, ChatSession
from app.schemas.chat_history import ChatHistoryCreate


class ChatHistoryRepository:
    """
    Capa de acceso a datos para Sesiones e Historial de Chat aplicando
    Repository Pattern y Soft Delete (filtrado obligatorio por deleted_at IS NULL).
    """

    def get_session_by_key(self, db: Session, session_key: str) -> Optional[ChatSession]:
        return db.query(ChatSession).filter(
            ChatSession.session_key == session_key,
            ChatSession.deleted_at.is_(None)
        ).first()

    def get_or_create_session(
        self, db: Session, session_key: str, user_id: Optional[int] = None
    ) -> ChatSession:
        existing = self.get_session_by_key(db, session_key)
        if existing:
            return existing

        session = ChatSession(session_key=session_key, user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_entry_by_id(self, db: Session, entry_id: int) -> Optional[ChatHistoryEntry]:
        return db.query(ChatHistoryEntry).filter(
            ChatHistoryEntry.id == entry_id,
            ChatHistoryEntry.deleted_at.is_(None)
        ).first()

    def create_entry(
        self, db: Session, session_id: int, data: ChatHistoryCreate,
        user_id: Optional[int] = None
    ) -> ChatHistoryEntry:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.deleted_at.is_(None)
        ).first()

        entry = ChatHistoryEntry(
            session_id=session_id,
            user_id=user_id if user_id is not None else (session.user_id if session else None),
            message=data.message,
            risk_level=data.risk_level,
            risk_percentage=data.risk_percentage,
            detected_entity=data.detected_entity,
            detected_vector=data.detected_vector,
            summary=data.summary,
            immediate_action=data.immediate_action,
            what_not_to_do=data.what_not_to_do,
            highlighted_phrases=[phrase.model_dump() for phrase in data.highlighted_phrases],
            wa_share_text=data.wa_share_text,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    def list_by_user(
        self, db: Session, user_id: int, page: int = 1, limit: int = 10
    ) -> Dict[str, object]:
        base_query = db.query(ChatHistoryEntry).filter(
            ChatHistoryEntry.user_id == user_id,
            ChatHistoryEntry.deleted_at.is_(None)
        )
        total = base_query.count()
        items: List[ChatHistoryEntry] = base_query.order_by(
            ChatHistoryEntry.created_at.desc(),
            ChatHistoryEntry.id.desc()
        ).offset((page - 1) * limit).limit(limit).all()

        return {"items": items, "total": total, "page": page, "limit": limit}

    def claim_session(self, db: Session, session_key: str, user_id: int) -> Optional[ChatSession]:
        session = self.get_session_by_key(db, session_key)
        if session is None:
            return None

        session.user_id = user_id
        db.query(ChatHistoryEntry).filter(
            ChatHistoryEntry.session_id == session.id,
            ChatHistoryEntry.user_id.is_(None),
            ChatHistoryEntry.deleted_at.is_(None)
        ).update({"user_id": user_id}, synchronize_session="fetch")
        db.commit()
        db.refresh(session)
        return session

    def soft_delete_entry(self, db: Session, entry_id: int) -> bool:
        entry = self.get_entry_by_id(db, entry_id)
        if not entry:
            return False
        entry.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True

    def soft_delete_session(self, db: Session, session_id: int) -> bool:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.deleted_at.is_(None)
        ).first()
        if not session:
            return False

        now = datetime.now(timezone.utc)
        session.deleted_at = now
        db.query(ChatHistoryEntry).filter(
            ChatHistoryEntry.session_id == session_id,
            ChatHistoryEntry.deleted_at.is_(None)
        ).update({"deleted_at": now}, synchronize_session="fetch")
        db.commit()
        return True

    def count_active_entries(self, db: Session, user_id: Optional[int] = None) -> int:
        query = db.query(func.count(ChatHistoryEntry.id)).filter(
            ChatHistoryEntry.deleted_at.is_(None)
        )
        if user_id is not None:
            query = query.filter(ChatHistoryEntry.user_id == user_id)
        return query.scalar()
