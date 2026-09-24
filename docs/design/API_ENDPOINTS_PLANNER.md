# Planificador de Endpoints de API (Equivalente a routes/api.php)

> **Uso:** El integrante de Frontend y el de Backend completan esta lista para programar en paralelo sin esperarse.

---

## Rutas del Módulo Core (`/api/core/...`)

| Método | Endpoint | Parámetros / Body | Respuesta Exitosa | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/core/items` | `page=1`, `limit=10`, `search=""`, `category=""` | `200 OK` + Lista paginada | Consulta tabla con filtros y paginación. |
| `POST` | `/api/core/items` | `{ title, description, category, location }` | `201 Created` + Objeto creado | Alta de nuevo registro desde modal. |
| `GET` | `/api/core/items/{id}` | `id: int` | `200 OK` + Objeto | Vista de detalle del registro. |
| `PUT` | `/api/core/items/{id}` | `{ ...campos a modificar }` | `200 OK` + Objeto actualizado | Modificación de registro. |
| `DELETE` | `/api/core/items/{id}` | `id: int` | `200 OK` + `{ message, id }` | **Soft Delete** (baja lógica). |
