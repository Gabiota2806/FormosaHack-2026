---
name: auditoria-codigo
description: Guía de revisión y auditoría de código para Pull Requests de compañeros (Matías, Valeria, Maxi).
---

# 🕵️ Skill: Auditoría de Código de Compañeros

## 🎯 Objetivo
Proveer el procedimiento para que Gabriel audite entregas de otros desarrolladores, asegurando estándares de arquitectura, pruebas y calidad antes de fusionar en `develop`.

## 🔄 Procedimiento Operativo

1. **Obtención de la Rama Remota**:
   - `git fetch origin`
   - `git checkout -b <rama> origin/<rama>`
   - `git diff develop..HEAD`

2. **Checklist Técnico de Revisión**:
   - [ ] **Repository Pattern**: Routers delegan en Services y estos en Repositories.
   - [ ] **Soft Delete**: Entidades implementan `deleted_at`.
   - [ ] **Seguridad & 2FA**: Rutas protegidas y validación estricta con Pydantic v2.
   - [ ] **UI Limpia**: Cero `alert()`, uso de Sonner Toasts, Lucide React (sin emojis de texto).
   - [ ] **Tests Automatizados**: Pruebas `pytest` 100% verdes.

3. **Pre-Verificación y QA Local**:
   - Smoke test visual con Playwright en `http://localhost:8000`.
   - Emitir Informe Técnico y Guía de QA para Gabriel.
   - **PAUSA OBLIGATORIA**: Esperar OK de Gabriel tras su prueba manual en Docker.

4. **Fusión, Limpieza y Cierre en Jira**:
   - `gh pr merge --merge`
   - `git checkout develop && git pull origin develop`
   - `git branch -d <rama> && git push origin --delete <rama>`
   - Publicar comentario en Jira con el dictamen de auditoría y merge (`jira_add_comment`).
   - Transicionar subtarea a `Listo` con `jira_transition_issue`.
   - Si todas las subtareas de la Historia padre están `Listo`, transicionar la Historia a `Listo`.
