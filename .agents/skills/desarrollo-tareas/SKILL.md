---
name: desarrollo-tareas
description: Guía procedimental para el desarrollo de tareas técnicas de Gabriel con FastAPI, React 19, TDD y Docker Compose.
---

# 🚀 Skill: Desarrollo de Tareas Técnicas (Gabriel & Antigravity)

## 🎯 Objetivo
Guiar a Antigravity en la ejecución paso a paso de tareas técnicas asignadas a Gabriel en Jira (`FH26`), asegurando rigor de código, pruebas automatizadas y QA local en `http://localhost:8000`.

## 🔄 Procedimiento Operativo

1. **Consulta e Inspección**:
   - Consultar Jira Cloud con la API REST v3 (`.env.jira`).
   - Inspeccionar modelos SQLAlchemy en `backend/core_service/app/models/` y componentes en `frontend/src/`.
   - Redactar el Plan Técnico y **esperar el OK explícito de Gabriel**.

2. **Creación de Rama, Transición en Jira y Codificación TDD**:
   - Crear rama con comando nativo: `git checkout -b feature/FH26-xxx-TASK-yyy-nombre`.
   - Transicionar la subtarea a `En curso` en Jira con `jira_transition_issue`.
   - Implementar pruebas con `pytest` en backend o pruebas de componentes en React.
   - Respetar Cero `alert()`, Sonner Toasts y Lucide React (`lucide-react`).
   - Ejecutar pruebas en Docker: `docker compose exec core_service pytest`.

3. **Pre-Verificación y QA Local**:
   - Navegar a `http://localhost:8000` con Playwright y constatar que no haya errores de consola ni excepciones HTTP 500.
   - Entregar la Guía de QA Manual Paso a Paso apuntando a `http://localhost:8000`.
   - **PAUSA OBLIGATORIA**: Esperar el OK de Gabriel tras su verificación manual.

4. **Fusión, Limpieza y Trazabilidad en Jira**:
   - Commit en español: `git commit -m "feat(área): [FH26-xx] descripción..."`.
   - Push y PR: `git push origin feature/... && gh pr create --base develop ...`.
   - Merge y limpieza: `gh pr merge --merge`, volver a `develop`, `git pull` y eliminar rama local y remota.
   - Publicar comentario en Jira con el enlace a la PR y commit (`jira_add_comment`).
   - Transicionar subtarea a `Listo` con `jira_transition_issue`.
   - Verificar si todas las subtareas de la Historia padre están `Listo`; de ser así, transicionar la Historia padre a `Listo`.
