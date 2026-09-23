# Guía de Proyecto — Desarrollo de Aplicaciones con IA

## 1. Objetivo

El objetivo de este trabajo es desarrollar una aplicación web completa, aplicando buenas prácticas de ingeniería de software, seguridad, trabajo colaborativo y desarrollo asistido por Inteligencia Artificial.

La aplicación deberá contar, como mínimo, con:

- **Frontend:** interfaz web desarrollada con ReactJS.
- **Backend:** API o conjunto de servicios que contengan la lógica de negocio.
- **Base de datos:** PostgreSQL o MongoDB.
- **Seguridad:** controles de seguridad implementados desde el diseño.
- **Testing:** pruebas unitarias y, cuando corresponda, pruebas de integración.
- **Documentación:** documentación técnica del sistema y de la API.
- **Control de versiones:** Git + GitHub.
- **Contenedores:** Docker.
- **Gestión del proyecto:** Trello u otra herramienta equivalente.

> **Importante:** La Inteligencia Artificial es una herramienta de apoyo. El equipo es responsable de comprender, revisar, probar y justificar el código generado por IA. No se debe copiar código sin entenderlo.

---

# 2. Etapa 1 — Analizar la problemática

Antes de comenzar a programar, deben comprender y definir correctamente el problema.

Pueden utilizar alguna de las siguientes IA para analizar la problemática:

- [ChatGPT](https://chat.openai.com/)
- [DeepSeek](https://chat.deepseek.com/)
- [Z.ai](https://z.ai/)

### ¿Qué deben pedirle a la IA?

La IA puede ayudarles a:

- identificar actores del sistema;
- identificar funcionalidades;
- definir requisitos funcionales;
- definir requisitos no funcionales;
- detectar reglas de negocio;
- proponer entidades;
- analizar posibles arquitecturas;
- detectar riesgos;
- proponer algoritmos;
- generar casos de uso;
- identificar casos extremos;
- detectar posibles vulnerabilidades;
- ayudar a elaborar el SDD.

### No deben hacer esto

No deben preguntarle simplemente:

> "Haceme toda la aplicación."

El objetivo es utilizar IA como **asistente de análisis y desarrollo**, no como sustituto del razonamiento del equipo.

---

# 3. SDD — Spec Driven Development

El proyecto utilizará la metodología **SDD (Spec Driven Development)**.

La idea principal es:

> **Primero especificar qué debe hacer el sistema y cómo estará diseñado; después implementarlo.**

El SDD funcionará como la fuente principal de verdad del proyecto.

## Flujo recomendado

```text
Problema
   ↓
Análisis
   ↓
Requisitos
   ↓
SDD
   ↓
Arquitectura
   ↓
Diseño
   ↓
TASKS
   ↓
Implementación
   ↓
Testing
   ↓
Revisión
   ↓
Deploy
```

El SDD debería contener, como mínimo:

- descripción del problema;
- objetivos;
- alcance;
- funcionalidades;
- requisitos funcionales;
- requisitos no funcionales;
- reglas de negocio;
- actores;
- casos de uso;
- arquitectura;
- modelo de datos;
- API;
- seguridad;
- testing;
- despliegue;
- tareas de desarrollo.

### Recomendación

Dividan el trabajo en **TASKS pequeñas y verificables**.

Una tarea debería indicar:

- objetivo;
- descripción;
- archivos o módulos involucrados;
- dependencias;
- criterios de aceptación;
- pruebas necesarias;
- riesgos.

---

# 4. Arquitectura

Cada equipo deberá seleccionar una arquitectura y justificar su elección.

## Opción A — Microservicios

**Recomendada para quienes quieran profundizar en arquitectura distribuida.**

Ejemplo:

```text
                    ┌───────────────┐
                    │   Frontend   │
                    │    React     │
                    └───────┬───────┘
                            │
                       API Gateway
                            │
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
   ┌────────────┐    ┌────────────┐    ┌────────────┐
   │ Usuarios   │    │ Productos  │    │ Reportes   │
   │ Servicio   │    │ Servicio   │    │ Servicio   │
   └────────────┘    └────────────┘    └────────────┘
          │                 │                 │
          ↓                 ↓                 ↓
       Base DB           Base DB           Base DB
```

Los microservicios permiten separar funcionalidades en servicios independientes.

### Importante

Si utilizan microservicios:

- no compartan conexiones de base de datos indiscriminadamente;
- utilicen **connection pools**;
- controlen el número máximo de conexiones;
- implementen timeouts;
- manejen errores de comunicación;
- eviten dependencias circulares;
- documenten la comunicación entre servicios.

No creen microservicios solamente para "tener muchos servicios". Cada servicio debe tener una responsabilidad clara.

---

# 5. Arquitectura Modular Monolítica

También pueden utilizar una arquitectura modular monolítica.

El frontend y backend deben continuar siendo proyectos separados:

```text
proyecto/
│
├── frontend/
│   ├── Dockerfile
│   └── ...
│
├── backend/
│   ├── Dockerfile
│   └── ...
│
├── docker-compose.yml
└── README.md
```

Dentro del backend se deben separar los módulos por responsabilidad.

Ejemplo:

```text
backend/
├── auth/
├── users/
├── products/
├── orders/
├── reports/
├── database/
├── middleware/
└── ...
```

Esta arquitectura es válida y puede ser más sencilla de desarrollar y desplegar.

---

# 6. Patrón de diseño

Se deberá utilizar al menos un patrón de diseño.

Se recomienda:

## Repository Pattern

El Repository Pattern permite separar la lógica de negocio del acceso a la base de datos.

Conceptualmente:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Por ejemplo:

```text
UserController
      ↓
UserService
      ↓
UserRepository
      ↓
PostgreSQL
```

El equipo es libre de utilizar otros patrones cuando estén justificados.

Ejemplos:

- Factory
- Strategy
- Adapter
- Observer
- Dependency Injection
- Singleton, cuando realmente corresponda
- Repository
- Service Layer

> No utilicen patrones únicamente para cumplir una lista. Deben poder explicar qué problema resuelve cada patrón.

---

# 7. Herramientas para desarrollar

Pueden utilizar:

- **Antigravity IDE**
- **Kiro — versión gratuita**

También pueden utilizar otros IDEs si el equipo lo considera necesario.

---

# 8. Lenguajes de programación

Son libres de elegir el lenguaje.

Opciones recomendadas:

| Lenguaje | Nivel orientativo | Comentario |
|---|---|---|
| JavaScript | Sencillo | Ecosistema web amplio |
| TypeScript | Avanzado | Tipado estático y mejor mantenibilidad |
| Python | Sencillo | Sintaxis simple y amplio ecosistema |
| Rust | Complicado | Alto rendimiento y seguridad de memoria |

La elección debe estar justificada en la documentación.

---

# 9. Frontend

El frontend deberá desarrollarse utilizando:

## ReactJS

Pueden utilizar alguna de las siguientes librerías:

- Material UI
- TailwindCSS
- Gluestack
- Chakra UI
- Radix UI

La aplicación debe ser:

- responsive;
- accesible;
- rápida;
- visualmente consistente;
- fácil de utilizar;
- adaptable a diferentes tamaños de pantalla.

## Reglas del frontend

### No utilizar alertas básicas de JavaScript

Evitar:

```javascript
alert("Usuario eliminado");
```

Utilizar en su lugar:

- Dialogs;
- Modals;
- Toasts;
- Snackbars;
- componentes de notificación.

Los mensajes deben ser claros y amigables.

### Responsive Design

La aplicación debe funcionar correctamente en:

- teléfonos;
- tablets;
- notebooks;
- monitores;
- resoluciones grandes y pequeñas.

No debe existir:

- contenido desbordado;
- botones fuera de pantalla;
- tablas imposibles de utilizar;
- elementos superpuestos;
- textos cortados;
- layouts rotos.

### Animaciones

Agregar animaciones y transiciones cuando aporten valor a la experiencia de usuario.

No abusar de las animaciones.

Las transiciones deben ser:

- suaves;
- rápidas;
- coherentes;
- no invasivas.

---

# 10. Backend

Pueden utilizar:

## Node.js

- Express — más sencillo.
- NestJS — más complejo y estructurado.

## Python

- FastAPI — más sencillo.
- Django — más complejo.

La elección debe estar justificada.

El backend debe implementar una API correctamente estructurada.

Se recomienda:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

La lógica de negocio no debe estar directamente dentro de los controllers.

---

# 11. Base de datos

Pueden utilizar:

## PostgreSQL

Base de datos relacional.

Adecuada cuando existen:

- relaciones entre entidades;
- integridad referencial;
- transacciones;
- consultas estructuradas.

## MongoDB

Base de datos no relacional.

Adecuada para determinados escenarios orientados a documentos.

La elección debe justificarse según las características del proyecto.

---

# 12. Seguridad — Obligatoria

La seguridad es un requisito obligatorio.

No se considera una funcionalidad opcional ni una tarea para realizar al final.

La seguridad debe incorporarse desde el diseño.

---

## 12.1 Rate Limiting

Limitar el número de solicitudes que puede realizar un cliente.

Debe aplicarse especialmente a:

- login;
- recuperación de contraseña;
- endpoints costosos;
- APIs públicas;
- operaciones sensibles.

Considerar:

- límites por IP;
- límites por usuario;
- ventanas de tiempo;
- backoff;
- bloqueo temporal cuando corresponda.

---

# 13. Seguridad de cabeceras HTTP

Implementar cabeceras de seguridad.

En Node.js pueden utilizar:

- Helmet.

Considerar, según corresponda:

- Content-Security-Policy;
- Strict-Transport-Security;
- X-Content-Type-Options;
- Referrer-Policy;
- Permissions-Policy;
- protección contra clickjacking.

No utilizar configuraciones copiadas sin comprenderlas.

---

# 14. Sanitización y validación

Todo dato recibido desde el cliente debe considerarse potencialmente malicioso.

Validar:

- body;
- query parameters;
- path parameters;
- headers relevantes;
- formularios;
- filtros;
- paginación;
- archivos.

Pueden utilizar herramientas como:

### Node.js

- Zod
- Joi
- class-validator

### Python

- Pydantic

La validación del frontend **no reemplaza** la validación del backend.

---

# 15. Protección contra inyecciones

La aplicación debe protegerse contra:

- SQL Injection;
- NoSQL Injection;
- Command Injection;
- LDAP Injection, si corresponde;
- otras formas de inyección.

No construir consultas mediante concatenación de strings con información proporcionada por usuarios.

Utilizar:

- ORM;
- consultas parametrizadas;
- validación;
- sanitización;
- allowlists.

---

# 16. CORS

Configurar CORS correctamente.

No utilizar indiscriminadamente:

```text
Access-Control-Allow-Origin: *
```

Especialmente en endpoints autenticados.

Configurar explícitamente:

- dominios permitidos;
- métodos;
- headers;
- credentials;
- preflight.

Diferenciar:

```text
development
staging
production
```

---

# 17. Autenticación y autorización

La aplicación debe implementar autenticación segura cuando corresponda.

Debe existir una clara diferencia entre:

### Autenticación

> ¿Quién es el usuario?

### Autorización

> ¿Qué puede hacer ese usuario?

Implementar:

- login;
- logout;
- protección de rutas;
- roles;
- permisos;
- control de acceso;
- expiración de sesión;
- recuperación segura de cuenta.

Utilizar hashing seguro para contraseñas.

Se recomienda:

- Argon2id;
- bcrypt correctamente configurado.

Nunca almacenar:

```text
password = "123456"
```

en texto plano.

---

# 18. Segundo factor de autenticación

Se deberá implementar un segundo factor de autenticación.

Una alternativa recomendada es:

- Google Authenticator;
- TOTP;
- u otra solución equivalente.

El objetivo es agregar una segunda capa de seguridad.

Ejemplo:

```text
Contraseña
     +
Código temporal
     ↓
Acceso
```

---

# 19. Control de acceso avanzado

No alcanza con esconder botones en React.

Por ejemplo, esto NO es seguridad:

```javascript
if (user.role === "ADMIN") {
   mostrarBotonEliminar();
}
```

El backend debe comprobar nuevamente los permisos.

Ejemplo:

```text
Frontend
   ↓
Oculta botón
   ↓
Backend
   ↓
Verifica permisos
   ↓
Database
```

Un usuario sin autorización nunca debe poder ejecutar una operación simplemente llamando directamente a la API.

Considerar ataques como:

- IDOR;
- Broken Access Control;
- escalamiento de privilegios.

---

# 20. RCE y Web Shell

La aplicación debe estar protegida contra **Remote Code Execution (RCE)** y Web Shells.

Evitar:

- ejecutar comandos recibidos desde el usuario;
- `eval`;
- ejecución arbitraria de código;
- construcción insegura de comandos;
- subida de archivos ejecutables;
- endpoints administrativos peligrosos.

Si el sistema necesita ejecutar procesos del sistema operativo, utilizar:

- allowlists;
- argumentos separados;
- permisos mínimos;
- usuarios sin privilegios;
- timeouts;
- sandboxing cuando corresponda.

---

# 21. Stored XSS

Proteger los datos almacenados que posteriormente se muestran en pantalla.

Ejemplo peligroso:

```text
Usuario guarda HTML malicioso
        ↓
Base de datos
        ↓
Frontend
        ↓
Se ejecuta JavaScript
```

Evitar esto mediante:

- escaping;
- sanitización;
- CSP;
- validación;
- evitar HTML arbitrario.

---

# 22. Path Traversal

Proteger las operaciones de archivos contra ataques como:

```text
../../../../archivo
```

Nunca confiar en nombres o rutas proporcionados por usuarios.

Utilizar:

- rutas controladas;
- nombres generados por el servidor;
- validación;
- allowlists;
- directorios aislados.

---

# 23. Malware Hosting

Si la aplicación permite subir archivos:

- validar extensión;
- validar MIME;
- limitar tamaño;
- generar nombre aleatorio;
- impedir ejecución;
- almacenar fuera del web root;
- considerar análisis antivirus;
- controlar quién puede acceder al archivo.

Si el proyecto no necesita subir archivos, **no agreguen un sistema de uploads innecesario**.

---

# 24. Variables de entorno y secretos

Nunca guardar secretos en el código.

No subir:

```text
.env
```

a GitHub.

Utilizar:

```text
.env
.env.example
```

Ejemplo:

```env
DATABASE_URL=
JWT_SECRET=
API_KEY=
```

`.env.example` debe contener solamente nombres de variables y valores de ejemplo no sensibles.

### Importante sobre React

Las variables que llegan al frontend **no son secretos**.

Todo lo que se incluya en el bundle del navegador puede ser inspeccionado por el usuario.

Nunca colocar:

- passwords;
- API keys privadas;
- secretos JWT;
- credenciales de DB.

en variables públicas del frontend.

---

# 25. Logging y auditoría

El sistema debe registrar eventos importantes.

Ejemplos:

- login exitoso;
- login fallido;
- logout;
- cambios de usuarios;
- cambios administrativos;
- eliminación de información;
- cambios de configuración;
- errores;
- eventos de seguridad.

Nunca registrar:

- passwords;
- tokens;
- claves privadas;
- secretos.

Implementar logs estructurados cuando sea posible.

---

# 26. Monitoreo

El sistema debe poder detectar problemas.

Considerar:

- logs;
- métricas;
- health checks;
- errores;
- tiempos de respuesta;
- disponibilidad.

Como mejora pueden utilizar:

- Sentry;
- Prometheus;
- Grafana;
- OpenTelemetry.

---

# 27. Cifrado de datos

Los datos sensibles deben protegerse.

Como mínimo:

### En tránsito

Utilizar:

```text
HTTPS / TLS
```

### En reposo

Analizar qué información requiere cifrado en la base de datos o en el almacenamiento.

Las contraseñas **no se cifran para luego descifrarlas**: se almacenan mediante hashing seguro.

---

# 28. Soft Delete

Las entidades importantes deberían implementar **Soft Delete / borrado lógico** cuando tenga sentido.

En lugar de:

```sql
DELETE FROM users WHERE id = 10;
```

puede utilizarse un campo:

```text
deleted_at
```

Por ejemplo:

```text
id: 10
name: Juan
deleted_at: 2026-09-21
```

El registro permanece disponible para auditoría o recuperación.

No todas las tablas necesariamente necesitan Soft Delete. La decisión debe justificarse.

---

# 29. Documentación de API

El backend debe estar documentado.

Utilizar:

- Swagger / OpenAPI;
- Redoc;
- u otra herramienta equivalente.

La documentación debe indicar:

- endpoint;
- método;
- parámetros;
- body;
- respuestas;
- códigos HTTP;
- autenticación;
- errores;
- ejemplos.

---

# 30. Contratos de API y tipos End-to-End

El frontend y backend deben compartir contratos claros.

Por ejemplo:

```text
Frontend
    ↓
POST /api/users
    ↓
Backend
```

Debe existir una definición clara de:

```text
Request
Response
Error
```

Evitar que frontend y backend manejen estructuras diferentes.

Cuando sea posible, utilizar:

- OpenAPI;
- generación de tipos;
- schemas compartidos;
- validación automática.

Esto permite reducir errores de integración.

---

# 31. Estado del Frontend

Definir una estrategia para manejar:

- usuario autenticado;
- datos de la aplicación;
- loading;
- errores;
- cache;
- solicitudes pendientes;
- estado de formularios.

Elegir una solución acorde al tamaño del proyecto.

No agregar Redux u otra herramienta compleja si no existe una necesidad real.

---

# 32. Manejo de errores de red

El frontend debe contemplar:

- servidor caído;
- timeout;
- error 400;
- error 401;
- error 403;
- error 404;
- error 409;
- error 429;
- error 500;
- pérdida de conexión.

Los mensajes deben ser comprensibles para el usuario.

No mostrar:

```text
TypeError: Cannot read properties of undefined...
```

como mensaje principal al usuario.

---

# 33. Paginación

### Regla obligatoria

Siempre que existan listas potencialmente grandes, implementar paginación.

No hacer:

```text
GET /users
```

y devolver 500.000 registros.

Utilizar paginación en el servidor.

Ejemplo:

```text
GET /users?page=1&limit=20
```

El backend debe devolver información como:

```json
{
  "data": [],
  "page": 1,
  "limit": 20,
  "total": 500,
  "totalPages": 25
}
```

La paginación debe estar optimizada tanto en:

- backend;
- base de datos;
- frontend.

---

# 34. Buscadores y filtros

Cuando una pantalla tenga listas, implementar buscadores y filtros cuando sean aplicables.

Ejemplo:

```text
Usuarios

[ Buscar usuario................ ]

Rol: [ Todos ▼ ]
Estado: [ Activos ▼ ]

--------------------------------
Juan
Pedro
María
...
```

El filtrado debe realizarse en el servidor cuando el volumen de datos lo requiera.

No descargar todos los registros para luego filtrarlos en React.

---

# 35. Git y GitHub

El proyecto deberá utilizar:

- Git;
- GitHub.

Cada integrante debe trabajar con control de versiones.

## Commits

Los commits deben:

- ser pequeños;
- representar cambios concretos;
- tener mensajes claros;
- estar escritos en español.

Ejemplos:

```text
feat: agregar autenticación de usuarios
feat: implementar cálculo de rutas
fix: corregir validación del formulario
fix: solucionar error de paginación
test: agregar pruebas del servicio de usuarios
docs: actualizar documentación de API
refactor: separar lógica del repositorio
security: agregar rate limiting al login
```

### Importante

**No agregar a la IA como coautora del commit.**

La IA es una herramienta utilizada durante el desarrollo; los integrantes del equipo son responsables del código.

---

# 36. Estrategia de ramas

Pueden utilizar:

### GitHub Flow

```text
main
  │
  ├── feature/login
  ├── feature/rutas
  ├── feature/dashboard
  └── fix/paginacion
```

o un Git Flow simplificado.

Cada feature debe desarrollarse en una rama y luego integrarse mediante Pull Request.

---

# 37. Docker

El proyecto deberá poder ejecutarse localmente utilizando Docker.

La estructura recomendada es:

```text
proyecto/
│
├── frontend/
│   ├── Dockerfile
│   └── ...
│
├── backend/
│   ├── Dockerfile
│   └── ...
│
├── docker-compose.yml
└── README.md
```

## Regla de oro

**Frontend y Backend deben estar separados.**

Cada uno debe tener su propio:

```text
Dockerfile
```

y fuera de ambos debe existir:

```text
docker-compose.yml
```

El `docker-compose.yml` será responsable de levantar los servicios.

Ejemplo conceptual:

```text
docker-compose
      │
      ├── frontend
      │
      ├── backend
      │
      └── database
```

---

# 38. IA local — Opcional

Si desean ejecutar modelos de IA localmente pueden utilizar:

- llama.cpp — más liviano.
- Ollama — más sencillo de utilizar, pero con mayor infraestructura.

Es opcional.

No es necesario ejecutar IA local para aprobar el proyecto.

---

# 39. Deploy — Recomendado

Como mejora, se recomienda desplegar la aplicación en Internet.

Pueden investigar opciones gratuitas o con free tier, por ejemplo:

- Render
- Vercel
- u otras alternativas

El objetivo es poder compartir una URL funcional.

El despliegue debe documentarse.

---

# 40. Inteligencia Artificial dentro de la aplicación — Opcional

Como funcionalidad adicional, pueden incorporar IA dentro de su propio sistema.

Algunas posibilidades:

### Chatbot contextual

Un chatbot que conozca el contexto de la aplicación.

Por ejemplo:

> "¿Cómo puedo registrar un nuevo producto?"

El chatbot podría orientar al usuario utilizando información de la propia aplicación.

### Recomendaciones

La IA puede analizar información y realizar recomendaciones.

Ejemplo:

```text
Según los datos registrados,
se recomienda...
```

### Acciones mediante lenguaje natural

Por ejemplo:

> "Registrá una venta de 5 unidades del producto X."

El sistema podría interpretar la solicitud y ejecutar una acción, siempre aplicando:

- autenticación;
- autorización;
- validación;
- confirmación cuando sea necesario;
- auditoría.

### Reconocimiento facial

Otra posibilidad es implementar autenticación mediante reconocimiento facial.

**Importante:** esta funcionalidad implica riesgos importantes de privacidad y seguridad. Si la utilizan, deberán documentar el tratamiento de datos biométricos, consentimiento, almacenamiento, protección y alternativas de autenticación.

---

# 41. Buenas prácticas de rendimiento

La aplicación debe buscar un buen rendimiento desde el diseño.

Considerar:

- paginación;
- índices de base de datos;
- consultas eficientes;
- caching cuando corresponda;
- lazy loading;
- code splitting;
- compresión;
- imágenes optimizadas;
- evitar renders innecesarios;
- evitar consultas duplicadas;
- connection pooling;
- timeouts.

No optimizar prematuramente. Primero identificar los cuellos de botella.

---

# 42. Testing

Los tests unitarios son obligatorios.

Se recomienda cubrir:

- servicios;
- funciones importantes;
- validaciones;
- reglas de negocio;
- algoritmos;
- componentes críticos.

También se recomienda implementar:

- tests de integración;
- tests de API;
- tests end-to-end.

Ejemplo:

```text
Código
  ↓
Test unitario
  ↓
Test de integración
  ↓
Test E2E
```

---

# 43. Gestión del proyecto — Trello

Se recomienda utilizar Trello por su simplicidad.

Crear columnas como:

```text
BACKLOG
    ↓
TODO
    ↓
EN DESARROLLO
    ↓
CODE REVIEW
    ↓
TESTING
    ↓
DONE
```

Cada tarjeta debería indicar:

- tarea;
- responsable;
- descripción;
- criterios de aceptación;
- prioridad;
- estado.

---

# 44. SKILLS para trabajar con IA

Si utilizan agentes de IA, pueden definir **SKILLS** para que el agente sepa cómo realizar determinadas tareas.

Ejemplos:

```text
SKILL: Frontend React

Objetivo:
Desarrollar interfaces React siguiendo las convenciones del proyecto.

Debe:
- utilizar componentes reutilizables;
- respetar responsive design;
- manejar loading;
- manejar errores;
- utilizar validación;
- mantener accesibilidad;
- evitar duplicación.
```

Otra:

```text
SKILL: Backend Security

Objetivo:
Implementar funcionalidades backend siguiendo las políticas de seguridad.

Debe:
- validar entradas;
- proteger endpoints;
- verificar autorización;
- utilizar rate limiting;
- evitar exposición de secretos;
- registrar eventos relevantes;
- no devolver información sensible.
```

Las SKILLS deben ser reutilizables y estar documentadas.

---

# 45. TASKS para agentes de IA

Las funcionalidades deben dividirse en TASKS.

Ejemplo:

```text
TASK-001
Inicializar frontend React

TASK-002
Inicializar backend

TASK-003
Configurar Docker

TASK-004
Configurar base de datos

TASK-005
Implementar autenticación

TASK-006
Implementar autorización

TASK-007
Crear CRUD de usuarios

TASK-008
Implementar paginación

TASK-009
Implementar buscador

TASK-010
Implementar funcionalidad principal

TASK-011
Agregar tests

TASK-012
Implementar seguridad

TASK-013
Documentar API

TASK-014
Deploy
```

Cada TASK debe tener:

- objetivo;
- contexto;
- SKILLS requeridas;
- dependencias;
- implementación;
- criterios de aceptación;
- tests;
- documentación.

---

# 46. Definition of Done

Una TASK no está terminada simplemente porque "funciona".

Debe cumplir:

- [ ] Funcionalidad implementada.
- [ ] Código revisado.
- [ ] Validaciones implementadas.
- [ ] Seguridad revisada.
- [ ] Tests implementados.
- [ ] Tests ejecutados correctamente.
- [ ] Lint sin errores.
- [ ] Typecheck sin errores cuando corresponda.
- [ ] Documentación actualizada.
- [ ] No existen secretos en el código.
- [ ] Commit realizado.
- [ ] Pull Request revisado.
- [ ] Integración realizada.

---

# 47. Reglas de oro del proyecto

Estas reglas son obligatorias salvo que exista una justificación técnica documentada.

### 1. Separación Frontend / Backend

Siempre:

```text
frontend/
backend/
docker-compose.yml
```

Cada aplicación tendrá su propio Dockerfile.

---

### 2. Paginación

Toda lista que pueda crecer significativamente debe utilizar paginación optimizada.

La paginación debe realizarse en el servidor.

---

### 3. Buscadores y filtros

Las listas deben incorporar búsqueda y filtros cuando sean aplicables.

Los filtros deben ejecutarse en el servidor cuando el volumen de datos lo justifique.

---

### 4. Testing

Implementar tests unitarios obligatoriamente.

---

### 5. Commits

Realizar commits por feature o cambio significativo.

Los mensajes deben estar en español.

No agregar la IA como coautora.

---

### 6. Segundo factor

Implementar 2FA utilizando Google Authenticator, TOTP u otra solución equivalente.

---

### 7. UX

No utilizar `alert()` de JavaScript.

Utilizar:

- modals;
- dialogs;
- toast;
- snackbar;
- notificaciones.

---

### 8. Responsive

Nada debe desbordarse.

La aplicación debe funcionar correctamente en diferentes tamaños de pantalla.

---

### 9. Seguridad Backend

Proteger todas las rutas que lo requieran.

Nunca devolver información sensible.

Los errores mostrados al usuario deben ser amigables.

---

### 10. Documentación

El backend debe contar con documentación de API.

Utilizar Swagger/OpenAPI o una herramienta equivalente.

---

### 11. Contratos

Mantener contratos claros entre frontend y backend.

---

### 12. Estado

Definir una estrategia clara para el manejo de estado del frontend.

---

### 13. Variables de entorno

Nunca almacenar secretos en el repositorio.

---

### 14. Soft Delete

Utilizar borrado lógico cuando corresponda.

---

### 15. Microservicios

Si utilizan microservicios:

- utilizar connection pools;
- controlar conexiones;
- implementar timeouts;
- manejar errores de comunicación;
- evitar crear servicios innecesarios.

---

# 48. Entrega mínima esperada

Para considerar completo el proyecto deberá existir:

```text
✓ Frontend React
✓ Backend/API
✓ Base de datos
✓ Docker
✓ docker-compose
✓ Autenticación
✓ Autorización
✓ 2FA
✓ Seguridad
✓ Validación
✓ Rate Limiting
✓ CORS
✓ Security Headers
✓ Logging
✓ Auditoría
✓ Soft Delete cuando corresponda
✓ Paginación
✓ Búsqueda y filtros
✓ Tests unitarios
✓ Documentación de API
✓ Git
✓ GitHub
✓ Trello
✓ SDD
✓ Documentación técnica
```

---

# 49. Funcionalidades que suman puntos

Además de cumplir los requisitos obligatorios, pueden agregar funcionalidades que aporten valor.

Por ejemplo:

- Deploy online.
- IA integrada.
- Chatbot.
- Recomendaciones.
- Reconocimiento facial.
- Notificaciones.
- Dashboard.
- Métricas.
- Exportación de datos.
- Integración con servicios externos.
- Sistema de auditoría avanzado.
- Observabilidad.
- CI/CD.
- Tests E2E.
- OpenTelemetry.
- Aplicación móvil o PWA.

La funcionalidad adicional debe estar correctamente integrada y documentada.

**No se obtienen puntos simplemente por agregar muchas tecnologías.**

Una funcionalidad pequeña, bien diseñada, segura, testeada y documentada aporta más valor que muchas funcionalidades incompletas.

---

# 50. Checklist final

Antes de entregar, verificar:

## Análisis

- [ ] Problema correctamente comprendido.
- [ ] Requisitos documentados.
- [ ] Reglas de negocio identificadas.
- [ ] Casos extremos identificados.

## Arquitectura

- [ ] Arquitectura seleccionada.
- [ ] Arquitectura justificada.
- [ ] Frontend y backend separados.
- [ ] Patrón de diseño implementado.

## Frontend

- [ ] ReactJS.
- [ ] UI consistente.
- [ ] Responsive.
- [ ] Sin `alert()`.
- [ ] Manejo de errores.
- [ ] Manejo de estado.
- [ ] Animaciones/transiciones cuando correspondan.
- [ ] Paginación.
- [ ] Búsqueda/filtros.

## Backend

- [ ] API documentada.
- [ ] Validación.
- [ ] Autenticación.
- [ ] Autorización.
- [ ] 2FA.
- [ ] Rate limiting.
- [ ] CORS.
- [ ] Security headers.
- [ ] Manejo seguro de errores.
- [ ] Logging.
- [ ] Auditoría.

## Base de datos

- [ ] Modelo correctamente diseñado.
- [ ] Índices.
- [ ] Relaciones.
- [ ] Restricciones.
- [ ] Soft Delete cuando corresponda.
- [ ] Connection pooling cuando corresponda.

## Seguridad

- [ ] SQL Injection.
- [ ] NoSQL Injection cuando corresponda.
- [ ] XSS.
- [ ] Stored XSS.
- [ ] CSRF cuando corresponda.
- [ ] Path Traversal.
- [ ] RCE.
- [ ] Malware Upload.
- [ ] Secretos protegidos.
- [ ] HTTPS.
- [ ] Control de acceso.
- [ ] Auditoría.

## Testing

- [ ] Tests unitarios.
- [ ] Tests de integración cuando corresponda.
- [ ] Tests de API.
- [ ] Casos extremos.
- [ ] Tests de seguridad básicos.

## DevOps

- [ ] Dockerfile frontend.
- [ ] Dockerfile backend.
- [ ] docker-compose.
- [ ] Variables de entorno.
- [ ] Health checks.
- [ ] Deploy documentado si corresponde.

## Gestión

- [ ] Trello actualizado.
- [ ] GitHub actualizado.
- [ ] Commits en español.
- [ ] Ramas correctamente utilizadas.
- [ ] Pull Requests revisados.

## Documentación

- [ ] README.
- [ ] SDD.
- [ ] Arquitectura.
- [ ] Base de datos.
- [ ] API.
- [ ] Seguridad.
- [ ] Instalación.
- [ ] Docker.
- [ ] Variables de entorno.
- [ ] Instrucciones de ejecución.

---

# 51. Principio final

El objetivo de este proyecto **no es demostrar cuánto código pueden generar utilizando IA**.

El objetivo es demostrar que pueden:

> **analizar un problema, diseñar una solución, utilizar IA de forma responsable, implementar software seguro, trabajar colaborativamente, probarlo, documentarlo y justificar las decisiones técnicas tomadas.**

La IA puede escribir código.

El equipo debe ser capaz de **entender, revisar, probar, corregir y defender técnicamente ese código**.

Por eso, ante cada decisión importante, deben poder responder:

1. ¿Por qué lo hicimos así?
2. ¿Qué problema resuelve?
3. ¿Qué alternativas evaluamos?
4. ¿Qué riesgos tiene?
5. ¿Cómo lo probamos?
6. ¿Cómo lo protegemos?
7. ¿Cómo lo mantenemos?
