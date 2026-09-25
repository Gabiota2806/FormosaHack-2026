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
