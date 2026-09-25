from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base


class ChatSession(Base):
    """
    Sesión de conversación del Asistente Virtual CiberGuardián. El `session_key`
    (UUID generado por el frontend y persistido en localStorage) identifica a los
    usuarios anónimos y habilita el auto-claim del historial tras iniciar sesión.
    Implementa Soft Delete obligatorio mediante `deleted_at`.
    """
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_key = Column(String(64), nullable=False, unique=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Soft Delete obligatorio
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    @property
    def active(self) -> bool:
        return self.deleted_at is None


class ChatHistoryEntry(Base):
    """
    Entrada del historial de consultas: mensaje analizado por el usuario junto con
    el diagnóstico completo (semáforo de riesgo, entidad suplantada, frases
    resaltadas y acciones recomendadas). Permite restaurar la conversación y la
    tarjeta de diagnóstico al pulsar una consulta pasada. Implementa Soft Delete
    obligatorio mediante `deleted_at` (Escenario 5 de FH26-84).
    """
    __tablename__ = "chat_history_entries"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=True, index=True)

    message = Column(Text, nullable=False)
    risk_level = Column(String(10), nullable=False, index=True)
    risk_percentage = Column(Integer, nullable=False, default=0)
    detected_entity = Column(String(100), nullable=True)
    detected_vector = Column(String(50), nullable=True)
    summary = Column(Text, nullable=False)
    immediate_action = Column(Text, nullable=False)
    what_not_to_do = Column(Text, nullable=False)
    highlighted_phrases = Column(JSON, nullable=False, default=list)
    wa_share_text = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Soft Delete obligatorio
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    @property
    def active(self) -> bool:
        return self.deleted_at is None
