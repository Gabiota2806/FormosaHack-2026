export interface EmergencyContact {
  name: string;
  phone: string;
  desc: string;
  highlight: boolean;
}

// Números alineados con scripts/seed.py (OfficialChannel.emergency_phone) y docs/SDD.md.
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: 'Banco Formosa (Bloqueo 24hs)',
    phone: '0800-777-2262',
    desc: 'Bloqueo inmediato de Home Banking y tarjetas de débito.',
    highlight: true,
  },
  {
    name: 'Tarjeta Chigüé',
    phone: '0810-888-2444',
    desc: 'Denuncia por pérdida, robo o transacciones no autorizadas.',
    highlight: false,
  },
  {
    name: 'Red Link (Central de Bloqueos)',
    phone: '0800-888-5465',
    desc: 'Atención 24 hs para inmovilización de tarjetas Link.',
    highlight: false,
  },
  {
    name: 'Banelco',
    phone: '011-4320-5000',
    desc: 'Línea de emergencia para clientes de la red Banelco.',
    highlight: false,
  },
  {
    name: 'Policía de Formosa (Delitos Informáticos)',
    phone: '911',
    desc: 'Denuncias penales por estafas electrónicas y hackeos.',
    highlight: true,
  },
];

// Deriva el enlace tel: del número visible para que nunca queden desincronizados.
export const toTelHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
