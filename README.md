# FormosaHack 2026 — Prototipo Ultra Hackatón 24 Horas

> **Organizador:** Instituto Politécnico Formosa "Dr. Alberto Marcelo Zorrilla" (IPF CONECTA)  
> **Metodología:** Spec-Driven Development (SDD) con Asistencia de Inteligencia Artificial  
> **Equipo:** 4 Integrantes  

---

## 1. Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada de **Microservicios** contenerizados con Docker y unificados mediante un **API Gateway**:

```text
                        [ Navegador / Cliente ]
                                  │
                                (Puerto 8000)
                                  ▼
                    ┌──────────────────────────┐
                    │   API Gateway (Nginx)    │
                    └─────────────┬────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │ /api/auth/*        │ /api/core/*        │ / (Frontend)
             ▼                    ▼                    ▼
     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
     │ Auth Service │     │ Core Service │     │   Frontend   │
     │  (FastAPI)   │     │  (FastAPI)   │     │ (React + TS) │
     │  2FA & JWT   │     │  Repository  │     │   Tailwind   │
     └───────┬──────┘     └───────┬──────┘     └──────────────┘
             │                    │
             └──────────┬─────────┘
                        ▼
            ┌───────────────────────┐
            │  PostgreSQL (Docker)  │
            │   Connection Pool     │
            └───────────────────────┘
```

---

## 2. Puntos Clave & Cumplimiento de la Guía del Profesor

| Requisito de la Guía | Implementación en este Proyecto | Ubicación en el Código |
| :--- | :--- | :--- |
| **Separación Frontend/Backend** | Proyectos desacoplados con Dockerfiles propios y Nginx Gateway. | `/frontend`, `/backend`, `docker-compose.yml` |
| **Patrón de Diseño Obligatorio** | **Repository Pattern** (`Router -> Service -> Repository -> DB`). | `/backend/core_service/app/repositories/` |
| **Segundo Factor de Autenticación (2FA)** | **TOTP con Google Authenticator / Authy** (`pyotp` + QR Base64). | `/backend/auth_service/app/routers/auth.py` |
| **Seguridad: Rate Limiting & Headers** | SlowAPI en endpoints de auth + Headers de seguridad estrictos. | `auth_service/app/main.py`, `gateway/nginx.conf` |
| **Soft Delete (Borrado Lógico)** | Entidades con columna `deleted_at` sin destrucción física de datos. | `/backend/core_service/app/models/resource.py` |
| **Paginación & Búsqueda en Servidor** | Parámetros `page`, `limit` y filtrado dinámico en base de datos. | `/backend/core_service/app/services/` |
| **UX sin `alert()`** | Toasts accesibles con **Sonner** y modales con **Lucide Icons**. | `/frontend/src/components/ui/ConfirmModal.tsx` |
| **Documentación de API** | **Swagger / OpenAPI interactivo** generado automáticamente. | `http://localhost:8000/api/auth/docs`, `.../core/docs` |
| **Metodología SDD** | Especificación formal y desglose de tareas con DoD. | `docs/SDD.md` y `docs/TASKS.md` |

---

## 3. Puesta en Marcha en 1 Comando

Para levantar toda la infraestructura (Base de datos PostgreSQL, Microservicios, Gateway y Frontend):

```bash
docker compose up -d
```

### URLs de Acceso:
* **Aplicación Web (Frontend):** [http://localhost:8000](http://localhost:8000)
* **Swagger Auth Service:** [http://localhost:8000/api/auth/docs](http://localhost:8000/api/auth/docs)
* **Swagger Core Service:** [http://localhost:8000/api/core/docs](http://localhost:8000/api/core/docs)
* **Base de Datos PostgreSQL:** `localhost:5432` (`postgres` / `postgres`)

---

## 4. Ejecución de Pruebas Unitarias

```bash
# Pruebas de Auth Service (FastAPI + 2FA)
cd backend/auth_service && pytest

# Pruebas de Core Service (Repository Pattern + Soft Delete)
cd backend/core_service && pytest

# Verificación de compilación Frontend
cd frontend && npm run build
```
