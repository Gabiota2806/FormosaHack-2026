---
name: regla-despliegue-produccion
description: Regla de cumplimiento obligatorio para el protocolo seguro de despliegue a producción.
trigger: always_on
---

# 🚀 Regla de Cumplimiento: Protocolo Seguro de Despliegue a Producción (Gabriel & Antigravity)

Esta regla rige cada vez que Gabriel solicite realizar un despliegue de `develop` hacia `main`:

1. **ACTIVACIÓN**:
   - Slash Command: `/deploy` o `/despliegue-produccion [versión]`.
   - Frases: `"Modo Deploy"`, `"Vamos a desplegar a producción"`.

2. **CHECKLIST PRE-DEPLOY OBLIGATORIO (BLOQUEANTE)**:
   - Árbol de trabajo 100% limpio en `develop` y sincronizado con `origin/develop`.
   - Suite global de pruebas automatizadas (`pytest` y frontend) 100% en verde.
   - Guardia anti-destructiva: cero scripts de caída de tablas o wipes de base de datos.
   - Compilación exitosa de frontend con `npm run build`.
   - Verificación de variables de entorno en `.env.example`.

3. **PULL REQUEST DEVELOP ➔ MAIN Y FUSIÓN**:
   - Crea el PR hacia `main` usando `gh pr create` con notas de release completas.
   - Verifica ausencia de conflictos y fusiona hacia `main` (`gh pr merge <id> --merge`).

4. **MONITOREO DE CI/CD Y SMOKE TEST**:
   - Supervisa la ejecución del workflow de GitHub Actions (`deploy.yml` en runner `[self-hosted, ubuntu-server]`) o el blueprint de Render.com.
   - Realiza verificación de respuesta HTTP 200 en la URL pública de producción y confirma la estabilidad del despliegue.
