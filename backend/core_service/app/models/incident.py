import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from app.database import Base

class AttackVector(str, enum.Enum):
    WHATSAPP = "WHATSAPP"
    SMS = "SMS"
    LLAMADA = "LLAMADA"
    WEB = "WEB"
    EMAIL = "EMAIL"
    OTRO = "OTRO"

class IncidentStatus(str, enum.Enum):
    ACTIVE = "active"
    FLAGGED = "flagged"
    RESOLVED = "resolved"

class IncidentReport(Base):
    """
    Modelo de Reporte de Incidente / Intento de Estafa.
    Implementa Soft Delete obligatorio mediante `deleted_at`.
    """
    __tablename__ = "incident_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    impersonated_entity = Column(String(100), nullable=False, index=True)
    attack_vector = Column(String(50), nullable=False, default="WHATSAPP", index=True)
    evidence_text = Column(Text, nullable=True)
    suspicious_phone = Column(String(50), nullable=True)
    suspicious_url = Column(String(255), nullable=True)
    fake_cbu = Column(String(50), nullable=True)
    votes_count = Column(Integer, default=1, nullable=False)
    status = Column(String(20), default="active", nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Soft Delete obligatorio
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    __table_args__ = (
        Index("ix_incidents_entity_vector", "impersonated_entity", "attack_vector"),
    )

class IncidentVote(Base):
    """
    Registro de validación comunitaria ("A mí también me llegó").
    """
    __tablename__ = "incident_votes"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incident_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_fingerprint = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class OfficialChannel(Base):
    """
    Canales oficiales verificados de entidades en Formosa y Argentina
    para contrastar contactos y ofrecer líneas directas de emergencia.
    """
    __tablename__ = "official_channels"

    id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String(100), nullable=False, unique=True, index=True)
    official_domains = Column(Text, nullable=False)
    official_phones = Column(Text, nullable=False)
    emergency_phone = Column(String(50), nullable=False)
    verified_whatsapp = Column(String(50), nullable=True)
    advice = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
