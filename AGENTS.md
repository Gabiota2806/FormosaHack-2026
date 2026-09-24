# Guía Universal del Asistente de IA (AGENTS.md) — FormosaHack 2026

## 1. Contexto del Proyecto
Este proyecto es un prototipo desarrollado para la competencia **FormosaHack 2026 (Ultra Hackatón de 24 Horas)**.
- **Frontend:** React 18/19 + Vite + TypeScript + Tailwind CSS.
- **Backend:** Microservicios en Python (FastAPI) unificados por un API Gateway.
- **Persistencia:** PostgreSQL 16 con connection pooling y soft delete (`deleted_at`).
- **Metodología:** SDD (Spec-Driven Development) documentada en `docs/SDD.md` y `docs/TASKS.md`.

---

## 2. Reglas de Eficiencia y Ahorro de Tokens
1. **Respuestas directas:** Ve al grano inmediatamente. No agregues prefacios vacíos ("¡Claro! Con gusto te ayudo..."), explicaciones teóricas genéricas ni resúmenes redundantes.
2. **Generación de código completo:** No dejes bloques a medias ni comentarios tipo `// agregar lógica aquí`. Provee soluciones listas para ejecutar.
3. **Uso de Skills bajo demanda:** Las directivas detalladas están divididas en `.agents/skills/`. Consulta únicamente la skill requerida para la tarea en curso.
4. **Verificación antes de proponer:** Revisa los archivos existentes (`docs/SDD.md`, schemas de Pydantic, rutas de React) antes de inventar nuevos contratos.

---

## 3. Reglas de Oro Técnicas (Mandatorias por la Guía del Profesor)
- **Cero alertas nativas:** Queda estrictamente prohibido usar `alert()` en React. Utilizar Sonner Toasts (`toast.success()`, `toast.error()`) y componentes Modales/Dialogs.
- **Seguridad en Backend:**
  - 2FA TOTP obligatorio (Google Authenticator / Authy con `pyotp`).
  - Rate Limiting en endpoints de autenticación y operaciones sensibles.
  - Validación estricta con Pydantic Schemas en entrada y salida.
  - Contraseñas con hashing seguro (Argon2id o bcrypt).
- **Repository Pattern:** En el backend, mantener la separación: `Router -> Service -> Repository -> Database`. La lógica de negocio no debe residir en los routers ni en los repositorios.
- **Paginación y Filtros:** Las listas deben paginarse en el servidor (`page`, `limit`). No traer listas enteras a memoria para filtrar en React.
- **Commits:** Mensajes en español, atómicos y descriptivos (`feat:`, `fix:`, `refactor:`, `security:`). No atribuir la autoría de los commits a la IA.

---

## 4. Transparencia en Edición de Archivos (Regla Local)
Antes de crear o modificar cualquier archivo en el espacio de trabajo, debes mostrar de forma explícita las líneas exactas o un diff detallado del cambio a realizar.

---

## 5. Metodología de Sesiones Aisladas y Ecosistema Local (.agents/)
- **Playbook de Sesiones:** Consultar `.agents/PLAYBOOK_SESIONES.md` para el catálogo de Prompts y Slash Commands (`/desarrollo-tarea`, `/auditoria`, `/planificacion`, `/deploy`, `/analisis`, `/metodologias`).
- **Paradigma de Trabajo de Gabriel:** "1 Chat = 1 Tarea / Propósito Específico" para preservar máxima agudeza técnica y evitar context poisoning.
- **Reglas Normativas Locales:** Inyectadas permanentemente en `.agents/rules/` (`1_desarrollo_tareas.md` a `6_analisis_requerimientos.md`).
- **Metodología de Equipo (GitFlow):** Consultar `docs/metodologia.md` para estándares de código, pruebas y flujo circular.
- **Propuesta Maestra Definitiva:** Consultar `docs/PROPUESTA_DEFINITIVA.md` para la arquitectura oficial de CiberGuardián.
