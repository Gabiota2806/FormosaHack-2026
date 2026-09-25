from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.push import PushSubscription
from app.schemas.push import PushSubscriptionCreate


class PushRepository:
    """
    Capa de acceso a datos para Suscripciones Web Push aplicando Repository
    Pattern y Soft Delete (filtrado obligatorio por deleted_at IS NULL).
    """

    def get_by_endpoint(self, db: Session, endpoint: str) -> Optional[PushSubscription]:
        return db.query(PushSubscription).filter(
            PushSubscription.endpoint == endpoint,
            PushSubscription.deleted_at.is_(None)
        ).first()

    def get_by_id(self, db: Session, subscription_id: int) -> Optional[PushSubscription]:
        return db.query(PushSubscription).filter(
            PushSubscription.id == subscription_id,
            PushSubscription.deleted_at.is_(None)
        ).first()

    def upsert(self, db: Session, data: PushSubscriptionCreate) -> PushSubscription:
        endpoint = str(data.endpoint)
        existing = db.query(PushSubscription).filter(
            PushSubscription.endpoint == endpoint
        ).first()

        if existing:
            existing.p256dh_key = data.keys.p256dh
            existing.auth_key = data.keys.auth
            existing.user_agent = data.user_agent
            existing.user_id = data.user_id
            existing.deleted_at = None
            db.commit()
            db.refresh(existing)
            return existing

        subscription = PushSubscription(
            endpoint=endpoint,
            p256dh_key=data.keys.p256dh,
            auth_key=data.keys.auth,
            user_agent=data.user_agent,
            user_id=data.user_id,
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        return subscription

    def get_active_subscriptions(self, db: Session) -> List[PushSubscription]:
        return db.query(PushSubscription).filter(
            PushSubscription.deleted_at.is_(None)
        ).all()

    def count_active(self, db: Session) -> int:
        return db.query(func.count(PushSubscription.id)).filter(
            PushSubscription.deleted_at.is_(None)
        ).scalar()

    def soft_delete(self, db: Session, subscription_id: int) -> bool:
        subscription = self.get_by_id(db, subscription_id)
        if not subscription:
            return False
        subscription.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True

    def soft_delete_by_endpoint(self, db: Session, endpoint: str) -> bool:
        subscription = self.get_by_endpoint(db, endpoint)
        if not subscription:
            return False
        subscription.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True
