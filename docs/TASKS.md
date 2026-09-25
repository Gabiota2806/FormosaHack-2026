# Registro de Tareas del Proyecto (TASKS) — Metodología SDD

> **Sincronización:** Diseñado para mapearse directamente con el tablero de Jira del equipo mediante el Servidor MCP o tableros ágiles (TODO $\rightarrow$ IN PROGRESS $\rightarrow$ CODE REVIEW $\rightarrow$ DONE).

---

## Matriz de Tareas

| ID | Tarea | Componente | Prioridad | Jira Key | Criterios de Aceptación & DoD | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TASK-001** | Definición del SDD y Especificación de Requerimientos | Documentación | **Crítica** | - | Completar `docs/SDD.md` con la problemática asignada en la hora 0-2. | `TODO` |
| **TASK-002** | Scaffolding de Docker Compose y Redes de Microservicios | Infra / DevOps | **Alta** | - | `docker-compose.yml` levanta PostgreSQL, Gateway, Frontend y Microservicios. | `TODO` |
| **TASK-003** | Servicio de Autenticación Base (JWT, Hashing, Roles) | Auth Service | **Alta** | - | Registro de usuarios, login con JWT y protección de contraseñas con Argon2id/bcrypt. | `TODO` |
| **TASK-004** | Segundo Factor de Autenticación (2FA TOTP con Google Auth) | Auth Service | **Crítica** | - | Enrolamiento con QR/Secreto TOTP y middleware de verificación obligatoria. | `TODO` |
| **TASK-005** | Rate Limiting y Cabeceras de Seguridad en Auth | Auth Service | **Alta** | - | Límites de peticiones (SlowAPI) en login/register y cabeceras de seguridad activas. | `TODO` |
| **TASK-006** | Modelado de Entidades Core con Soft Delete (`deleted_at`) | Core Service | **Alta** | - | Modelos SQLAlchemy con clave foránea, timestamps y borrado lógico. | `TODO` |
| **TASK-007** | Implementación del Repository Pattern en Core Service | Core Service | **Alta** | - | Separación estricta: `Router -> Service -> Repository -> Database`. | `TODO` |
| **TASK-008** | Paginación en Servidor y Filtros de Búsqueda Dinámicos | Core Service | **Media** | - | Endpoints devuelven `data`, `total`, `page`, `limit` sin saturar memoria. | `TODO` |
| **TASK-009** | Configuración de API Gateway (Nginx / Proxy Unificado) | Gateway | **Alta** | - | Enrutamiento unificado bajo el puerto 8000 para `/api/auth` y `/api/core`. | `TODO` |
| **TASK-010** | Scaffolding Frontend React (Vite, TS, Tailwind CSS) | Frontend | **Alta** | - | Estructura base limpia, cliente Axios con interceptores y diseño responsivo. | `TODO` |
| **TASK-011** | Sistema de Notificaciones Toasts y Modales (Cero `alert()`) | Frontend | **Alta** | - | Sonner Toasts para feedback de operaciones y modales accesibles para confirmación. | `TODO` |
| **TASK-012** | Pantalla de Login, Registro y Enrolamiento/Validación 2FA | Frontend | **Alta** | - | Formularios con validación en tiempo real y flujo de verificación TOTP. | `TODO` |
| **TASK-013** | Vistas de la Problemática Core (CRUD, Tablas Paginadas) | Frontend | **Alta** | - | Consumo de endpoints de Core Service con estados de carga y manejo de errores. | `TODO` |
| **TASK-014** | Seeder de Datos Contextuales de Formosa para Demostración | Core / Seeders | **Media** | - | Población de base de datos con instituciones, nombres y datos locales reales. | `TODO` |
| **TASK-015** | Pruebas Unitarias Obligatorias (`pytest`) y Swagger Docs | Backend / QA | **Crítica** | - | Tests unitarios pasando y Swagger accesible en `/docs` para evaluación. | `TODO` |
| **TASK-016** | README de Entrega y Guion de Pitch para el Jurado | Producto | **Crítica** | - | Documento final con justificación técnica y ensayo del pitch de 3-5 minutos. | `TODO` |

---

## Definition of Done (DoD) para cada Tarea
1. Código revisado por al menos un compañero del equipo o IA asistente.
2. Sin credenciales ni secretos en el código fuente.
3. Tests unitarios implementados para la lógica creada.
4. Mensajes de error legibles y amigables.
5. Commit descriptivo en español siguiendo convenciones (`feat:`, `fix:`, `refactor:`).
