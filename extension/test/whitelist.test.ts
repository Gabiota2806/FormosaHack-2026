import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_FORMOSA_WHITELIST,
  normalizeHostname,
  isWhitelistedDomain,
} from '../src/content/whitelist.js';

describe('Whitelist Oficial de CiberGuardián (Formosa & Bancaria)', () => {
  it('debe contener dominios clave de Formosa y nacionales en la lista oficial', () => {
    expect(OFFICIAL_FORMOSA_WHITELIST.length).toBeGreaterThan(10);
    expect(OFFICIAL_FORMOSA_WHITELIST).toContain('bancoformosa.com.ar');
    expect(OFFICIAL_FORMOSA_WHITELIST).toContain('formosa.gob.ar');
  });

  describe('normalizeHostname', () => {
    it('debe limpiar URLs completas con protocolo https y ruta', () => {
      expect(normalizeHostname('https://bancoformosa.com.ar/homebanking/login')).toBe(
        'bancoformosa.com.ar'
      );
    });

    it('debe limpiar URLs con protocolo http y puertos', () => {
      expect(normalizeHostname('http://localhost:8000/api/v1')).toBe('localhost');
      expect(normalizeHostname('127.0.0.1:5173')).toBe('127.0.0.1');
    });

    it('debe normalizar a minúsculas y quitar espacios en blanco', () => {
      expect(normalizeHostname('  BANCOFORMOSA.COM.AR  ')).toBe('bancoformosa.com.ar');
    });

    it('debe retornar cadena vacía ante valores nulos o vacíos', () => {
      expect(normalizeHostname('')).toBe('');
      // @ts-expect-error probando valor inválido
      expect(normalizeHostname(null)).toBe('');
    });
  });

  describe('isWhitelistedDomain', () => {
    it('debe validar dominios exactos de la whitelist oficial', () => {
      expect(isWhitelistedDomain('bancoformosa.com.ar')).toBe(true);
      expect(isWhitelistedDomain('formosa.gob.ar')).toBe(true);
      expect(isWhitelistedDomain('refsa.com.ar')).toBe(true);
      expect(isWhitelistedDomain('dgrformosa.gob.ar')).toBe(true);
      expect(isWhitelistedDomain('anses.gob.ar')).toBe(true);
      expect(isWhitelistedDomain('redlink.com.ar')).toBe(true);
      expect(isWhitelistedDomain('localhost')).toBe(true);
    });

    it('debe validar subdominios legítimos oficiales', () => {
      expect(isWhitelistedDomain('https://homebanking.bancoformosa.com.ar/login')).toBe(true);
      expect(isWhitelistedDomain('https://tramites.formosa.gob.ar/portal')).toBe(true);
      expect(isWhitelistedDomain('autogestion.refsa.com.ar')).toBe(true);
      expect(isWhitelistedDomain('servicios.redlink.com.ar')).toBe(true);
    });

    it('debe RECHAZAR dominios maliciosos de suplantación y phishing (spoofing)', () => {
      // Intento de sufijo engañoso
      expect(isWhitelistedDomain('bancoformosa.com.ar.servidor-hacker.xyz')).toBe(false);
      expect(isWhitelistedDomain('https://formosa.gob.ar.login-falso.online')).toBe(false);
      expect(isWhitelistedDomain('anses.gob.ar.tramites-urgentes.site')).toBe(false);

      // Typosquatting / dominios parecidos
      expect(isWhitelistedDomain('banco-formosa.com')).toBe(false);
      expect(isWhitelistedDomain('bancodeformosa-web.com')).toBe(false);
      expect(isWhitelistedDomain('refsa-pagos.net')).toBe(false);
      expect(isWhitelistedDomain('redlink-seguridad.com')).toBe(false);
    });

    it('debe permitir listas blancas personalizadas opcionales', () => {
      const customList = ['sitio-confiable.com.ar'];
      expect(isWhitelistedDomain('sitio-confiable.com.ar', customList)).toBe(true);
      expect(isWhitelistedDomain('sub.sitio-confiable.com.ar', customList)).toBe(true);
      expect(isWhitelistedDomain('bancoformosa.com.ar', customList)).toBe(false);
    });
  });
});
