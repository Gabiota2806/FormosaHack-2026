---
name: regla-desarrollo-tareas
description: Regla de cumplimiento obligatorio para el desarrollo de tareas técnicas de Gabriel (Team Lead).
trigger: always_on
---

# 🛡️ Regla de Cumplimiento: Desarrollo de Tareas Técnicas (Gabriel & Antigravity)

Esta regla rige de forma permanente en todas las sesiones de desarrollo de Gabriel:

1. **ACTIVACIÓN HÍBRIDA Y CREACIÓN DE RAMA EN GIT**:
   - Slash Command: `/desarrollo-tarea` o `/desarrollo-tareas`.
     * Invocación inline: `/desarrollo-tarea FH26-39`. Extrae la clave y avanza a consultar Jira sin preguntas redundantes.
     * Invocación vacía: Activa `ask_question` solicitando la clave de la tarea y notas técnicas.
   - NUNCA escribas código sin antes presentar un Plan Técnico detallado en el chat.
   - Consulta Jira Cloud vía API REST v3 (`.env.jira`), extrae el título oficial y define la rama con comandos estándar de Git:
     ```bash
     git checkout -b feature/FH26-xxx-TASK-yyy-nombre-tarea
     ```
   - Inspecciona los modelos SQLAlchemy, routers FastAPI y schemas Pydantic v2 antes de proponer cambios.
   - Pausa y espera el "OK" explícito de Gabriel antes de codificar.

2. **REGLA ESTRICTA DE JIRA EN COMMITS Y PULL REQUESTS**:
   - NUNCA incluyas la clave de la Historia de Usuario (`HU-xx` / `FH26-xx` de la historia) en commits ni en títulos de PR para no cerrar historias antes de tiempo.
   - SOLO referencia la clave de la Subtarea específica (`TASK-xx` / `FH26-xx` de la subtarea, ej. `FH26-39`).

3. **INSPECCIÓN VISUAL, PRE-VERIFICACIÓN CON PLAYWRIGHT Y QA MANUAL LOCAL**:
   - Codifica bajo TDD implementando pruebas en `pytest` para FastAPI o pruebas de componentes en React.
   - Prohibido el uso de `alert()`. Utiliza exclusivamente Sonner Toasts (`toast.success()`, `toast.error()`) y modales.
   - Iconografía: Prohibido emojis de texto en componentes UI; utiliza exclusivamente **Lucide React** (`lucide-react`) o SVGs vectoriales con Tailwind.
   - Pre-verificación técnica obligatoria por el agente:
     * Navega a la vista afectada en `http://localhost:8000` con Playwright.
     * Constata ausencia de errores en consola de JavaScript y respuestas HTTP 200 en endpoints.
   - 🚫 **PAUSA OBLIGATORIA DE QA MANUAL**: Presenta la Guía de QA Manual Paso a Paso apuntando a `http://localhost:8000` y espera el OK de Gabriel tras su prueba local con Docker Compose.
   - Ciclo iterativo ante observaciones: si Gabriel pide ajustes, redacta un plan de ajuste, espera OK, aplica correcciones y repite la verificación.

4. **DOCUMENTACIÓN, COMMIT Y FUSIÓN**:
   - Tras el OK de Gabriel en QA:
     * Realiza el commit en español con Conventional Commits (`feat: ...`, `fix: ...`, `test: ...`).
     * Sube la rama: `git push origin feature/FH26-xxx-TASK-yyy-nombre-tarea`.
     * Abre el PR hacia `develop` usando `gh pr create`.
     * Verifica ausencia de conflictos y fusiona automáticamente (`gh pr merge <id> --merge`).
     * Limpieza: vuelve a `develop`, haz `git pull origin develop`, elimina la rama local (`git branch -d`) y remota (`git push origin --delete`).
