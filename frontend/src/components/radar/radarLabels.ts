// Vectores que acepta el backend (IncidentBase.attack_vector).
export const VECTOR_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  LLAMADA: 'Llamada telefónica',
  WEB: 'Sitio web / Link',
  EMAIL: 'Correo electrónico',
};

export const vectorLabel = (vector: string) => VECTOR_LABELS[vector.toUpperCase()] ?? vector;

// Entidades que carga scripts/seed.py.
export const ENTITY_OPTIONS = [
  'Banco Formosa',
  'Tarjeta Chigüé',
  'REFSA',
  'Mercado Pago',
  'ANSES',
  'WhatsApp',
  'Otro',
];

export const reportsLabel = (count: number) =>
  count === 1 ? '1 persona lo recibió' : `${count} personas lo recibieron`;
