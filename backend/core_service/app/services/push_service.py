import json
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.incident import IncidentReport
from app.repositories.incident_repository import IncidentRepository
from app.repositories.push_repository import PushRepository
from app.schemas.push import BroadcastResponse, PushSubscriptionCreate, PushSubscriptionResponse

logger = logging.getLogger("ciberguardian.push")

# Umbrales del algoritmo de detección de brotes (FH26-72, Escenario 2):
# brote masivo = >= 5 reportes de la misma entidad o >= 10 votos en menos de 2 horas.
OUTBREAK_REPORTS_THRESHOLD = 5
OUTBREAK_VOTES_THRESHOLD = 10
OUTBREAK_WINDOW_HOURS = 2

# Dedupe en memoria: 1 broadcast automático por entidad suplantada dentro de la
# ventana, evita notificar en cadena ante cada nuevo reporte/voto del mismo brote.
_auto_broadcast_sent: Dict[str, datetime] = {}

PUSH_ICON_URL = "/icons/icon-192.png"
RADAR_BASE_URL = "/#radar"

SEND_DELIVERED = "delivered"
SEND_FAILED = "failed"
SEND_EXPIRED = "expired"


def _vapid_settings() -> Dict:
    public_key = os.getenv("VAPID_PUBLIC_KEY", "")
    private_key = os.getenv("VAPID_PRIVATE_KEY", "")
    claims_email = os.getenv("VAPID_CLAIMS_EMAIL", "admin@ciberguardian.gob.ar")
    if not public_key or not private_key:
        return {}
    return {
        "vapid_private_key": private_key,
        "vapid_claims": {"sub": f"mailto:{claims_email}"},
    }


def get_vapid_public_key() -> str:
    return os.getenv("VAPID_PUBLIC_KEY", "")


def build_notification_payload(
    title: str, body: str, url: str, incident_id: Optional[int] = None
) -> str:
    """Payload JSON consumido por el evento `push` del Service Worker (sw.js)."""
    return json.dumps(
        {
            "title": title,
            "body": body,
            "url": url,
            "icon": PUSH_ICON_URL,
            "badge": PUSH_ICON_URL,
            "tag": f"ciberguardian-incident-{incident_id}" if incident_id else "ciberguardian-alerta",
            "incident_id": incident_id,
        }
    )


class PushService:
    """
    Capa de servicio Web Push: suscripciones, broadcast de comunicados y
    algoritmo de detección de brotes masivos de estafas. Sigue el Repository
    Pattern (Router -> Service -> Repository -> Database).
    """

    def __init__(
        self,
        repo: Optional[PushRepository] = None,
        incident_repo: Optional[IncidentRepository] = None,
    ):
        self.repo = repo or PushRepository()
        self.incident_repo = incident_repo or IncidentRepository()

    def subscribe(self, db: Session, data: PushSubscriptionCreate) -> PushSubscriptionResponse:
        subscription = self.repo.upsert(db, data)
        return PushSubscriptionResponse.model_validate(subscription)

    def unsubscribe(self, db: Session, endpoint: str) -> bool:
        return self.repo.soft_delete_by_endpoint(db, endpoint)

    def send_to_subscription(self, subscription, payload: str) -> str:
        """
        Envía una notificación a una suscripción y clasifica el resultado.
        Ante HTTP 410 Gone / 404 Not Found del proveedor push devuelve
        SEND_EXPIRED para que el broadcast aplique Soft Delete (Escenario 5
        de FH26-72) y evite futuros envíos infructuosos.
        """
        from pywebpush import WebPushException, webpush

        vapid = _vapid_settings()
        if not vapid:
            logger.warning("VAPID no configurado: se omite el envío push.")
            return SEND_FAILED

        subscription_info = {
            "endpoint": subscription.endpoint,
            "keys": {"p256dh": subscription.p256dh_key, "auth": subscription.auth_key},
        }
        try:
            webpush(subscription_info=subscription_info, data=payload, **vapid)
            return SEND_DELIVERED
        except WebPushException as exc:
            response = getattr(exc, "response", None)
            status_code = getattr(response, "status_code", None)
            if status_code in (404, 410):
                logger.info("Suscripción expirada (HTTP %s): se aplicará Soft Delete.", status_code)
                return SEND_EXPIRED
            logger.error("Error del proveedor push: %s", exc)
            return SEND_FAILED
        except Exception:
            logger.exception("Fallo inesperado al enviar la notificación push.")
            return SEND_FAILED

    def broadcast(
        self,
        db: Session,
        title: str,
        body: str,
        url: str,
        incident_id: Optional[int] = None,
        trigger: str = "outbreak",
    ) -> BroadcastResponse:
        """Emite la alerta nativa a todas las suscripciones activas."""
        subscriptions: List = self.repo.get_active_subscriptions(db)
        enviados = 0
        fallidos = 0
        limpiados = 0
        payload = build_notification_payload(title, body, url, incident_id)

        for subscription in subscriptions:
            result = self.send_to_subscription(subscription, payload)
            if result == SEND_DELIVERED:
                enviados += 1
            else:
                fallidos += 1
                if result == SEND_EXPIRED and self.repo.soft_delete(db, subscription.id):
                    limpiados += 1

        return BroadcastResponse(
            success=True,
            incident_id=incident_id or 0,
            trigger=trigger,
            title=title,
            body=body,
            url=url,
            enviados=enviados,
            fallidos=fallidos,
            suscripciones_limpiadas=limpiados,
            message=f"Alerta emitida a {enviados} dispositivo(s); {limpiados} suscripción(es) expirada(s) dada(s) de baja.",
        )

    def detect_outbreak(self, db: Session, incident: IncidentReport) -> bool:
        """
        Algoritmo de detección de brotes: >= 5 reportes de la misma entidad
        suplantada o >= 10 votos comunitarios sobre el incidente, ambos dentro
        de una ventana móvil de 2 horas.
        """
        since = datetime.now(timezone.utc) - timedelta(hours=OUTBREAK_WINDOW_HOURS)
        reports = self.incident_repo.count_reports_by_entity_since(
            db, incident.impersonated_entity, since
        )
        votes = self.incident_repo.count_votes_since(db, incident.id, since)
        return reports >= OUTBREAK_REPORTS_THRESHOLD or votes >= OUTBREAK_VOTES_THRESHOLD

    def _should_auto_broadcast(self, entity: str) -> bool:
        now = datetime.now(timezone.utc)
        key = entity.strip().lower()
        last_sent = _auto_broadcast_sent.get(key)
        if last_sent and now - last_sent < timedelta(hours=OUTBREAK_WINDOW_HOURS):
            return False
        _auto_broadcast_sent[key] = now
        return True

    def check_and_broadcast_outbreak(self, db: Session, incident: IncidentReport) -> Optional[BroadcastResponse]:
        """Evalúa el brote tras un reporte/voto y emite la alerta una única vez por entidad y ventana."""
        if not self.detect_outbreak(db, incident):
            return None
        if not self._should_auto_broadcast(incident.impersonated_entity):
            return None
        title = f"🚨 Brote de estafas en Formosa: Suplantación de {incident.impersonated_entity}"
        body = (incident.description or incident.title)[:300]
        url = f"{RADAR_BASE_URL}?incident_id={incident.id}"
        return self.broadcast(db, title=title, body=body, url=url, incident_id=incident.id, trigger="outbreak")

    def broadcast_moderator_communique(
        self, db: Session, incident_id: int, title: Optional[str], body: Optional[str], url: Optional[str]
    ) -> Optional[BroadcastResponse]:
        """
        Comunicado de emergencia disparado manualmente por un moderador con 2FA.
        Retorna None si el incidente no existe o fue eliminado lógicamente.
        """
        incident = self.incident_repo.get_by_id(db, incident_id)
        if not incident:
            return None
        final_title = title or f"🚨 Brote de estafas en Formosa: Suplantación de {incident.impersonated_entity}"
        final_body = body or (incident.description or incident.title)[:300]
        final_url = url or f"{RADAR_BASE_URL}?incident_id={incident.id}"
        return self.broadcast(
            db, title=final_title, body=final_body, url=final_url, incident_id=incident.id, trigger="moderator"
        )


def clear_outbreak_cache() -> None:
    """Reinicia el dedupe de broadcasts automáticos (útil en pruebas)."""
    _auto_broadcast_sent.clear()


def outbreak_check_task(incident_id: int) -> None:
    """
    Tarea de background: reevalúa el algoritmo de brotes con una sesión nueva
    (la sesión HTTP ya fue cerrada) y emite la alerta push si corresponde.
    """
    import app.database as app_db

    db = app_db.SessionLocal()
    try:
        incident = IncidentRepository().get_by_id(db, incident_id)
        if incident:
            PushService().check_and_broadcast_outbreak(db, incident)
    except Exception:
        logger.exception("Fallo la verificación de brote del incidente %s", incident_id)
    finally:
        db.close()
