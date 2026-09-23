# Documento de Especificación del Sistema (SDD) — FormosaHack 2026

> **Metodología:** Spec-Driven Development (SDD) con Asistencia de Inteligencia Artificial.  
> **Fuente de Verdad del Proyecto:** Este documento define el alcance, arquitectura, requerimientos y diseño del sistema antes de su implementación.

---

## 1. Descripción del Problema
*Breve contextualización de la problemática asignada en la competencia (Salud, Educación, Producción y Medio Ambiente, Seguridad y Sociedad, Economía).*
- **Contexto local:** Impacto directo en la comunidad de la Provincia de Formosa.
- **Problemática actual:** Limitaciones, cuellos de botella y riesgos detectados en el escenario actual sin el sistema.

---

## 2. Objetivos del Sistema
- **Objetivo General:** Desarrollar un prototipo funcional (MVP) de alta calidad en 24 horas, seguro, accesible y demostrable en vivo ante el jurado evaluador.
- **Objetivos Específicos:**
  1. Proveer una interfaz web responsiva e intuitiva desarrollada en **React + Tailwind CSS**.
  2. Implementar un backend desacoplado con arquitectura de **Microservicios (FastAPI)** y **API Gateway**.
  3. Asegurar la plataforma con **autenticación JWT**, **2FA obligatorio con TOTP**, **Rate Limiting** y **Security Headers**.
  4. Garantizar integridad de datos mediante **PostgreSQL**, **Soft Delete** y el patrón **Repository Pattern**.

---

## 3. Alcance del MVP (Ventana de 24 Horas)
* **Dentro del Alcance (Core MVP):**
  - Registro, autenticación y activación de 2FA (Google Authenticator / Authy).
  - Flujo principal de la problemática asignada con CRUD completo.
  - Paginación y búsqueda/filtros en el servidor.
  - Documentación interactiva de la API con Swagger / OpenAPI.
  - Despliegue y ejecución local reproducible con `docker-compose up -d`.
* **Fuera del Alcance (Fase 2 / Futuro):**
  - Módulos auxiliares no críticos que pongan en riesgo el tiempo de entrega.

---

## 4. Requisitos Funcionales (RF) y No Funcionales (RNF)

### 4.1 Requisitos Funcionales (RF)
- **RF-01 (Autenticación y 2FA):** El sistema debe permitir registro de usuarios, login con credenciales seguras y validación de segundo factor mediante código temporal TOTP de 6 dígitos.
- **RF-02 (Control de Acceso RBAC):** El sistema debe restringir endpoints y acciones según roles (ej. Administrador, Operador, Usuario).
- **RF-03 (Operaciones de Negocio Core):** Gestión de las entidades centrales del desafío asignado (creación, edición, consulta y borrado lógico).
- **RF-04 (Paginación y Búsqueda):** Las listas de registros deben paginarse en el servidor (`page`, `limit`) y permitir búsqueda por filtros relevantes.
- **RF-05 (Auditoría de Eventos):** Registro de eventos críticos (logins, modificaciones de estado, borrado lógico).

### 4.2 Requisitos No Funcionales (RNF)
- **RNF-01 (Seguridad - No Negociable):**
  - Contraseñas hasheadas con Argon2id / bcrypt.
  - Rate limiting aplicado a `/login`, `/register` y endpoints sensibles.
  - Cabeceras de seguridad activas (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
  - CORS configurado de forma estricta.
- **RNF-02 (Rendimiento):** Tiempos de respuesta de API < 200ms en operaciones estándar; connection pooling activo en PostgreSQL.
- **RNF-03 (Usabilidad & UX):** Cero uso de `alert()` nativo de JavaScript; retroalimentación mediante Sonner Toasts y modales accesibles.
- **RNF-04 (Mantenibilidad & Arquitectura):** Frontend y backend estrictamente desacoplados; uso del Repository Pattern en backend.

---

## 5. Reglas de Negocio y Actores
* **Actores del Sistema:**
  1. *Usuario General:* Acceso a sus propios datos, consulta y carga de solicitudes.
  2. *Administrador / Auditor:* Gestión global, reportes, auditoría y control de usuarios.
* **Reglas de Negocio:**
  - Los registros eliminados no se destruyen físicamente, sino que se marcan con fecha en `deleted_at` (Soft Delete).
  - Un usuario no puede operar en el sistema sin haber completado la verificación de su 2FA.
  - Todo dato entrante debe ser sanitizado y validado en backend mediante Schemas Pydantic.

---

## 6. Arquitectura del Sistema

```text
[ Cliente Web / Móvil ]
          │
   (Puerto 8000)
          ▼
┌────────────────────────────────────────┐
│         API Gateway (Nginx)            │
└───────┬────────────────────────┬───────┘
        │                        │
  /api/auth/*              /api/core/*
        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│   Auth Service   │    │   Core Service   │
│    (FastAPI)     │    │    (FastAPI)     │
│ 2FA, JWT, Roles  │    │ Repository Patt. │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
       ┌───────────────────────────┐
       │   PostgreSQL 16 (Docker)  │
       │     (Connection Pool)     │
       └───────────────────────────┘
```

---

## 7. Modelo de Datos y Entidades Base
- **Tabla `users`:** `id`, `name`, `email`, `password_hash`, `role`, `totp_secret`, `is_totp_enabled`, `created_at`, `deleted_at`.
- **Tabla `audit_logs`:** `id`, `user_id`, `action`, `ip_address`, `timestamp`, `details`.
- **Entidades de Negocio (Core):** Adaptadas según el desafío asignado, con clave foránea, índices en columnas de búsqueda y `deleted_at`.

---

## 8. Estrategia de Testing y Verificación
- **Pruebas Unitarias Obligatorias:** Con `pytest` en backend y `vitest` en frontend.
- **Cobertura mínima:** Servicios de autenticación, validación de schemas Pydantic, cálculo de reglas de negocio y repositorios.

---

## 9. Definition of Done (DoD)
Para dar por completada cualquier tarea:
- [ ] Código implementado y probado localmente.
- [ ] Validaciones de entrada en frontend y backend.
- [ ] Sin credenciales ni secretos en el código fuente.
- [ ] Pruebas unitarias pasando exitosamente.
- [ ] Manejo de errores amigable sin exponer stacktraces.
- [ ] Documentación OpenAPI actualizada automáticamente.
