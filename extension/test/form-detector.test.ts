// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isCredentialInput,
  hasCredentialInputs,
  initFormDetector,
} from '../src/content/form-detector.js';
import {
  BANNER_HOST_ID,
  SESSION_STORAGE_DISMISS_KEY,
  removeWarningBanner,
} from '../src/content/warning-banner.js';

describe('Detector Reactivo de Formularios de Phishing', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
  });

  afterEach(() => {
    removeWarningBanner(document);
  });

  describe('isCredentialInput', () => {
    it('debe detectar input type="password"', () => {
      const input = document.createElement('input');
      input.type = 'password';
      expect(isCredentialInput(input)).toBe(true);
    });

    it('debe detectar inputs con autocomplete de password o token', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('autocomplete', 'current-password');
      expect(isCredentialInput(input)).toBe(true);

      const tokenInput = document.createElement('input');
      tokenInput.setAttribute('autocomplete', 'one-time-code');
      expect(isCredentialInput(tokenInput)).toBe(true);
    });

    it('debe detectar inputs heurísticamente por nombre, id o placeholder', () => {
      const input1 = document.createElement('input');
      input1.name = 'user_pin';
      expect(isCredentialInput(input1)).toBe(true);

      const input2 = document.createElement('input');
      input2.id = 'txt_clave_seguridad';
      expect(isCredentialInput(input2)).toBe(true);

      const input3 = document.createElement('input');
      input3.placeholder = 'Ingrese su Token Bancario';
      expect(isCredentialInput(input3)).toBe(true);
    });

    it('no debe marcar inputs estándar inofensivos (búsqueda, usuario, email)', () => {
      const search = document.createElement('input');
      search.type = 'search';
      expect(isCredentialInput(search)).toBe(false);

      const username = document.createElement('input');
      username.name = 'username';
      expect(isCredentialInput(username)).toBe(false);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      expect(isCredentialInput(checkbox)).toBe(false);
    });
  });

  describe('hasCredentialInputs', () => {
    it('debe retornar true si el contenedor tiene campos de contraseña', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <label>Usuario</label>
        <input type="text" name="usuario" />
        <label>Contraseña</label>
        <input type="password" name="password" />
      `;
      document.body.appendChild(form);

      expect(hasCredentialInputs(document)).toBe(true);
    });

    it('debe retornar false si el formulario no pide credenciales sensibles', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <input type="text" name="nombre" placeholder="Nombre completo" />
        <input type="email" name="correo" placeholder="Correo electrónico" />
      `;
      document.body.appendChild(form);

      expect(hasCredentialInputs(document)).toBe(false);
    });
  });

  describe('initFormDetector y comportamiento en dominios', () => {
    it('NO debe inyectar alerta si el dominio pertenece a la Whitelist Oficial (ej. bancoformosa.com.ar)', () => {
      const fakeWindow = {
        location: {
          hostname: 'homebanking.bancoformosa.com.ar',
          href: 'https://homebanking.bancoformosa.com.ar/login',
        },
      } as unknown as Window;

      document.body.innerHTML = `
        <input type="password" name="clave" />
      `;

      const controller = initFormDetector({
        doc: document,
        win: fakeWindow,
      });

      expect(document.getElementById(BANNER_HOST_ID)).toBeNull();
      controller.stop();
    });

    it('DEBE inyectar alerta inmediatamente en sitios sospechosos no listados', () => {
      const fakeWindow = {
        location: {
          hostname: 'bancoformosa-acceso-falso.online',
          href: 'https://bancoformosa-acceso-falso.online/login',
        },
      } as unknown as Window;

      document.body.innerHTML = `
        <form>
          <input type="password" name="clave_ingreso" />
        </form>
      `;

      const controller = initFormDetector({
        doc: document,
        win: fakeWindow,
      });

      expect(document.getElementById(BANNER_HOST_ID)).not.toBeNull();
      controller.stop();
    });

    it('NO debe inyectar alerta si el usuario ya la descartó en la sesión activa', () => {
      sessionStorage.setItem(SESSION_STORAGE_DISMISS_KEY, 'true');

      const fakeWindow = {
        location: {
          hostname: 'estafa-formosa.xyz',
          href: 'https://estafa-formosa.xyz/',
        },
      } as unknown as Window;

      document.body.innerHTML = `<input type="password" />`;

      const controller = initFormDetector({
        doc: document,
        win: fakeWindow,
      });

      expect(document.getElementById(BANNER_HOST_ID)).toBeNull();
      controller.stop();
    });

    it('debe detectar reactivamente mediante MutationObserver formularios agregados dinámicamente', async () => {
      const fakeWindow = {
        location: {
          hostname: 'phishing-dinamico.site',
          href: 'https://phishing-dinamico.site/',
        },
      } as unknown as Window;

      // Inicia con body limpio sin inputs
      document.body.innerHTML = `<div>Bienvenido a la página informativa</div>`;

      const controller = initFormDetector({
        doc: document,
        win: fakeWindow,
      });

      expect(document.getElementById(BANNER_HOST_ID)).toBeNull();

      // Inserción dinámica (ej. modal de login renderizado por SPA)
      const dynamicModal = document.createElement('div');
      dynamicModal.id = 'login-modal';
      dynamicModal.innerHTML = `
        <h3>Inicia sesión para reclamar tu subsidio</h3>
        <input type="password" id="modal-pass" />
      `;
      document.body.appendChild(dynamicModal);

      // Esperar a que el observer procese el debounce (80ms)
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(document.getElementById(BANNER_HOST_ID)).not.toBeNull();
          controller.stop();
          resolve();
        }, 150);
      });
    });
  });
});
