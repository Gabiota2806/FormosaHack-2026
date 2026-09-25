from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class PushSubscription(Base):
    """
    Suscripción Web Push generada por el Service Worker del navegador
    (claves VAPID p256dh/auth). Implementa Soft Delete obligatorio mediante
    `deleted_at` para dar de baja suscripciones cuando el proveedor push
    responde HTTP 410 Gone o 404 Not Found.
    """
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(Text, nullable=False, index=True)
    p256dh_key = Column(String(255), nullable=False)
    auth_key = Column(String(255), nullable=False)
    user_agent = Column(String(255), nullable=True)
    user_id = Column(Integer, nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Soft Delete obligatorio
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    @property
    def active(self) -> bool:
        return self.deleted_at is None
