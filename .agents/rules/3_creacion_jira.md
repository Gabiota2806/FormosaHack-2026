---
name: regla-creacion-jira
description: Regla de cumplimiento obligatorio para la planificación y creación de tareas en Jira Cloud.
trigger: always_on
---

# 📋 Regla de Cumplimiento: Planificación y Creación en Jira Cloud (Gabriel & Antigravity)

Esta regla rige cada vez que Gabriel solicite crear o planificar tareas en Jira Cloud:

1. **ACTIVACIÓN HÍBRIDA Y /grill-me**:
   - Slash Command: `/planificacion` o `/planificacion-jira`.
   - Si existen dudas funcionales, ambigüedades o alternativas de alcance, activa `/grill-me` usando `ask_question`.

2. **PRESENTACIÓN DEL BORRADOR COMPLETO**:
   - Historia de Usuario (HU): Título, narrativa BDD (Gherkin: Dado/Cuando/Entonces), criterios de aceptación y Story Points acumulados.
   - Subtareas Técnicas (TASK): Título, especificación técnica (mencionando Lucide React, Soft Delete, etc.), archivos afectados y Story Points.
   - Épica Padre y Sprint Objetivo (`FH26`).

3. **BLOQUEO ABSOLUTO DE CREACIÓN SIN "OK"**:
   - 🚫 NUNCA crees tarjetas en Jira Cloud por API sin el "OK" explícito y visible de Gabriel en el chat.

4. **CREACIÓN VÍA API REST V3 DE JIRA**:
   - Credenciales desde `.env.jira` (`JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY=FH26`).
   - Tras el OK de Gabriel, crea la HU y las subtareas anidadas vía REST API v3, entregando los enlaces directos a las tarjetas creadas en el tablero.
