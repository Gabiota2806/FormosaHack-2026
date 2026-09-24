---
name: regla-auditoria-codigo
description: Regla de cumplimiento obligatorio para la auditoría y revisión de código de compañeros de equipo.
trigger: always_on
---

# 🕵️ Regla de Cumplimiento: Metodología de Auditoría Interna (Gabriel & Antigravity)

Esta regla rige cada vez que Gabriel solicite auditar una tarea o Pull Request de un integrante del equipo (Matías, Valeria, Maxi u otro):

1. **ACTIVACIÓN HÍBRIDA Y DATOS REQUERIDOS**:
   - Slash Command: `/auditoria` o `/auditoria-codigo`.
     * Invocación inline: `/auditoria FH26-40 Matias`.
     * Invocación vacía: Activa `ask_question` con un formulario modal que incluye: Clave de Jira, Autor del código (campo libre de texto) y Rama remota.

2. **CHECKOUT E INSPECCIÓN EXHAUSTIVA CONTRA DEVELOP**:
   - Trae referencias remotas (`git fetch origin`) y haz checkout a la rama del compañero:
     ```bash
     git checkout -b <rama> origin/<rama>
     ```
   - Analiza el diff completo contra `develop` (`git diff develop..HEAD`):
     * **En Backend:** Cumplimiento estricto del Repository Pattern (`Router -> Service -> Repository -> Database`), soft delete (`deleted_at`), schemas de validación Pydantic v2 y seguridad.
     * **En Frontend:** Prohibición absoluta de `alert()`, uso correcto de Sonner Toasts, iconografía exclusiva con Lucide React / SVGs vectoriales (cero emojis de texto) y diseño responsivo accesible.
     * **Pruebas Automatizadas:** Ejecuta la suite de pruebas (`pytest` en backend, tests en frontend) garantizando 100% en verde.

3. **ESTRATEGIA HÍBRIDA DE OBSERVACIONES**:
   - **Caso A (Ajustes Menores o Tests Faltantes):** Antigravity resuelve directamente en la rama, escribe el test correspondiente, comitea en español (`test: ...`, `fix: ...`) y pushea.
   - **Caso B (Errores Graves de Lógica o Arquitectura):** Antigravity redacta el informe descriptivo y justificado para que Gabriel proporcione feedback o rechace la PR.

4. **PRE-VERIFICACIÓN CON PLAYWRIGHT Y QA MANUAL DE GABRIEL**:
   - Si la tarea incluye frontend o endpoints nuevos, realiza smoke test en `http://localhost:8000` con Playwright.
   - 🚫 **PAUSA OBLIGATORIA**: Presenta el Informe de Auditoría y la Guía de QA Manual a Gabriel. Espera su OK tras su prueba manual en `http://localhost:8000` con los contenedores de Docker levantados.

5. **FUSIÓN Y LIMPIEZA FINAL**:
   - Tras el OK definitivo de Gabriel:
     * Fusiona la Pull Request hacia `develop` (`gh pr merge <id> --merge`).
     * Vuelve a `develop`, actualiza (`git pull origin develop`), y elimina la rama local y remota (`git push origin --delete <branch>`).
