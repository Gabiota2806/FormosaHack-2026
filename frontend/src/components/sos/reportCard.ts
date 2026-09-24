export type ReportChannel = 'WHATSAPP' | 'SMS' | 'LLAMADA' | 'LINK' | 'REDES' | 'OTRO';

export const CHANNEL_LABELS: Record<ReportChannel, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS / Mensaje de texto',
  LLAMADA: 'Llamada telefónica',
  LINK: 'Link o página web',
  REDES: 'Redes sociales',
  OTRO: 'Otro',
};

export interface ReportCardData {
  channel: ReportChannel | '';
  entity: string;
  incidentDate: string; // valor de <input type="datetime-local">
  amount: string;
  destination: string; // CBU/CVU (22 dígitos) o alias
  scammerPhone: string;
  fraudLink: string;
  narrative: string;
}

export type ReportCardErrors = Partial<Record<keyof ReportCardData, string>>;

export const EMPTY_REPORT_CARD: ReportCardData = {
  channel: '',
  entity: '',
  incidentDate: '',
  amount: '',
  destination: '',
  scammerPhone: '',
  fraudLink: '',
  narrative: '',
};

export const NARRATIVE_MAX_LENGTH = 2000;

// Zona horaria de Formosa en la base tz.
const TIME_ZONE = 'America/Argentina/Cordoba';

// Montos en formato argentino: "45000", "45.000", "45.000,50".
const AMOUNT_PATTERN = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/;
const ALIAS_PATTERN = /^[a-zA-Z0-9.-]{6,20}$/;

/** Convierte un monto en formato argentino a número, o null si no es válido. */
export function parseAmount(raw: string): number | null {
  const value = raw.trim().replace(/^\$\s*/, '');
  if (!AMOUNT_PATTERN.test(value)) return null;
  return Number(value.replace(/\./g, '').replace(',', '.'));
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
}

export function validateReportCard(data: ReportCardData, now: Date = new Date()): ReportCardErrors {
  const errors: ReportCardErrors = {};

  if (!data.channel) {
    errors.channel = 'Elegí por dónde te contactaron.';
  }

  if (data.incidentDate) {
    const date = new Date(data.incidentDate);
    if (Number.isNaN(date.getTime())) {
      errors.incidentDate = 'La fecha no es válida.';
    } else if (date.getTime() > now.getTime()) {
      errors.incidentDate = 'La fecha no puede ser posterior a hoy.';
    }
  }

  if (data.amount.trim()) {
    const amount = parseAmount(data.amount);
    if (amount === null || amount <= 0) {
      errors.amount = 'Escribí solo el número, por ejemplo 45.000 o 45000.';
    }
  }

  const destination = data.destination.trim();
  if (destination) {
    const digits = destination.replace(/[\s-]/g, '');
    if (/^\d+$/.test(digits)) {
      if (digits.length !== 22) {
        errors.destination = `El CBU/CVU tiene 22 números y escribiste ${digits.length}.`;
      }
    } else if (!ALIAS_PATTERN.test(destination)) {
      errors.destination = 'El alias tiene entre 6 y 20 caracteres: letras, números, puntos o guiones.';
    }
  }

  const phone = data.scammerPhone.trim();
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    if (!/^[\d\s+()-]+$/.test(phone) || phoneDigits.length < 8 || phoneDigits.length > 15) {
      errors.scammerPhone = 'Revisá el número: por ejemplo +54 9 370 4123456.';
    }
  }

  if (data.fraudLink.trim() && !normalizeUrl(data.fraudLink)) {
    errors.fraudLink = 'No parece un link válido. Copialo tal cual lo recibiste.';
  }

  if (data.narrative.length > NARRATIVE_MAX_LENGTH) {
    errors.narrative = `El relato no puede superar los ${NARRATIVE_MAX_LENGTH} caracteres.`;
  }

  return errors;
}

/** Devuelve la URL normalizada (con esquema) o null si no parece un dominio. */
export function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

// Sin caracteres ambiguos (0/O, 1/I) para que se pueda dictar por teléfono.
const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Código único de referencia con el formato del SDD: DEN-2026-B3C9. */
export function generateReferenceCode(issuedAt: Date = new Date()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(bytes, (b) => REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length]).join('');
  return `DEN-${issuedAt.getFullYear()}-${suffix}`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('es-AR', { timeZone: TIME_ZONE, dateStyle: 'short', timeStyle: 'short' });
}

const orMissing = (value: string, fallback = 'No aportado') => value.trim() || fallback;

export function buildReportCardText(
  data: ReportCardData,
  { referenceCode, issuedAt }: { referenceCode: string; issuedAt: Date },
): string {
  const amount = parseAmount(data.amount);
  const incidentDate = data.incidentDate ? formatDateTime(new Date(data.incidentDate)) : 'No especificada';

  return `=====================================================
FICHA DE DENUNCIA DIGITAL — CIBERGUARDIÁN
Documento de recopilación preliminar para denuncia penal
=====================================================
Código de Referencia: ${referenceCode}
Fecha y Hora de Emisión: ${formatDateTime(issuedAt)}

DATOS DEL HECHO
Fecha y Hora del Hecho: ${incidentDate}
Canal de Contacto: ${data.channel ? CHANNEL_LABELS[data.channel] : 'No especificado'}
Entidad o Institución Fingida: ${orMissing(data.entity, 'No especificada')}
Monto Involucrado / Transferido: ${amount !== null ? formatAmount(amount) : 'No declarado'}

EVIDENCIA DEL ESTAFADOR
CBU / CVU / Alias de Destino: ${orMissing(data.destination)}
Teléfono del Estafador: ${orMissing(data.scammerPhone)}
Enlace o Sitio Fraudulento: ${orMissing(data.fraudLink)}

RELATO DE LOS HECHOS:
${orMissing(data.narrative, 'El usuario no proporcionó una descripción adicional.')}

RECOMENDACIONES LEGALES:
1. Presentar esta ficha ante la Comisaría más cercana o Fiscalía de Instrucción de Formosa.
2. Adjuntar capturas de pantalla completas donde se vean fechas y números de remitente.
3. Solicitar en el banco el Número de Operación (ID Coelsa) de la transferencia.
4. Citar el Código de Referencia ${referenceCode} en cada trámite.
=====================================================`;
}

export const reportCardFileName = (referenceCode: string) => `Ficha_Denuncia_${referenceCode}.txt`;
