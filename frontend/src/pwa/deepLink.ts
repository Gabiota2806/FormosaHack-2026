// Enlaces profundos de las notificaciones push: el backend manda "/#radar?incident_id=15"
// (push_service.RADAR_BASE_URL) y el service worker lleva a la app a esa dirección.

export interface RadarDeepLink {
  /** Amenaza a destacar en el Radar, o null si el enlace es solo "#radar". */
  incidentId: number | null;
}

/** Interpreta el hash de la URL; devuelve null si no es un enlace al Radar. */
export function parseRadarDeepLink(hash: string): RadarDeepLink | null {
  const [path, query = ''] = hash.replace(/^#/, '').split('?', 2);
  if (path.toLowerCase() !== 'radar') return null;

  const raw = new URLSearchParams(query).get('incident_id');
  const id = raw !== null && /^\d+$/.test(raw) ? Number(raw) : NaN;
  return { incidentId: Number.isSafeInteger(id) && id > 0 ? id : null };
}

/**
 * Saca el hash ya procesado de la URL (sin recargar ni sumar historial): así, si llega
 * otra notificación con el mismo enlace, el cambio de hash vuelve a dispararse.
 */
export function clearDeepLink(location: Location = window.location, history: History = window.history) {
  history.replaceState(history.state, '', `${location.pathname}${location.search}`);
}
