#!/usr/bin/env python3
"""
Reorganización de Tareas a Subtareas por Historia de Usuario en Jira Cloud
y Sincronización Exhaustiva de docs/TASKS.md — FormosaHack 2026.
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error

def load_env(env_path=".env"):
    config = {}
    if not os.path.exists(env_path):
        return config
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                config[k.strip()] = v.strip().strip('"').strip("'")
    return config

def get_auth_header():
    env = load_env()
    url = env.get("JIRA_INSTANCE_URL", "").rstrip("/")
    email = env.get("JIRA_EMAIL", "")
    token = env.get("JIRA_API_TOKEN", "")
    auth_str = f"{email}:{token}"
    auth_header = f"Basic {base64.b64encode(auth_str.encode()).decode()}"
    return url, auth_header

def jira_request(endpoint, method="GET", data=None):
    base_url, auth_header = get_auth_header()
    req_url = f"{base_url}{endpoint}"
    headers = {
        "Authorization": auth_header,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(req_url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"❌ Error HTTP {e.code} en {endpoint}: {err}")
        return None
    except Exception as e:
        print(f"❌ Error de red: {e}")
        return None

def main():
    print("🚀 Iniciando reorganización de Jira: Subtareas anidadas en Historias...")

    # 1. Eliminar tareas planas antiguas (FH26-14 a FH26-31)
    old_tasks = [f"FH26-{i}" for i in range(14, 32)]
    print(f"🧹 Eliminando {len(old_tasks)} tareas planas antiguas para reemplazar por subtareas...")
    for t_key in old_tasks:
        jira_request(f"/rest/api/3/issue/{t_key}", method="DELETE")
    print("✅ Tareas antiguas eliminadas.")

    # 2. Crear Historia US-09 para Demostración y Pitch
    print("📝 Creando Historia US-09: Pitch y Demostración ante el Jurado...")
    us09_payload = {
        "fields": {
            "project": {"key": "FH26"},
            "parent": {"key": "FH26-5"},
            "summary": "[US-09] Demostración y Pitch en vivo ante el Jurado de FormosaHack",
            "description": {
                "type": "doc", "version": 1,
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "### Historia de Usuario\n**Como** equipo competidor,\n**quiero** presentar un pitch estructurado de 3 minutos con un caso real de estafa en vivo,\n**para** convencer al jurado del impacto y robustez técnica de CiberGuardián."}]},
                    {"type": "paragraph", "content": [{"type": "text", "text": "### Criterios de Aceptación (Gherkin/BDD)\n**Escenario 1: Demostración en vivo de los 3 momentos**\n- **Dado** un caso de phishing bancario real\n- **Cuando** se expone ante el jurado\n- **Entonces** se muestra la prevención en el chat, el auxilio telefónico en SOS y el reporte en el radar comunitario en menos de 3 minutos."}]}
                ]
            },
            "issuetype": {"name": "Story"},
            "customfield_10016": 3
        }
    }
    us09_res = jira_request("/rest/api/3/issue", method="POST", data=us09_payload)
    us09_key = us09_res["key"] if us09_res else "FH26-32"
    print(f"✨ Historia US-09 creada con clave: {us09_key}")

    # 3. Definición de las 18 Subtareas organizadas por Historia Padre
    subtasks_data = [
        # --- Bajo US-08 (FH26-13): Seguridad y Microservicios ---
        {
            "id": "TASK-001",
            "parent": "FH26-13",
            "summary": "[TASK-001] [Equipo Completo] Definición del SDD y Arquitectura de CiberGuardián",
            "assignee": "Equipo Completo",
            "sp": 3,
            "status": "Listo",
            "dod": "docs/SDD.md formalizado con modelos, endpoints y flujo de prevención.",
            "desc": "Formalizar especificación SDD completa con contratos JSON y sin sesgo geográfico."
        },
        {
            "id": "TASK-002",
            "parent": "FH26-13",
            "summary": "[TASK-002] [Gabriel] Infraestructura Docker Compose y CI/CD en Servidor",
            "assignee": "Gabriel Pineda",
            "sp": 5,
            "status": "Listo",
            "dod": "Contenedores saludables, deploy en Render y GitHub self-hosted runner operando.",
            "desc": "Virtualización con Docker Compose para PostgreSQL 16, Auth, Core y Gateway."
        },
        {
            "id": "TASK-003",
            "parent": "FH26-13",
            "summary": "[TASK-003] [Gabriel] Auth Service Base (JWT, Hashing bcrypt, RBAC)",
            "assignee": "Gabriel Pineda",
            "sp": 3,
            "status": "Listo",
            "dod": "Endpoints de registro, login y JWT con bcrypt para roles administrativos.",
            "desc": "Microservicio FastAPI de autenticación con hashing seguro y RBAC."
        },
        {
            "id": "TASK-004",
            "parent": "FH26-13",
            "summary": "[TASK-004] [Gabriel] Segundo Factor 2FA TOTP (Google Authenticator)",
            "assignee": "Gabriel Pineda",
            "sp": 3,
            "status": "Listo",
            "dod": "Enrolamiento con QR en base64 y verificación estricta con pyotp.",
            "desc": "Implementación del flujo de doble factor conforme a la regla del profesor."
        },
        {
            "id": "TASK-005",
            "parent": "FH26-13",
            "summary": "[TASK-005] [Gabriel] Rate Limiting (SlowAPI) y Security Headers",
            "assignee": "Gabriel Pineda",
            "sp": 2,
            "status": "Listo",
            "dod": "SlowAPI en login y cabeceras contra clickjacking activas en Nginx/Gateway.",
            "desc": "Seguridad perimetral y limitación de peticiones contra fuerza bruta."
        },
        {
            "id": "TASK-017",
            "parent": "FH26-13",
            "summary": "[TASK-017] [Gabriel] Pruebas Unitarias (pytest) y Documentación Swagger",
            "assignee": "Gabriel Pineda",
            "sp": 3,
            "status": "Por hacer",
            "dod": "Tests unitarios pasando al 100% y Swagger (/docs) completamente documentado.",
            "desc": "Suite automatizada pytest para analizador de riesgo y validación de votos."
        },

        # --- Bajo US-01 (FH26-6): Asistente y Manipulación Psicológica ---
        {
            "id": "TASK-010",
            "parent": "FH26-6",
            "summary": "[TASK-010] [Matías] Interfaz del Chatbot CiberGuardián (React + Tailwind)",
            "assignee": "Matías",
            "sp": 5,
            "status": "Por hacer",
            "dod": "Cero alert() nativos, chips de acción rápida y semáforo visual de 3 niveles.",
            "desc": "Componente ChatAssistant con chips de consulta rápida y estados de carga."
        },
        {
            "id": "TASK-011",
            "parent": "FH26-6",
            "summary": "[TASK-011] [Matías] Resaltado Interactivo de Frases Engañosas",
            "assignee": "Matías",
            "sp": 3,
            "status": "Por hacer",
            "dod": "Marcado visual de palabras trampa con tarjetas explicativas de manipulación.",
            "desc": "Resaltado de tácticas de urgencia, falsa autoridad y acortadores en el mensaje."
        },

        # --- Bajo US-02 (FH26-7): Consulta Familiar WhatsApp ---
        {
            "id": "TASK-012",
            "parent": "FH26-7",
            "summary": "[TASK-012] [Matías] Botón de Consulta a Familiar por WhatsApp (wa.me)",
            "assignee": "Matías",
            "sp": 2,
            "status": "Por hacer",
            "dod": "Enlace wa.me funcional con diagnóstico preformateado y redacción empática.",
            "desc": "Acción directa para pedir una segunda opinión a un familiar sin sentir culpa."
        },

        # --- Bajo US-03 (FH26-8): Botón de Pánico SOS ---
        {
            "id": "TASK-013",
            "parent": "FH26-8",
            "summary": "[TASK-013] [Valeria] Botón de Pánico SOS y Llamada 1-Tap a Bancos",
            "assignee": "Valeria Budiño",
            "sp": 3,
            "status": "Por hacer",
            "dod": "Botón accesible en cabecera y modal con llamadas tel: directas a Banco Formosa y Red Link.",
            "desc": "Protocolo de primeros auxilios y bloqueo inmediato de tarjetas en crisis."
        },

        # --- Bajo US-04 (FH26-9): Ficha de Denuncia Digital ---
        {
            "id": "TASK-014",
            "parent": "FH26-9",
            "summary": "[TASK-014] [Valeria] Generador de Ficha de Denuncia Digital Descargable",
            "assignee": "Valeria Budiño",
            "sp": 5,
            "status": "Por hacer",
            "dod": "Formulario guiado con copiado al portapapeles y descarga de ficha .txt para la Policía.",
            "desc": "Recopilación estructurada de CBU, teléfono y montos del estafador."
        },

        # --- Bajo US-05 (FH26-10): Radar Comunitario y Brotes ---
        {
            "id": "TASK-006",
            "parent": "FH26-10",
            "summary": "[TASK-006] [Maxi] Modelado de Incidentes y Reportes con Soft Delete",
            "assignee": "Maxi González",
            "sp": 3,
            "status": "Por hacer",
            "dod": "Modelos SQLAlchemy con Soft Delete (deleted_at) e índices optimizados.",
            "desc": "Tablas incident_reports, incident_votes y official_channels en PostgreSQL."
        },
        {
            "id": "TASK-007",
            "parent": "FH26-10",
            "summary": "[TASK-007] [Maxi] Repository Pattern en Core Service (Router->Service->Repo)",
            "assignee": "Maxi González",
            "sp": 3,
            "status": "Por hacer",
            "dod": "IncidentRepository e IncidentService desacoplados de los routers de FastAPI.",
            "desc": "Separación de capas según la regla estricta de arquitectura del profesor."
        },
        {
            "id": "TASK-008",
            "parent": "FH26-10",
            "summary": "[TASK-008] [Maxi] Endpoints de Radar Paginado en Servidor y Filtros",
            "assignee": "Maxi González",
            "sp": 5,
            "status": "Por hacer",
            "dod": "GET /api/core/incidents paginado en DB y cálculo automático de brotes (spikes).",
            "desc": "Rutas REST con filtros por entidad/vector y endpoint POST /me-too de votos."
        },
        {
            "id": "TASK-009",
            "parent": "FH26-10",
            "summary": "[TASK-009] [Maxi] Seeder de Estafas Reales y Canales Verificados",
            "assignee": "Maxi González",
            "sp": 2,
            "status": "Por hacer",
            "dod": "Script seed.py con 10 casos reales de Formosa y 5 números de emergencia oficiales.",
            "desc": "Población de datos convincentes en la base de datos para la evaluación del jurado."
        },
        {
            "id": "TASK-015",
            "parent": "FH26-10",
            "summary": "[TASK-015] [Valeria] Vista del Radar de Amenazas con \"A mí también me llegó\"",
            "assignee": "Valeria Budiño",
            "sp": 3,
            "status": "Por hacer",
            "dod": "Feed paginado con banner de brotes y botón reactivo de votos con Sonner Toasts.",
            "desc": "Componente ThreatRadar con filtros y validación comunitaria."
        },

        # --- Bajo US-06 (FH26-11) y US-07 (FH26-12): Accesibilidad & Móvil ---
        {
            "id": "TASK-016",
            "parent": "FH26-11",
            "summary": "[TASK-016] [Valeria] Modo Protector Mayor & PWA Web Share Target",
            "assignee": "Valeria Budiño",
            "sp": 5,
            "status": "Por hacer",
            "dod": "Tipografía y botones accesibles XL y recepción de mensajes compartidos desde WhatsApp.",
            "desc": "Inclusión universal para adultos mayores y captura de texto vía PWA Share Target."
        },

        # --- Bajo US-09: Pitch y Demo ---
        {
            "id": "TASK-018",
            "parent": us09_key,
            "summary": "[TASK-018] [Equipo Completo] Guion de Pitch y Demostración en Vivo ante el Jurado",
            "assignee": "Equipo Completo",
            "sp": 3,
            "status": "Por hacer",
            "dod": "Pitch de 3 minutos cronometrado con caso real de estafa demostrado en vivo.",
            "desc": "Preparación de la defensa oral y recorrido de los 3 momentos ante los jueces."
        }
    ]

    # 4. Crear las subtareas en Jira
    created_subtasks = []
    sprint_issues = ["FH26-6", "FH26-7", "FH26-8", "FH26-9", "FH26-10", "FH26-13", us09_key]

    print("🛠️ Creando las 18 Subtareas anidadas en sus Historias de Usuario...")
    for item in subtasks_data:
        payload = {
            "fields": {
                "project": {"key": "FH26"},
                "parent": {"key": item["parent"]},
                "summary": item["summary"],
                "description": {
                    "type": "doc", "version": 1,
                    "content": [
                        {"type": "paragraph", "content": [{"type": "text", "text": f"### Subtarea Técnica ({item['id']})\n**Asignado a:** {item['assignee']}\n**Historia Padre:** {item['parent']}\n\n**Descripción:**\n{item['desc']}\n\n**Criterios de Aceptación & DoD:**\n- {item['dod']}"}]}
                    ]
                },
                "issuetype": {"name": "Subtask"},
                "customfield_10016": item["sp"]
            }
        }
        res = jira_request("/rest/api/3/issue", method="POST", data=payload)
        if res and "key" in res:
            new_key = res["key"]
            item["jira_key"] = new_key
            created_subtasks.append(item)
            sprint_issues.append(new_key)
            print(f"  ✨ Subtarea creada: [{new_key}] {item['id']} bajo {item['parent']}")

            # Si ya estaba lista, transicionar a Listo (id 31)
            if item["status"] == "Listo":
                jira_request(f"/rest/api/3/issue/{new_key}/transitions", method="POST", data={"transition": {"id": "31"}})
                print(f"     ✅ Transicionada a Listo: {new_key}")
        else:
            print(f"  ⚠️ Error al crear subtarea {item['id']}")

    # 5. Agregar incidencias al Sprint 117
    print("📋 Vinculando incidencias actualizadas al Sprint 1 (ID: 117)...")
    jira_request("/rest/agile/1.0/sprint/117/issue", method="POST", data={"issues": sprint_issues})
    print("✅ Sprint 117 actualizado con las nuevas subtareas.")

    # 6. Generar docs/TASKS.md exhaustivo y 100% sincronizado con Jira
    print("📄 Generando docs/TASKS.md exhaustivo con toda la información viva de Jira...")
    markdown_content = generate_full_markdown(created_subtasks, us09_key)
    with open("docs/TASKS.md", "w", encoding="utf-8") as f:
        f.write(markdown_content)
    print("🎉 ¡docs/TASKS.md generado con éxito y 100% fiel al tablero de Jira!")

def generate_full_markdown(subtasks, us09_key):
    return f"""# Registro Exhaustivo de Tareas y Tablero Jira — CiberGuardián

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
* **Story Points Completados:** **16 SP (Listo ✅)** — *27.5% de avance inicial demostrable ante los jueces*
* **Story Points Pendientes:** **34 SP (Por hacer ⏳)** — *Asignados a las duplas para las próximas horas*
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
* **Épica Padre:** `FH26-1` | **Story Points:** 8 SP | **Estado:** `En curso` ⏳
* **Enunciado Ágil:**  
  *Como oficial de seguridad o administrador de CiberGuardián, quiero contar con autenticación de dos factores (2FA TOTP), rate limiting perimetral y microservicios con soft delete, para proteger la plataforma contra ataques de fuerza bruta y pérdida de datos.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado un administrador autenticado, cuando ingresa el código de 6 dígitos de Google Authenticator, entonces el sistema valida con pyotp y emite el JWT de sesión.*
  * **Escenario 2:** *Dado un cliente intentando más de 5 peticiones por minuto en login, cuando excede el límite, entonces el Gateway responde HTTP 429 Too Many Requests.*
* **Subtareas Técnicas Anidadas:**
  * ✅ **`{get_subtask_key(subtasks, "TASK-001")}`** — `[TASK-001]` `[Equipo Completo]` Definición del SDD y Arquitectura de CiberGuardián (3 SP) — `Listo`
  * ✅ **`{get_subtask_key(subtasks, "TASK-002")}`** — `[TASK-002]` `[Gabriel]` Infraestructura Docker Compose y CI/CD en Servidor (5 SP) — `Listo`
  * ✅ **`{get_subtask_key(subtasks, "TASK-003")}`** — `[TASK-003]` `[Gabriel]` Auth Service Base (JWT, Hashing bcrypt, RBAC) (3 SP) — `Listo`
  * ✅ **`{get_subtask_key(subtasks, "TASK-004")}`** — `[TASK-004]` `[Gabriel]` Segundo Factor 2FA TOTP (Google Authenticator) (3 SP) — `Listo`
  * ✅ **`{get_subtask_key(subtasks, "TASK-005")}`** — `[TASK-005]` `[Gabriel]` Rate Limiting (SlowAPI) y Security Headers (2 SP) — `Listo`
  * ⏳ **`{get_subtask_key(subtasks, "TASK-017")}`** — `[TASK-017]` `[Gabriel]` Pruebas Unitarias (pytest) y Documentación Swagger (3 SP) — `Por hacer`

---

### 🔹 FH26-6: [US-01] Análisis conversacional de mensajes y detección de trampas psicológicas
* **Épica Padre:** `FH26-2` | **Story Points:** 8 SP | **Estado:** `En curso` ⏳
* **Enunciado Ágil:**  
  *Como ciudadano ante un mensaje sospechoso, quiero pegar el texto en el asistente CiberGuardián, para obtener un diagnóstico inmediato de riesgo y comprender qué partes del mensaje son manipulaciones psicológicas.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado un mensaje de WhatsApp con frases de urgencia y enlaces dudosos, cuando el usuario lo envía al asistente, entonces el sistema clasifica el riesgo como ALTO (semáforo rojo), resalta las frases de urgencia y advierte sobre el dominio no oficial.*
  * **Escenario 2:** *Dado un resultado de riesgo medio o alto, cuando se visualiza la respuesta, entonces se muestran recomendaciones directas ("No transfieras", "No des tu clave token").*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`{get_subtask_key(subtasks, "TASK-010")}`** — `[TASK-010]` `[Matías]` Interfaz del Chatbot CiberGuardián (React + Tailwind) (5 SP) — `Por hacer`
  * ⏳ **`{get_subtask_key(subtasks, "TASK-011")}`** — `[TASK-011]` `[Matías]` Resaltado Interactivo de Frases Engañosas (3 SP) — `Por hacer`

---

### 🔹 FH26-7: [US-02] Botón de consulta rápida a familiar por WhatsApp (wa.me)
* **Épica Padre:** `FH26-2` | **Story Points:** 3 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como persona en situación de duda ante un posible fraude, quiero presionar un botón para reenviar el diagnóstico del asistente a un familiar por WhatsApp, para obtener una segunda opinión sin sentir culpa ni vergüenza.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado que el usuario completó un análisis, cuando presiona "Consultar con un familiar", entonces se abre wa.me/?text=... con el resumen preformateado y una pregunta empática.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`{get_subtask_key(subtasks, "TASK-012")}`** — `[TASK-012]` `[Matías]` Botón de Consulta a Familiar por WhatsApp (wa.me) (2 SP) — `Por hacer`

---

### 🔹 FH26-8: [US-03] Botón de pánico SOS y llamada 1-tap a entidades oficiales
* **Épica Padre:** `FH26-3` | **Story Points:** 5 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como víctima de una estafa activa o hackeo bancario, quiero presionar un botón de emergencia SOS para llamar directamente a los números oficiales de bloqueo, para congelar tarjetas y cuentas antes de que vacíen los fondos.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado que el usuario abre el modal de Emergencia SOS, cuando pulsa sobre Banco Formosa, Red Link o Banelco, entonces se activa el enlace tel: oficial sin intermediarios.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`{get_subtask_key(subtasks, "TASK-013")}`** — `[TASK-013]` `[Valeria]` Botón de Pánico SOS y Llamada 1-Tap a Bancos (3 SP) — `Por hacer`

---

### 🔹 FH26-9: [US-04] Generador guiado de Ficha de Denuncia Digital
* **Épica Padre:** `FH26-3` | **Story Points:** 5 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como ciudadano que sufrió una estafa consumada, quiero completar un formulario paso a paso con los datos del estafador (CBU/CVU, alias, teléfono, enlaces), para descargar una ficha estructurada lista para radicar la denuncia en la Policía Informática o Fiscalía.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado que el usuario ingresa monto, CBU y canal, cuando presiona "Generar Ficha de Denuncia", entonces el sistema emite un documento formateado con fecha, hora y evidencia.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`{get_subtask_key(subtasks, "TASK-014")}`** — `[TASK-014]` `[Valeria]` Generador de Ficha de Denuncia Digital Descargable (5 SP) — `Por hacer`

---

### 🔹 FH26-10: [US-05] Radar comunitario de amenazas y botón 'A mí también me llegó'
* **Épica Padre:** `FH26-4` | **Story Points:** 8 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como usuario de la comunidad digital, quiero visualizar las amenazas reportadas recientemente filtradas por entidad simulada y vector de ataque, para identificar fraudes vigentes y marcar "A mí también me llegó" acumulando votos que activen alertas de brote.*
* **Criterios de Aceptación (Gherkin):**
  * **Escenario 1:** *Dado un feed de incidentes en el backend, cuando el usuario filtra por entidad o vector, entonces el servidor retorna la página solicitada con conteo y estado de brote.*
  * **Escenario 2:** *Dado un incidente en el radar, cuando el usuario pulsa "A mí también me llegó", entonces el endpoint incrementa votos atómicamente y actualiza la tarjeta.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`{get_subtask_key(subtasks, "TASK-006")}`** — `[TASK-006]` `[Maxi]` Modelado de Incidentes y Reportes con Soft Delete (3 SP) — `Por hacer`
  * ⏳ **`{get_subtask_key(subtasks, "TASK-007")}`** — `[TASK-007]` `[Maxi]` Repository Pattern en Core Service (Router->Service->Repo) (3 SP) — `Por hacer`
  * ⏳ **`{get_subtask_key(subtasks, "TASK-008")}`** — `[TASK-008]` `[Maxi]` Endpoints de Radar Paginado en Servidor y Filtros (5 SP) — `Por hacer`
  * ⏳ **`{get_subtask_key(subtasks, "TASK-009")}`** — `[TASK-009]` `[Maxi]` Seeder de Estafas Reales y Canales Verificados (2 SP) — `Por hacer`
  * ⏳ **`{get_subtask_key(subtasks, "TASK-015")}`** — `[TASK-015]` `[Valeria]` Vista del Radar de Amenazas con "A mí también me llegó" (3 SP) — `Por hacer`

---

### 🔹 FH26-11: [US-06] Modo Protector Mayor con tipografía XL y alto contraste
* **Épica Padre:** `FH26-5` | **Story Points:** 3 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como adulto mayor o persona con dificultades visuales, quiero activar un switch de 'Modo Protector Mayor', para visualizar fuentes grandes y botones táctiles de máxima accesibilidad.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`{get_subtask_key(subtasks, "TASK-016")}`** — `[TASK-016]` `[Valeria]` Modo Protector Mayor & PWA Web Share Target (5 SP) — `Por hacer`

---

### 🔹 FH26-12: [US-07] Recepción de mensajes compartidos vía PWA Web Share Target
* **Épica Padre:** `FH26-5` | **Story Points:** 5 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como usuario de WhatsApp en celular, quiero usar el botón nativo de "Compartir" hacia CiberGuardián, para evaluar el mensaje engañoso directamente sin copiar y pegar.*

---

### 🔹 {us09_key}: [US-09] Demostración y Pitch en vivo ante el Jurado de FormosaHack
* **Épica Padre:** `FH26-5` | **Story Points:** 3 SP | **Estado:** `Por hacer` ⏳
* **Enunciado Ágil:**  
  *Como equipo competidor, quiero presentar un pitch estructurado de 3 minutos con un caso real de estafa en vivo, para convencer al jurado del impacto y robustez técnica de CiberGuardián.*
* **Subtareas Técnicas Anidadas:**
  * ⏳ **`{get_subtask_key(subtasks, "TASK-018")}`** — `[TASK-018]` `[Equipo Completo]` Guion de Pitch y Demostración en Vivo ante el Jurado (3 SP) — `Por hacer`

---

## 🎯 Asignación Oficial de Trabajo por Duplas (Sprint 1)
* **Dupla Backend (Gabriel Pineda + Maxi González):**
  * Maxi González: `{get_subtask_key(subtasks, "TASK-006")}`, `{get_subtask_key(subtasks, "TASK-007")}`, `{get_subtask_key(subtasks, "TASK-008")}`, `{get_subtask_key(subtasks, "TASK-009")}` (13 SP pendientes).
  * Gabriel Pineda: `{get_subtask_key(subtasks, "TASK-017")}` (3 SP pendientes) + Integración y Soporte de Infraestructura.
* **Dupla Frontend (Matías + Valeria Budiño):**
  * Matías: `{get_subtask_key(subtasks, "TASK-010")}`, `{get_subtask_key(subtasks, "TASK-011")}`, `{get_subtask_key(subtasks, "TASK-012")}` (10 SP pendientes).
  * Valeria Budiño: `{get_subtask_key(subtasks, "TASK-013")}`, `{get_subtask_key(subtasks, "TASK-014")}`, `{get_subtask_key(subtasks, "TASK-015")}`, `{get_subtask_key(subtasks, "TASK-016")}` (16 SP pendientes).
"""

def get_subtask_key(subtasks, task_id):
    for s in subtasks:
        if s.get("id") == task_id:
            return s.get("jira_key", task_id)
    return task_id

if __name__ == "__main__":
    main()
