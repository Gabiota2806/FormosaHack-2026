from typing import List, Optional
from pydantic import BaseModel, Field

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=3, max_length=2000, description="Texto o transcripción del mensaje sospechoso recibido por el usuario.")

class HighlightedPhrase(BaseModel):
    phrase: str = Field(..., description="Frase o fragmento textual identificado en el mensaje.")
    reason: str = Field(..., description="Explicación clara del motivo por el cual es un indicador de engaño.")
    category: str = Field(..., description="Categoría de táctica psicológica o amenaza: URGENCE, AUTHORITY, CREDENTIALS, FAKE_LINK, GREED, FAMILY_IMPERSONATION, COMMUNITY_OUTBREAK, PROMPT_INJECTION.")

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


class ChatFollowupTurn(BaseModel):
    role: str = Field(..., description="Rol del emisor en el hilo conversacional: 'user' o 'assistant'.")
    content: str = Field(..., min_length=1, description="Contenido textual del mensaje.")


class EmergencyContact(BaseModel):
    name: str = Field(..., description="Nombre de la entidad u organismo de auxilio.")
    phone: Optional[str] = Field(None, description="Teléfono oficial o línea de emergencia.")
    channel_type: str = Field("PHONE", description="Tipo de canal: PHONE, WHATSAPP, WEB.")
    url: Optional[str] = Field(None, description="Enlace web oficial o enlace directo a WhatsApp.")
    description: Optional[str] = Field(None, description="Pauta rápida de contacto o disponibilidad horaria.")


class ChatFollowupRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=2,
        max_length=2000,
        description="Pregunta de seguimiento, duda de auxilio técnico o pedido de contención del usuario."
    )
    context_diagnosis: Optional[ChatMessageResponse] = Field(
        None,
        description="Diagnóstico previo emitido para preservar el contexto de la amenaza y entidad analizada."
    )
    initial_message: Optional[str] = Field(
        None,
        description="Texto original del mensaje sospechoso analizado previamente."
    )
    history: List[ChatFollowupTurn] = Field(
        default_factory=list,
        description="Historial acumulado de preguntas y respuestas en la sesión activa."
    )
    session_key: Optional[str] = Field(
        None,
        max_length=64,
        description="Identificador de la sesión de chat para tracking o persistencia."
    )


class ChatFollowupResponse(BaseModel):
    answer: str = Field(
        ...,
        description="Respuesta empática, clara y paso a paso para guiar y contener al usuario sin tecnicismos complejos."
    )
    suggested_actions: List[str] = Field(
        default_factory=list,
        description="Lista priorizada de acciones concretas de mitigación (bloqueo bancario, resguardo de pruebas, denuncia)."
    )
    emergency_contacts: List[EmergencyContact] = Field(
        default_factory=list,
        description="Contactos oficiales verificados y líneas de emergencia relevantes según la entidad o contexto del incidente."
    )
    followup_suggestions: List[str] = Field(
        default_factory=list,
        description="Sugerencias de repregunta contextuales para que el usuario continúe la consulta con un clic."
    )
    is_fallback: bool = Field(
        False,
        description="Indica si la respuesta fue generada por el motor heurístico local resiliente ante degradación de Gemini."
    )

