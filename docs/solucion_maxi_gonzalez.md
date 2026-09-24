# Solución Innovadora — Maxi González | FormosaHack 2026

**Eje:** Seguridad
**Desafío:** Dificultad para reconocer engaños y riesgos en entornos digitales
**Propuesta:** CiberAlerta Formosa — Inmunidad Colectiva Digital

---

## 1. El problema (contexto Formosa)

Las personas interactúan diariamente con mensajes, sitios web, redes sociales y otros servicios digitales donde aparecen intentos de fraude, suplantaciones de identidad e información engañosa. En Formosa el vector principal es WhatsApp/SMS suplantando a Banco Formosa, REFSA, ANSES, Correo Argentino y Marketplace.

El problema no es solo técnico: es cognitivo y social. Un adulto mayor no distingue `bancoformosa-soporte.xyz` de `bancoformosa.com.ar`, y cuando cae, no tiene a quién acudir en los primeros 10 minutos críticos.

## 2. La idea innovadora en 1 frase

Convertir cada intento de estafa en una vacuna colectiva: cuando un vecino reporta o analiza un mensaje sospechoso, el sistema inmuniza automáticamente al resto de la provincia en tiempo real.

No es "otro detector de phishing". Es Waze pero para estafas, explicado en lenguaje de abuela e hiperlocalizado a Formosa.

## 3. Las 3 innovaciones

### Innovación 1 — Escáner Explicable Hiperlocal (diferencial técnico)
Pegar texto/link sospechoso → Semáforo Verde/Amarillo/Rojo + % riesgo + motivos en lenguaje simple + qué hacer.

Motor heurístico 100% local en FastAPI (<200ms, sin IA paga, funciona offline):
- Urgencia extrema ("bloqueada en 2 horas", "último aviso").
- Pedido de claves, token de 6 dígitos, transferencia inmediata.
- Suplantación de entidades formoseñas (Banco Formosa, REFSA, ANSES, Correo Argentino, Mercado Pago).
- Análisis de URLs: acortadores (bit.ly), dominios gemelos por Levenshtein + homoglyphs, TLD sospechoso (.xyz vs .com.ar).
- Premio falso / regalo / subsidio inexistente.

Innovador porque no es caja negra: desarma la manipulación psicológica ("te apuran para que no pienses") y enseña mientras protege.

### Innovación 2 — Radar de Inmunidad Barrial (efecto red)
Cada análisis y reporte alimenta un índice de contagio por localidad y modalidad. Si 3 vecinos de Pirané reportan el mismo número/alias/link en 2 hs, el sistema escala a ALERTA ROJA provincial.

- Feed paginado en servidor con filtros: localidad (Capital, Clorinda, Pirané, El Colorado, Las Lomitas), tipo (Bancario, Servicios, WhatsApp hackeado, Marketplace), estado (en_verificacion, confirmada, descartada).
- Botón "A mí también me llegó" = voto de inmunidad que eleva el nivel de alerta.
- Directorio de canales oficiales verificados (contraste verde oficial vs rojo fraude).

### Innovación 3 — Modo Protector Mayor + Red de Tutores (innovación social)
- Modo Abuelo: tipografía XL, semáforo gigante, un solo botón "Consultar a mi persona de confianza".
- Tutores barriales: jóvenes y moderadores con login + 2FA TOTP validan alertas y ganan reputación. Cierra la brecha intergeneracional.

## 4. Módulos MVP 24h

1. Analizador `POST /api/core/analyze` (público con rate limit).
2. Radar `GET /api/core/alerts?page&limit&search&localidad&tipo&estado` + CRUD + `POST /alerts/{id}/me-too`.
3. Verificador `GET /api/core/channels?search=`.
4. Simulador educativo "¿Legítimo o Fraude?" (quiz 5 preguntas, feedback instantáneo).
5. Auth JWT + 2FA TOTP + RBAC (ciudadano, moderador, admin) + auditoría.

## 5. Modelo de datos mínimo

- `users`: id, name, email, password_hash, role, totp_secret, is_totp_enabled, created_at, deleted_at.
- `alerts`: id, titulo, contenido_sospechoso, tipo, localidad, nivel_riesgo, estado, reportes_count, user_id FK, created_at, deleted_at.
- `official_channels`: id, institucion, tipo_canal, valor, verificado, created_at, deleted_at.
- `audit_logs`: id, user_id, action, ip_address, timestamp, details.

## 6. Arquitectura y cumplimiento de la guía

Microservicios FastAPI (auth + core) + Gateway Nginx :8000 + React + PostgreSQL 16 + Docker. Repository Pattern (Router → Service → Repository → DB), Pydantic v2, Argon2id/bcrypt, SlowAPI rate limiting, headers seguros, CORS estricto, soft delete, paginación en servidor, Swagger/OpenAPI, cero `alert()` (Sonner + modales), tests `pytest`.

## 7. Reparto equipo de 4

1. Frontend Líder: Analizador + Semáforo + Modo Abuelo.
2. Frontend Vistas: Radar + filtros + paginación + Simulador.
3. Backend Core: modelos + Repository + paginación + seed formoseño.
4. Backend Auth/Analyzer: 2FA + RBAC + motor heurístico + tests.

## 8. Guion demo 90 segundos (para el jurado)

1. "A mi abuela le llegó esto..." → pegar WhatsApp falso Banco Formosa → ROJO 94% con 4 motivos.
2. "Y no fue la única: 4 vecinos de Las Lomitas reportaron el mismo link, es un brote activo" → radar + me-too.
3. "Y con Modo Abuelo lo entiende cualquiera" → semáforo gigante + botón ayuda.

## 9. Por qué gana

Hiperlocal (nombres reales de Formosa), explicable (educa, no solo bloquea), comunitario (efecto red), intergeneracional (abuelos + tutores), factible en 24h sin dependencias externas y con cumplimiento total de la guía del profesor.

---
*Autor: Maxi González — FormosaHack 2026*
