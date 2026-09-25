from typing import List, Optional
from pydantic import BaseModel, Field

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=3, max_length=2000, description="Texto o transcripción del mensaje sospechoso recibido por el usuario.")

class HighlightedPhrase(BaseModel):
    phrase: str = Field(..., description="Frase o fragmento textual identificado en el mensaje.")
    reason: str = Field(..., description="Explicación clara del motivo por el cual es un indicador de engaño.")
    category: str = Field(..., description="Categoría de táctica psicológica: URGENCE, AUTHORITY, CREDENTIALS, FAKE_LINK, GREED, FAMILY_IMPERSONATION, COMMUNITY_OUTBREAK.")

class ChatMessageResponse(BaseModel):
    risk_level: str = Field(..., description="Nivel de riesgo: LOW (Verde), MEDIUM (Amarillo), HIGH (Rojo).")
    risk_percentage: int = Field(..., ge=0, le=100, description="Porcentaje de probabilidad de estafa (0-100%).")
    detected_entity: Optional[str] = Field(None, description="Entidad o institución suplantada si se detectó.")
    detected_vector: Optional[str] = Field("WHATSAPP", description="Vector de ataque inferido.")
    summary: str = Field(..., description="Diagnóstico en lenguaje humano, claro y sin tecnicismos complejos.")
    immediate_action: str = Field(..., description="Acción de contención inmediata recomendada.")
    what_not_to_do: str = Field(..., description="Advertencia explícita de lo que el usuario NUNCA debe hacer.")
    highlighted_phrases: List[HighlightedPhrase] = Field(default_factory=list, description="Lista de frases y trampas psicológicas resaltadas.")
    wa_share_text: str = Field(..., description="Texto preformateado y empático listo para compartir con un familiar por WhatsApp (wa.me).")
