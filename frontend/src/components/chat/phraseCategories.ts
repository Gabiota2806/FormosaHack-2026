/** Nombre en lenguaje claro y colores de cada tipo de trampa que detecta el backend. */
interface CategoryStyle {
  label: string;
  /** Clases del texto resaltado dentro del mensaje. */
  mark: string;
  /** Punto de color para la leyenda y la explicación. */
  dot: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  URGENCE: {
    label: 'Urgencia',
    mark: 'bg-amber-100 text-amber-900',
    dot: 'bg-amber-500',
  },
  AUTHORITY: {
    label: 'Se hace pasar por una entidad',
    mark: 'bg-teal-100 text-teal-900',
    dot: 'bg-teal-500',
  },
  CREDENTIALS: {
    label: 'Te pide datos o claves',
    mark: 'bg-red-100 text-red-900',
    dot: 'bg-red-500',
  },
  FAKE_LINK: {
    label: 'Enlace sospechoso',
    mark: 'bg-red-100 text-red-900 underline decoration-wavy decoration-red-500 underline-offset-2',
    dot: 'bg-red-700',
  },
  GREED: {
    label: 'Promesa de premio',
    mark: 'bg-violet-100 text-violet-900',
    dot: 'bg-violet-500',
  },
};

const FALLBACK_STYLE: CategoryStyle = {
  label: 'Señal sospechosa',
  mark: 'bg-slate-200 text-slate-900',
  dot: 'bg-slate-500',
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? FALLBACK_STYLE;
}
