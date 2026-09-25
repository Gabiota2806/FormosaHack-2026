// Web Share Target: al compartir desde WhatsApp (u otra app) hacia CiberGuardián instalada,
// el celular abre "/?title=…&text=…&url=…" (ver share_target en public/manifest.webmanifest).

// Límite del backend (ChatMessageRequest.message).
export const SHARED_MESSAGE_MAX_LENGTH = 2000;

const SHARE_PARAMS = ['title', 'text', 'url', 'analyze'] as const;

export interface SharedMessage {
  text: string;
  truncated: boolean;
}

/** Arma el mensaje a analizar con lo compartido, o null si no llegó nada. */
export function readSharedMessage(search: string): SharedMessage | null {
  const params = new URLSearchParams(search);
  const analyze = params.get('analyze')?.trim();
  if (analyze) {
    return {
      text: analyze.slice(0, SHARED_MESSAGE_MAX_LENGTH),
      truncated: analyze.length > SHARED_MESSAGE_MAX_LENGTH,
    };
  }

  const [title, text, url] = ['title', 'text', 'url'].map((key) => params.get(key)?.trim() ?? '');

  // Cada app completa los campos distinto: WhatsApp manda todo en "text" y otras
  // repiten el link en "text" y en "url". Se evita duplicar.
  const parts: string[] = [];
  if (title && !text.includes(title)) parts.push(title);
  if (text) parts.push(text);
  if (url && !text.includes(url)) parts.push(url);

  const combined = parts.join('\n');
  if (!combined) return null;

  return {
    text: combined.slice(0, SHARED_MESSAGE_MAX_LENGTH),
    truncated: combined.length > SHARED_MESSAGE_MAX_LENGTH,
  };
}

/**
 * Saca los parámetros compartidos de la URL: al recargar no se vuelve a analizar
 * y el mensaje (que puede tener datos personales) no queda en el historial.
 */
export function clearShareParams(location: Location = window.location, history: History = window.history) {
  const url = new URL(location.href);
  SHARE_PARAMS.forEach((key) => url.searchParams.delete(key));
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
