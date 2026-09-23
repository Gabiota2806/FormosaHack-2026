---
name: security-2fa-totp
description: Guía de implementación y auditoría de seguridad para 2FA con TOTP (Google Authenticator), Rate Limiting con SlowAPI, cabeceras seguras y CORS.
---

# Skill: Seguridad, 2FA y Hardening

## 1. Segundo Factor de Autenticación (TOTP)
- **Librería:** `pyotp` + `qrcode` (en backend).
- **Flujo:**
  1. `/api/auth/2fa/setup`: Genera un secreto base32 único con `pyotp.random_base32()` y una URL de aprovisionamiento `totp.provisioning_uri()`. Devuelve el secreto y el SVG/PNG en base64 del código QR.
  2. `/api/auth/2fa/verify`: Valida el código de 6 dígitos con `totp.verify(code)`. Si es correcto, activa `is_totp_enabled = True` y emite el token JWT de sesión autenticada.

## 2. Rate Limiting (SlowAPI)
- Proteger rutas de autenticación contra fuerza bruta:
  - `@limiter.limit("5/minute")` en `/login` y `/register`.
  - `@limiter.limit("3/minute")` en `/2fa/verify`.

## 3. Cabeceras HTTP de Seguridad
Configurar middleware en FastAPI / Nginx con:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## 4. Hashing de Contraseñas
- Usar `passlib[bcrypt]` o `argon2-cffi`. Nunca almacenar contraseñas en texto plano.
