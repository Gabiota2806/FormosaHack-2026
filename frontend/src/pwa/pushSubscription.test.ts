import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pushApi } from '../services/api';
import { PushError, getPushStatus, subscribeToPush, unsubscribeFromPush, vapidKeyToBytes } from './pushSubscription';

vi.mock('../services/api', () => ({
  pushApi: { getVapidPublicKey: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() },
}));

const VAPID_KEY = 'BEFpJaIHzOc1KNC-RFWnNoM-0wx9TnVILFf4e5eS51TFnSjg8pxHxD7DJEiQFAJCZFuS9hu-BjD5QdrQxg9py9Q';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/150.0 Mobile Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1';

function fakeSubscription(endpoint = 'https://fcm.googleapis.com/fcm/send/abc') {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'p256dh-key', auth: 'auth-secret' } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
}

let permission: NotificationPermission;
let requestPermission: ReturnType<typeof vi.fn>;
let pushManager: { getSubscription: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };
let getRegistration: ReturnType<typeof vi.fn>;

function setBrowser({ userAgent = ANDROID_UA, standalone = false } = {}) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  window.matchMedia = vi.fn().mockReturnValue({ matches: standalone }) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.mocked(pushApi.getVapidPublicKey).mockReset().mockResolvedValue(VAPID_KEY);
  vi.mocked(pushApi.subscribe).mockReset().mockResolvedValue(undefined);
  vi.mocked(pushApi.unsubscribe).mockReset().mockResolvedValue(undefined);

  permission = 'default';
  requestPermission = vi.fn(async () => {
    permission = 'granted';
    return permission;
  });
  vi.stubGlobal('Notification', {
    get permission() {
      return permission;
    },
    requestPermission,
  });
  vi.stubGlobal('PushManager', function PushManager() {});

  pushManager = { getSubscription: vi.fn().mockResolvedValue(null), subscribe: vi.fn() };
  getRegistration = vi.fn().mockResolvedValue({ pushManager });
  Object.defineProperty(navigator, 'serviceWorker', { value: { getRegistration }, configurable: true });

  setBrowser();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
});

describe('getPushStatus', () => {
  it('ofrece la suscripción si el navegador la soporta y no hay una activa', async () => {
    expect(await getPushStatus()).toBe('default');
  });

  it('detecta que este dispositivo ya está suscripto', async () => {
    pushManager.getSubscription.mockResolvedValue(fakeSubscription());
    expect(await getPushStatus()).toBe('subscribed');
  });

  it('detecta que el usuario bloqueó las notificaciones', async () => {
    permission = 'denied';
    expect(await getPushStatus()).toBe('denied');
  });

  it('en el Safari del iPhone pide instalar la app, aunque no exista PushManager', async () => {
    vi.unstubAllGlobals();
    setBrowser({ userAgent: IPHONE_UA });
    expect(await getPushStatus()).toBe('ios-install');
  });

  it('en el iPhone con la app instalada sigue el flujo normal', async () => {
    setBrowser({ userAgent: IPHONE_UA, standalone: true });
    expect(await getPushStatus()).toBe('default');
  });

  it('sin Web Push en el navegador no ofrece nada', async () => {
    vi.unstubAllGlobals();
    expect(await getPushStatus()).toBe('unsupported');
  });
});

describe('vapidKeyToBytes', () => {
  it('convierte la clave pública base64url en los 65 bytes de un punto P-256', () => {
    const bytes = vapidKeyToBytes(VAPID_KEY);
    expect(bytes).toHaveLength(65);
    expect(bytes[0]).toBe(0x04);
  });
});

describe('subscribeToPush', () => {
  it('pide permiso, se suscribe con la clave VAPID y registra la suscripción en el backend', async () => {
    const subscription = fakeSubscription();
    pushManager.subscribe.mockResolvedValue(subscription);

    await subscribeToPush();

    expect(requestPermission).toHaveBeenCalledOnce();
    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: vapidKeyToBytes(VAPID_KEY),
    });
    expect(pushApi.subscribe).toHaveBeenCalledWith({
      endpoint: subscription.endpoint,
      keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
      user_agent: ANDROID_UA,
    });
  });

  it('avisa si el servidor no tiene claves VAPID, sin pedir permiso', async () => {
    vi.mocked(pushApi.getVapidPublicKey).mockResolvedValue('');

    await expect(subscribeToPush()).rejects.toEqual(new PushError('not-configured'));
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('avisa si no hay service worker registrado (build de desarrollo)', async () => {
    getRegistration.mockResolvedValue(undefined);
    await expect(subscribeToPush()).rejects.toMatchObject({ code: 'no-service-worker' });
  });

  it('distingue el permiso denegado del cerrado sin responder', async () => {
    requestPermission.mockResolvedValueOnce('denied');
    await expect(subscribeToPush()).rejects.toMatchObject({ code: 'denied' });

    requestPermission.mockResolvedValueOnce('default');
    await expect(subscribeToPush()).rejects.toMatchObject({ code: 'dismissed' });
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('si el navegador no puede registrarse en su servicio de push, lo distingue de un error del servidor', async () => {
    pushManager.subscribe.mockRejectedValue(new DOMException('Registration failed - permission denied', 'AbortError'));

    await expect(subscribeToPush()).rejects.toMatchObject({ code: 'push-service' });
    expect(pushApi.subscribe).not.toHaveBeenCalled();
  });

  it('si el backend falla, deshace la suscripción del navegador', async () => {
    const subscription = fakeSubscription();
    pushManager.subscribe.mockResolvedValue(subscription);
    vi.mocked(pushApi.subscribe).mockRejectedValue(new Error('500'));

    await expect(subscribeToPush()).rejects.toMatchObject({ code: 'server' });
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it('si no puede pedir la clave VAPID, es un error de servidor', async () => {
    vi.mocked(pushApi.getVapidPublicKey).mockRejectedValue(new Error('Network Error'));
    await expect(subscribeToPush()).rejects.toMatchObject({ code: 'server' });
  });
});

describe('unsubscribeFromPush', () => {
  it('da de baja la suscripción en el navegador y en el backend', async () => {
    const subscription = fakeSubscription();
    pushManager.getSubscription.mockResolvedValue(subscription);

    await unsubscribeFromPush();

    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
    expect(pushApi.unsubscribe).toHaveBeenCalledWith(subscription.endpoint);
  });

  it('no falla si el backend ya la había dado de baja', async () => {
    pushManager.getSubscription.mockResolvedValue(fakeSubscription());
    vi.mocked(pushApi.unsubscribe).mockRejectedValue(new Error('404'));

    await expect(unsubscribeFromPush()).resolves.toBeUndefined();
  });

  it('sin suscripción no hace nada', async () => {
    await unsubscribeFromPush();
    expect(pushApi.unsubscribe).not.toHaveBeenCalled();
  });
});
