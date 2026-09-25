from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class IncidentBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=255, description="Título descriptivo de la amenaza detectada.")
    description: str = Field(..., min_length=10, description="Descripción detallada de la mecánica del engaño.")
    impersonated_entity: str = Field(..., max_length=100, description="Entidad suplantada (ej: Banco Formosa, REFSA, Tarjeta Chigüé).")
    attack_vector: str = Field(default="WHATSAPP", max_length=50, description="Vector de ataque: WHATSAPP, SMS, LLAMADA, WEB, EMAIL.")
    evidence_text: Optional[str] = Field(None, description="Texto o fragmento del mensaje recibido.")
    suspicious_phone: Optional[str] = Field(None, max_length=50, description="Número de teléfono desde el que intentaron la estafa.")
    suspicious_url: Optional[str] = Field(None, max_length=255, description="Enlace malicioso o acortador utilizado.")
    fake_cbu: Optional[str] = Field(None, max_length=50, description="CBU, CVU o alias facilitado por los atacantes.")

class IncidentCreate(IncidentBase):
    pass

class IncidentResponse(IncidentBase):
    id: int
    votes_count: int
    status: str
    created_at: datetime
    updated_at: datetime
    is_outbreak_spike: bool = False

    model_config = ConfigDict(from_attributes=True)

class IncidentPagination(BaseModel):
    items: List[IncidentResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    has_active_outbreak: bool = False
    outbreak_entity: Optional[str] = None

class VoteRequest(BaseModel):
    user_fingerprint: str = Field(..., min_length=8, max_length=64, description="Huella anónima del navegador para evitar votos duplicados.")

class VoteResponse(BaseModel):
    success: bool
    incident_id: int
    votes_count: int
    message: str

class IncidentStatsResponse(BaseModel):
    total_incidents: int = Field(..., description="Total de amenazas registradas (excluye soft delete).")
    total_votes: int = Field(..., description="Total de validaciones comunitarias ('A mí también me llegó').")
    verified_channels: int = Field(..., description="Canales oficiales verificados disponibles.")
    distinct_entities: int = Field(..., description="Entidades suplantadas distintas detectadas.")
    active_outbreaks_24h: int = Field(..., description="Brotes activos en las últimas 24 horas (>=3 reportes por entidad).")

class OfficialChannelResponse(BaseModel):
    id: int
    entity_name: str
    official_domains: str
    official_phones: str
    emergency_phone: str
    verified_whatsapp: Optional[str] = None
    advice: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
