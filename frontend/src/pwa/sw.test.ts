import { beforeEach, describe, expect, it, vi } from 'vitest';
// public/sw.js no pasa por el bundler: se carga como texto y se ejecuta con un `self` simulado.
import SW_SOURCE from '../../public/sw.js?raw';
const ORIGIN = 'http://localhost:8000';

type Handler = (event: Record<string, unknown>) => void;

function loadServiceWorker({ windows = [] as unknown[] } = {}) {
  const handlers: Record<string, Handler> = {};
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: Handler) => (handlers[type] = fn),
    skipWaiting: vi.fn(),
    registration: { showNotification: vi.fn().mockResolvedValue(undefined) },
    clients: {
      claim: vi.fn(),
      matchAll: vi.fn().mockResolvedValue(windows),
      openWindow: vi.fn().mockResolvedValue(undefined),
    },
  };
  new Function('self', SW_SOURCE)(self);

  /** Dispara un evento y espera lo que el service worker pasó a waitUntil. */
  const dispatch = async (type: string, event: Record<string, unknown>) => {
    let pending: Promise<unknown> = Promise.resolve();
    handlers[type]({ ...event, waitUntil: (p: Promise<unknown>) => (pending = p) });
    await pending;
  };

  return { self, dispatch };
}

const pushEvent = (payload: unknown) => ({
  data: {
    json: () => {
      if (typeof payload === 'string') return JSON.parse(payload);
      return payload;
    },
  },
});

const BACKEND_PAYLOAD = {
  title: 'Brote de estafas en Formosa: Suplantación de REFSA',
  body: '5 personas reportaron el mismo mensaje en las últimas 2 horas.',
  url: '/#radar?incident_id=15',
  icon: '/icons/icon-192.png',
  badge: '/icons/icon-192.png',
  tag: 'ciberguardian-incident-15',
  incident_id: 15,
};

describe('service worker: evento push', () => {
  it('muestra la notificación con los datos del backend', async () => {
    const { self, dispatch } = loadServiceWorker();

    await dispatch('push', pushEvent(BACKEND_PAYLOAD));

    expect(self.registration.showNotification).toHaveBeenCalledWith(
      BACKEND_PAYLOAD.title,
      expect.objectContaining({
        body: BACKEND_PAYLOAD.body,
        icon: '/icons/icon-192.png',
        tag: 'ciberguardian-incident-15',
        renotify: true,
        data: { url: '/#radar?incident_id=15' },
      }),
    );
  });

  it('con un payload roto muestra un aviso genérico que lleva al Radar', async () => {
    const { self, dispatch } = loadServiceWorker();

    await dispatch('push', pushEvent('{no es json'));

    expect(self.registration.showNotification).toHaveBeenCalledWith(
      'CiberGuardián: alerta de estafa',
      expect.objectContaining({ data: { url: '/#radar' }, renotify: false }),
    );
  });

  it('nunca usa un enlace que lleve fuera de la app', async () => {
    const { self, dispatch } = loadServiceWorker();

    for (const url of ['https://sitio-trucho.com', '//sitio-trucho.com', 'javascript:alert(1)']) {
      await dispatch('push', pushEvent({ ...BACKEND_PAYLOAD, url }));
    }

    for (const [, options] of self.registration.showNotification.mock.calls) {
      expect(options.data.url).toBe('/#radar');
    }
  });
});

describe('service worker: clic en la notificación', () => {
  const clickEvent = (url: string) => ({ notification: { close: vi.fn(), data: { url } } });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('con la app abierta la trae al frente y la lleva al Radar', async () => {
    const win = { url: `${ORIGIN}/`, focus: vi.fn().mockResolvedValue(undefined), navigate: vi.fn() };
    const { self, dispatch } = loadServiceWorker({ windows: [win] });
    const event = clickEvent('/#radar?incident_id=15');

    await dispatch('notificationclick', event);

    expect(event.notification.close).toHaveBeenCalled();
    expect(win.focus).toHaveBeenCalled();
    expect(win.navigate).toHaveBeenCalledWith(`${ORIGIN}/#radar?incident_id=15`);
    expect(self.clients.openWindow).not.toHaveBeenCalled();
  });

  it('sin la app abierta, la abre en el Radar', async () => {
    const { self, dispatch } = loadServiceWorker({ windows: [] });

    await dispatch('notificationclick', clickEvent('/#radar?incident_id=15'));

    expect(self.clients.openWindow).toHaveBeenCalledWith(`${ORIGIN}/#radar?incident_id=15`);
  });

  it('si no puede navegar la pestaña abierta, abre una nueva', async () => {
    const win = {
      url: `${ORIGIN}/`,
      focus: vi.fn().mockResolvedValue(undefined),
      navigate: vi.fn().mockRejectedValue(new TypeError('not controlled')),
    };
    const { self, dispatch } = loadServiceWorker({ windows: [win] });

    await dispatch('notificationclick', clickEvent('/#radar'));

    expect(self.clients.openWindow).toHaveBeenCalledWith(`${ORIGIN}/#radar`);
  });

  it('ignora pestañas de otros sitios', async () => {
    const other = { url: 'https://otro-sitio.com/', focus: vi.fn(), navigate: vi.fn() };
    const { self, dispatch } = loadServiceWorker({ windows: [other] });

    await dispatch('notificationclick', clickEvent('/#radar'));

    expect(other.focus).not.toHaveBeenCalled();
    expect(self.clients.openWindow).toHaveBeenCalledWith(`${ORIGIN}/#radar`);
  });
});
