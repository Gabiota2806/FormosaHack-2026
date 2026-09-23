---
name: jira-task-manager
description: Guía de comandos y mapeo de tareas entre docs/TASKS.md y el tablero de Jira utilizando las herramientas del Servidor MCP.
---

# Skill: Gestión de Tareas con Jira MCP

## Objetivo
Mantener sincronizado el progreso del equipo en Jira sin salir del entorno de desarrollo asistido por IA.

## Flujo de Trabajo con Jira MCP
1. **Listar Proyectos:** Ejecutar herramienta MCP `jira_get_projects` para identificar la clave del proyecto (ej. `FH26`, `HACK`).
2. **Crear Tareas desde el SDD:**
   - Usar `jira_create_issue` para dar de alta las tareas definidas en `docs/TASKS.md`.
   - Especificar: `project_key`, `summary` (ej. `[TASK-004] 2FA TOTP con Google Authenticator`), `issue_type` ("Task"), y descripción con los criterios de aceptación.
3. **Transicionar Estados:**
   - Cuando se inicie una tarea: mover a `In Progress` con `jira_transition_issue`.
   - Cuando se complete y se verifiquen los tests: mover a `Done`.
4. **Actualizar docs/TASKS.md:**
   - Registrar la clave de Jira (ej. `FH-12`) en la columna correspondiente del documento markdown.
