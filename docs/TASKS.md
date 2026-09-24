# Registro de Tareas del Proyecto (TASKS) — CiberGuardián
**Metodología:** Spec-Driven Development (SDD)  
**Configuración Oficial:** Duplas de Desarrollo  
• **Dupla Frontend:** Matías + Valeria Budiño  
• **Dupla Backend & Infraestructura:** Gabriel Pineda + Maxi González  
**Rama:** `design` (Lista para sincronizar a `develop`)

---

## Matriz de Tareas Oficial del Hackatón

| ID | Tarea | Asignado a | Componente | Criterios de Aceptación & DoD | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TASK-001** | Definición del SDD y Arquitectura de CiberGuardián | **Equipo Completo** | Documentación | `docs/SDD.md` formalizado con modelos, endpoints y flujo del chatbot. | `DONE` ✅ |
| **TASK-002** | Infraestructura Docker Compose y CI/CD en Servidor | **Gabriel Pineda** | Infra / DevOps | Contenedores levantados, deploy en Render y self-hosted runner operando. | `DONE` ✅ |
| **TASK-003** | Auth Service Base (JWT, Hashing bcrypt, RBAC) | **Gabriel Pineda** | Auth Service | Login, registro y emisión de JWT para moderadores y administradores. | `DONE` ✅ |
| **TASK-004** | Segundo Factor 2FA TOTP (Google Authenticator) | **Gabriel Pineda** | Auth Service | Enrolamiento con QR en Base64 y verificación con `pyotp`. | `DONE` ✅ |
| **TASK-005** | Rate Limiting (SlowAPI) y Security Headers | **Gabriel Pineda** | Gateway / Auth | SlowAPI en endpoints sensibles y cabeceras contra clickjacking en Nginx. | `DONE` ✅ |
| **TASK-006** | Modelado de Incidentes y Reportes con Soft Delete | **Maxi González** | Core Service | Modelos SQLAlchemy `incident_reports`, `incident_votes`, `official_channels` con `deleted_at`. | `TODO` ⏳ |
| **TASK-007** | Repository Pattern en Core Service (`Router->Service->Repo`) | **Maxi González** | Core Service | `IncidentRepository`, `IncidentService` e `IncidentRouter` desacoplados. | `TODO` ⏳ |
| **TASK-008** | Endpoints de Radar Paginado en Servidor y Filtros | **Maxi González** | Core Service | `GET /api/core/incidents` paginado con filtros de entidad y vector + alertas de brote. | `TODO` ⏳ |
| **TASK-009** | Seeder de Estafas Reales y Canales Verificados | **Maxi González** | Core / Seeders | Script `seed.py` con casos reales de phishing bancario, servicios y comercios. | `TODO` ⏳ |
| **TASK-010** | Interfaz del Chatbot CiberGuardián (React + Tailwind) | **Matías** | Frontend | Chat interactivo con chips de acción rápida, burbujas y semáforo visual. | `TODO` ⏳ |
| **TASK-011** | Resaltado Interactivo de Frases Engañosas | **Matías** | Frontend | Componente visual que resalta en el mensaje las trampas de urgencia y enlaces falsos. | `TODO` ⏳ |
| **TASK-012** | Botón de Consulta a Familiar por WhatsApp (`wa.me`) | **Matías** | Frontend | Acción directa para reenviar el diagnóstico formateado a un contacto de confianza. | `TODO` ⏳ |
| **TASK-013** | Botón de Pánico SOS y Llamada 1-Tap a Bancos | **Valeria Budiño** | Frontend | Accesos directos a líneas de bloqueo 24hs de Banco Formosa, Red Link y Banelco. | `TODO` ⏳ |
| **TASK-014** | Generador de Ficha de Denuncia Digital Descargable | **Valeria Budiño** | Frontend | Formulario guiado que genera resumen con CBU y teléfono para la Policía Informática. | `TODO` ⏳ |
| **TASK-015** | Vista del Radar de Amenazas con "A mí también me llegó" | **Valeria Budiño** | Frontend | Feed de alertas por entidad/vector consumiendo endpoint paginado con Toasts. | `TODO` ⏳ |
| **TASK-016** | Modo Protector Mayor & PWA Web Share Target | **Valeria Budiño** | Frontend / PWA | Switch de accesibilidad XL y recepción de mensajes compartidos desde WhatsApp móvil. | `TODO` ⏳ |
| **TASK-017** | Pruebas Unitarias (`pytest`) y Documentación Swagger | **Gabriel Pineda** | Backend / QA | Tests unitarios para el chatbot y swagger interactivo en `/docs`. | `TODO` ⏳ |
| **TASK-018** | Guion de Pitch y Demostración en Vivo ante el Jurado | **Equipo Completo** | Producto | Presentación de 3 minutos con mensaje real de estafa en vivo ante el jurado. | `TODO` ⏳ |

---

## Siguiente Paso Inmediato:
1. Realizar el commit de cierre de la fase de diseño en la rama **`design`** y pushear a GitHub.
2. Hacer checkout a **`develop`** y comenzar la implementación de las tareas en paralelo.
