import { Gift, Landmark, MessageCircle, PhoneCall, ShieldCheck, Siren } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EntryMode, QuickReply } from './types';

/** Guiones fijos del chatbot: los flujos "durante" y "SOS" no dependen del backend. */

export const ENTRY_OPTIONS: { mode: EntryMode; label: string; icon: LucideIcon; userText: string }[] = [
  {
    mode: 'PREVENCION',
    label: 'Analizar mensaje o enlace sospechoso',
    icon: ShieldCheck,
    userText: 'Quiero analizar un mensaje o enlace sospechoso.',
  },
  {
    mode: 'DURANTE',
    label: 'Me están llamando o apurando ahora mismo',
    icon: PhoneCall,
    userText: 'Me están llamando o apurando ahora mismo.',
  },
  {
    mode: 'SOS',
    label: '¡Pasé mis datos o plata, auxilio!',
    icon: Siren,
    userText: '¡Pasé mis datos o plata, auxilio!',
  },
];

export const ENTRY_QUICK_REPLIES: QuickReply[] = ENTRY_OPTIONS.map((o) => ({
  label: o.label,
  icon: o.icon,
  type: 'entry',
  mode: o.mode,
}));

export const WELCOME_TEXT =
  'Hola, soy CiberGuardián. Te ayudo a detectar estafas antes, durante y después de que pasen. ¿Qué te está pasando?';

export const PREVENTION_TEXT =
  'Pegá abajo el mensaje de WhatsApp, SMS, correo o el enlace que te llegó y lo reviso. Si querés, probá con uno de estos ejemplos:';

export const EXAMPLE_MESSAGES: QuickReply[] = [
  {
    label: 'Llamada del banco pidiendo el token',
    icon: Landmark,
    type: 'analyze',
    text: 'Me llamaron supuestamente de Banco Formosa diciendo que bloquearon mi cuenta y que tengo que ir al cajero o dictarles el código token de la app.',
  },
  {
    label: 'Bono o premio con link',
    icon: Gift,
    type: 'analyze',
    text: '¡URGENTE! Fuiste seleccionado para cobrar el bono extraordinario de $70.000. Confirmá tus datos antes de las 24 hs en: bit.ly/bono-acreditacion',
  },
  {
    label: '"Hola má, cambié de número"',
    icon: MessageCircle,
    type: 'analyze',
    text: 'Hola má, cambié de número porque se rompió mi teléfono. ¿Me pasás el código de 6 dígitos que te acaba de llegar por SMS?',
  },
];

export const CONTENTION = {
  title: '¡CORTÁ LA LLAMADA AHORA MISMO!',
  body: 'Ninguna entidad bancaria, empresa de servicios ni organismo público te va a pedir tu clave token, tu contraseña ni te va a hacer ir a un cajero automático.',
  checks: [
    {
      question: '¿Te dicen que ganaste un sorteo o subsidio pero tenés que pagar un gasto previo?',
      verdict: 'ES UNA ESTAFA.',
    },
    {
      question: '¿Te piden el código de 6 dígitos que te acaba de llegar por SMS?',
      verdict: 'TE ESTÁN ROBANDO EL WHATSAPP.',
    },
    {
      question: '¿Te dicen que un familiar tuvo un accidente grave y necesita plata ya?',
      verdict: 'Cortá y llamá a tu familiar al número que ya tenías agendado.',
    },
  ],
};

export const AFTER_CONTENTION_TEXT =
  'Si ya les pasaste algún dato o hiciste una transferencia, no pierdas tiempo: tocá "¡Pasé mis datos o plata, auxilio!" y te guío para bloquear todo.';

export const SOS_TEXT =
  'Respirá hondo, vamos paso a paso. Lo primero es bloquear tus cuentas y tarjetas: te abro las líneas de emergencia 24 hs y la ficha de denuncia para la policía.';

export const ANALYSIS_ERROR_TEXT =
  'No pude analizar el mensaje en este momento. Mientras tanto: no abras enlaces, no compartas códigos y no transfieras plata. Probá de nuevo en unos segundos.';
