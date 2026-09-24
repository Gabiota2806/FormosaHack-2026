#!/usr/bin/env python3
"""
Script de Sincronización entre Jira Cloud y docs/TASKS.md — FormosaHack 2026
Utiliza únicamente la biblioteca estándar de Python (urllib, json, re, base64).
"""

import os
import re
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

def get_jira_credentials():
    env = load_env()
    url = env.get("JIRA_INSTANCE_URL", "").rstrip("/")
    email = env.get("JIRA_EMAIL", "")
    token = env.get("JIRA_API_TOKEN", "")
    project_key = env.get("JIRA_PROJECT_KEY", "")

    if not url or "tu-organizacion" in url:
        print("❌ Error: Debe configurar JIRA_INSTANCE_URL en su archivo .env")
        sys.exit(1)
    if not email or "tu-email" in email:
        print("❌ Error: Debe configurar JIRA_EMAIL en su archivo .env")
        sys.exit(1)
    if not token or "tu_api_token" in token:
        print("❌ Error: Debe configurar JIRA_API_TOKEN en su archivo .env")
        sys.exit(1)
    if not project_key or "FH26" == project_key and "tu" in project_key:
        print("❌ Error: Debe configurar JIRA_PROJECT_KEY en su archivo .env")
        sys.exit(1)

    auth_str = f"{email}:{token}"
    auth_header = f"Basic {base64.b64encode(auth_str.encode()).decode()}"
    return url, auth_header, project_key

def jira_request(endpoint, method="GET", data=None):
    url, auth_header, _ = get_jira_credentials()
    req_url = f"{url}{endpoint}"
    headers = {
        "Authorization": auth_header,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(req_url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"❌ Error HTTP {e.code} en {endpoint}: {err_msg}")
        return None
    except Exception as e:
        print(f"❌ Error de red: {e}")
        return None

def test_connection():
    print("🔍 Probando conexión con Jira...")
    user = jira_request("/rest/api/3/myself")
    if not user:
        return
    print(f"✅ Conectado exitosamente como: {user.get('displayName')} ({user.get('emailAddress')})")

    _, _, project_key = get_jira_credentials()
    project = jira_request(f"/rest/api/3/project/{project_key}")
    if project:
        print(f"✅ Proyecto encontrado: [{project.get('key')}] {project.get('name')}")
    else:
        print(f"⚠️ Advertencia: No se encontró el proyecto con clave '{project_key}'. Verifique la clave en .env")

def push_tasks(tasks_file="docs/TASKS.md"):
    if not os.path.exists(tasks_file):
        print(f"❌ No se encontró el archivo {tasks_file}")
        return

    _, _, project_key = get_jira_credentials()
    with open(tasks_file, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    updated_lines = []
    created_count = 0

    print("🚀 Sincronizando tareas desde docs/TASKS.md hacia Jira...")

    for line in lines:
        # Detectar líneas de la tabla de tareas: | **TASK-XXX** | Tarea | Comp | Prioridad | Jira Key | ... | Estado |
        match = re.search(r"\|\s*\*\*(TASK-\d+)\*\*\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*`?([A-Za-z_ ]+)`?\s*\|", line)
        if match:
            task_id = match.group(1).strip()
            summary = match.group(2).strip()
            component = match.group(3).strip()
            priority = match.group(4).strip()
            jira_key = match.group(5).strip()
            criteria = match.group(6).strip()
            status_val = match.group(7).strip()

            # Si la tarea aún no tiene Jira Key
            if jira_key in ["-", ""]:
                issue_payload = {
                    "fields": {
                        "project": {"key": project_key},
                        "summary": f"[{task_id}] {summary}",
                        "description": {
                            "type": "doc",
                            "version": 1,
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {"type": "text", "text": f"Componente: {component}\nCriterios & DoD: {criteria}"}
                                    ]
                                }
                            ]
                        },
                        "issuetype": {"name": "Task"}
                    }
                }
                res = jira_request("/rest/api/3/issue", method="POST", data=issue_payload)
                if res and "key" in res:
                    new_key = res["key"]
                    print(f"  ✨ Creada en Jira: [{new_key}] {task_id} - {summary}")
                    line = f"| **{task_id}** | {summary} | {component} | {priority} | {new_key} | {criteria} | `{status_val}` |"
                    created_count += 1
        updated_lines.append(line)

    if created_count > 0:
        with open(tasks_file, "w", encoding="utf-8") as f:
            f.write("\n".join(updated_lines) + "\n")
        print(f"🎉 Se crearon {created_count} tareas en Jira y se actualizaron en {tasks_file}.")
    else:
        print("ℹ️ Todas las tareas ya cuentan con su clave de Jira asignada.")

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/sync_jira.py [test | push]")
        print("  test - Valida la conexión y permisos con tu Jira Cloud")
        print("  push - Sube las tareas de docs/TASKS.md a Jira y anota sus Jira Keys")
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd == "test":
        test_connection()
    elif cmd == "push":
        push_tasks()
    else:
        print(f"Comando desconocido: {cmd}")

if __name__ == "__main__":
    main()
