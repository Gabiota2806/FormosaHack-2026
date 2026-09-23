from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_totp_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    requires_2fa: bool = False
    temp_token: Optional[str] = None

class TOTPSetupResponse(BaseModel):
    secret: str
    qr_code_base64: str
    provisioning_uri: str

class TOTPVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
