# Planificador de Base de Datos (Equivalente a Migraciones de Laravel)

> **Uso:** Completar este archivo en la hora 0 de la competencia para definir las tablas antes de escribir código.

---

## 1. Entidad Principal del Desafío
* **Nombre de la tabla:** `[ej: pacientes / turnos / alertas / cultivos]` (en plural)
* **Propósito:** `[Breve descripción de qué representa en el problema]`

### Columnas Planificadas:
| Nombre de Columna | Tipo de Dato | Nullable | Descripción / Propósito |
| :--- | :--- | :--- | :--- |
| `id` | Integer (PK) | No | Identificador único auto-incremental. |
| `title` / `nombre` | String(150) | No | Nombre o título representativo. |
| `description` | Text | Sí | Descripción o notas detalladas. |
| `category` | String(100) | No | Clasificación temática del registro. |
| `status` | String(50) | No | Estado (`activo`, `pendiente`, `completado`). |
| `location` | String(150) | No | Localidad en Formosa (`Capital`, `Clorinda`, etc.). |
| `created_at` | DateTime | No | Fecha de creación automática. |
| `updated_at` | DateTime | No | Fecha de última actualización. |
| `deleted_at` | DateTime | Sí | **Soft Delete obligatorio** (fecha de baja lógica). |

---

## 2. Relaciones entre Tablas
- `[Entidad A]` pertenece a `[Entidad B]` mediante `entidad_b_id`.
