---
name: fastapi-microservices
description: Patrones de arquitectura y desarrollo acelerado para microservicios en FastAPI aplicando Repository Pattern, Pydantic v2, Soft Delete y Swagger automático.
---

# Skill: FastAPI Microservices Architecture

## Estructura de Capas Obligatoria (Repository Pattern)
Cada microservicio debe estructurarse estrictamente en las siguientes capas:

```text
Router (app/routers/)
   ↓ Recibe HTTP Request, valida con Pydantic Schema, llama al Service
Service Layer (app/services/)
   ↓ Contiene las reglas de negocio, validaciones lógicas y auditoría
Repository (app/repositories/)
   ↓ Realiza las consultas SQLAlchemy a PostgreSQL (CRUD, filtros, paginación)
Database (PostgreSQL 16)
```

## Reglas Críticas
1. **No inyectar SQL crudo:** Usar SQLAlchemy 2.0 con consultas parametrizadas para prevenir SQL Injection.
2. **Soft Delete (`deleted_at`):**
   - No ejecutar `DELETE FROM ...`. Actualizar el timestamp en `deleted_at = datetime.utcnow()`.
   - Las consultas de lectura deben filtrar por defecto `where(Model.deleted_at.is_(None))`.
3. **Paginación en Servidor:**
   - Todo endpoint de listado debe recibir `page: int = 1`, `limit: int = 20`.
   - La respuesta debe seguir el esquema: `{ "data": [...], "page": 1, "limit": 20, "total": 100, "total_pages": 5 }`.
4. **Documentación Swagger:**
   - Usar `summary`, `description` y `response_model` en cada ruta para que `/docs` genere una documentación impecable para el jurado.
