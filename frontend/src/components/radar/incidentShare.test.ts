import { describe, expect, it } from 'vitest';
import type { IncidentItem } from '../../types';
import { buildIncidentShareText } from './incidentShare';

const ITEM: IncidentItem = {
  id: 15,
  title: 'Falso corte de luz de REFSA',
  description: 'Piden pagar una deuda inexistente.',
  impersonated_entity: 'REFSA',
  attack_vector: 'SMS',
  evidence_text: 'REFSA: su suministro será cortado hoy. Pague en refsa-pagos.online',
  votes_count: 5,
  status: 'ACTIVO',
  created_at: '2026-09-25T10:00:00Z',
  updated_at: '2026-09-25T10:00:00Z',
};

describe('buildIncidentShareText', () => {
  it('arma el aviso con la estafa, la entidad, el canal legible y el ejemplo', () => {
    expect(buildIncidentShareText(ITEM)).toBe(
      [
        'Ojo: está circulando esta estafa en Formosa.',
        '',
        '*Falso corte de luz de REFSA*',
        'Se hacen pasar por: REFSA',
        'Llega por: SMS',
        'Ejemplo: "REFSA: su suministro será cortado hoy. Pague en refsa-pagos.online"',
        '',
        'Si te llega algo así, no respondas ni toques links. Lo vi en el Radar de CiberGuardián.',
      ].join('\n'),
    );
  });

  it('omite el ejemplo si no hay y recorta los muy largos', () => {
    expect(buildIncidentShareText({ ...ITEM, evidence_text: undefined })).not.toContain('Ejemplo:');

    const long = buildIncidentShareText({ ...ITEM, evidence_text: 'a'.repeat(400) });
    expect(long).toContain(`Ejemplo: "${'a'.repeat(280)}…"`);
  });
});
