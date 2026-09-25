import type {
  RiskLevel,
  HighlightedPhrase,
  ChatMessageResponse,
  AnalysisResult,
  ApiClientConfig,
  RiskBadgeConfig,
} from '../types/analysis.js';
import type { AnalysisStorageItem } from '../types/extension.js';

export const DEFAULT_API_BASE_URL = 'http://localhost:8000';
export const DEFAULT_TIMEOUT_MS = 3000;
export const DEFAULT_STORAGE_KEY = 'ciberguardian_latest_analysis';

export const ENTITIES_PATTERNS: Record<string, RegExp[]> = {
  'Banco Formosa': [/banco\s*formosa/i, /formosa\s*banco/i, /onda\s*siempre\s*pod/i, /chig[uü]e/i],
  'Tarjeta Chigüé': [/chig[uü][eé]/i, /tarjeta\s*chig/i],
  'REFSA': [/refsa/i, /recurso\s*energ[eé]tico/i, /corte\s*de\s*luz/i, /factura\s*de\s*luz/i],
  'Mercado Pago': [/mercado\s*pago/i, /mercadopago/i, /mercado\s*libre/i, /mp\s*argentina/i],
  'ANSES': [/anses/i, /bono\s*extraordinario/i, /ife/i, /refuerzo\s*de\s*ingreso/i, /mi\s*anses/i],
  'WhatsApp': [/soporte\s*de\s*whatsapp/i, /c[oó]digo\s*de\s*verificaci[oó]n/i, /buz[oó]n\s*de\s*voz/i],
  'Policía / Poder Judicial': [/polic[ií]a/i, /fiscal[ií]a/i, /orden\s*de\s*detenci[oó]n/i, /citaci[oó]n\s*judicial/i],
};

export const URGENCY_PATTERNS: RegExp[] = [
  /urgente/i, /inmediato/i, /24\s*horas/i, /suspensi[oó]n/i, /bloquead[oa]/i, /embargo/i,
  /caduca/i, /en\s*las\s*pr[oó]ximas/i, /alerta\s*roja/i, /cierre\s*definitivo/i,
  /ultim[ao]\s*aviso/i, /evit[aá]\s*el\s*corte/i,
];

export const CREDENTIAL_PATTERNS: RegExp[] = [
  /token/i, /clave/i, /cbu/i, /cvu/i, /contrase[ñn]a/i, /c[oó]digo\s*de\s*6\s*d[ií]gitos/i,
  /foto\s*de\s*tu\s*dni/i, /transfer[ií]/i, /acredita/i, /valid[aá]\s*tus\s*datos/i,
  /ingres[aá]\s*tu\s*pin/i, /descarg[aá]\s*esta\s*app/i, /anydesk/i, /teamviewer/i,
];

export const FAMILY_IMPERSONATION_PATTERNS: RegExp[] = [
  /hola\s*m[aá][,\s]/i,
  /hola\s*p[aá][,\s]/i,
  /cambi[eé]\s*de\s*n[uú]mero/i,
  /n[uú]mero\s*nuevo/i,
  /se\s*rompi[oó]\s*(mi\s*)?(celular|tel[eé]fono)/i,
  /se\s*moj[oó]\s*(el\s*)?(celular|tel[eé]fono)/i,
  /c[oó]digo\s*que\s*te\s*lleg[oó]\s*por\s*(sms|whatsapp)/i,
];

export const GREED_PATTERNS: RegExp[] = [
  /ganaste/i, /premio/i, /sorteo/i, /beneficiario/i, /acreditaci[oó]n\s*pendiente/i,
  /subsidio/i, /felicidades/i, /fuiste\s*seleccionad[oa]/i,
];

export const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+|t\.me\/[^\s]+)/gi;

/**
 * Motor heurístico local offline.
 * Se activa en caso de falla de red, timeout o inaccesibilidad del Core Service.
 */
export function analyzeMessageOfflineFallback(message: string): ChatMessageResponse {
  const text = message.trim();
  let score = 0;
  const highlighted: HighlightedPhrase[] = [];
  let detectedEntity: string | null = null;

  // 1. Detección de entidades locales y financieras
  for (const [entity, patterns] of Object.entries(ENTITIES_PATTERNS)) {
    for (const pat of patterns) {
      const match = pat.exec(text);
      if (match) {
        detectedEntity = entity;
        score += 25;
        highlighted.push({
          phrase: match[0],
          reason: `Se menciona a '${entity}'. Los atacantes suelen suplantar entidades legítimas para infundir confianza.`,
          category: 'AUTHORITY',
        });
        break;
      }
    }
    if (detectedEntity) break;
  }

  // 2. Detección de urgencia psicológica
  let urgencyCount = 0;
  for (const pat of URGENCY_PATTERNS) {
    const match = pat.exec(text);
    if (match && urgencyCount < 2) {
      urgencyCount++;
      score += 20;
      highlighted.push({
        phrase: match[0],
        reason: 'Uso de urgencia artificial para forzar una decisión apresurada sin verificar.',
        category: 'URGENCE',
      });
    }
  }

  // 3. Detección de solicitud de credenciales o transferencias
  let credCount = 0;
  for (const pat of CREDENTIAL_PATTERNS) {
    const match = pat.exec(text);
    if (match && credCount < 2) {
      credCount++;
      score += 35;
      highlighted.push({
        phrase: match[0],
        reason: 'Solicitud de datos confidenciales, transferencias bancarias o instalación de herramientas remotas.',
        category: 'CREDENTIALS',
      });
    }
  }

  // 4. Suplantación de identidad familiar ("Hola má / pá")
  for (const pat of FAMILY_IMPERSONATION_PATTERNS) {
    const match = pat.exec(text);
    if (match) {
      score += 60;
      highlighted.push({
        phrase: match[0],
        reason: 'Patrón típico del fraude "Hola má / cambié de número" para solicitar dinero simulando ser un pariente.',
        category: 'FAMILY_IMPERSONATION',
      });
      break;
    }
  }

  // 5. Señuelos de codicia o premios falsos
  for (const pat of GREED_PATTERNS) {
    const match = pat.exec(text);
    if (match) {
      score += 25;
      highlighted.push({
        phrase: match[0],
        reason: 'Promesa de premios no solicitados o beneficios para atraer a la víctima.',
        category: 'GREED',
      });
      break;
    }
  }

  // 6. Enlaces externos sospechosos
  const urlMatches = text.match(URL_REGEX);
  if (urlMatches && urlMatches.length > 0) {
    score += 25;
    highlighted.push({
      phrase: urlMatches[0],
      reason: 'Contiene un enlace que podría redirigir a un formulario falso de phishing.',
      category: 'FAKE_LINK',
    });
  }

  // Normalización del puntaje (mínimo 5%, máximo 98%)
  const riskPercentage = Math.min(98, Math.max(5, score));

  let riskLevel: RiskLevel = 'LOW';
  if (riskPercentage >= 60) {
    riskLevel = 'HIGH';
  } else if (riskPercentage >= 30) {
    riskLevel = 'MEDIUM';
  }

  let summary = '';
  let immediateAction = '';
  let whatNotToDo = '';

  if (riskLevel === 'HIGH') {
    summary = `[Modo Offline] 🔴 Riesgo Alto detectado (${riskPercentage}%). El texto exhibe fuertes indicios de manipulación${detectedEntity ? ` simulando a ${detectedEntity}` : ''}.`;
    immediateAction = 'Corte toda comunicación de inmediato. No transfiera dinero ni ingrese credenciales en ningún enlace.';
    whatNotToDo = 'NUNCA comparta contraseñas, tokens de seguridad ni descargue aplicaciones sugeridas.';
  } else if (riskLevel === 'MEDIUM') {
    summary = `[Modo Offline] 🟡 Riesgo Medio detectado (${riskPercentage}%). Se encontraron patrones de urgencia o menciones que ameritan extrema precaución.`;
    immediateAction = 'Contacte directamente a la entidad por sus canales oficiales verificados antes de proceder.';
    whatNotToDo = 'No se apresure a brindar datos personales ni acceda desde enlaces del mensaje.';
  } else {
    summary = `[Modo Offline] 🟢 Riesgo Bajo detectado (${riskPercentage}%). No se identificaron patrones comunes de fraude o coerción en este fragmento.`;
    immediateAction = 'Mantenga la cautela general y verifique el remitente si no es de su confianza.';
    whatNotToDo = 'No entregue claves ni credenciales a terceros bajo ningún concepto.';
  }

  const waShareText = `⚠️ *Alerta CiberGuardián (Modo Offline)*: Me llegó un mensaje sospechoso${detectedEntity ? ` mencionando a ${detectedEntity}` : ''} con riesgo ${riskLevel}. Te lo comparto para que estés alerta y no ingreses tus datos: "${text.substring(0, 80)}..."`;

  return {
    risk_level: riskLevel,
    risk_percentage: riskPercentage,
    detected_entity: detectedEntity,
    detected_vector: 'EXTENSIÓN / WEB',
    summary,
    immediate_action: immediateAction,
    what_not_to_do: whatNotToDo,
    highlighted_phrases: highlighted,
    wa_share_text: waShareText,
  };
}

export class CoreApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private enableOfflineFallback: boolean;

  constructor(config?: ApiClientConfig) {
    this.baseUrl = (config?.baseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.enableOfflineFallback = config?.enableOfflineFallback ?? true;
  }

  async analyzeMessage(text: string, overrideConfig?: ApiClientConfig): Promise<AnalysisResult> {
    const baseUrl = (overrideConfig?.baseUrl || this.baseUrl).replace(/\/+$/, '');
    const timeoutMs = overrideConfig?.timeoutMs ?? this.timeoutMs;
    const enableFallback = overrideConfig?.enableOfflineFallback ?? this.enableOfflineFallback;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/api/core/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = `Error HTTP ${response.status}`;
        try {
          const body = await response.json();
          if (body?.detail) errorDetail = body.detail;
        } catch {
          // Si el cuerpo no es JSON, se conserva el estado HTTP
        }

        if (enableFallback) {
          const fallbackData = analyzeMessageOfflineFallback(text);
          return {
            success: true,
            data: fallbackData,
            isOfflineFallback: true,
            statusCode: response.status,
            error: `Falla en backend (${errorDetail}). Se activó análisis heurístico offline.`,
          };
        }

        return {
          success: false,
          statusCode: response.status,
          error: errorDetail,
        };
      }

      const data = (await response.json()) as ChatMessageResponse;
      return {
        success: true,
        data,
        isOfflineFallback: false,
        statusCode: response.status,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      const isAbort = (err instanceof Error && err.name === 'AbortError') ||
        (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'AbortError');

      const errorMsg = isAbort
        ? `Tiempo de espera agotado (${timeoutMs}ms)`
        : err instanceof Error
        ? err.message
        : 'Error de red';

      if (enableFallback) {
        const fallbackData = analyzeMessageOfflineFallback(text);
        return {
          success: true,
          data: fallbackData,
          isOfflineFallback: true,
          error: `${errorMsg}. Se activó análisis heurístico offline.`,
        };
      }

      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}

export function getRiskBadgeConfig(riskLevel?: RiskLevel | 'error' | 'pending'): RiskBadgeConfig {
  switch (riskLevel) {
    case 'HIGH':
      return { text: 'ALTO', color: '#EF4444' };
    case 'MEDIUM':
      return { text: 'MED', color: '#F59E0B' };
    case 'LOW':
      return { text: 'BAJO', color: '#10B981' };
    case 'error':
      return { text: '!', color: '#EF4444' };
    case 'pending':
      return { text: '...', color: '#3B82F6' };
    default:
      return { text: '', color: '#6B7280' };
  }
}

export async function updateBadgeForRisk(riskLevel?: RiskLevel | 'error' | 'pending'): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.action) return;
  const config = getRiskBadgeConfig(riskLevel);
  await chrome.action.setBadgeText({ text: config.text });
  if (config.color) {
    await chrome.action.setBadgeBackgroundColor({ color: config.color });
  }
}

export async function saveAnalysisToStorage(
  item: AnalysisStorageItem,
  storageKey: string = DEFAULT_STORAGE_KEY
): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  await chrome.storage.local.set({ [storageKey]: item });
}

export async function getLatestAnalysisFromStorage(
  storageKey: string = DEFAULT_STORAGE_KEY
): Promise<AnalysisStorageItem | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;
  const data = await chrome.storage.local.get(storageKey);
  return (data[storageKey] as AnalysisStorageItem) || null;
}

export const apiClient = new CoreApiClient();
