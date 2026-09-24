---
name: sdd-system-architect
description: Guía paso a paso para transformar la problemática asignada por el jurado de FormosaHack en los requisitos, modelos de datos, endpoints y tareas del SDD sin pisarse entre integrantes.
---

# Skill: Arquitecto del Sistema (SDD System Architect)

## Objetivo
En las primeras 1 a 2 horas de la competencia, definir el alcance exacto del sistema y completar la especificación formal en `docs/SDD.md` para coordinar al equipo de 4 personas.

## Flujo de Trabajo en 4 Pasos (Analogía Laravel)

### Paso 1: Identificar Actores y Casos de Uso
1. ¿Quiénes usan el sistema? (Ej: Paciente, Enfermero, Director de Hospital).
2. ¿Qué acciones clave realizan? (Ej: Solicitar turno, asignar cama, consultar estadísticas).

### Paso 2: Diseñar las Tablas de Base de Datos (Equivalente a Migraciones Eloquent)
- Definir qué tablas se crearán en `backend/core_service/app/models/`:
  - Nombre de la tabla (en plural).
  - Columnas requeridas y tipos (string, integer, datetime).
  - Claves foráneas / relaciones (1 a N, N a N).
  - Campo obligatorio de borrado lógico: `deleted_at`.

### Paso 3: Definir los Endpoints de la API (Equivalente a routes/api.php)
- Acordar qué rutas expondrá el backend para que el frontend pueda consumirlas:
  - `GET /api/core/entidades?page=1&limit=10&search=...` (Listar con paginación).
  - `POST /api/core/entidades` (Crear registro).
  - `GET /api/core/entidades/{id}` (Ver detalle).
  - `PUT /api/core/entidades/{id}` (Editar registro).
  - `DELETE /api/core/entidades/{id}` (Soft Delete).

### Paso 4: Desglosar Tareas en docs/TASKS.md
- Asignar responsables entre los 4 integrantes (Frontend, Backend, Datos, Producto) para trabajar en paralelo sin pisarse.
