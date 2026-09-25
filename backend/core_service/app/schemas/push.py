from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


class PushKeys(BaseModel):
    """Claves criptográficas generadas por PushManager.subscribe() en el Service Worker."""
    p256dh: str = Field(..., min_length=1, max_length=255, description="Clave pública p256dh de la suscripción Web Push.")
    auth: str = Field(..., min_length=1, max_length=255, description="Secreto auth de la suscripción Web Push.")


class PushSubscriptionCreate(BaseModel):
    endpoint: HttpUrl = Field(..., description="URL del proveedor push (FCM / Mozilla / Apple) que recibe la notificación.")
    keys: PushKeys
    user_agent: Optional[str] = Field(None, max_length=255, description="User-Agent del navegador móvil que se suscribe.")
    user_id: Optional[int] = Field(None, description="ID del usuario autenticado; nulo para suscripciones anónimas.")


class PushSubscriptionResponse(BaseModel):
    id: int
    endpoint: str
    user_id: Optional[int] = None
    active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PushUnsubscribeRequest(BaseModel):
    endpoint: HttpUrl = Field(..., description="Endpoint de la suscripción a dar de baja (Soft Delete).")


class VapidPublicKeyResponse(BaseModel):
    vapid_public_key: str = Field(..., description="Clave pública VAPID requerida por PushManager.subscribe() en el Service Worker.")


class BroadcastRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=120, description="Título de la alerta; si se omite se genera automáticamente con la entidad suplantada.")
    body: Optional[str] = Field(None, min_length=3, max_length=300, description="Descripción concisa del brote; si se omite se genera automáticamente.")
    url: Optional[str] = Field(None, max_length=255, description="Deep-link de destino (por defecto la pestaña del Radar Comunitario con el incidente).")


class BroadcastResponse(BaseModel):
    success: bool
    incident_id: int
    trigger: str = Field(..., description="Origen del broadcast: 'moderator' (comunicado manual) u 'outbreak' (detección automática).")
    title: str
    body: str
    url: str
    enviados: int = Field(0, description="Notificaciones entregadas al proveedor push.")
    fallidos: int = Field(0, description="Envíos rechazados por el proveedor push.")
    suscripciones_limpiadas: int = Field(0, description="Suscripciones con Soft Delete por HTTP 410 Gone / 404 Not Found.")
    message: str
