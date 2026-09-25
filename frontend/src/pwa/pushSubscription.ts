// Suscripción a las alertas push de brotes de estafas (FH26-76).
// El service worker (public/sw.js, FH26-75) muestra la notificación; acá se pide el permiso,
// se crea la suscripción con la clave VAPID del backend y se registra en /api/core/push.

import { pushApi } from '../services/api';

/**
 * - unsupported: el navegador no tiene Web Push.
 * - ios-install: iPhone/iPad en el navegador; Apple solo permite push en la app instalada.
 * - denied: el usuario bloqueó las notificaciones; solo se rehabilitan desde el navegador.
 * - default: se puede ofrecer la suscripción.
 * - subscribed: este dispositivo ya recibe las alertas.
 */
export type PushStatus = 'unsupported' | 'ios-install' | 'denied' | 'default' | 'subscribed';

export type PushErrorCode = 'not-configured' | 'no-service-worker' | 'denied' | 'dismissed' | 'push-service' | 'server';

export class PushError extends Error {
  readonly code: PushErrorCode;

  constructor(code: PushErrorCode) {
    super(code);
    this.name = 'PushError';
    this.code = code;
  }
}

function isIOS(): boolean {
  const { userAgent, platform, maxTouchPoints } = navigator;
  // El iPad con iPadOS se presenta como Mac: se reconoce por la pantalla táctil.
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  return navigator.serviceWorker.getRegistration();
}

export async function getPushStatus(): Promise<PushStatus> {
  // Antes que "unsupported": en el Safari del iPhone no hay PushManager, pero instalada sí.
  if (isIOS() && !isStandalone()) return 'ios-install';
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  const subscription = await (await getRegistration())?.pushManager.getSubscription();
  return subscription ? 'subscribed' : 'default';
}

/** La clave VAPID viaja en base64url; PushManager.subscribe() la necesita en bytes. */
export function vapidKeyToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function subscribeToPush(): Promise<void> {
  let vapidKey: string;
  try {
    vapidKey = await pushApi.getVapidPublicKey();
  } catch {
    throw new PushError('server');
  }
  if (!vapidKey) throw new PushError('not-configured');

  // Solo existe en el build de producción (ver registerServiceWorker.ts).
  const registration = await getRegistration();
  if (!registration) throw new PushError('no-service-worker');

  const permission = await Notification.requestPermission();
  if (permission === 'denied') throw new PushError('denied');
  if (permission !== 'granted') throw new PushError('dismissed');

  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKeyToBytes(vapidKey),
    });
  } catch {
    // El navegador no pudo registrarse en su servicio de push (p. ej. Brave sin los servicios
    // de Google, algunas ventanas privadas o Chromium sin FCM), aunque el permiso esté concedido.
    throw new PushError('push-service');
  }

  const { endpoint, keys } = subscription.toJSON();
  try {
    if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error('Suscripción incompleta');
    await pushApi.subscribe({
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      user_agent: navigator.userAgent.slice(0, 255),
    });
  } catch {
    // Si el backend no la registró, no queda una suscripción huérfana en el navegador.
    await subscription.unsubscribe().catch(() => {});
    throw new PushError('server');
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await (await getRegistration())?.pushManager.getSubscription();
  if (!subscription) return;

  const { endpoint } = subscription;
  await subscription.unsubscribe();
  // Aunque el backend falle (o ya la hubiera dado de baja), en este dispositivo ya no llegan.
  await pushApi.unsubscribe(endpoint).catch(() => {});
}
