# Metodología de Trabajo del Equipo (GitFlow Protegido + TDD + Duplas Fullstack)

Para garantizar la estabilidad, seguridad y calidad del código durante el hackatón, el repositorio cuenta con la rama `develop` protegida. Ningún desarrollador ni asistente de IA puede escribir o realizar un merge local directo sobre `develop`.

---

## 👥 1. Estructura del Equipo y Distribución de Responsabilidades

El equipo opera organizado en dos duplas coordinadas por Gabriel Pineda (Team Lead & QA Architect):

1. **🎨 Dupla Frontend:**
   - **Matías (Líder Frontend & Chatbot):** Interfaz principal React 19 + TypeScript + Tailwind CSS, burbujas de diálogo del Chatbot, selector de chips de los 3 momentos, semáforo interactivo y Sonner Toasts.
   - **Valeria Budiño (Frontend SOS, Radar & PWA):** Botón de Pánico SOS (llamadas directas 1-tap), Ficha de Denuncia Digital, vista del Radar de Amenazas paginado, Modo Protector Mayor XL y configuración PWA `Web Share Target`.
2. **⚙️ Dupla Backend & Infraestructura:**
   - **Maxi González (Líder Backend Core & Seeders):** Microservicio Core (`core_service` FastAPI), modelos SQLAlchemy con `deleted_at` (Soft Delete), Repository Pattern (`Router -> Service -> Repository -> DB`), endpoints paginados del Radar y seeders.
   - **Gabriel Pineda (Líder DevOps, Seguridad & QA):** Orquestación Docker Compose, API Gateway Nginx, Auth Service 2FA TOTP (PyOTP), Rate Limiting (SlowAPI), auditoría de código, control de calidad y despliegues a producción.

---

## 🔄 2. Flujo de Trabajo Circular para Cada Tarea

### Paso 1: Planificación e Inicio
1. Asegúrate de estar en `develop` y con el código más actualizado:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Crea tu rama local para la tarea asignada usando la clave de Jira `FH26` y un nombre descriptivo:
   ```bash
   git checkout -b feature/FH26-xxx-TASK-yyy-nombre-tarea
   ```

### Paso 2: Desarrollo y TDD (Test-Driven Development)
1. Escribe la lógica y su respectiva prueba automatizada:
   - **En Backend (FastAPI):** Pruebas unitarias y de integración utilizando **pytest** (`pytest backend/core_service/tests` o `docker compose exec backend pytest`).
   - **En Frontend (React):** Pruebas de componentes y flujos de interfaz.
2. **Estándar Obligatorio de Iconografía y UI (Lucide React / SVGs vectoriales)**:
   - En todas las pantallas, botones, tablas y modales: **TERMINANTEMENTE PROHIBIDO** el uso de emojis de texto (ej. 🗑️, ✏️, ➕, ❌, 📦) o caracteres sustitutos (ej. `+`, `✕`).
   - Se debe utilizar **exclusivamente iconos vectoriales de Lucide React** (`lucide-react`) o SVGs estilizados con clases de Tailwind CSS (`w-4 h-4` o `w-5 h-5`, `stroke="currentColor"`, `shrink-0`).
3. **Cero Alertas Nativas (`alert()` / `confirm()`)**:
   - Todo aviso al usuario debe manejarse mediante **Sonner Toasts** (`toast.success()`, `toast.error()`) y cuadros de diálogo modales accesibles.
4. Valida que todos los tests pasen exitosamente y que la suite esté 100% verde antes de comitear.

### Paso 3: Registro y Envío Remoto (Push)
1. Registra tus cambios de forma limpia:
   ```bash
   git add .
   ```
2. Realiza el commit utilizando mensajes descriptivos en español siguiendo Conventional Commits:
   ```bash
   git commit -m "feat(core): implementar repository pattern para reportes de incidentes"
   ```
   > ⚠️ **Regla Estricta de Jira:** Menciona únicamente la clave de la subtarea técnica (`FH26-xx` de la TASK). NUNCA menciones la clave de la Historia de Usuario en el commit para no disparar transiciones automáticas prematuras en el tablero.
3. Sube la rama de tu tarea al servidor remoto en GitHub:
   ```bash
   git push origin feature/FH26-xxx-TASK-yyy-nombre-tarea
   ```

### Paso 4: Apertura de Pull Request (PR) y Trabajo en Paralelo
1. Abre un **Pull Request (PR)** desde la rama de tu tarea hacia la rama `develop` utilizando GitHub CLI o la web de GitHub:
   ```bash
   gh pr create --base develop --title "feat: descripción de la subtarea" --body "Resumen de cambios y checklist"
   ```
2. **🚫 PROHIBIDO FUSIONAR DIRECTAMENTE**: La revisión, auditoría técnica, pruebas en contenedor y fusión en `develop` son exclusivas de **Gabriel Pineda (Team Lead & QA)**.
3. **🔄 Trabajo en Paralelo**: Tras solicitar el PR, puedes cambiar de rama de inmediato para avanzar con otra tarea asignada sin necesidad de esperar a que la primera sea aprobada.
4. **🛠️ Solicitud de Cambios**: Si Gabriel solicita cambios u observaciones en tu PR, vuelve a la rama de la tarea, realiza las correcciones y haz push del nuevo commit para reevaluación.

### Paso 5: Integración Local y Limpieza
1. Una vez que Gabriel confirme la aprobación y fusión del PR en `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d feature/FH26-xxx-TASK-yyy-nombre-tarea
   ```

---

## 🤖 3. Directivas Especiales para Asistentes de IA de los Colaboradores

Si eres una IA trabajando para uno de los desarrolladores del equipo en este repositorio, **debes seguir estrictamente el flujo circular descrito arriba**, adaptándolo a las siguientes reglas:

1. **Etapa de Planificación (Bloqueo de IA)**:
   - **NUNCA** comiences a codificar, a crear ramas o a instalar dependencias inmediatamente tras recibir una solicitud.
   - Presenta primero un plan técnico detallado indicando los archivos a crear o modificar.
   - **Espera el OK explícito y visible de tu desarrollador** en el chat antes de realizar cualquier cambio en el sistema.
2. **Etapa de Desarrollo, Calidad y UI**:
   - Escribe código limpio respetando la arquitectura de microservicios (FastAPI) o componentes (React 19).
   - Utiliza exclusivamente **Lucide React / SVGs vectoriales** con Tailwind CSS en vistas React, sin emojis ni caracteres de texto.
   - Queda prohibido usar `alert()`. Utiliza Sonner Toasts (`toast`).
   - Diseña o actualiza pruebas automatizadas con `pytest`.
   - Detalla al usuario cómo probar las modificaciones en su entorno local con Docker (`docker compose`).
   - **Espera un segundo OK explícito** del desarrollador confirmando que todo funciona en local.
3. **Fase de Envío y Desbloqueo**:
   - **NO** intentes editar los archivos maestros de control (`docs/SDD.md`, `docs/TASKS.md`, `docs/metodologia.md`, `docs/PROPUESTA_DEFINITIVA.md`), los cuales son gobernados exclusivamente por el Team Lead (Gabriel).
   - Realiza los commits en español siguiendo Conventional Commits referenciando la TASK de Jira.
   - Sube la rama y abre el Pull Request hacia `develop` para que Gabriel lo audite y fusione.
