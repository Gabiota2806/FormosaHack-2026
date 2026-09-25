import type { IncidentItem } from '../../types';
import { vectorLabel } from './radarLabels';

/** Largo máximo del ejemplo citado, para que el enlace wa.me no quede demasiado largo. */
const MAX_EVIDENCE_LENGTH = 280;

/**
 * Texto para avisar a la familia de una estafa que está circulando (FH26-75).
 * WhatsApp muestra en negrita lo que va entre asteriscos.
 */
export function buildIncidentShareText(item: IncidentItem): string {
  const lines = [
    'Ojo: está circulando esta estafa en Formosa.',
    '',
    `*${item.title}*`,
    `Se hacen pasar por: ${item.impersonated_entity}`,
    `Llega por: ${vectorLabel(item.attack_vector)}`,
  ];

  const evidence = item.evidence_text?.trim();
  if (evidence) {
    const quoted =
      evidence.length > MAX_EVIDENCE_LENGTH ? `${evidence.slice(0, MAX_EVIDENCE_LENGTH).trimEnd()}…` : evidence;
    lines.push(`Ejemplo: "${quoted}"`);
  }

  lines.push('', 'Si te llega algo así, no respondas ni toques links. Lo vi en el Radar de CiberGuardián.');
  return lines.join('\n');
}
