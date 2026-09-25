// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isCredentialInput,
  hasCredentialInputs,
  initFormDetector,
  isSessionDismissed,
} from '../src/content/form-detector.js';
import {
  BANNER_HOST_ID,
  SESSION_STORAGE_DISMISS_KEY,
  removeWarningBanner,
  isWarningBannerActive,
} from '../src/content/warning-banner.js';
import { isWhitelistedDomain } from '../src/content/whitelist.js';

describe('Suite de Content Script (Detección de Phishing y Whitelist)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
  });

  afterEach(() => {
    removeWarningBanner(document);
  });

  describe('Auditoría Heurística de Inputs (isCredentialInput)', () => {
    it('debe detectar input[type="password"] en cualquier variante de mayúsculas', () => {
      const input = document.createElement('input');
      input.type = 'password';
      expect(isCredentialInput(input)).toBe(true);

      const upperInput = document.createElement('input');
      upperInput.setAttribute('type', 'PASSWORD');
      expect(isCredentialInput(upperInput)).toBe(true);
    });

    it('debe detectar autocomplete de contraseñas y tokens OTP (current-password, new-password, one-time-code)', () => {
      const p1 = document.createElement('input');
      p1.setAttribute('autocomplete', 'current-password');
      expect(isCredentialInput(p1)).toBe(true);

      const p2 = document.createElement('input');
      p2.setAttribute('autocomplete', 'new-password');
      expect(isCredentialInput(p2)).toBe(true);

      const otp = document.createElement('input');
      otp.setAttribute('autocomplete', 'one-time-code');
      expect(isCredentialInput(otp)).toBe(true);
    });

    it('debe detectar atributos semánticos sospechosos (clave, pin, token, cbu, cvv)', () => {
      const el1 = document.createElement('input');
      el1.name = 'input_clave_seguridad';
      expect(isCredentialInput(el1)).toBe(true);

      const el2 = document.createElement('input');
      el2.id = 'txt_pin_cajero';
      expect(isCredentialInput(el2)).toBe(true);

      const el3 = document.createElement('input');
      el3.placeholder = 'Token de seguridad';
      expect(isCredentialInput(el3)).toBe(true);

      const el4 = document.createElement('input');
      el4.setAttribute('aria-label', 'Ingrese su CBU o Alias');
      expect(isCredentialInput(el4)).toBe(true);

      const el5 = document.createElement('input');
      el5.name = 'card_cvv';
      expect(isCredentialInput(el5)).toBe(true);
    });

    it('debe ignorar campos comunes inofensivos (búsqueda, checkbox, radio, email, usuario)', () => {
      const search = document.createElement('input');
      search.type = 'search';
      expect(isCredentialInput(search)).toBe(false);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      expect(isCredentialInput(checkbox)).toBe(false);

      const email = document.createElement('input');
      email.type = 'email';
      email.name = 'email_address';
      expect(isCredentialInput(email)).toBe(false);

      const user = document.createElement('input');
      user.name = 'username';
      user.placeholder = 'Ingrese su usuario o DNI';
      expect(isCredentialInput(user)).toBe(false);
    });

    it('debe retornar false si el elemento no es una instancia de HTMLInputElement', () => {
      const div = document.createElement('div');
      div.setAttribute('name', 'password');
      expect(isCredentialInput(div)).toBe(false);

      const textarea = document.createElement('textarea');
      textarea.setAttribute('name', 'clave');
      expect(isCredentialInput(textarea)).toBe(false);
    });
  });

  describe('Escaneo de Contenedor DOM (hasCredentialInputs)', () => {
    it('debe retornar true si el formulario contiene campos de contraseña', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <div>
          <label>DNI</label>
          <input type="text" name="dni" />
          <label>Clave</label>
          <input type="password" name="password" />
        </div>
      `;
      document.body.appendChild(form);

      expect(hasCredentialInputs(document)).toBe(true);
    });

    it('debe retornar false si el formulario solo contiene datos de contacto', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <input type="text" name="fullname" placeholder="Nombre completo" />
        <input type="email" name="contact_email" placeholder="Correo electrónico" />
        <input type="text" name="city" placeholder="Ciudad" />
      `;
      document.body.appendChild(form);

      expect(hasCredentialInputs(document)).toBe(false);
    });

    it('debe manejar nodos nulos o inválidos retornando false de forma segura', () => {
      expect(hasCredentialInputs(null as any)).toBe(false);
      expect(hasCredentialInputs({} as any)).toBe(false);
    });
  });

  describe('Cumplimiento de Whitelist Oficial de Formosa e Instituciones Financieras', () => {
    it('debe reconocer los dominios autorizados de Formosa y Bancos', () => {
      expect(isWhitelistedDomain('bancoformosa.com.ar')).toBe(true);
      expect(isWhitelistedDomain('homebanking.bancoformosa.com.ar')).toBe(true);
      expect(isWhitelistedDomain('redlink.com.ar')).toBe(true);
      expect(isWhitelistedDomain('hb.redlink.com.ar')).toBe(true);
      expect(isWhitelistedDomain('formosa.gob.ar')).toBe(true);
      expect(isWhitelistedDomain('portal.formosa.gob.ar')).toBe(true);
      expect(isWhitelistedDomain('anses.gob.ar')).toBe(true);
      expect(isWhitelistedDomain('bna.com.ar')).toBe(true);
    });

    it('NO debe considerar dominios de suplantación o phishing como autorizados', () => {
      expect(isWhitelistedDomain('bancoformosa-acceso.com')).toBe(false);
      expect(isWhitelistedDomain('bancoformosa.com.ar.sitio-falso.online')).toBe(false);
      expect(isWhitelistedDomain('anses-bonos.net')).toBe(false);
      expect(isWhitelistedDomain('redlink-actualizacion.xyz')).toBe(false);
    });

    it('NO debe inyectar banner en dominios oficiales de la Whitelist aunque contengan formularios de login', () => {
      const mockWin = {
        location: {
          hostname: 'homebanking.bancoformosa.com.ar',
          href: 'https://homebanking.bancoformosa.com.ar/login',
        },
      } as unknown as Window;

      document.body.innerHTML = `
        <form>
          <input type="text" name="usuario" />
          <input type="password" name="clave" />
          <button type="submit">Ingresar al Home Banking</button>
        </form>
      `;

      const controller = initFormDetector({ doc: document, win: mockWin });

      expect(isWarningBannerActive(document)).toBe(false);
      expect(document.getElementById(BANNER_HOST_ID)).toBeNull();
      controller.stop();
    });
  });

  describe('Protección Proactiva e Inyección en Sitios Sospechosos', () => {
    it('DEBE inyectar el banner de advertencia cuando un sitio no autorizado pide contraseñas', () => {
      const mockWin = {
        location: {
          hostname: 'bancoformosa-validar.com',
          href: 'https://bancoformosa-validar.com/login',
        },
      } as unknown as Window;

      document.body.innerHTML = `
        <div id="phishing-box">
          <h2>Actualice sus datos bancarios inmediatamente</h2>
          <input type="password" name="clave_bancaria" />
        </div>
      `;

      const controller = initFormDetector({ doc: document, win: mockWin });

      expect(isWarningBannerActive(document)).toBe(true);
      const host = document.getElementById(BANNER_HOST_ID);
      expect(host).not.toBeNull();
      // En modo cerrado (closed), host.shadowRoot no es accesible directamente
      expect(host?.shadowRoot).toBeNull();

      controller.stop();
    });

    it('NO debe inyectar el banner si el usuario ya lo descartó en la sesión activa', () => {
      sessionStorage.setItem(SESSION_STORAGE_DISMISS_KEY, 'true');
      expect(isSessionDismissed()).toBe(true);

      const mockWin = {
        location: {
          hostname: 'tramite-formosa-falso.site',
          href: 'https://tramite-formosa-falso.site/',
        },
      } as unknown as Window;

      document.body.innerHTML = `<input type="password" name="clave" />`;

      const controller = initFormDetector({ doc: document, win: mockWin });

      expect(isWarningBannerActive(document)).toBe(false);
      expect(document.getElementById(BANNER_HOST_ID)).toBeNull();

      controller.stop();
    });

    it('debe detectar reactivamente modales y formularios SPA agregados dinámicamente con MutationObserver', async () => {
      const mockWin = {
        location: {
          hostname: 'promo-sorteo-formosa.xyz',
          href: 'https://promo-sorteo-formosa.xyz/',
        },
      } as unknown as Window;

      document.body.innerHTML = `<h1>Bienvenido al portal de noticias</h1>`;

      const controller = initFormDetector({ doc: document, win: mockWin });
      expect(isWarningBannerActive(document)).toBe(false);

      // Inyección diferida en el DOM simulando carga asíncrona de SPA
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="login-dialog">
          <p>Para continuar, ingrese su PIN de cajero</p>
          <input type="password" id="atm-pin" />
        </div>
      `;
      document.body.appendChild(modal);

      // Esperar debounce de MutationObserver (80ms)
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(isWarningBannerActive(document)).toBe(true);
          expect(document.getElementById(BANNER_HOST_ID)).not.toBeNull();
          controller.stop();
          resolve();
        }, 150);
      });
    });

    it('controller.stop() debe desconectar el observador y no alertar tras detenerse', async () => {
      const mockWin = {
        location: {
          hostname: 'sitio-detenido.xyz',
          href: 'https://sitio-detenido.xyz/',
        },
      } as unknown as Window;

      const controller = initFormDetector({ doc: document, win: mockWin });
      controller.stop();

      const modal = document.createElement('div');
      modal.innerHTML = `<input type="password" id="pass-late" />`;
      document.body.appendChild(modal);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(isWarningBannerActive(document)).toBe(false);
          resolve();
        }, 120);
      });
    });
  });
});
