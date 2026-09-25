import io
import base64
import pyotp
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TOTPSetupResponse,
    TOTPVerifyRequest
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="", tags=["Autenticación y 2FA"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Registro de nuevo usuario")
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo electrónico ya se encuentra registrado")
    
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role or "user",
        is_totp_enabled=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token, summary="Inicio de sesión con soporte 2FA")
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email, User.deleted_at.is_(None)).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # Si tiene 2FA habilitado
    if user.is_totp_enabled:
        if not login_in.totp_code:
            temp_token = create_access_token({"sub": user.email, "type": "2fa_pending"})
            return Token(requires_2fa=True, temp_token=temp_token)
        
        # Validar código 2FA
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(login_in.totp_code, valid_window=1):
            raise HTTPException(status_code=401, detail="Código de autenticación 2FA incorrecto o expirado")

    access_token = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    return Token(access_token=access_token, token_type="bearer", requires_2fa=False)

@router.post("/2fa/setup", response_model=TOTPSetupResponse, summary="Generar clave y código QR para Google Authenticator")
def setup_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generar secreto base32
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    db.commit()

    # Generar URI para Google Authenticator / Authy
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="FormosaHack-2026"
    )

    # Generar imagen QR en base64
    img = qrcode.make(uri)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return TOTPSetupResponse(
        secret=secret,
        qr_code_base64=f"data:image/png;base64,{qr_b64}",
        provisioning_uri=uri
    )

@router.post("/2fa/verify", summary="Verificar y activar 2FA con código de 6 dígitos")
def verify_2fa(req: TOTPVerifyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Debe iniciar la configuración 2FA primero")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(req.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Código 2FA incorrecto o expirado")

    current_user.is_totp_enabled = True
    db.commit()
    return {"message": "2FA configurado y activado exitosamente", "is_totp_enabled": True}

@router.get("/me", response_model=UserResponse, summary="Obtener perfil del usuario autenticado")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
