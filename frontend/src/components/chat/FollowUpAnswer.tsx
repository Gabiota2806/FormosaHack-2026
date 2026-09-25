import { Globe, Info, ListChecks, MessageCircle, PhoneCall } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ChatFollowupResponse, EmergencyContact } from '../../types';
import { buttonClasses } from '../ui/buttonClasses';
import { toTelHref } from '../sos/emergencyContacts';

interface ContactLink {
  href: string;
  label: string;
  icon: LucideIcon;
  external: boolean;
}

// Solo enlaces seguros: la respuesta viene del modelo y nunca debe abrir esquemas raros.
const isWebUrl = (url?: string | null): url is string => !!url && /^https?:\/\//i.test(url);

/** Arma el enlace de un contacto según su canal, o null si no tiene uno utilizable. */
function contactLink(contact: EmergencyContact): ContactLink | null {
  const channel = contact.channel_type.toUpperCase();
  if (channel === 'WHATSAPP') {
    if (isWebUrl(contact.url)) return { href: contact.url, label: 'WhatsApp', icon: MessageCircle, external: true };
    if (contact.phone) {
      return { href: `https://wa.me/${contact.phone.replace(/\D/g, '')}`, label: 'WhatsApp', icon: MessageCircle, external: true };
    }
  }
  if (channel === 'WEB' && isWebUrl(contact.url)) {
    return { href: contact.url, label: 'Abrir sitio', icon: Globe, external: true };
  }
  if (contact.phone) return { href: toTelHref(contact.phone), label: 'Llamar', icon: PhoneCall, external: false };
  if (isWebUrl(contact.url)) return { href: contact.url, label: 'Abrir sitio', icon: Globe, external: true };
  return null;
}

interface FollowUpAnswerProps {
  response: ChatFollowupResponse;
}

/** Respuesta a una pregunta de seguimiento: texto, pasos concretos y contactos de ayuda. */
export function FollowUpAnswer({ response }: FollowUpAnswerProps) {
  const contacts = response.emergency_contacts
    .map((c) => ({ contact: c, link: contactLink(c) }))
    .filter((c): c is { contact: EmergencyContact; link: ContactLink } => c.link !== null);

  return (
    <div className="space-y-3 px-4 py-3">
      <p className="whitespace-pre-wrap">{response.answer}</p>

      {response.suggested_actions.length > 0 && (
        <div className="rounded-xl bg-brand-50 border border-brand-100 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            Qué hacer ahora
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-700">
            {response.suggested_actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </div>
      )}

      {contacts.length > 0 && (
        <ul className="space-y-2" aria-label="Contactos de ayuda">
          {contacts.map(({ contact, link }) => (
            <li
              key={`${contact.name}-${link.href}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">{contact.name}</p>
                {contact.description && <p className="text-[11px] text-slate-500">{contact.description}</p>}
                {contact.phone && <p className="font-mono text-xs text-slate-700">{contact.phone}</p>}
              </div>
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-label={`${link.label}: ${contact.name}`}
                className={buttonClasses({ variant: link.label === 'Llamar' ? 'danger' : 'secondary', size: 'sm' })}
              >
                <link.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}

      {response.is_fallback && (
        <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          Respuesta automática de respaldo. Ante la duda, confirmalo con tu banco o por los canales oficiales.
        </p>
      )}
    </div>
  );
}
