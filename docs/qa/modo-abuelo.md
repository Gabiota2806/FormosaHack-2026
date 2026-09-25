# QA visual del Modo Abuelo (FH26-83)

Checklist para repetir antes de la demo. Cubre lo que los tests automáticos no ven: cómo se ve y
si todo entra en pantalla con la letra de 22px.

Lo automático ya está en `frontend/src/components/elderly/`:

| Test | Qué verifica |
| --- | --- |
| `ElderlyModeContext.test.tsx` | Clase `.modo-abuelo`, persistencia en `localStorage`, migración desde `protector_mode`, sin `localStorage` |
| `prerenderScript.test.ts` | El script de `index.html` aplica el modo antes del primer render (sin parpadeo) |
| `elderlyContrast.test.ts` | Contraste WCAG AAA (7:1) con los colores reales de `index.css` y Tailwind |
| `elderlyAccessibility.test.tsx` | Auditoría `axe-core` de cada pantalla y uso completo con teclado |
| `ElderlyHomeView`, `ElderlyPanicScreen`, `ElderlyVerdictCard` | Botones, enlaces `tel:` y `wa.me`, alturas mínimas de 64px |
| `App.test.tsx` (Modo Abuelo) | Pestañas técnicas ocultas, inicio de 3 botones, persistencia tras recargar |

## Preparación

1. `docker compose up -d --build frontend core_service`
2. Abrir `http://localhost:8000` en Chrome (no `127.0.0.1` ni otro puerto: el backend rechaza ese origen por CORS).
3. Herramientas de desarrollo → modo dispositivo. Probar en **320px** (iPhone SE 1.ª gen.), **360px**,
   **390px** y **escritorio (1280px)**.
4. Activar el interruptor "Modo Abuelo / Simple" del header.

## Checklist

### Header
- [ ] En 320–390px entran el logo, el interruptor y el **SOS completo**, sin scroll horizontal.
- [ ] Sin pestañas técnicas: no aparecen "Radar Comunitario" ni "2FA & Auth". En celular tampoco "Inicio" (el logo lleva ahí).
- [ ] El SOS no late (sin animación) y el rojo es más oscuro que en el modo normal.

### Inicio (3 botones)
- [ ] Los tres botones se leen completos. En celular el ícono va arriba del texto y no queda una palabra por renglón.
- [ ] "Avisar a mi hijo / familiar por WhatsApp" abre WhatsApp con el mensaje escrito (probar en un celular real).

### Pantalla antipánico
- [ ] En 360px o más, el botón **Banco Formosa** entra completo en la primera pantalla, sin scrollear.
- [ ] El número `0800-777-2262` no se corta ni se sale de la tarjeta (en 320px queda justo).
- [ ] "Volver" regresa a los 3 botones.

### Chat y veredicto
- [ ] "Pegar mensaje…" abre el widget del chat. La conversación ocupa la mayor parte del alto (en el iPhone SE, unos 250px).
- [ ] Analizar `Banco Formosa: tu cuenta será bloqueada, pasame el token urgente` → veredicto **rojo**, visible **desde el título** (el chat no salta al final).
- [ ] Analizar `Hola abuela, el domingo vamos a comer` → veredicto **verde**.
- [ ] Ningún veredicto muestra porcentajes, semáforo ni la palabra "ALERTA ROJA".
- [ ] En 320px, "SOSPECHOSO" y "SACARTE PLATA" no se salen de la tarjeta.

### SOS
- [ ] En celular, el encabezado rojo es compacto y el cuerpo del modal scrollea con el dedo (antes quedaban 66px en el iPhone SE).

### Persistencia
- [ ] Recargar: el modo sigue activo y no se ve la versión chica ni por un instante.
- [ ] Desactivar: vuelve la landing completa con todas las pestañas.

## Mediciones de referencia (Playwright, 25/09/2026)

| Pantalla | Antes | Después |
| --- | --- | --- |
| Header en 360px | nav de 394px, SOS cortado | entra completo |
| SOS, cuerpo con scroll (iPhone SE) | 66px | 354px |
| Chat, conversación (iPhone SE) | 55px | 251px |
| Antipánico, primer botón (iPhone SE) | termina a 1322px | termina a 570px |
