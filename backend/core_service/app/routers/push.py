from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import limiter
from app.database import get_db
from app.schemas.push import (
    BroadcastResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    PushUnsubscribeRequest,
    VapidPublicKeyResponse,
)
from app.services.push_service import PushService, get_vapid_public_key

router = APIRouter(prefix="/push", tags=["Notificaciones Push"])


def get_push_service() -> PushService:
    return PushService()


@router.get(
    "/vapid-public-key",
    response_model=VapidPublicKeyResponse,
    summary="Obtener la clave pública VAPID",
    description="Expone la clave pública VAPID requerida por `PushManager.subscribe()` en el Service Worker del navegador."
)
def vapid_public_key():
    return VapidPublicKeyResponse(vapid_public_key=get_vapid_public_key())


@router.post(
    "/subscribe",
    response_model=PushSubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Suscribir dispositivo a las alertas de brotes",
    description="Registra (upsert por endpoint) la suscripción Web Push generada por el Service Worker con las claves p256dh/auth. Protegido con Rate Limiting."
)
@limiter.limit("20/minute")
def subscribe_push(
    request: Request,
    payload: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    service: PushService = Depends(get_push_service)
):
    return service.subscribe(db, payload)


@router.delete(
    "/subscriptions",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar suscripción push (Soft Delete)",
    description="Aplica borrado lógico (deleted_at) sobre la suscripción identificada por su endpoint."
)
@limiter.limit("20/minute")
def unsubscribe_push(
    request: Request,
    payload: PushUnsubscribeRequest,
    db: Session = Depends(get_db),
    service: PushService = Depends(get_push_service)
):
    deleted = service.unsubscribe(db, str(payload.endpoint))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripción no encontrada o ya eliminada."
        )
    return None
