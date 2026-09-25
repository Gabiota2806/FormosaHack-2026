/**
 * Componente de Alerta Flotante Encapsulada mediante Shadow DOM (closed).
 * Garantiza total aislamiento visual sin interferencias de CSS con la web anfitriona.
 */

export const BANNER_HOST_ID = 'ciberguardian-phishing-guard';
export const SESSION_STORAGE_DISMISS_KEY = 'ciberguardian_warning_dismissed';

export interface WarningBannerOptions {
  hostname?: string;
  targetUrl?: string;
  ciberguardianUrl?: string;
  onDismiss?: () => void;
  documentRef?: Document;
}

/**
 * Retorna si la advertencia está actualmente montada en el DOM.
 */
export function isWarningBannerActive(doc: Document = document): boolean {
  return doc.getElementById(BANNER_HOST_ID) !== null;
}

/**
 * Remueve el banner del DOM si existe.
 */
export function removeWarningBanner(doc: Document = document): void {
  const existing = doc.getElementById(BANNER_HOST_ID);
  if (existing) {
    existing.remove();
  }
}

/**
 * Genera el CSS aislado inyectado en el Shadow Root.
 */
function getIsolatedStyles(): string {
  return `
    :host {
      all: initial;
      display: block;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #f8fafc;
      pointer-events: auto;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .cbg-banner-card {
      width: 400px;
      max-width: calc(100vw - 40px);
      background-color: #0f172a;
      border: 2px solid #ef4444;
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4), 0 0 15px rgba(239, 68, 68, 0.3);
      padding: 18px;
      animation: cbgFadeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes cbgFadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(-16px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .cbg-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .cbg-icon-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 10px;
      color: #ef4444;
      flex-shrink: 0;
    }

    .cbg-header-text {
      flex: 1;
    }

    .cbg-tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #ef4444;
      background: rgba(239, 68, 68, 0.12);
      padding: 2px 8px;
      border-radius: 6px;
      margin-bottom: 4px;
    }

    .cbg-title {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
    }

    .cbg-close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .cbg-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .cbg-body {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 14px;
    }

    .cbg-body p {
      margin-bottom: 8px;
    }

    .cbg-domain-box {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #1e293b;
      border: 1px solid #334155;
      padding: 6px 10px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      color: #fca5a5;
      word-break: break-all;
    }

    .cbg-actions {
      display: flex;
      gap: 10px;
    }

    .cbg-btn-primary {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #dc2626;
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }

    .cbg-btn-primary:hover {
      background: #b91c1c;
    }

    .cbg-btn-secondary {
      background: #1e293b;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #334155;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .cbg-btn-secondary:hover {
      background: #334155;
      color: #ffffff;
    }
  `;
}

/**
 * Inyecta el banner flotante en el DOM encapsulado en Shadow DOM closed.
 */
export function injectWarningBanner(options?: WarningBannerOptions): HTMLElement | null {
  const doc = options?.documentRef || (typeof document !== 'undefined' ? document : null);
  if (!doc || !doc.body) return null;

  // Evitar duplicados
  if (isWarningBannerActive(doc)) {
    return doc.getElementById(BANNER_HOST_ID);
  }

  const hostname = options?.hostname || (typeof window !== 'undefined' ? window.location.hostname : 'desconocido');
  const targetUrl = options?.targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const ciberguardianUrl = options?.ciberguardianUrl || `http://localhost:8000/?analyze=${encodeURIComponent(targetUrl)}`;

  // Host container
  const host = doc.createElement('div');
  host.id = BANNER_HOST_ID;

  // Shadow Root Aislado (mode: closed)
  const shadow = host.attachShadow({ mode: 'closed' });

  // Estilos
  const styleEl = doc.createElement('style');
  styleEl.textContent = getIsolatedStyles();
  shadow.appendChild(styleEl);

  // Estructura HTML
  const card = doc.createElement('div');
  card.className = 'cbg-banner-card';
  card.setAttribute('role', 'alert');
  card.setAttribute('aria-live', 'assertive');

  card.innerHTML = `
    <div class="cbg-header">
      <div class="cbg-icon-badge" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>
      <div class="cbg-header-text">
        <span class="cbg-tag">Sitio no verificado</span>
        <h3 class="cbg-title">Alerta de Seguridad CiberGuardián</h3>
      </div>
      <button class="cbg-close-btn" id="cbg-btn-close" aria-label="Cerrar advertencia">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
    </div>

    <div class="cbg-body">
      <p>
        Se detectó un <strong>formulario de credenciales (contraseña, PIN o token)</strong> en una página web que no pertenece a los canales oficiales de Formosa ni a entidades bancarias verificadas.
      </p>
      <div class="cbg-domain-box">
        <span>⚠️ Dominio no oficial:</span>
        <strong id="cbg-detected-domain"></strong>
      </div>
    </div>

    <div class="cbg-actions">
      <a href="${ciberguardianUrl}" target="_blank" rel="noopener noreferrer" class="cbg-btn-primary" id="cbg-btn-verify">
        <span>Verificar en CiberGuardián</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h6v6"/>
          <path d="M10 14 21 3"/>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        </svg>
      </a>
      <button type="button" class="cbg-btn-secondary" id="cbg-btn-dismiss">Descartar</button>
    </div>
  `;

  // Asignar texto de dominio de forma segura (prevención XSS)
  const domainEl = card.querySelector('#cbg-detected-domain');
  if (domainEl) {
    domainEl.textContent = hostname;
  }

  // Handlers para descartar
  const handleDismiss = () => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_DISMISS_KEY, 'true');
      }
    } catch {
      // Ignorar si cookies/storage están deshabilitadas
    }
    removeWarningBanner(doc);
    if (options?.onDismiss) {
      options.onDismiss();
    }
  };

  const closeBtn = card.querySelector('#cbg-btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', handleDismiss);
  }

  const dismissBtn = card.querySelector('#cbg-btn-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', handleDismiss);
  }

  shadow.appendChild(card);
  doc.body.appendChild(host);

  return host;
}
