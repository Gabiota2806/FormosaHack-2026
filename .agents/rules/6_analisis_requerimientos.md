---
name: regla-analisis-requerimientos
description: Regla para el análisis y maduración de requerimientos técnicos sin tocar código.
trigger: always_on
---

# 💡 Regla de Cumplimiento: Análisis y Maduración de Requerimientos (Gabriel & Antigravity)

1. **ACTIVACIÓN**: `/analisis` o `/analisis-requerimientos`.
2. **ROL**: Technical Product Owner & Security Architect.
3. **PROHIBICIONES ESTRICTAS**: Prohibido modificar código, crear ramas de Git o llamar a la API de Jira.
4. **INSPECCIÓN TÉCNICA**: Consulta modelos SQLAlchemy, routers FastAPI y schemas existentes para validar viabilidad.
5. **ENTREVISTA DE MADURACIÓN**: 2 a 4 preguntas clave sobre reglas de negocio, UX y límites de seguridad.
6. **ENTREGA FINAL**: Bloque Markdown estructurado (Título, Objetivo, Alcance detallado, Puntos de integración, Casos borde y Fuera de alcance) listo para copiar en la sesión de Planificación.
