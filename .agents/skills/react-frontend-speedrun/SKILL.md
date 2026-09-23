---
name: react-frontend-speedrun
description: Guía de mejores prácticas para desarrollo rápido de interfaces con React, Vite, TypeScript y Tailwind CSS, cumpliendo con accesibilidad, diseño responsivo y sin uso de alert().
---

# Skill: React Frontend Speedrun

## Objetivo
Desarrollar vistas y componentes de alta calidad visual para el MVP de FormosaHack en tiempo récord, respetando las directivas de evaluación.

## Reglas Obligatorias
1. **Cero `alert()` nativo:**
   - Usar `toast.success("Mensaje")` o `toast.error("Error")` desde `sonner`.
   - Para confirmaciones destructivas (ej. eliminar registro), utilizar el componente modal de confirmación (`ConfirmModal`).
2. **Diseño Responsivo:**
   - Todo layout debe adaptarse con breakpoints de Tailwind (`sm:`, `md:`, `lg:`, `xl:`).
   - Prohibido el desbordamiento horizontal (`overflow-x-clip` o `overflow-x-auto` en tablas).
3. **Manejo de Estados de Red:**
   - Siempre mostrar skeleton loaders o spinners (`animate-spin` de Lucide) durante la carga de datos.
   - Capturar y traducir errores HTTP (400, 401, 403, 404, 429, 500) en mensajes legibles para el usuario.
4. **Paginación y Filtros:**
   - Toda tabla de datos debe incluir barra de búsqueda con debounce y controles de paginación (`Página X de Y`, Anterior / Siguiente).
