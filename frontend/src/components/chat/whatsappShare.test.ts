import { describe, expect, it } from 'vitest';
import type { ChatAnalysisResponse } from '../../types';
import { MAX_QUOTE_LENGTH, buildFamilyShareText, buildWhatsAppUrl } from './whatsappShare';

const ANALYSIS: ChatAnalysisResponse = {
  risk_level: 'HIGH',
  risk_percentage: 85,
  detected_entity: 'Banco Formosa',
  detected_vector: 'WHATSAPP',
  summary: 'ALERTA ROJA',
  immediate_action: 'No respondas.',
  what_not_to_do: 'Nunca compartas el token.',
  highlighted_phrases: [
    { phrase: 'banco formosa', reason: 'r', category: 'AUTHORITY' },
    { phrase: 'urgente', reason: 'r', category: 'URGENCE' },
    { phrase: 'token', reason: 'r', category: 'CREDENTIALS' },
    { phrase: 'clave', reason: 'r', category: 'CREDENTIALS' },
  ],
  wa_share_text: 'texto del backend',
};

const MESSAGE = 'Banco Formosa: urgente, pasame el token y la clave';

describe('buildFamilyShareText', () => {
  it('incluye el mensaje, el riesgo en español, la entidad y una pregunta empática', () => {
    expect(buildFamilyShareText(ANALYSIS, MESSAGE)).toBe(
      [
        'Hola, me llegó este mensaje y antes de responder lo revisé con CiberGuardián:',
        '',
        `"${MESSAGE}"`,
        '',
        'Resultado: *Riesgo alto* (85% de probabilidad de engaño)',
        'Se hace pasar por: Banco Formosa',
        'Trampas que encontró: Se hace pasar por una entidad, Urgencia, Te pide datos o claves',
        '',
        '¿Lo miramos juntos antes de que haga algo? Gracias.',
      ].join('\n'),
    );
  });

  it('omite entidad y trampas cuando no hay', () => {
    const text = buildFamilyShareText(
      { ...ANALYSIS, risk_level: 'LOW', risk_percentage: 15, detected_entity: undefined, highlighted_phrases: [] },
      'Hola, ¿cómo estás?',
    );

    expect(text).toContain('*Riesgo bajo* (15% de probabilidad de engaño)');
    expect(text).not.toContain('Se hace pasar por:');
    expect(text).not.toContain('Trampas que encontró');
  });

  it('recorta los mensajes muy largos', () => {
    const long = 'a'.repeat(MAX_QUOTE_LENGTH + 100);
    const text = buildFamilyShareText(ANALYSIS, long);

    expect(text).toContain(`"${'a'.repeat(MAX_QUOTE_LENGTH)}…"`);
    expect(text).not.toContain('a'.repeat(MAX_QUOTE_LENGTH + 1));
  });
});

describe('buildWhatsAppUrl', () => {
  it('codifica el texto para wa.me sin número de destino', () => {
    const url = buildWhatsAppUrl('¿Hola? *sí* & más\nlínea');

    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url.split('?text=')[1])).toBe('¿Hola? *sí* & más\nlínea');
    expect(url).not.toContain(' ');
  });
});
