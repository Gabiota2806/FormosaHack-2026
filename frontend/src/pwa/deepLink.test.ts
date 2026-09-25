import { describe, expect, it } from 'vitest';
import { clearDeepLink, parseRadarDeepLink } from './deepLink';

describe('parseRadarDeepLink', () => {
  it.each([
    ['#radar', { incidentId: null }],
    ['#radar?incident_id=15', { incidentId: 15 }],
    ['#RADAR?incident_id=7', { incidentId: 7 }],
    ['radar?incident_id=3', { incidentId: 3 }],
  ])('%s → %o', (hash, expected) => {
    expect(parseRadarDeepLink(hash)).toEqual(expected);
  });

  it.each(['#radar?incident_id=abc', '#radar?incident_id=-4', '#radar?incident_id=0', '#radar?incident_id=1.5'])(
    'un id inválido (%s) lleva al Radar sin destacar nada',
    (hash) => {
      expect(parseRadarDeepLink(hash)).toEqual({ incidentId: null });
    },
  );

  it.each(['', '#', '#home', '#radares', '#auth?incident_id=15'])('"%s" no es un enlace al Radar', (hash) => {
    expect(parseRadarDeepLink(hash)).toBeNull();
  });
});

describe('clearDeepLink', () => {
  it('saca el hash y conserva la ruta y la búsqueda', () => {
    window.history.replaceState(null, '', '/?x=1#radar?incident_id=15');

    clearDeepLink();

    expect(window.location.hash).toBe('');
    expect(`${window.location.pathname}${window.location.search}`).toBe('/?x=1');
  });
});
