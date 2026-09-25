import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { PushError, getPushStatus, subscribeToPush, unsubscribeFromPush } from '../../pwa/pushSubscription';
import { PushSubscriptionBanner } from './PushSubscriptionBanner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../pwa/pushSubscription', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../pwa/pushSubscription')>()),
  getPushStatus: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
}));

const ACTIVATE = 'Activar alertas de brotes de estafas';

describe('PushSubscriptionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPushStatus).mockResolvedValue('default');
    vi.mocked(subscribeToPush).mockResolvedValue(undefined);
    vi.mocked(unsubscribeFromPush).mockResolvedValue(undefined);
  });

  it('ofrece activar las alertas y, al aceptar, confirma con un toast', async () => {
    const user = userEvent.setup();
    render(<PushSubscriptionBanner />);

    await user.click(await screen.findByRole('button', { name: ACTIVATE }));

    expect(subscribeToPush).toHaveBeenCalledOnce();
    expect(await screen.findByRole('heading', { name: 'Alertas activadas con éxito' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desactivar alertas' })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/Alertas activadas/));
  });

  it('muestra que está activando y no deja tocar dos veces', async () => {
    let finish!: () => void;
    vi.mocked(subscribeToPush).mockReturnValue(new Promise((resolve) => (finish = () => resolve())));
    const user = userEvent.setup();
    render(<PushSubscriptionBanner />);

    await user.click(await screen.findByRole('button', { name: ACTIVATE }));
    const busy = screen.getByRole('button', { name: 'Activando…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');

    finish();
    expect(await screen.findByRole('button', { name: 'Desactivar alertas' })).toBeInTheDocument();
  });

  it('si el usuario deniega el permiso, explica cómo rehabilitarlo', async () => {
    vi.mocked(subscribeToPush).mockRejectedValue(new PushError('denied'));
    const user = userEvent.setup();
    render(<PushSubscriptionBanner />);

    await user.click(await screen.findByRole('button', { name: ACTIVATE }));

    expect(await screen.findByRole('heading', { name: 'Las notificaciones están bloqueadas' })).toBeInTheDocument();
    expect(screen.getByText(/tocá el candado/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ACTIVATE })).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/Bloqueaste las notificaciones/));
  });

  it('ante un error del servidor avisa y deja reintentar', async () => {
    vi.mocked(subscribeToPush).mockRejectedValue(new PushError('server'));
    const user = userEvent.setup();
    render(<PushSubscriptionBanner />);

    await user.click(await screen.findByRole('button', { name: ACTIVATE }));

    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/No pudimos activar las alertas/));
    expect(await screen.findByRole('button', { name: ACTIVATE })).toBeEnabled();
  });

  it('avisa si las alertas no están configuradas en el servidor', async () => {
    vi.mocked(subscribeToPush).mockRejectedValue(new PushError('not-configured'));
    const user = userEvent.setup();
    render(<PushSubscriptionBanner />);

    await user.click(await screen.findByRole('button', { name: ACTIVATE }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/todavía no están disponibles/));
  });

  it('con las alertas activas permite desactivarlas', async () => {
    vi.mocked(getPushStatus).mockResolvedValue('subscribed');
    const user = userEvent.setup();
    render(<PushSubscriptionBanner />);

    await user.click(await screen.findByRole('button', { name: 'Desactivar alertas' }));

    expect(unsubscribeFromPush).toHaveBeenCalledOnce();
    expect(await screen.findByRole('button', { name: ACTIVATE })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/Desactivamos/));
  });

  it('en el Safari del iPhone indica instalar la app, sin botón de activar', async () => {
    vi.mocked(getPushStatus).mockResolvedValue('ios-install');
    render(<PushSubscriptionBanner />);

    expect(
      await screen.findByRole('heading', { name: 'En iPhone, instalá la app para recibir alertas' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('no se muestra si el navegador no soporta notificaciones', async () => {
    vi.mocked(getPushStatus).mockResolvedValue('unsupported');
    const { container } = render(<PushSubscriptionBanner />);

    await waitFor(() => expect(getPushStatus).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
