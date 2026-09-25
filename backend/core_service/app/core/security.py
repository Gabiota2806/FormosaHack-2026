import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address

SECRET_KEY = os.getenv("JWT_SECRET", "formosahack_jwt_secret_dev_key_2026_not_for_prod")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

MODERATOR_ROLES = {"admin", "operator"}

bearer_scheme = HTTPBearer(auto_error=False, description="Token JWT emitido por auth_service tras validar 2FA TOTP.")

limiter = Limiter(key_func=get_remote_address)


def decode_token(token: str) -> dict:
    """Decodifica y valida un JWT emitido por auth_service."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_moderator(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Exige un moderador autenticado con 2FA completo. Rechaza tokens temporales
    `2fa_pending` (emitidos antes de validar el código TOTP) y roles no
    privilegiados, garantizando que el broadcast de emergencia solo lo dispare
    personal autorizado.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación de moderador.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)

    if payload.get("type") == "2fa_pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Autenticación 2FA incompleta. Verifique el código TOTP.",
        )

    role = payload.get("role")
    if role not in MODERATOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de moderador (admin/operator).",
        )

    return {"sub": payload.get("sub"), "role": role}
