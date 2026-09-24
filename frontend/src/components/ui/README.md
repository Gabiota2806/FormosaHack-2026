# Componentes UI compartidos

Piezas base del tema visual de CiberGuardián. Usalas en lugar de copiar clases de Tailwind para que toda la app se vea igual.

## Colores

Definidos en `src/index.css` (`@theme`):

- `slate-*`: gris azulado de la app (fondos, bordes, textos). Es la escala de Tailwind redefinida.
- `brand-*`: verde de marca para acciones principales y estados activos. **Usalo en lugar de `blue-*`, `cyan-*` o `indigo-*`.**
- `red-*`: solo para peligro y SOS. `amber-*`: solo para advertencias.

## `Button`

```tsx
import { Button } from '../ui/Button';
import { Share2, Trash2, Send } from 'lucide-react';

<Button icon={Share2} onClick={...}>Compartir</Button>                  // primary (verde)
<Button variant="secondary">Cancelar</Button>                            // sobre tarjetas claras
<Button variant="danger" icon={Trash2}>Eliminar</Button>                 // rojo
<Button variant="ghost" size="sm">Nueva consulta</Button>                // discreto sobre fondo oscuro
<Button size="icon" icon={Send} aria-label="Enviar" />                   // solo ícono: aria-label obligatorio
```

Es `type="button"` por defecto: en formularios pasá `type="submit"`.

## `Card`

```tsx
import { Card } from '../ui/Card';

<Card>...</Card>                  // blanca: contenido principal (resultados, fichas)
<Card tone="dark">...</Card>      // panel oscuro: contenedores de sección
<Card className="p-6 rounded-3xl">...</Card>
```

## `IconBadge`

Ícono de Lucide dentro de un círculo con degradé, como las ilustraciones de la referencia.

```tsx
import { IconBadge } from '../ui/IconBadge';
import { Radio, Siren, ShieldCheck } from 'lucide-react';

<IconBadge icon={Radio} />                          // brand, sobre fondo claro
<IconBadge icon={Siren} tone="danger" size="md" />  // rojo
<IconBadge icon={ShieldCheck} tone="solid" />       // lleno, sobre fondo oscuro
```

## `cn`

Combina clases y resuelve conflictos de Tailwind: `cn('px-2', isActive && 'bg-brand-500', className)`.

## Reglas del equipo

- Solo íconos de `lucide-react`, sin emojis (`docs/metodologia.md`).
- Sin `alert()`: usar `toast` de Sonner.
- Las animaciones van en CSS (`animate-bubble-in`, `animate-fade-up`) y se desactivan solas con `prefers-reduced-motion`.
