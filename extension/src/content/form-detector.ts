/**
 * Content Script Reactivo de Detección de Phishing.
 * Audita campos de credenciales sensibles (password, token, PIN, clave) y
 * contrasta contra la Whitelist Oficial de Formosa e instituciones bancarias.
 */
import { isWhitelistedDomain } from './whitelist.js';
import {
  injectWarningBanner,
  isWarningBannerActive,
  SESSION_STORAGE_DISMISS_KEY,
} from './warning-banner.js';

export const CREDENTIAL_KEYWORDS_REGEX = /(password|contrasena|contraseña|clave|pin|token|cvv|cbu|credencial)/i;

/**
 * Determina si un elemento input es un campo de credenciales sensible.
 */
export function isCredentialInput(element: Element): boolean {
  if (!(element instanceof HTMLInputElement)) return false;

  // Tipo password explícito
  if (element.type?.toLowerCase() === 'password') {
    return true;
  }

  // Descartar campos que explícitamente no sean de credenciales
  const type = element.type?.toLowerCase();
  if (type === 'search' || type === 'checkbox' || type === 'radio' || type === 'file' || type === 'submit') {
    return false;
  }

  // Autocomplete estándar de credenciales
  const autocomplete = element.getAttribute('autocomplete')?.toLowerCase() || '';
  if (
    autocomplete === 'current-password' ||
    autocomplete === 'new-password' ||
    autocomplete === 'one-time-code'
  ) {
    return true;
  }

  // Evaluación heurística por atributos clave
  const name = element.name || '';
  const id = element.id || '';
  const placeholder = element.placeholder || '';
  const ariaLabel = element.getAttribute('aria-label') || '';

  const combinedAttributes = `${name} ${id} ${placeholder} ${ariaLabel}`;
  return CREDENTIAL_KEYWORDS_REGEX.test(combinedAttributes);
}

/**
 * Escanea un nodo o documento buscando inputs de credenciales.
 */
export function hasCredentialInputs(root: ParentNode = document): boolean {
  if (!root || !('querySelectorAll' in root)) return false;

  // 1. Búsqueda directa de passwords
  const passwordInputs = root.querySelectorAll('input[type="password"]');
  if (passwordInputs.length > 0) return true;

  // 2. Búsqueda por inputs y evaluación heurística
  const allInputs = root.querySelectorAll('input');
  for (let i = 0; i < allInputs.length; i++) {
    if (isCredentialInput(allInputs[i])) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica si el usuario ya descartó la advertencia para esta sesión/página.
 */
export function isSessionDismissed(): boolean {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(SESSION_STORAGE_DISMISS_KEY) === 'true';
    }
  } catch {
    // Si el almacenamiento está restringido por políticas de seguridad
  }
  return false;
}

export interface FormDetectorController {
  stop: () => void;
  evaluateNow: () => boolean;
}

/**
 * Inicializa el observador reactivo y la auditoría de formularios en la página activa.
 */
export function initFormDetector(options?: {
  doc?: Document;
  win?: Window;
  skipSessionCheck?: boolean;
}): FormDetectorController {
  const currentDoc = options?.doc || (typeof document !== 'undefined' ? document : null);
  const currentWin = options?.win || (typeof window !== 'undefined' ? window : null);

  if (!currentDoc || !currentWin) {
    return {
      stop: () => {},
      evaluateNow: () => false,
    };
  }

  const hostname = currentWin.location.hostname || '';

  // Si el dominio está en la lista blanca oficial de Formosa/bancos, no intervenir
  if (isWhitelistedDomain(hostname)) {
    return {
      stop: () => {},
      evaluateNow: () => false,
    };
  }

  const evaluateAndAlert = (): boolean => {
    // Verificar si fue descartado
    if (!options?.skipSessionCheck && isSessionDismissed()) {
      return false;
    }

    // Verificar si ya está montado
    if (isWarningBannerActive(currentDoc)) {
      return true;
    }

    // Escanear inputs de credenciales
    if (hasCredentialInputs(currentDoc)) {
      injectWarningBanner({
        hostname,
        targetUrl: currentWin.location.href,
        documentRef: currentDoc,
      });
      return true;
    }

    return false;
  };

  // Evaluación inicial síncrona
  evaluateAndAlert();

  // Monitoreo reactivo con MutationObserver para SPAs y modales diferidos
  let observer: MutationObserver | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  if (typeof MutationObserver !== 'undefined' && currentDoc.body) {
    observer = new MutationObserver((mutations) => {
      // Filtrar mutaciones provocadas por nuestro propio banner para evitar bucles
      const isInternalMutation = mutations.some(
        (m) =>
          (m.target as HTMLElement)?.id === 'ciberguardian-phishing-guard' ||
          Array.from(m.addedNodes).some((n) => (n as HTMLElement)?.id === 'ciberguardian-phishing-guard')
      );
      if (isInternalMutation) return;

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        evaluateAndAlert();
      }, 80);
    });

    try {
      observer.observe(currentDoc.body, {
        childList: true,
        subtree: true,
      });
    } catch {
      // Ignorar si el body no permite observación directa
    }
  }

  return {
    stop: () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    },
    evaluateNow: () => evaluateAndAlert(),
  };
}

// Inicialización automática en entorno de navegador (Content Script)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Asegurar que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initFormDetector();
    });
  } else {
    initFormDetector();
  }
}
