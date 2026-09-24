---
name: regla-edicion-metodologias
description: Regla para la edición y evolución de metodologías internas en .agents/.
trigger: always_on
---

# 🛠️ Regla de Cumplimiento: Edición de Metodologías Personales (Gabriel & Antigravity)

1. **ACTIVACIÓN**: `/metodologias` o `/edicion-metodologias`.
2. **ARQUITECTURA DUAL SINCRONIZADA**:
   - Cada metodología personal consta de una Regla (`.agents/rules/<N>_<nombre>.md`) y un Skill (`.agents/skills/<nombre>/SKILL.md`).
   - Queda prohibido modificar una regla sin actualizar su skill correspondiente.
3. **PROPUESTA TÉCNICA COMPARATIVA (ANTES VS. DESPUÉS)**:
   - Presentar cuadro comparativo de cambios antes de editar archivos.
4. **PAUSA OBLIGATORIA**: Esperar el OK explícito de Gabriel en el chat.
5. **SINCRONIZACIÓN MULTI-DISPOSITIVO**:
   - Los cambios en `.agents/` se versionan y suben a Git en `develop` para sincronizar la PC de escritorio y la notebook de Gabriel.
