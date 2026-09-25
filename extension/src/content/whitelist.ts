/**
 * Lista blanca oficial de dominios bancarios e institucionales de Formosa y nacionales.
 * Previene falsos positivos en sitios legítimos y neutraliza ataques de phishing.
 */
export const OFFICIAL_FORMOSA_WHITELIST: readonly string[] = [
  // Entidades Bancarias y Financieras Oficiales
  'bancoformosa.com.ar',
  'bancodeformosa.com.ar',
  'redlink.com.ar',
  'banelco.com.ar',
  'prisma.com.ar',
  'bna.com.ar',
  'bcra.gob.ar',

  // Gobierno e Instituciones de la Provincia de Formosa
  'formosa.gob.ar',
  'dgrformosa.gob.ar',
  'refsa.com.ar',
  'ipvformosa.gob.ar',
  'cps.formosa.gob.ar',
  'jusformosa.gob.ar',
  'politecnico.formosa.gob.ar',
  'uprab.edu.ar',
  'unaf.edu.ar',

  // Entidades Nacionales Oficiales
  'anses.gob.ar',
  'afip.gob.ar',
  'arca.gob.ar',
  'argentina.gob.ar',
  'mi.argentina.gob.ar',

  // Entornos de desarrollo y pruebas locales
  'localhost',
  '127.0.0.1',
];

/**
 * Normaliza una URL o hostname extrayendo el dominio en minúsculas y sin puertos.
 */
export function normalizeHostname(urlOrHost: string): string {
  if (!urlOrHost || typeof urlOrHost !== 'string') return '';

  let cleaned = urlOrHost.trim().toLowerCase();

  // Si tiene protocolo o formato de URL, usar el parser nativo de URL
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('//')) {
    try {
      const parsed = new URL(cleaned.startsWith('//') ? `https:${cleaned}` : cleaned);
      return parsed.hostname;
    } catch {
      // Continuar con limpieza manual si falla el parseo
    }
  }

  // Quitar path y query params si existen
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];

  // Quitar puerto si existe (ej. localhost:8000 -> localhost)
  cleaned = cleaned.split(':')[0];

  return cleaned;
}

/**
 * Verifica si un hostname o URL pertenece a la lista blanca oficial o es un subdominio legítimo.
 * Bloquea intentos de suplantación como "bancoformosa.com.ar.atacante.com".
 */
export function isWhitelistedDomain(
  urlOrHost: string,
  whitelist: readonly string[] = OFFICIAL_FORMOSA_WHITELIST
): boolean {
  const host = normalizeHostname(urlOrHost);
  if (!host) return false;

  return whitelist.some((allowedDomain) => {
    const normalizedAllowed = allowedDomain.toLowerCase().trim();
    // Coincidencia exacta (ej. bancoformosa.com.ar === bancoformosa.com.ar)
    if (host === normalizedAllowed) {
      return true;
    }
    // Subdominio legítimo (ej. homebanking.bancoformosa.com.ar termina con .bancoformosa.com.ar)
    if (host.endsWith(`.${normalizedAllowed}`)) {
      return true;
    }
    return false;
  });
}
