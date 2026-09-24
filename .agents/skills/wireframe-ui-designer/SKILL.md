---
name: wireframe-ui-designer
description: Guía de maquetación y patrones de diseño en React + Tailwind CSS para crear pantallas y wireframes del sistema rápidamente sin pisar el backend.
---

# Skill: Diseñador de Vistas y Wireframes (UI Designer)

## Objetivo
Maquetar las pantallas del sistema en `frontend/src/` con Tailwind CSS mientras el backend prepara los modelos y bases de datos.

## Patrones de Pantalla Rápidos (Equivalente a Vistas Blade)

### 1. Cabecera y Navegación
- Mantener la barra superior con el logo de FormosaHack y selector de módulos.

### 2. Tabla Paginada con Filtros
- Usar contenedor responsivo con scroll horizontal controlado.
- Píldoras de estado (`bg-emerald-950 text-emerald-400` para activo, `bg-amber-950 text-amber-400` para pendiente).
- Botones de acción con iconos de Lucide (`Plus`, `Trash2`, `ExternalLink`).

### 3. Formularios en Modales
- Utilizar ventanas modales flotantes con fondo oscuro translúcido (`bg-black/60 backdrop-blur-xs`).
- Validar campos obligatorios en el cliente antes de enviar.
- Mostrar Sonner Toasts tras la confirmación exitosa.
