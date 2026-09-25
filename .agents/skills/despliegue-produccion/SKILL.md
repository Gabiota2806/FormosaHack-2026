---
name: despliegue-produccion
description: Protocolo seguro de despliegue a producción de develop hacia main.
---

# 🚀 Skill: Despliegue a Producción

## 🎯 Procedimiento Operativo
1. Validar `develop` limpio y actualizado.
2. Ejecutar suite global de pruebas (`pytest` y tests de frontend).
3. Verificar compilación de Vite (`npm run build`).
4. Generar PR `develop ➔ main` con notas de release.
5. Fusionar PR y monitorear GitHub Actions (`deploy.yml`) o Render.com.
6. Smoke test HTTP 200 en la URL pública.
