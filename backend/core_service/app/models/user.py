from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class User(Base):
    """
    Modelo de usuario compartido con auth_service para resolución y vinculación
    de identidad en el historial de chat y auto-claim.
    """
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    role = Column(String(50), default="user", nullable=False)
    deleted_at = Column(DateTime, nullable=True)
