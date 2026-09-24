import { describe, expect, it } from 'vitest';
import {
  EMPTY_REPORT_CARD,
  buildReportCardText,
  generateReferenceCode,
  normalizeUrl,
  parseAmount,
  validateReportCard,
  type ReportCardData,
} from './reportCard';

const NOW = new Date('2026-09-24T18:00:00-03:00');

const withData = (data: Partial<ReportCardData>): ReportCardData => ({
  ...EMPTY_REPORT_CARD,
  channel: 'WHATSAPP',
  ...data,
});

describe('parseAmount', () => {
  it.each([
    ['45000', 45000],
    ['45.000', 45000],
    ['1.250.000', 1250000],
    ['45.000,50', 45000.5],
    ['$ 3500', 3500],
  ])('interpreta %s como %d', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });

  it.each(['abc', '45,000.00', '4.50', ''])('rechaza %s', (raw) => {
    expect(parseAmount(raw)).toBeNull();
  });
});

describe('validateReportCard', () => {
  it('exige el canal de contacto', () => {
    expect(validateReportCard(EMPTY_REPORT_CARD, NOW)).toEqual({
      channel: 'Elegí por dónde te contactaron.',
    });
  });

  it('acepta una ficha con solo el canal (el resto es opcional)', () => {
    expect(validateReportCard(withData({}), NOW)).toEqual({});
  });

  it('acepta CBU de 22 dígitos con espacios y alias válidos', () => {
    expect(validateReportCard(withData({ destination: '0000003100 012345678901' }), NOW)).toEqual({});
    expect(validateReportCard(withData({ destination: 'juan.perez.mp' }), NOW)).toEqual({});
  });

  it('rechaza CBU con cantidad incorrecta de dígitos y alias inválidos', () => {
    expect(validateReportCard(withData({ destination: '12345' }), NOW).destination).toMatch(/22 números/);
    expect(validateReportCard(withData({ destination: 'ab' }), NOW).destination).toMatch(/alias/);
  });

  it('rechaza montos, teléfonos y links inválidos', () => {
    const errors = validateReportCard(
      withData({ amount: 'mucho', scammerPhone: '123', fraudLink: 'no es un link' }),
      NOW,
    );
    expect(Object.keys(errors).sort()).toEqual(['amount', 'fraudLink', 'scammerPhone']);
  });

  it('rechaza una fecha del hecho en el futuro', () => {
    expect(validateReportCard(withData({ incidentDate: '2026-09-25T10:00' }), NOW).incidentDate).toMatch(
      /posterior/,
    );
  });
});

describe('normalizeUrl', () => {
  it('agrega el esquema cuando falta', () => {
    expect(normalizeUrl('bancoformosa-gestion.online')).toBe('https://bancoformosa-gestion.online/');
  });

  it('rechaza textos que no son dominios', () => {
    expect(normalizeUrl('hola')).toBeNull();
  });
});

describe('generateReferenceCode', () => {
  it('sigue el formato DEN-AAAA-XXXX sin caracteres ambiguos', () => {
    const code = generateReferenceCode(NOW);
    expect(code).toMatch(/^DEN-2026-[2-9A-HJ-NP-Z]{4}$/);
  });
});

describe('buildReportCardText', () => {
  it('incluye código, fecha, canal, monto formateado y evidencia', () => {
    const text = buildReportCardText(
      withData({
        entity: 'Banco Formosa',
        amount: '45.000',
        destination: 'juan.perez.mp',
        scammerPhone: '+54 9 370 4998877',
      }),
      { referenceCode: 'DEN-2026-B3C9', issuedAt: NOW },
    );

    expect(text).toContain('Código de Referencia: DEN-2026-B3C9');
    expect(text).toContain('Fecha y Hora de Emisión: 24/9/26');
    expect(text).toContain('Canal de Contacto: WhatsApp');
    expect(text).toMatch(/Monto Involucrado \/ Transferido: \$\s45\.000,00/);
    expect(text).toContain('CBU / CVU / Alias de Destino: juan.perez.mp');
    expect(text).toContain('Enlace o Sitio Fraudulento: No aportado');
  });
});
