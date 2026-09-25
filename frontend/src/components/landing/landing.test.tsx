import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EMERGENCY_CONTACTS, toTelHref } from '../sos/emergencyContacts';
import { LandingPage } from './LandingPage';

vi.mock('../../services/api', () => ({
  incidentApi: {
    getStats: vi.fn().mockResolvedValue({
      total_incidents: 10,
      total_votes: 262,
      verified_channels: 5,
      distinct_entities: 7,
      active_outbreaks_24h: 1,
    }),
  },
}));

const renderLanding = () => {
  const onAction = vi.fn();
  render(<LandingPage onAction={onAction} />);
  return { onAction, user: userEvent.setup() };
};

describe('LandingPage', () => {
  it('tiene un único título principal y las secciones con su encabezado', () => {
    renderLanding();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: /Te acompañamos en los 3 momentos/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Está donde lo necesitás' })).toBeInTheDocument();
  });

  it.each([
    ['Analizar mensaje sospechoso', 'ANALYZE'],
    ['Protocolo de auxilio SOS', 'SOS'],
    ['Explorar Radar de estafas', 'RADAR'],
  ])('el botón del hero "%s" dispara %s', async (name, action) => {
    const { onAction, user } = renderLanding();

    await user.click(screen.getByRole('button', { name }));
    expect(onAction).toHaveBeenCalledExactlyOnceWith(action);
  });

  it('muestra los 3 momentos y cada uno lleva a su flujo', async () => {
    const { onAction, user } = renderLanding();
    const pillars = within(screen.getByRole('heading', { name: /3 momentos/ }).closest('section')!).getAllByRole(
      'listitem',
    );
    expect(pillars).toHaveLength(3);

    await user.click(within(pillars[0]).getByRole('button'));
    await user.click(within(pillars[1]).getByRole('button'));
    await user.click(within(pillars[2]).getByRole('button'));
    expect(onAction.mock.calls).toEqual([['ANALYZE'], ['DURING_CALL'], ['SOS']]);
  });

  it('el showcase lleva al Radar', async () => {
    const { onAction, user } = renderLanding();

    await user.click(screen.getByRole('button', { name: 'Ver el Radar' }));
    expect(onAction).toHaveBeenCalledExactlyOnceWith('RADAR');
  });

  it('el pie lista las mismas líneas de emergencia que el SOS', () => {
    renderLanding();
    const links = within(screen.getByRole('navigation', { name: 'Líneas de emergencia 24 hs' })).getAllByRole('link');

    expect(links.map((a) => a.getAttribute('href'))).toEqual(EMERGENCY_CONTACTS.map((c) => toTelHref(c.phone)));
  });

  it('no promete canales que todavía no existen', () => {
    renderLanding();

    expect(screen.queryByText(/extensi[oó]n/i)).not.toBeInTheDocument();
  });
});
