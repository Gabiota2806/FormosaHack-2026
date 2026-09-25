from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.chat import HighlightedPhrase


class ChatSessionCreate(BaseModel):
    session_key: str = Field(..., min_length=8, max_length=64, description="UUID generado por el frontend (localStorage) que identifica la sesión anónima del Asistente Virtual.")
    user_id: Optional[int] = Field(None, description="ID del usuario autenticado; nulo para sesiones anónimas previas al login.")


class ChatSessionOut(BaseModel):
    id: int
    session_key: str
    user_id: Optional[int] = None
    active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryCreate(BaseModel):
    message: str = Field(..., min_length=3, max_length=2000, description="Texto original del mensaje sospechoso analizado por el usuario.")
    risk_level: str = Field(..., description="Nivel de riesgo del semáforo: LOW (Verde), MEDIUM (Amarillo), HIGH (Rojo).")
    risk_percentage: int = Field(..., ge=0, le=100, description="Porcentaje de probabilidad de estafa (0-100%).")
    detected_entity: Optional[str] = Field(None, max_length=100, description="Entidad o institución suplantada si se detectó.")
    detected_vector: Optional[str] = Field("WHATSAPP", max_length=50, description="Vector de ataque inferido.")
    summary: str = Field(..., description="Diagnóstico en lenguaje humano guardado para restaurar la tarjeta de resultado.")
    immediate_action: str = Field(..., description="Acción de contención inmediata recomendada.")
    what_not_to_do: str = Field(..., description="Advertencia explícita de lo que el usuario NUNCA debe hacer.")
    highlighted_phrases: List[HighlightedPhrase] = Field(default_factory=list, description="Frases y trampas psicológicas resaltadas en el análisis.")
    wa_share_text: str = Field(..., description="Texto preformateado listo para compartir con un familiar por WhatsApp.")


class ChatHistoryOut(BaseModel):
    id: int
    session_id: int
    user_id: Optional[int] = None
    message: str
    risk_level: str
    risk_percentage: int
    detected_entity: Optional[str] = None
    detected_vector: Optional[str] = None
    summary: str
    immediate_action: str
    what_not_to_do: str
    highlighted_phrases: List[HighlightedPhrase] = Field(default_factory=list)
    wa_share_text: str
    active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryClaimRequest(BaseModel):
    session_key: str = Field(..., min_length=8, max_length=64, description="Clave de la sesión anónima del frontend a vincular con la cuenta autenticada (auto-claim).")


class ChatHistoryPage(BaseModel):
    items: List[ChatHistoryOut] = Field(default_factory=list, description="Entradas del historial de la página solicitada, ordenadas de más reciente a más antigua.")
    total: int = Field(..., ge=0, description="Cantidad total de entradas activas del usuario.")
    page: int = Field(..., ge=1, description="Número de página actual (1-indexed).")
    limit: int = Field(..., ge=1, le=100, description="Cantidad máxima de entradas por página.")
