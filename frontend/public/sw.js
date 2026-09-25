// Service worker mínimo de CiberGuardián.
//
// Existe para que la app sea instalable, aparezca en el menú "Compartir" del celular
// (Web Share Target) y reciba las alertas push de brotes (FH26-75). NO guarda la app en
// caché a propósito: así cada deploy se ve al instante y nunca queda una versión vieja en
// pantalla durante la demo.
//
// Sin conexión, en lugar de la pantalla de error del navegador, muestra las líneas de
// emergencia: los enlaces tel: funcionan aunque no haya internet.
// Mantener sincronizado con src/components/sos/emergencyContacts.ts.

const EMERGENCY_LINES = [
  ['Banco Formosa (Bloqueo 24hs)', '0800-777-2262'],
  ['Tarjeta Chigüé', '0810-888-2444'],
  ['Red Link (Central de Bloqueos)', '0800-888-5465'],
  ['Banelco', '011-4320-5000'],
  ['Policía de Formosa (Delitos Informáticos)', '911'],
];

const OFFLINE_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CiberGuardián — Sin conexión</title>
<style>
  body { margin: 0; font: 18px/1.5 system-ui, sans-serif; background: #212c37; color: #f5f8fa; }
  main { max-width: 32rem; margin: 0 auto; padding: 1.5rem 1rem; }
  h1 { font-size: 1.4rem; margin: 0 0 .5rem; }
  p { color: #d3dde5; }
  a { display: block; margin: .75rem 0; padding: 1rem; border-radius: 1rem; background: #dc2626; color: #fff;
      font-weight: 700; text-decoration: none; }
  a span { display: block; font-weight: 400; font-family: monospace; }
</style>
</head>
<body>
<main>
  <h1>Sin conexión a internet</h1>
  <p>CiberGuardián necesita internet para analizar mensajes. Si estás en una emergencia, igual podés llamar:</p>
  ${EMERGENCY_LINES.map(([name, phone]) =>
    `<a href="tel:${phone.replace(/[^\d+]/g, '')}">${name}<span>${phone}</span></a>`).join('\n  ')}
</main>
</body>
</html>`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Solo las navegaciones: los assets y la API van directo a la red, sin pasar por acá.
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    ),
  );
});

// --- Notificaciones push de brotes de estafas (FH26-75) ---------------------------------
// Payload que arma el backend (core_service/app/services/push_service.py):
// { title, body, url: "/#radar?incident_id=15", icon, badge, tag, incident_id }

const DEFAULT_NOTIFICATION = {
  title: 'CiberGuardián: alerta de estafa',
  body: 'Hay una alerta nueva en el Radar Comunitario. Tocá para verla.',
  url: '/#radar',
  icon: '/icons/icon-192.png',
  badge: '/icons/icon-192.png',
};

// Solo rutas de la propia app ("/..."): el enlace de una notificación nunca lleva a otro sitio.
const isAppPath = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
const text = (value, fallback) => (typeof value === 'string' && value.trim() ? value : fallback);

function readPushPayload(event) {
  let data = {};
  try {
    data = (event.data && event.data.json()) || {};
  } catch (e) {
    // Payload que no es JSON: se muestra el aviso genérico.
  }
  return {
    title: text(data.title, DEFAULT_NOTIFICATION.title),
    body: text(data.body, DEFAULT_NOTIFICATION.body),
    url: isAppPath(data.url) ? data.url : DEFAULT_NOTIFICATION.url,
    icon: text(data.icon, DEFAULT_NOTIFICATION.icon),
    badge: text(data.badge, DEFAULT_NOTIFICATION.badge),
    tag: text(data.tag, undefined),
  };
}

self.addEventListener('push', (event) => {
  const n = readPushPayload(event);
  event.waitUntil(
    self.registration.showNotification(n.title, {
      body: n.body,
      icon: n.icon,
      badge: n.badge,
      lang: 'es-AR',
      vibrate: [200, 100, 200],
      // Mismo tag = mismo brote: la alerta nueva reemplaza a la anterior y vuelve a avisar.
      tag: n.tag,
      renotify: Boolean(n.tag),
      data: { url: n.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = event.notification.data && isAppPath(event.notification.data.url)
    ? event.notification.data.url
    : DEFAULT_NOTIFICATION.url;
  const target = new URL(path, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((c) => new URL(c.url).origin === self.location.origin);
      if (open) {
        // La app ya está abierta: al frente y al Radar (solo cambia el hash, no recarga).
        await open.focus();
        try {
          await open.navigate(target);
          return;
        } catch (e) {
          // Pestaña que este service worker no controla: se abre una nueva.
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
