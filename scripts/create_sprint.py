#!/usr/bin/env python3
"""
Script para crear e iniciar el Sprint 1 en Jira Agile API — FormosaHack 2026.
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
        print(f"❌ Error de conexión: {e}")
        return None

def main():
    print("🔍 Consultando tableros de Jira para el proyecto FH26...")
    boards = jira_request("/rest/agile/1.0/board?projectKeyOrId=FH26")
    if not boards or not boards.get("values"):
        print("❌ No se encontró un tablero Agile para FH26. Buscando por lista general...")
        boards = jira_request("/rest/agile/1.0/board")
        if not boards or not boards.get("values"):
            print("❌ No se pudieron recuperar tableros.")
            return

    # Buscar el tablero correspondiente a FH26
    board = None
    for b in boards.get("values", []):
        if b.get("location", {}).get("projectKey") == "FH26" or "FH26" in b.get("name", ""):
            board = b
            break
    
    if not board:
        board = boards["values"][0]

    board_id = board["id"]
    board_name = board["name"]
    print(f"✅ Tablero detectado: [{board_id}] '{board_name}'")

    # 1. Crear Sprint
    sprint_payload = {
        "name": "Sprint 1 - MVP (16:30-19:30)",
        "startDate": "2026-09-24T16:30:00.000-03:00",
        "endDate": "2026-09-24T19:30:00.000-03:00",
        "originBoardId": board_id,
        "goal": "Desplegar el MVP funcional de CiberGuardián con el flujo completo de los 3 momentos activo para la evaluación preliminar (Chatbot con semáforo, Auxilio SOS y Radar Comunitario)."
    }

    print("🚀 Creando Sprint 1 en Jira...")
    sprint = jira_request("/rest/agile/1.0/sprint", method="POST", data=sprint_payload)
    if not sprint or "id" not in sprint:
        print("⚠️ No se pudo crear vía /rest/agile/1.0/sprint. Verifique permisos o tipo de tablero.")
        return

    sprint_id = sprint["id"]
    print(f"✨ Sprint 1 creado exitosamente con ID: {sprint_id}")

    # 2. Asignar los issues del Sprint 1
    issues_to_add = [
        # Historias de Usuario
        "FH26-6", "FH26-7", "FH26-8", "FH26-9", "FH26-10", "FH26-13",
        # Tareas del MVP
        "FH26-14", "FH26-15", "FH26-16", "FH26-17", "FH26-18",
        "FH26-19", "FH26-20", "FH26-21", "FH26-22", "FH26-23",
        "FH26-24", "FH26-25", "FH26-26", "FH26-27", "FH26-28"
    ]

    print(f"📋 Moviendo {len(issues_to_add)} incidencias al Sprint {sprint_id}...")
    move_res = jira_request(f"/rest/agile/1.0/sprint/{sprint_id}/issue", method="POST", data={"issues": issues_to_add})
    if move_res is not None:
        print("✅ Incidencias agregadas al Sprint 1.")

    # 3. Iniciar el Sprint
    print("▶️ Iniciando el Sprint 1...")
    start_payload = {
        "state": "active",
        "startDate": "2026-09-24T16:30:00.000-03:00",
        "endDate": "2026-09-24T19:30:00.000-03:00"
    }
    start_res = jira_request(f"/rest/agile/1.0/sprint/{sprint_id}", method="POST", data=start_payload)
    if start_res:
        print(f"🎉 ¡Sprint 1 activo y corriendo! Estado: {start_res.get('state', 'active')}")

if __name__ == "__main__":
    main()
