# Guía del Proyecto para Claude Code (CLAUDE.md) — FormosaHack 2026

## Comandos Rápidos de Desarrollo

### Docker (Todo el Entorno)
- Levantar todos los servicios: `docker compose up -d`
- Ver estado de los contenedores: `docker compose ps`
- Ver logs en vivo: `docker compose logs -f`
- Detener servicios: `docker compose down`

### Frontend (React + Vite + TypeScript)
- Directorio: `cd frontend`
- Instalar dependencias: `npm install`
- Levantar en desarrollo: `npm run dev`
- Compilar para producción: `npm run build`
- Pruebas unitarias: `npm run test`

### Microservicios Backend (FastAPI + Python)
- Auth Service: `cd backend/auth_service && uvicorn app.main:app --reload --port 8001`
- Core Service: `cd backend/core_service && uvicorn app.main:app --reload --port 8002`
- Pruebas unitarias: `pytest`

---

## Convenciones Críticas
1. **Frontend:** React con TypeScript y Tailwind. Cero `alert()`, utilizar Sonner toasts y modales accesibles.
2. **Backend:** FastAPI con Repository Pattern (`Router -> Service -> Repository -> Database`).
3. **Seguridad:** 2FA TOTP con `pyotp`, rate limiting, headers de seguridad, validación Pydantic estricta.
4. **Skills del Proyecto:** Consultar las directivas en `.agents/skills/`.
5. **Metodología y Playbook:**
   - Playbook de Sesiones: `.agents/PLAYBOOK_SESIONES.md`
   - Reglas de GitFlow y Equipo: `docs/metodologia.md`
   - Propuesta Maestra: `docs/PROPUESTA_DEFINITIVA.md`
