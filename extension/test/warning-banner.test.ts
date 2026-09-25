// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BANNER_HOST_ID,
  SESSION_STORAGE_DISMISS_KEY,
  injectWarningBanner,
  removeWarningBanner,
  isWarningBannerActive,
} from '../src/content/warning-banner.js';

describe('WarningBanner con Shadow DOM Aislado', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
  });

  afterEach(() => {
    removeWarningBanner(document);
  });

  it('debe inyectar el host del banner en el body', () => {
    const banner = injectWarningBanner({
      hostname: 'sitio-falso.xyz',
      targetUrl: 'https://sitio-falso.xyz/login',
      documentRef: document,
    });

    expect(banner).not.toBeNull();
    expect(isWarningBannerActive(document)).toBe(true);
    expect(document.getElementById(BANNER_HOST_ID)).toBe(banner);
  });

  it('debe encapsular el contenido en modo closed impidiendo acceso externo directo a shadowRoot', () => {
    const banner = injectWarningBanner({
      hostname: 'banco-trucho.com',
      documentRef: document,
    });

    expect(banner).not.toBeNull();
    // En modo closed, host.shadowRoot debe ser null desde el contexto exterior
    expect(banner?.shadowRoot).toBeNull();
  });

  it('no debe duplicar el banner si ya se encuentra montado', () => {
    const banner1 = injectWarningBanner({
      hostname: 'sitio-falso.xyz',
      documentRef: document,
    });
    const banner2 = injectWarningBanner({
      hostname: 'sitio-falso.xyz',
      documentRef: document,
    });

    expect(banner1).toBe(banner2);
    expect(document.querySelectorAll(`#${BANNER_HOST_ID}`).length).toBe(1);
  });

  it('debe remover el host del DOM al llamar a removeWarningBanner', () => {
    injectWarningBanner({ documentRef: document });
    expect(isWarningBannerActive(document)).toBe(true);

    removeWarningBanner(document);
    expect(isWarningBannerActive(document)).toBe(false);
    expect(document.getElementById(BANNER_HOST_ID)).toBeNull();
  });

  it('debe ejecutar callback y almacenar estado al descartar', () => {
    const onDismissSpy = vi.fn();

    // Espiar attachShadow para acceder al inner DOM cerrado en test
    const originalAttachShadow = HTMLElement.prototype.attachShadow;
    vi.spyOn(HTMLElement.prototype, 'attachShadow').mockImplementation(function (this: HTMLElement) {
      const shadow = originalAttachShadow.call(this, { mode: 'open' }); // open durante test para interactuar
      setTimeout(() => {
        const dismissBtn = shadow.querySelector('#cbg-btn-dismiss');
        if (dismissBtn) {
          dismissBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      }, 10);
      return shadow;
    });

    injectWarningBanner({
      hostname: 'estafa.xyz',
      onDismiss: onDismissSpy,
      documentRef: document,
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(sessionStorage.getItem(SESSION_STORAGE_DISMISS_KEY)).toBe('true');
        expect(onDismissSpy).toHaveBeenCalled();
        expect(isWarningBannerActive(document)).toBe(false);
        resolve();
      }, 50);
    });
  });
});
