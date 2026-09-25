# Registro Exhaustivo de Tareas y Tablero Jira — CiberGuardián

**Proyecto:** FormosaHack 2026 — Competencia de 24 Horas  
**Clave Jira:** `FH26` (Formosa Hack 2026)  
**URL del Tablero:** [https://gabrielp2806.atlassian.net/jira/software/projects/FH26/boards](https://gabrielp2806.atlassian.net/jira/software/projects/FH26/boards)  
**Sprint Activo:** `Sprint 1 - MVP (16:30-19:30)` (ID: `117`) — Estado: `ACTIVE` 🟢  
**Horario del Sprint 1:** Hoy 24/09 de 16:30 hs a 19:30 hs (Timebox: 3 Horas)  
**Sprint Goal Oficial:**  
> *"Desplegar el MVP funcional de CiberGuardián con el flujo completo de los 3 momentos activo para la evaluación preliminar (Chatbot con semáforo, Auxilio SOS y Radar Comunitario)."*

---

## 📊 Métricas Vivas del Sprint 1
* **Capacidad Total del Sprint:** 50 Story Points
* **Story Points Completados:** **24 SP (Listo ✅)** — *40% de avance inicial demostrable ante los jueces*
 * **Story Points Pendientes:** **26 SP (Por hacer ⏳)** — *Asignados a las duplas para las próximas horas*
* **Estructura Jerárquica:** 5 Épicas → 9 Historias de Usuario BDD → 18 Subtareas Técnicas

---

## 🏛️ Épicas del Tablero Jira

| Clave | Nombre de la Épica | Objetivo Macro en el Hackatón |
| :--- | :--- | :--- |
| **FH26-1** | `[EPIC-1]` Plataforma Segura, Resiliencia y Arquitectura Base | Arquitectura de microservicios con FastAPI, Docker Compose, CI/CD, 2FA TOTP y Rate Limiting. |
| **FH26-2** | `[EPIC-2]` Asistente Virtual y Detección de Manipulación Psicológica | Chatbot en tiempo real, semáforo de riesgo (Verde/Amarillo/Rojo), desglose de trampas y consulta familiar. |
| **FH26-3** | `[EPIC-3]` Módulo de Reacción y Contención Post-Incidente | Botón de pánico SOS, llamadas 1-tap directas a Banco Formosa/Red Link y Ficha de Denuncia Digital. |
| **FH26-4** | `[EPIC-4]` Radar Comunitario de Amenazas y Alerta de Brotes | Feed paginado con Soft Delete, detección de picos de estafas (spikes) y votos solidarios. |
| **FH26-5** | `[EPIC-5]` Accesibilidad Universal, Integración Móvil y Demostración | Modo Protector Mayor XL, PWA Web Share Target desde WhatsApp y Pitch de victoria ante el jurado. |

---

## 👥 Historias de Usuario (BDD / Gherkin) y sus Subtareas Técnicas

### 🔹 FH26-13: [US-08] Seguridad perimetral, 2FA TOTP y arquitectura de microservicios
* **Épica Padre:** `FH26-1` | **Story Points:** 8 SP | **Estado:** `Listo` ✅
* **Enunciado Ágil:**  
  *Como oficial de seguridad o administrador de CiberGuardián, quiero contar con autenticación de dos factores (2FA TOTP), rate limiting perimetral y microservicios con soft delete, para proteger la plataforma contra ataques de fuerza bruta y pérdida de datos.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado un administrador autenticado, cuando ingresa el código de 6 dígitos de Google Authenticator, entonces el sistema valida con pyotp y emite el JWT de sesión.*
  * **Escenario 2:** *Dado un cliente intentando más de 5 peticiones por minuto en login, cuando excede el límite, entonces el Gateway responde HTTP 429 Too Many Requests.*
* **Subtareas Técnicas Anidadas:**
  * ✅ **`FH26-34`** — `[TASK-001]` `[Equipo Completo]` Definición del SDD y Arquitectura de CiberGuardián (3 SP) — `Listo`
  * ✅ **`FH26-35`** — `[TASK-002]` `[Gabriel]` Infraestructura Docker Compose y CI/CD en Servidor (5 SP) — `Listo`
  * ✅ **`FH26-36`** — `[TASK-003]` `[Gabriel]` Auth Service Base (JWT, Hashing bcrypt, RBAC) (3 SP) — `Listo`
  * ✅ **`FH26-37`** — `[TASK-004]` `[Gabriel]` Segundo Factor 2FA TOTP (Google Authenticator) (3 SP) — `Listo`
  * ✅ **`FH26-38`** — `[TASK-005]` `[Gabriel]` Rate Limiting (SlowAPI) y Security Headers (2 SP) — `Listo`
  * ✅ **`FH26-39`** — `[TASK-017]` `[Gabriel]` Pruebas Unitarias (pytest) y Documentación Swagger (3 SP) — `Listo`

---

### 🔹 FH26-6: [US-01] Análisis conversacional de mensajes y detección de trampas psicológicas
* **Épica Padre:** `FH26-2` | **Story Points:** 8 SP | **Estado:** `En curso` ⏳
* **Enunciado Ágil:**  
  *Como ciudadano ante un mensaje sospechoso, quiero pegar el texto en el asistente CiberGuardián, para obtener un diagnóstico inmediato de riesgo y comprender qué partes del mensaje son manipulaciones psicológicas.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado un mensaje de WhatsApp con frases de urgencia y enlaces dudosos, cuando el usuario lo envía al asistente, entonces el sistema clasifica el riesgo como ALTO (semáforo rojo), resalta las frases de urgencia y advierte sobre el dominio no oficial.*
  * **Escenario 2:** *Dado un resultado de riesgo medio o alto, cuando se visualiza la respuesta, entonces se muestran recomendaciones directas ("No transfieras", "No des tu clave token").*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`FH26-40`** — `[TASK-010]` `[Matías]` Interfaz del Chatbot CiberGuardián (React + Tailwind) (5 SP) — `Por hacer`
  * ⏳ **`FH26-41`** — `[TASK-011]` `[Matías]` Resaltado Interactivo de Frases Engañosas (3 SP) — `Por hacer`

---

### 🔹 FH26-7: [US-02] Botón de consulta rápida a familiar por WhatsApp (wa.me)
* **Épica Padre:** `FH26-2` | **Story Points:** 3 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como persona en situación de duda ante un posible fraude, quiero presionar un botón para reenviar el diagnóstico del asistente a un familiar por WhatsApp, para obtener una segunda opinión sin sentir culpa ni vergüenza.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado que el usuario completó un análisis, cuando presiona "Consultar con un familiar", entonces se abre wa.me/?text=... con el resumen preformateado y una pregunta empática.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`FH26-42`** — `[TASK-012]` `[Matías]` Botón de Consulta a Familiar por WhatsApp (wa.me) (2 SP) — `Por hacer`

---

### 🔹 FH26-8: [US-03] Botón de pánico SOS y llamada 1-tap a entidades oficiales
* **Épica Padre:** `FH26-3` | **Story Points:** 5 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como víctima de una estafa activa o hackeo bancario, quiero presionar un botón de emergencia SOS para llamar directamente a los números oficiales de bloqueo, para congelar tarjetas y cuentas antes de que vacíen los fondos.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado que el usuario abre el modal de Emergencia SOS, cuando pulsa sobre Banco Formosa, Red Link o Banelco, entonces se activa el enlace tel: oficial sin intermediarios.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`FH26-43`** — `[TASK-013]` `[Valeria]` Botón de Pánico SOS y Llamada 1-Tap a Bancos (3 SP) — `Por hacer`

---

### 🔹 FH26-9: [US-04] Generador guiado de Ficha de Denuncia Digital
* **Épica Padre:** `FH26-3` | **Story Points:** 5 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como ciudadano que sufrió una estafa consumada, quiero completar un formulario paso a paso con los datos del estafador (CBU/CVU, alias, teléfono, enlaces), para descargar una ficha estructurada lista para radicar la denuncia en la Policía Informática o Fiscalía.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado que el usuario ingresa monto, CBU y canal, cuando presiona "Generar Ficha de Denuncia", entonces el sistema emite un documento formateado con fecha, hora y evidencia.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`FH26-44`** — `[TASK-014]` `[Valeria]` Generador de Ficha de Denuncia Digital Descargable (5 SP) — `Por hacer`

---

### 🔹 FH26-10: [US-05] Radar comunitario de amenazas y botón 'A mí también me llegó'
* **Épica Padre:** `FH26-4` | **Story Points:** 8 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como usuario de la comunidad digital, quiero visualizar las amenazas reportadas recientemente filtradas por entidad simulada y vector de ataque, para identificar fraudes vigentes y marcar "A mí también me llegó" acumulando votos que activen alertas de brote.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado un feed de incidentes en el backend, cuando el usuario filtra por entidad o vector, entonces el servidor retorna la página solicitada con conteo y estado de brote.*
  * **Escenario 2:** *Dado un incidente en el radar, cuando el usuario pulsa "A mí también me llegó", entonces el endpoint incrementa votos atómicamente y actualiza la tarjeta.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`FH26-45`** — `[TASK-006]` `[Maxi]` Modelado de Incidentes y Reportes con Soft Delete (3 SP) — `Por hacer`
  * ✅ **`FH26-46`** — `[TASK-007]` `[Maxi]` Repository Pattern en Core Service (Router->Service->Repo) (3 SP) — `Listo`
  * ✅ **`FH26-47`** — `[TASK-008]` `[Maxi]` Endpoints de Radar Paginado en Servidor y Filtros (5 SP) — `Listo`
  * ⏳ **`FH26-48`** — `[TASK-009]` `[Maxi]` Seeder de Estafas Reales y Canales Verificados (2 SP) — `Por hacer`
  * ⏳ **`FH26-49`** — `[TASK-015]` `[Valeria]` Vista del Radar de Amenazas con "A mí también me llegó" (3 SP) — `Por hacer`

---

### 🔹 FH26-11: [US-06] Modo Protector Mayor con tipografía XL y alto contraste
* **Épica Padre:** `FH26-5` | **Story Points:** 3 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como adulto mayor o persona con dificultades visuales, quiero activar un switch de 'Modo Protector Mayor', para visualizar fuentes grandes y botones táctiles de máxima accesibilidad.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`FH26-50`** — `[TASK-016]` `[Valeria]` Modo Protector Mayor & PWA Web Share Target (5 SP) — `Por hacer`

---

### 🔹 FH26-12: [US-07] Recepción de mensajes compartidos vía PWA Web Share Target
* **Épica Padre:** `FH26-5` | **Story Points:** 5 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como usuario de WhatsApp en celular, quiero usar el botón nativo de "Compartir" hacia CiberGuardián, para evaluar el mensaje engañoso directamente sin copiar y pegar.*

---

### 🔹 FH26-33: [US-09] Demostración y Pitch en vivo ante el Jurado de FormosaHack
* **Épica Padre:** `FH26-5` | **Story Points:** 3 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como equipo competidor, quiero presentar un pitch estructurado de 3 minutos con un caso real de estafa en vivo, para convencer al jurado del impacto y robustez técnica de CiberGuardián.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`FH26-51`** — `[TASK-018]` `[Equipo Completo]` Guion de Pitch y Demostración en Vivo ante el Jurado (3 SP) — `Por hacer`

---

## 🎯 Asignación Oficial de Trabajo por Duplas (Sprint 1)
* **Dupla Backend (Gabriel Pineda + Maxi González):**
  * Maxi González: `FH26-48` (2 SP pendientes).
  * Gabriel Pineda: `FH26-39` (✅ Listo) + Integración y Soporte de Infraestructura.
* **Dupla Frontend (Matías + Valeria Budiño):**
  * Matías: `FH26-40`, `FH26-41`, `FH26-42` (10 SP pendientes).
  * Valeria Budiño: `FH26-43`, `FH26-44`, `FH26-49`, `FH26-50` (16 SP pendientes).
